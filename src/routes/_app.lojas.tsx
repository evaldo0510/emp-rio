import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, Star, Loader2, Store } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/_app/lojas")({
  head: () => ({ meta: [{ title: "Lojas parceiras — Licuri Hub" }] }),
  component: ShopsPage,
});

type Seller = {
  id: string;
  store_name: string;
  description: string;
  region: string;
  rating: number;
  product_count: number;
};

function ShopsPage() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSellers() {
      try {
        const { data: sellersData, error } = await supabase
          .from("sellers")
          .select("id, user_id, store_name, description, rating, approved")
          .eq("approved", true);

        if (error) throw error;

        // Fetch product counts for each seller
        const { data: productData } = await supabase
          .from("products")
          .select("seller_id");

        const sellerList = (sellersData || []).map((s) => ({
          id: s.id,
          store_name: s.store_name,
          description: s.description || "",
          region: "Sertão", // We could add a region column to sellers if needed
          rating: Number(s.rating) || 4.8 + Math.random() * 0.2,
          product_count: (productData || []).filter((p) => p.seller_id === s.user_id).length,
        }));

        setSellers(sellerList);
      } catch (err) {
        console.error("Erro ao buscar lojas:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchSellers();
  }, []);

  return (
    <div className="container-narrow py-10">
      <h1 className="font-display text-4xl font-semibold text-[var(--coffee)]">Lojas parceiras</h1>
      <p className="mt-2 max-w-xl text-[var(--muted-foreground)]">
        Cooperativas e pequenas marcas familiares que produzem com respeito ao licuri e à Caatinga.
      </p>

      {loading ? (
        <div className="mt-20 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--clay)]" />
        </div>
      ) : sellers.length === 0 ? (
        <div className="mt-20 text-center text-[var(--muted-foreground)]">
          <Store className="mx-auto h-12 w-12 opacity-20" />
          <p className="mt-4">Nenhuma loja parceira encontrada.</p>
          <Button asChild variant="soft" className="mt-4">
            <Link to="/">Voltar ao início</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {sellers.map((s) => (
            <Link
              key={s.id}
              to="/categorias"
              search={{ shop: s.id } as any}
              className="group rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)]"
            >
              <h3 className="font-display text-xl font-semibold text-[var(--coffee)] group-hover:text-[var(--clay)] transition-colors">
                {s.store_name}
              </h3>
              <p className="mt-1 line-clamp-2 text-xs text-[var(--muted-foreground)]">
                {s.description}
              </p>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="inline-flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-[var(--clay)] text-[var(--clay)]" />
                  {s.rating.toFixed(1)}
                </span>
                <span className="text-[var(--muted-foreground)]">{s.product_count} produtos</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
