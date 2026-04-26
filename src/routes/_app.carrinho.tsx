import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2, ShoppingBag, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { formatBRL } from "@/lib/products";
import { useState, useEffect } from "react";
import { supabase, syncCartToDB } from "@/lib/supabase";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/carrinho")({
  head: () => ({ meta: [{ title: "Carrinho — Licuri Hub" }] }),
  component: CartPage,
});

function CartPage() {
  const [loading, setLoading] = useState(true);
  const items = useCart((s) => s.items);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const clear = useCart((s) => s.clear);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    handleCartSync();
  }, [items]);

  const handleCartSync = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user && items.length > 0) {
      try {
        await syncCartToDB(user.id, items);
      } catch (e) {
        console.error("Erro ao sincronizar carrinho:", e);
      }
    }
  };

  const fetchDBCart = async () => {
    try {
      setIsSyncing(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("cart_items")
        .select("quantity, products(*)")
        .eq("user_id", user.id);

      if (error) throw error;

      // If DB has items and local cart is empty, maybe populate from DB
      // But for this simplified flow, we prioritize the Zustand state and push to DB
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  };

  const subtotal = items.reduce((a, i) => a + i.price * i.quantity, 0);

  return (
    <div className="container-narrow py-10">
      <h1 className="font-display text-4xl font-semibold text-[var(--coffee)]">Carrinho</h1>

      {items.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-[var(--border)] p-16 text-center">
          <p className="text-[var(--muted-foreground)]">Seu carrinho está vazio.</p>
          <Button asChild variant="hero" className="mt-6">
            <Link to="/categorias">Explorar produtos</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 md:grid-cols-[1fr_360px]">
          <ul className="space-y-3">
            {items.map((i) => (
              <li
                key={i.id}
                className="flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-3"
              >
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-[var(--sand)]">
                  <img src={i.image} alt={i.name} className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    to="/produto/$slug"
                    params={{ slug: i.slug }}
                    className="line-clamp-1 font-display text-base font-semibold text-[var(--coffee)] hover:text-[var(--clay)]"
                  >
                    {i.name}
                  </Link>
                  <p className="font-display text-base font-bold text-[var(--clay)]">
                    {formatBRL(i.price)}
                  </p>
                </div>
                <div className="flex items-center rounded-md border border-[var(--border)]">
                  <button
                    onClick={() => setQty(i.id, i.quantity - 1)}
                    className="grid h-8 w-8 place-items-center hover:bg-[var(--sand)]"
                    aria-label="Diminuir"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold">{i.quantity}</span>
                  <button
                    onClick={() => setQty(i.id, i.quantity + 1)}
                    className="grid h-8 w-8 place-items-center hover:bg-[var(--sand)]"
                    aria-label="Aumentar"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <button
                  onClick={() => remove(i.id)}
                  className="grid h-9 w-9 place-items-center rounded-full text-[var(--muted-foreground)] hover:bg-[var(--sand)] hover:text-[var(--destructive)]"
                  aria-label="Remover"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>

          <aside className="h-max rounded-2xl border border-[var(--border)] bg-[var(--cream)] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-semibold">Resumo</h2>
              {isSyncing && <RefreshCw className="h-3 w-3 animate-spin text-[var(--muted-foreground)]" />}
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-[var(--muted-foreground)]">Subtotal ({items.length} itens)</dt>
                <dd>{formatBRL(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--muted-foreground)]">Frete</dt>
                <dd>Calcular no checkout</dd>
              </div>
            </dl>
            <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-4">
              <span className="text-sm text-[var(--muted-foreground)]">Total</span>
              <span className="font-display text-2xl font-bold text-[var(--clay)]">
                {formatBRL(subtotal)}
              </span>
            </div>
            <Button asChild variant="hero" size="lg" className="mt-6 w-full">
              <Link to="/checkout">Finalizar compra</Link>
            </Button>
          </aside>
        </div>
      )}
    </div>
  );
}
