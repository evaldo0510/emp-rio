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
  { icon: Sprout, title: "Origem", text: "Tradição sertaneja" },
  { icon: Leaf, title: "Sustentável", text: "Preserva a Caatinga" },
  { icon: Sun, title: "Inovação", text: "Futuro do licuri" },
  { icon: Truck, title: "Conexão", text: "Sertão para o Brasil" },
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
                  <Sprout className="h-3.5 w-3.5" /> Ecossistema Licuri
                </p>
                <h1 className="font-display text-balance text-4xl font-semibold leading-tight md:text-6xl uppercase">
                  Do sertão para o mundo.
                </h1>
                <p className="mt-5 max-w-md text-base text-[var(--cream)]/85 md:text-lg">
                  Onde a tradição encontra o futuro.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Button asChild variant="hero" size="xl">
                    <Link to="/categorias">
                      Explorar o Empório <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="soft" size="xl">
                    <Link to="/vendedor">Quero vender no Empório</Link>
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
              <p.icon className="h-5 w-5 text-primary" />
              <div className="text-xs uppercase tracking-[0.16em] text-[var(--sertao)]">
                <div className="font-semibold">{p.title}</div>
                <div className="opacity-70">{p.text}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ECOSSISTEMA */}
      <section className="container-narrow mt-20">
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--cream)] p-8 md:p-16">
          <div className="max-w-3xl">
            <p className="text-[10px] uppercase tracking-[0.22em] text-primary">
              Muito mais que uma loja
            </p>
            <h2 className="mt-4 font-display text-3xl font-semibold text-[var(--coffee)] md:text-5xl">
              O ecossistema que transforma o licuri em produtos, negócios e oportunidades.
            </h2>
            <p className="mt-6 text-lg text-[var(--sertao)]">
              Não queremos competir apenas por preço. Queremos criar <strong>VALOR PERCEBIDO</strong>. 
              No Empório do Licuri, você não compra apenas um produto; você leva <strong>origem, história, experiência e identidade</strong>.
            </p>

          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              { title: "Cultura", desc: "Sertão, Caatinga e histórias que inspiram.", icon: Sprout },
              { title: "Tecnologia", desc: "IA e catálogo digital para facilitar vendas.", icon: Sun },
              { title: "Negócios", desc: "Conexão entre marcas, produtores e inovação.", icon: Leaf },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-[var(--border)]/50 bg-white/50 p-6">
                <item.icon className="h-6 w-6 text-primary" />
                <h3 className="mt-4 font-display text-xl font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">{item.desc}</p>
              </div>
            ))}
          </div>
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
            className="hidden items-center gap-1 text-sm text-primary hover:underline md:inline-flex"

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
                <ArrowRight className="h-4 w-4 text-primary" />
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
            className="hidden items-center gap-1 text-sm text-primary hover:underline md:inline-flex"
          >
            Ver tudo <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
          {isLoading ? (
            <div className="col-span-full flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))
          )}
        </div>
      </section>

      {/* CASA DO LICURI */}
      <section className="container-narrow mt-24">
        <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--coffee)] text-[var(--cream)]">
          <div className="grid gap-10 p-10 md:grid-cols-2 md:p-16">
            <div className="flex flex-col justify-center">
              <p className="text-[10px] uppercase tracking-[0.22em] opacity-70">
                O Futuro Espaço Físico na Bahia
              </p>
              <h2 className="mt-4 font-display text-4xl font-semibold md:text-5xl uppercase">
                Casa do Licuri
              </h2>
              <p className="mt-6 text-lg opacity-85">
                Entre. Experimente. Conheça o sertão.
              </p>
              <p className="mt-2 text-base opacity-70">
                Um espaço físico que combina Empório, Cafeteria, Espaço Cultural e Experiência. 
                Onde a tradição encontra o futuro.
              </p>
              <div className="mt-8">
                <Button asChild variant="hero" size="lg">
                  <Link to="/sobre">Conhecer a visão</Link>
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="text-center font-display text-2xl font-bold italic opacity-40 md:text-4xl">
                PRODUTOS • HISTÓRIAS <br /> EXPERIÊNCIAS • CULTURA
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NARRATIVA CENTRAL */}
      <section className="container-narrow mt-24 py-16 border-y border-[var(--border)]">
        <div className="grid gap-12 md:grid-cols-2 items-center">
          <div>
            <h3 className="font-display text-3xl font-bold text-[var(--coffee)] md:text-5xl">
              Uma palmeira que conecta o sertão ao mundo.
            </h3>
            <div className="mt-8 space-y-4 text-[var(--sertao)] text-lg">
              <p>Alimenta pessoas e animais. Gera matéria-prima e inspira receitas.</p>
              <p>Sustenta tradições e gera renda.</p>
              <p className="font-bold text-primary text-xl">Essa palmeira é o licuri.</p>
            </div>
          </div>
          <div className="rounded-3xl bg-[var(--coffee)] p-10 text-[var(--cream)] flex items-center justify-center">
             <div className="text-center">
                <p className="text-[10px] uppercase tracking-[0.22em] opacity-70 mb-4">A Promessa</p>
                <p className="font-display text-2xl italic">"Transformar a biodiversidade e a cultura em desenvolvimento econômico sustentável."</p>
             </div>
          </div>
        </div>
      </section>

      {/* HISTÓRIAS DO SERTÃO */}


      {/* PROPÓSITO IMPACTO */}

      <section className="container-narrow mt-24 py-12 text-center">
        <div className="mx-auto max-w-4xl">
          <h3 className="font-display text-4xl font-bold text-[var(--coffee)] md:text-6xl uppercase">
            O licuri é nossa raiz. <br />
            <span className="text-primary">O futuro é nosso caminho.</span>
          </h3>
          <p className="mt-8 text-lg text-[var(--sertao)]">
            Descubra produtos que carregam histórias.
          </p>

        </div>
      </section>

      {/* CALL VENDEDORES */}
      <section className="container-narrow mt-16 mb-24">
        <div className="grid gap-8 rounded-3xl border border-[var(--border)] bg-[var(--cream)] p-10 text-[var(--coffee)] md:grid-cols-2 md:p-14">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-primary">
              Para Produtores
            </p>
            <h3 className="mt-2 font-display text-3xl font-semibold md:text-4xl uppercase">
              VOCÊ PRODUZ? VENDA NO EMPÓRIO.
            </h3>

          </div>
          <div className="flex flex-col items-start justify-center gap-4">
            <p className="text-[var(--sertao)] text-lg font-medium">
              Seu produto tem uma história. Nós ajudamos o mundo a conhecê-la.
            </p>
            <p className="text-[var(--sertao)]">
              Você tem um produto feito com licuri ou relacionado à cultura e à biodiversidade do sertão? O Empório do Licuri pode ser a sua vitrine.
            </p>
            <Button asChild variant="hero" size="lg">
              <Link to="/vendedor">QUERO SER UM PRODUTOR PARCEIRO</Link>
            </Button>

          </div>
        </div>
      </section>

    </>
  );
}
