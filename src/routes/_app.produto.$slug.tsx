import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ChevronRight, Heart, Leaf, Minus, Plus, Sparkles, Star } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product-card";
import { useCart } from "@/lib/cart";
import { formatBRL, getProductBySlug, products } from "@/lib/products";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/produto/$slug")({
  loader: ({ params }) => {
    const product = getProductBySlug(params.slug);
    if (!product) throw notFound();
    return product;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.name} — Licuri Hub` },
          { name: "description", content: loaderData.description },
          { property: "og:title", content: loaderData.name },
          { property: "og:description", content: loaderData.short },
          { property: "og:image", content: loaderData.image },
        ]
      : [],
  }),
  notFoundComponent: () => (
    <div className="container-narrow py-20 text-center">
      <h1 className="font-display text-3xl">Produto não encontrado</h1>
      <Link to="/categorias" className="mt-4 inline-block text-[var(--clay)] underline">
        Voltar ao catálogo
      </Link>
    </div>
  ),
  component: ProductPage,
});

function ProductPage() {
  const product = Route.useLoaderData();
  const [qty, setQty] = useState(1);
  const add = useCart((s) => s.add);
  const related = products.filter((p) => p.id !== product.id && p.category === product.category).slice(0, 4);

  return (
    <div className="container-narrow py-10">
      <nav className="mb-6 flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
        <Link to="/" className="hover:text-[var(--clay)]">Início</Link>
        <ChevronRight className="h-3 w-3" />
        <Link to="/categorias" className="hover:text-[var(--clay)]">Catálogo</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="line-clamp-1">{product.name}</span>
      </nav>

      <div className="grid gap-10 md:grid-cols-[1fr_1fr]">
        {/* Galeria */}
        <div className="grid grid-cols-[80px_1fr] gap-3">
          <div className="space-y-3">
            {[product.image, product.image, product.image].map((img, i) => (
              <div
                key={i}
                className="aspect-square overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--sand)]"
              >
                <img src={img} alt="" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
          <div className="aspect-square overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--sand)]">
            <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
          </div>
        </div>

        {/* Info */}
        <div>
          <h1 className="font-display text-3xl font-semibold leading-tight text-[var(--coffee)] md:text-4xl">
            {product.name}
          </h1>
          <div className="mt-3 flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1 text-[var(--clay)]">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={
                    "h-4 w-4 " +
                    (i < Math.round(product.rating)
                      ? "fill-[var(--clay)] text-[var(--clay)]"
                      : "text-[var(--muted-foreground)]/40")
                  }
                />
              ))}
              <span className="font-semibold text-[var(--coffee)]">{product.rating}</span>
            </span>
            <span className="text-[var(--muted-foreground)]">({product.reviews} avaliações)</span>
          </div>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Vendido por <span className="font-medium text-[var(--sertao)]">{product.shop}</span>
          </p>

          <p className="mt-6 font-display text-4xl font-bold text-[var(--clay)]">
            {formatBRL(product.price)}
          </p>

          <p className="mt-5 text-[var(--sertao)]">{product.description}</p>

          <ul className="mt-6 space-y-2 text-sm">
            {product.badges.map((b: string) => (
              <li key={b} className="flex items-center gap-2 text-[var(--sertao)]">
                <Leaf className="h-4 w-4 text-[var(--leaf)]" /> {b}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex items-center gap-3">
            <div className="flex items-center rounded-md border border-[var(--border)]">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="grid h-11 w-11 place-items-center text-[var(--sertao)] hover:bg-[var(--sand)]"
                aria-label="Diminuir"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center text-base font-semibold">{qty}</span>
              <button
                onClick={() => setQty(qty + 1)}
                className="grid h-11 w-11 place-items-center text-[var(--sertao)] hover:bg-[var(--sand)]"
                aria-label="Aumentar"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <Button
              variant="hero"
              size="xl"
              className="flex-1"
              onClick={() => {
                add(product, qty);
                toast.success("Adicionado ao carrinho", { description: product.name });
              }}
            >
              Adicionar ao carrinho
            </Button>
          </div>

          <button className="mt-4 inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--clay)]">
            <Heart className="h-4 w-4" /> Adicionar aos favoritos
          </button>
        </div>
      </div>

      {/* História */}
      <section className="mt-16 rounded-2xl border border-[var(--border)] bg-[var(--cream)] p-8">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
          <Sparkles className="h-3.5 w-3.5" /> História do produto
        </div>
        <h2 className="mt-2 font-display text-2xl font-semibold text-[var(--coffee)]">
          Tradição que atravessa gerações
        </h2>
        <p className="mt-3 max-w-3xl text-[var(--sertao)]">
          Este produto é elaborado por famílias da região da Caatinga baiana, que mantêm viva a tradição de extração artesanal do licuri — respeitando o tempo da natureza e promovendo o desenvolvimento sustentável.
        </p>
      </section>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 font-display text-2xl font-semibold text-[var(--coffee)]">
            Você também pode gostar
          </h2>
          <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
