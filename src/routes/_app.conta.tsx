import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase, loginWithEmail, logout } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2, LogOut, Mail, User as UserIcon } from "lucide-react";

export const Route = createFileRoute("/_app/conta")({
  head: () => ({ meta: [{ title: "Minha Conta — Licuri Hub" }] }),
  component: AccountPage,
});

function AccountPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    setLoading(false);
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      setIsLoggingIn(true);
      await loginWithEmail(email);
      toast.success("E-mail enviado!", {
        description: "Verifique sua caixa de entrada para o link de login.",
      });
    } catch (error: any) {
      toast.error("Erro ao fazer login: " + error.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success("Sessão encerrada.");
    navigate({ to: "/" });
  };

  if (loading) {
    return (
      <div className="container-narrow py-20 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--clay)]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container-narrow py-16 flex flex-col items-center max-w-md">
        <div className="w-16 h-16 bg-[var(--sand)] rounded-full flex items-center justify-center mb-6">
          <UserIcon className="h-8 w-8 text-[var(--clay)]" />
        </div>
        <h1 className="font-display text-3xl font-semibold text-[var(--coffee)] mb-2 text-center">Boas-vindas!</h1>
        <p className="text-[var(--muted-foreground)] text-center mb-8">Acesse sua conta para gerenciar pedidos e favoritos.</p>
        
        <form onSubmit={handleLogin} className="w-full space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-[var(--muted-foreground)] ml-1">Seu E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemplo@email.com"
                required
                className="w-full rounded-xl border border-[var(--border)] bg-white pl-10 pr-4 py-3 text-sm outline-none focus:border-[var(--clay)] focus:ring-1 focus:ring-[var(--clay)] transition-all"
              />
            </div>
          </div>
          <Button 
            type="submit" 
            variant="hero" 
            size="xl" 
            className="w-full shadow-lg shadow-[var(--clay)]/20"
            disabled={isLoggingIn}
          >
            {isLoggingIn ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Receber link de acesso
          </Button>
        </form>
        
        <p className="mt-8 text-xs text-center text-[var(--muted-foreground)] leading-relaxed">
          Enviaremos um link mágico para seu e-mail.<br />Não é necessário senha.
        </p>
      </div>
    );
  }

  return (
    <div className="container-narrow py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-semibold text-[var(--coffee)]">Olá, {user.email.split('@')[0]}</h1>
          <p className="text-[var(--muted-foreground)]">{user.email}</p>
        </div>
        <Button variant="soft" size="sm" onClick={handleLogout} className="text-red-600 hover:bg-red-50">
          <LogOut className="mr-2 h-4 w-4" /> Sair
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <h3 className="font-display text-lg font-semibold mb-4">Meus Pedidos</h3>
          <p className="text-sm text-[var(--muted-foreground)]">Você ainda não realizou pedidos.</p>
          <Button asChild variant="soft" size="sm" className="mt-4">
            <Link to="/categorias">Ver produtos</Link>
          </Button>
        </div>
        
        <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <h3 className="font-display text-lg font-semibold mb-4">Favoritos</h3>
          <p className="text-sm text-[var(--muted-foreground)]">Sua lista de desejos está vazia.</p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <h3 className="font-display text-lg font-semibold mb-4">Configurações</h3>
          <p className="text-sm text-[var(--muted-foreground)]">Gerencie seus endereços e dados pessoais.</p>
        </div>
      </div>
    </div>
  );
}
