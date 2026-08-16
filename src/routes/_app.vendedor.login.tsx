import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase, loginWithEmail } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2, Mail, Store, ArrowRight, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_app/vendedor/login")({
  head: () => ({ meta: [{ title: "Acesso do Vendedor — Empório do Licuri" }] }),
  component: VendorLoginPage,
});

function VendorLoginPage() {
  const [email, setEmail] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isSeller, setIsSeller] = useState<boolean | null>(null);
  const [checkingSeller, setCheckingSeller] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) checkSellerProfile(session.user.id);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) checkSellerProfile(user.id);
  }

  async function checkSellerProfile(userId: string) {
    setCheckingSeller(true);
    const { data } = await supabase
      .from("sellers")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    setIsSeller(!!data);
    setCheckingSeller(false);
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      setIsLoggingIn(true);
      await loginWithEmail(email);
      toast.success("E-mail enviado!", {
        description: "Verifique sua caixa de entrada para o link de acesso ao painel.",
      });
    } catch (error: any) {
      toast.error("Erro ao fazer login: " + error.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (user && isSeller === true) {
    return (
      <div className="container-narrow py-20 flex flex-col items-center max-w-md text-center">
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="font-display text-3xl font-semibold text-[var(--coffee)] mb-4">
          Você já está conectado
        </h1>
        <p className="text-[var(--muted-foreground)] mb-8">
          Identificamos seu perfil de vendedor. Você pode acessar seu painel agora.
        </p>
        <Button asChild variant="hero" size="xl" className="w-full">
          <Link to="/vendedor">Ir para o Painel</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container-narrow py-16 flex flex-col items-center max-w-md">
      <div className="w-16 h-16 bg-[var(--sand)] rounded-full flex items-center justify-center mb-6">
        <Store className="h-8 w-8 text-[var(--clay)]" />
      </div>
      <h1 className="font-display text-3xl font-semibold text-[var(--coffee)] mb-2 text-center">
        Área do Vendedor
      </h1>
      <p className="text-[var(--muted-foreground)] text-center mb-8">
        Acesse seu painel para gerenciar produtos, vendas e sua loja no ecossistema.
      </p>

      <form onSubmit={handleLogin} className="w-full space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-[var(--muted-foreground)] ml-1">
            E-mail do Vendedor
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
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
          Entrar no Painel
        </Button>
      </form>

      <div className="mt-10 pt-8 border-t border-[var(--border)] w-full">
        <p className="text-sm text-center text-[var(--muted-foreground)] mb-4">
          Ainda não é um vendedor parceiro?
        </p>
        <Button asChild variant="soft" className="w-full rounded-xl">
          <Link to="/vendedor" hash="registro">
            Cadastrar meu empreendimento
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <p className="mt-8 text-xs text-center text-[var(--muted-foreground)] leading-relaxed">
        O Empório do Licuri utiliza login por link mágico.
        <br />
        Verifique seu e-mail após clicar em entrar.
      </p>
    </div>
  );
}
