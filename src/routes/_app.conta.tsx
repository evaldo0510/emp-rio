import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase, loginWithEmail, logout } from "@/lib/supabase";
import { toast } from "sonner";
import {
  Loader2,
  LogOut,
  Mail,
  User as UserIcon,
  Package,
  ChevronRight,
  CheckCircle2,
  Clock,
  Truck,
  Store,
  X,
} from "lucide-react";
import { formatBRL } from "@/lib/products";

export const Route = createFileRoute("/_app/conta")({
  head: () => ({ meta: [{ title: "Minha Conta — Licuri Hub" }] }),
  component: AccountPage,
});

function AccountPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [follows, setFollows] = useState<any[]>([]);
  const [email, setEmail] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function checkUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUser(user);
    if (user) {
      const [ordersRes, favsRes, followsRes] = await Promise.all([
        supabase
          .from("orders")
          .select("*, order_items(*), shipments(*)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("favorites")
          .select("product_id, products(id, slug, name, image_url, price)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(6),
        supabase
          .from("seller_follows")
          .select("id, seller_id, sellers(id, store_name, logo_url, seller_type)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);
      setOrders(ordersRes.data || []);
      setFavorites(favsRes.data || []);
      setFollows(followsRes.data || []);
    }
    setLoading(false);
  }

  async function handleUnfollow(followId: string, storeName?: string) {
    const prev = follows;
    setFollows((f) => f.filter((x) => x.id !== followId));
    const { error } = await supabase.from("seller_follows").delete().eq("id", followId);
    if (error) {
      setFollows(prev);
      toast.error("Não foi possível deixar de seguir a loja.");
      return;
    }
    toast.success(storeName ? `Você deixou de seguir ${storeName}.` : "Loja removida.");
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
        <h1 className="font-display text-3xl font-semibold text-[var(--coffee)] mb-2 text-center">
          Boas-vindas!
        </h1>
        <p className="text-[var(--muted-foreground)] text-center mb-8">
          Acesse sua conta para gerenciar pedidos e favoritos.
        </p>

        <form onSubmit={handleLogin} className="w-full space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-[var(--muted-foreground)] ml-1">
              Seu E-mail
            </label>
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
          Enviaremos um link mágico para seu e-mail.
          <br />
          Não é necessário senha.
        </p>
      </div>
    );
  }

  return (
    <div className="container-narrow py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-semibold text-[var(--coffee)]">
            Olá, {user.email.split("@")[0]}
          </h1>
          <p className="text-[var(--muted-foreground)]">{user.email}</p>
        </div>
        <Button
          variant="soft"
          size="sm"
          onClick={handleLogout}
          className="text-red-600 hover:bg-red-50"
        >
          <LogOut className="mr-2 h-4 w-4" /> Sair
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <h2 className="font-display text-2xl font-semibold text-[var(--coffee)]">Meus Pedidos</h2>

          {orders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border)] p-12 text-center bg-white">
              <Package className="mx-auto h-10 w-10 text-[var(--muted-foreground)] opacity-20 mb-3" />
              <p className="text-sm text-[var(--muted-foreground)] mb-6">
                Você ainda não realizou nenhum pedido.
              </p>
              <Button asChild variant="hero">
                <Link to="/categorias">Ver produtos</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-2xl border border-[var(--border)] bg-white overflow-hidden shadow-sm"
                >
                  <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--sand)]/30">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
                        Pedido
                      </p>
                      <p className="text-sm font-semibold text-[var(--coffee)]">
                        #{order.id.slice(0, 8)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
                        Total
                      </p>
                      <p className="text-sm font-bold text-[var(--clay)]">
                        {formatBRL(order.total)}
                      </p>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="mb-8">
                      <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)] mb-4">
                        Status do Pedido
                      </p>
                      <div className="relative">
                        <div className="absolute top-4 left-0 w-full h-0.5 bg-[var(--border)]" />
                        <div className="relative flex justify-between">
                          <StatusStep
                            icon={CheckCircle2}
                            label="Pago"
                            active={["paid", "processing", "shipped", "delivered"].includes(
                              order.status,
                            )}
                          />
                          <StatusStep
                            icon={Clock}
                            label="Em preparo"
                            active={["processing", "shipped", "delivered"].includes(order.status)}
                          />
                          <StatusStep
                            icon={Truck}
                            label="Enviado"
                            active={["shipped", "delivered"].includes(order.status)}
                          />
                          <StatusStep
                            icon={Package}
                            label="Entregue"
                            active={["delivered"].includes(order.status)}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                      <Button asChild variant="soft" className="flex-1 rounded-xl">
                        <Link to="/rastreio/$orderId" params={{ orderId: order.id }}>
                          <Truck className="mr-2 h-4 w-4" />
                          Rastrear Pedido
                        </Link>
                      </Button>

                      {order.shipments?.[0]?.tracking_code && (
                        <div className="flex flex-col items-end justify-center px-4 py-2 bg-[var(--sand)]/40 rounded-xl border border-[var(--border)] min-w-[140px]">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
                            Código
                          </p>
                          <p className="text-sm font-mono font-bold text-[var(--clay)]">
                            {order.shipments[0].tracking_code}
                          </p>
                        </div>
                      )}
                    </div>

                    {order.shipments?.[0] && !order.shipments[0].tracking_code && (
                      <div className="mb-6 p-3 rounded-xl bg-blue-50 border border-blue-100 flex items-center gap-3">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <p className="text-xs text-blue-700">
                          Aguardando código de rastreio da transportadora.
                        </p>
                      </div>
                    )}

                    <div className="space-y-3">
                      {order.order_items?.map((item: any) => (
                        <div key={item.id} className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--sand)]">
                            <img
                              src={item.image_url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <p className="text-xs flex-1 text-[var(--coffee)] line-clamp-1">
                            {item.name}
                          </p>
                          <p className="text-xs font-bold text-[var(--muted-foreground)]">
                            x{item.quantity}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-semibold text-[var(--coffee)]">
                Favoritos
              </h3>
              {favorites.length > 0 && (
                <Link
                  to="/favoritos"
                  className="text-xs font-bold uppercase tracking-wider text-[var(--clay)] hover:underline"
                >
                  Ver todos
                </Link>
              )}
            </div>
            {favorites.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">
                Sua lista de desejos está vazia.
              </p>
            ) : (
              <ul className="space-y-3">
                {favorites.slice(0, 4).map((fav: any) => {
                  const p = fav.products;
                  if (!p) return null;
                  return (
                    <li key={fav.product_id}>
                      <Link
                        to="/produto/$slug"
                        params={{ slug: p.slug }}
                        className="flex items-center gap-3 group"
                      >
                        <div className="h-10 w-10 rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--sand)] shrink-0">
                          <img
                            src={p.image_url}
                            alt=""
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-[var(--coffee)] line-clamp-1 group-hover:text-[var(--clay)]">
                            {p.name}
                          </p>
                          <p className="text-xs font-bold text-[var(--clay)]">
                            {formatBRL(Number(p.price))}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
            <h3 className="font-display text-lg font-semibold mb-4 text-[var(--coffee)]">
              Lojas Seguidas
            </h3>
            {follows.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">
                Você ainda não segue nenhuma loja.
              </p>
            ) : (
              <ul className="space-y-3">
                {follows.map((f: any) => {
                  const s = f.sellers;
                  if (!s) return null;
                  return (
                    <li key={f.id} className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full overflow-hidden border border-[var(--border)] bg-[var(--sand)] shrink-0 flex items-center justify-center">
                        {s.logo_url ? (
                          <img src={s.logo_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Store className="h-4 w-4 text-[var(--clay)]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[var(--coffee)] line-clamp-1">
                          {s.store_name}
                        </p>
                        {s.seller_type && (
                          <p className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
                            {s.seller_type}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleUnfollow(f.id, s.store_name)}
                        aria-label={`Deixar de seguir ${s.store_name}`}
                        className="h-7 w-7 rounded-full flex items-center justify-center text-[var(--muted-foreground)] hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>



          <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
            <h3 className="font-display text-lg font-semibold mb-4 text-[var(--coffee)]">
              Endereço
            </h3>
            <p className="text-xs text-[var(--muted-foreground)]">
              Nenhum endereço cadastrado ainda.
            </p>
            <Button variant="soft" size="sm" className="w-full mt-4">
              Adicionar
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function StatusStep({ icon: Icon, label, active }: { icon: any; label: string; active: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-2 ${
          active
            ? "bg-[var(--clay)] border-[var(--clay)] text-white shadow-md"
            : "bg-white border-[var(--border)] text-[var(--muted-foreground)]"
        }`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <span
        className={`text-[10px] font-bold uppercase tracking-widest ${active ? "text-[var(--clay)]" : "text-[var(--muted-foreground)]"}`}
      >
        {label}
      </span>
    </div>
  );
}
