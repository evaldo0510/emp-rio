import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { ChevronRight, Star } from "lucide-react";
import {
  products as mockProducts,
  categories,
  regions,
  formatBRL,
  type Category,
  type Product,
} from "@/lib/products";
import { supabase } from "@/lib/supabase";

type Search = { cat?: Category | "todos"; q?: string };

export const Route = createFileRoute("/_app/categorias")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    cat: (s.cat as Search["cat"]) ?? "todos",
    q: (s.q as string) ?? "",
  }),
  head: () => ({
    meta: [
      { title: "Catálogo — Empório do Licuri" },
      {
        name: "description",
        content: "Explore alimentos, óleos, cosméticos e artesanato feitos a partir do licuri.",
      },
    ],
  }),
  component: CatalogPage,
});

function CatalogPage() {
  const { cat, q } = Route.useSearch();
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [region, setRegion] = useState("Todos");
  const [minRating, setMinRating] = useState(0);
  const [maxPrice, setMaxPrice] = useState(200);
  const [sort, setSort] = useState("destaques");

  useEffect(() => {
    const fetchDbProducts = async () => {
      const { data } = await supabase.from("products").select("*");
      if (data) {
        const mapped: Product[] = data.map((d: any) => ({
          id: d.id,
          slug: d.slug,
          name: d.name,
          category: d.category as Category,
          price: Number(d.price),
          rating: Number(d.rating),
          reviews: d.reviews,
          shop: d.shop,
          region: d.region,
          image: d.image_url,
          short: d.short_description,
          description: d.description,
          badges: d.badges || [],
        }));
        setDbProducts(mapped);
      }
    };
    fetchDbProducts();
  }, []);

  const list = useMemo(() => {
    let l = [...mockProducts, ...dbProducts];
    if (cat && cat !== "todos") l = l.filter((p) => p.category === cat);
    if (q) l = l.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
    if (region !== "Todos") l = l.filter((p) => p.region === region);
    if (minRating) l = l.filter((p) => p.rating >= minRating);
    l = l.filter((p) => p.price <= maxPrice);
    if (sort === "menor") l.sort((a, b) => a.price - b.price);
    if (sort === "maior") l.sort((a, b) => b.price - a.price);
    if (sort === "avaliacao") l.sort((a, b) => b.rating - a.rating);
    return l;
  }, [cat, q, region, minRating, maxPrice, sort]);

  const currentCat = categories.find((c) => c.id === cat);

  return (
    <div className="container-narrow py-10">
      <nav className="mb-3 flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
        <Link to="/" className="hover:text-[var(--clay)]">
          Início
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span>{currentCat?.label ?? "Todos os produtos"}</span>
      </nav>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl font-semibold text-[var(--coffee)]">
            {currentCat?.label ?? "Todos os produtos"}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Produtos deliciosos e nutritivos feitos com o melhor do licuri.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-sm">
          <span className="text-[var(--muted-foreground)]">Ordenar por</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-transparent font-medium outline-none"
          >
            <option value="destaques">Mais vendidos</option>
            <option value="menor">Menor preço</option>
            <option value="maior">Maior preço</option>
            <option value="avaliacao">Melhor avaliação</option>
          </select>
        </div>
      </header>

      <div className="grid gap-8 md:grid-cols-[240px_1fr]">
        {/* Filtros */}
        <aside className="space-y-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 h-max">
          <div>
            <h3 className="mb-3 font-display text-base font-semibold">Categoria</h3>
            <ul className="space-y-1.5 text-sm">
              <FilterItem to={{ cat: "todos" }} active={cat === "todos"}>
                Todos
              </FilterItem>
              {categories.map((c) => (
                <FilterItem key={c.id} to={{ cat: c.id }} active={cat === c.id}>
                  {c.label}
                </FilterItem>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 font-display text-base font-semibold">Faixa de preço</h3>
            <input
              type="range"
              min={10}
              max={200}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-[var(--clay)]"
            />
            <div className="flex justify-between text-xs text-[var(--muted-foreground)]">
              <span>R$ 0</span>
              <span>{formatBRL(maxPrice)}</span>
            </div>
          </div>

          <div>
            <h3 className="mb-3 font-display text-base font-semibold">Região</h3>
            <ul className="space-y-1.5 text-sm">
              {regions.map((r) => (
                <li key={r}>
                  <button
                    onClick={() => setRegion(r)}
                    className={
                      "w-full rounded-md px-2 py-1 text-left transition-colors " +
                      (region === r
                        ? "bg-[var(--sand)] font-medium text-[var(--clay)]"
                        : "hover:bg-[var(--sand)]")
                    }
                  >
                    {r}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 font-display text-base font-semibold">Avaliação</h3>
            <ul className="space-y-1.5 text-sm">
              {[5, 4, 3].map((n) => (
                <li key={n}>
                  <button
                    onClick={() => setMinRating(minRating === n ? 0 : n)}
                    className={
                      "flex w-full items-center gap-1 rounded-md px-2 py-1 transition-colors " +
                      (minRating === n ? "bg-[var(--sand)]" : "hover:bg-[var(--sand)]")
                    }
                  >
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={
                          "h-3.5 w-3.5 " +
                          (i < n
                            ? "fill-[var(--clay)] text-[var(--clay)]"
                            : "text-[var(--muted-foreground)]/40")
                        }
                      />
                    ))}
                    <span className="ml-1 text-xs text-[var(--muted-foreground)]">ou mais</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Grid */}
        <div>
          {list.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[var(--border)] p-12 text-center text-[var(--muted-foreground)]">
              Nenhum produto encontrado com esses filtros.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-5 md:grid-cols-3">
              {list.map((p) => (
                <Link
                  key={p.id}
                  to="/produto/$slug"
                  params={{ slug: p.slug }}
                  className="group overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)]"
                >
                  <div className="aspect-square overflow-hidden bg-[var(--sand)]">
                    <img
                      src={p.image}
                      alt={p.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="space-y-1 p-4">
                    <h3 className="line-clamp-2 font-display text-base font-semibold text-[var(--coffee)]">
                      {p.name}
                    </h3>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                      {p.shop}
                    </p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="font-display text-base font-bold text-[var(--clay)]">
                        {formatBRL(p.price)}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                        <Star className="h-3.5 w-3.5 fill-[var(--clay)] text-[var(--clay)]" />
                        {p.rating} ({p.reviews})
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterItem({
  to,
  active,
  children,
}: {
  to: { cat: Category | "todos" };
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        to="/categorias"
        search={to as never}
        className={
          "block rounded-md px-2 py-1 transition-colors " +
          (active
            ? "bg-[var(--sand)] font-medium text-[var(--clay)]"
            : "text-[var(--sertao)] hover:bg-[var(--sand)]")
        }
      >
        {children}
      </Link>
    </li>
  );
}
