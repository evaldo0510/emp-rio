import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Leaf, Sprout, Sun, Truck, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product-card";
import { categories, products as mockProducts, type Product } from "@/lib/products";
import { supabase } from "@/lib/supabase";
import hero from "@/assets/hero-licuri.jpg";

export const Route = createFileRoute("/_app/")({
  head: () => ({
    meta: [
      { title: "Empório do Licuri — Natural • Tradição • Energia" },
      {
        name: "description",
        content:
          "Produtos artesanais do licuri: alimentos, óleos, cosméticos e artesanato direto do Sertão.",
      },
      { property: "og:title", content: "Empório do Licuri — Natural • Tradição • Energia" },
      {
        property: "og:description",
        content: "Marketplace do licuri, produzido por famílias do Sertão.",
      },
      { property: "og:image", content: hero },
    ],
  }),
  component: HomePage,
});

const pillars = [
  { icon: Leaf, title: "Produtos naturais", text: "e artesanais" },
  { icon: Sprout, title: "Produtores", text: "do Nordeste" },
  { icon: Sun, title: "Comércio justo", text: "e sustentável" },
  { icon: Truck, title: "Entrega", text: "para todo o Brasil" },
];

function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("active", true)
          .limit(12);

        if (error) throw error;

        if (data && data.length > 0) {
          const mapped = data.map(p => ({
            id: p.id,
            slug: p.slug,
            name: p.name,
            category: p.category,
            price: Number(p.price),
            rating: Number(p.rating || 0),
            reviews: p.reviews || 0,
            shop: p.shop_name || p.shop || "Vendedor",
            region: p.region || "Sertão",
            image: p.image_url,
            short: p.short_description || "",
            description: p.description || "",
            badges: p.badges || [],
          })) as Product[];
          setProducts(mapped);
        } else {
          setProducts(mockProducts);
        }
      } catch (err) {
        console.error("Error fetching products:", err);
        setProducts(mockProducts);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProducts();
  }, []);

  const featured = products.slice(0, 4);
  return (
    <>
      {/* HERO */}
      <section className="container-narrow pt-8">
        <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] shadow-[var(--shadow-warm)]">
          <img
            src={hero}
            alt="Cesto de licuri sob coqueirais nordestinos"
            width={1920}
            height={1080}
            className="h-[clamp(360px,60vh,640px)] w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--coffee)]/75 via-[var(--coffee)]/45 to-transparent" />

          <div className="absolute inset-0 flex items-center">
            <div className="w-full px-6 md:px-12">
              <div className="max-w-xl text-[var(--cream)]">
                <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] backdrop-blur">
                  <Sprout className="h-3.5 w-3.5" /> Origem Licuri certificada
                </p>
                <h1 className="font-display text-balance text-4xl font-semibold leading-tight md:text-6xl">
                  Do coração do Nordeste para sua casa
                </h1>
                <p className="mt-5 max-w-md text-base text-[var(--cream)]/85 md:text-lg">
                  Produtos feitos a partir do licuri, com amor, tradição e sustentabilidade.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Button asChild variant="hero" size="xl">
                    <Link to="/categorias">
                      Comprar agora <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="soft" size="xl">
                    <Link to="/sobre">Conhecer história</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* selo */}
          <div className="absolute right-6 top-6 hidden h-28 w-28 place-items-center rounded-full border border-[var(--cream)]/40 bg-[var(--cream)]/15 text-center text-[10px] uppercase tracking-[0.18em] text-[var(--cream)] backdrop-blur md:grid">
            <div>
              <Sprout className="mx-auto mb-1 h-5 w-5" />
              Origem Licuri
              <br />
              certificada
            </div>
          </div>
        </div>

        {/* Pilares */}
        <div className="mt-6 grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--cream)] p-4 md:grid-cols-4 md:p-6">
          {pillars.map((p) => (
            <div key={p.title} className="flex items-center gap-3">
              <p.icon className="h-5 w-5 text-[var(--leaf)]" />
              <div className="text-xs uppercase tracking-[0.16em] text-[var(--sertao)]">
                <div className="font-semibold">{p.title}</div>
                <div className="opacity-70">{p.text}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CATEGORIAS */}
      <section className="container-narrow mt-20">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-display text-3xl font-semibold text-[var(--coffee)] md:text-4xl">
            Categorias em destaque
          </h2>
          <Link
            to="/categorias"
            className="hidden items-center gap-1 text-sm text-[var(--clay)] hover:underline md:inline-flex"
          >
            Ver todas <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {categories.map((c) => (
            <Link
              key={c.id}
              to="/categorias"
              search={{ cat: c.id } as never}
              className="group overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] transition-transform hover:-translate-y-0.5"
            >
              <div className="aspect-[4/3] overflow-hidden bg-[var(--sand)]">
                <img
                  src={c.image}
                  alt={c.label}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <div className="flex items-center justify-between p-3">
                <div>
                  <div className="font-display text-sm font-semibold text-[var(--coffee)]">
                    {c.label}
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                    {c.count} produtos
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-[var(--clay)]" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* DESTAQUES */}
      <section className="container-narrow mt-20">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
              Mais vendidos
            </p>
            <h2 className="font-display text-3xl font-semibold text-[var(--coffee)] md:text-4xl">
              Direto do Sertão
            </h2>
          </div>
          <Link
            to="/categorias"
            className="hidden items-center gap-1 text-sm text-[var(--clay)] hover:underline md:inline-flex"
          >
            Ver tudo <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
          {isLoading ? (
            <div className="col-span-full flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--clay)]" />
            </div>
          ) : (
            featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))
          )}
        </div>
      </section>

      {/* CALL */}
      <section className="container-narrow mt-24">
        <div className="grid gap-8 rounded-3xl border border-[var(--border)] bg-[var(--coffee)] p-10 text-[var(--cream)] md:grid-cols-2 md:p-14">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] opacity-70">
              Vendedores parceiros
            </p>
            <h3 className="mt-2 font-display text-3xl font-semibold md:text-4xl">
              Leve seu produto do licuri para o Brasil inteiro.
            </h3>
          </div>
          <div className="flex flex-col items-start justify-center gap-4">
            <p className="opacity-80">
              Cooperativas e famílias produtoras: cadastre sua loja, gerencie pedidos e acompanhe
              vendas pelo painel.
            </p>
            <Button asChild variant="hero" size="lg">
              <Link to="/vendedor">Acessar painel do vendedor</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
