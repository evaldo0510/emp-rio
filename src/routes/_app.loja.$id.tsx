import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Store, Star, Heart, HeartOff, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { formatBRL } from "@/lib/products";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/loja/$id")({
  head: () => ({ meta: [{ title: "Loja — Licuri Hub" }] }),
  component: StorePage,
});

type Seller = {
  id: string;
  user_id: string;
  store_name: string;
  description: string | null;
  logo_url: string | null;
  rating: number | null;
  seller_type: string | null;
};

function StorePage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [followId, setFollowId] = useState<string | null>(null);
  const [followLoading, setFollowLoading] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data: sellerData, error } = await supabase
        .from("sellers")
        .select("id, user_id, store_name, description, logo_url, rating, seller_type, approved")
        .eq("id", id)
        .eq("approved", true)
        .maybeSingle();

      if (cancelled) return;

      if (error || !sellerData) {
        setSeller(null);
        setLoading(false);
        return;
      }
      setSeller(sellerData as Seller);

      const [prodRes, userRes, countRes] = await Promise.all([
        supabase
          .from("products")
          .select("id, slug, name, price, image_url, rating, reviews")
          .eq("seller_id", sellerData.user_id ?? "")
          .eq("is_published", true)
          .order("created_at", { ascending: false }),
        supabase.auth.getUser(),
        supabase
          .from("seller_follows")
          .select("id", { count: "exact", head: true })
          .eq("seller_id", sellerData.id),
      ]);

      if (cancelled) return;
      setProducts(prodRes.data || []);
      setFollowerCount(countRes.count || 0);

      const uid = userRes.data.user?.id ?? null;
      setUserId(uid);
      if (uid) {
        const { data: f } = await supabase
          .from("seller_follows")
          .select("id")
          .eq("user_id", uid)
          .eq("seller_id", sellerData.id)
          .maybeSingle();
        if (!cancelled) setFollowId(f?.id ?? null);
      }
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function toggleFollow() {
    if (!userId) {
      toast.info("Faça login para seguir esta loja.");
      navigate({ to: "/conta" });
      return;
    }
    if (!seller || followLoading) return;
    setFollowLoading(true);
    if (followId) {
      const prev = followId;
      setFollowId(null);
      setFollowerCount((c) => Math.max(0, c - 1));
      const { error } = await supabase.from("seller_follows").delete().eq("id", prev);
      if (error) {
        setFollowId(prev);
        setFollowerCount((c) => c + 1);
        toast.error("Não foi possível deixar de seguir.");
      } else {
        toast.success(`Você deixou de seguir ${seller.store_name}.`);
      }
    } else {
      const { data, error } = await supabase
        .from("seller_follows")
        .insert({ user_id: userId, seller_id: seller.id })
        .select("id")
        .single();
      if (error || !data) {
        toast.error("Não foi possível seguir a loja.");
      } else {
        setFollowId(data.id);
        setFollowerCount((c) => c + 1);
        toast.success(`Você está seguindo ${seller.store_name}.`);
      }
    }
    setFollowLoading(false);
  }

  if (loading) {
    return (
      <div className="container-narrow py-20 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--clay)]" />
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="container-narrow py-20 text-center">
        <Store className="mx-auto h-12 w-12 opacity-20" />
        <p className="mt-4 text-[var(--muted-foreground)]">Loja não encontrada.</p>
        <Button asChild variant="soft" className="mt-4">
          <Link to="/lojas">Ver todas as lojas</Link>
        </Button>
      </div>
    );
  }

  const following = !!followId;

  return (
    <div className="container-narrow py-10">
      <div className="rounded-2xl border border-[var(--border)] bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="h-20 w-20 rounded-full overflow-hidden border border-[var(--border)] bg-[var(--sand)] flex items-center justify-center shrink-0">
            {seller.logo_url ? (
              <img src={seller.logo_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <Store className="h-8 w-8 text-[var(--clay)]" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-3xl font-semibold text-[var(--coffee)]">
              {seller.store_name}
            </h1>
            {seller.description && (
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">{seller.description}</p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[var(--muted-foreground)]">
              <span className="inline-flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-[var(--clay)] text-[var(--clay)]" />
                {(Number(seller.rating) || 0).toFixed(1)}
              </span>
              <span>{products.length} produtos</span>
              <span>
                {followerCount} {followerCount === 1 ? "seguidor" : "seguidores"}
              </span>
              {seller.seller_type && (
                <span className="uppercase tracking-wider">{seller.seller_type}</span>
              )}
            </div>
          </div>
          <Button
            onClick={toggleFollow}
            disabled={followLoading}
            variant={following ? "soft" : "hero"}
            className="shrink-0"
          >
            {followLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : following ? (
              <HeartOff className="mr-2 h-4 w-4" />
            ) : (
              <Heart className="mr-2 h-4 w-4" />
            )}
            {following ? "Seguindo" : "Seguir loja"}
          </Button>
        </div>
      </div>

      <h2 className="mt-10 mb-4 font-display text-2xl font-semibold text-[var(--coffee)]">
        Produtos
      </h2>

      {products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] p-12 text-center bg-white">
          <Package className="mx-auto h-10 w-10 text-[var(--muted-foreground)] opacity-20 mb-3" />
          <p className="text-sm text-[var(--muted-foreground)]">
            Esta loja ainda não publicou produtos.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <Link
              key={p.id}
              to="/produto/$slug"
              params={{ slug: p.slug }}
              className="group rounded-2xl border border-[var(--border)] bg-white overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)]"
            >
              <div className="aspect-square bg-[var(--sand)] overflow-hidden">
                {p.image_url && (
                  <img
                    src={p.image_url}
                    alt={p.name}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                  />
                )}
              </div>
              <div className="p-3">
                <p className="text-sm text-[var(--coffee)] line-clamp-2 group-hover:text-[var(--clay)]">
                  {p.name}
                </p>
                <p className="mt-1 text-sm font-bold text-[var(--clay)]">
                  {formatBRL(Number(p.price))}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
