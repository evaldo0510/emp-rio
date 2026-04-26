import { createFileRoute, Link, notFound, useLoaderData } from "@tanstack/react-router";
import {
  ChevronRight,
  Heart,
  Leaf,
  Minus,
  Plus,
  Sparkles,
  Star,
  ShieldCheck,
  Truck,
  Zap,
  ShoppingCart,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product-card";
import { useCart } from "@/lib/cart";
import { formatBRL, getProductBySlug, products } from "@/lib/products";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/produto/$slug")({
  loader: async ({ params }) => {
    const product = await getProductBySlug(params.slug);
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
  const product = useLoaderData({ from: "/_app/produto/$slug" });
  const [selectedImage, setSelectedImage] = useState(product.image);
  const [qty, setQty] = useState(1);
  const [showSticky, setShowSticky] = useState(false);
  const add = useCart((s) => s.add);

  useEffect(() => {
    const handleScroll = () => {
      setShowSticky(window.scrollY > 600);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const related = products
    .filter((p) => p.id !== product.id && p.category === product.category)
    .slice(0, 4);

  // Mocked data for sections not yet in DB
  const story =
    "Este produto nasce do coração do sertão. Cada fruto é colhido manualmente, respeitando o tempo da terra e mantendo a tradição viva.";
  const benefits = [
    "Rico em nutrientes naturais",
    "Produção artesanal e sustentável",
    "Livre de conservantes artificiais",
    "Apoia comunidades locais",
  ];
  const specs = {
    origem: product.region || "Bahia",
    tipo: "Artesanal",
    validade: "12 meses",
  };

  return (
    <div className="bg-[#F5F1E8]/50 min-h-screen">
      <div className="container-narrow py-10">
        <nav className="mb-8 flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
          <Link to="/" className="hover:text-[var(--clay)] transition-colors">
            Início
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/categorias" className="hover:text-[var(--clay)] transition-colors">
            Catálogo
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="line-clamp-1 font-medium text-[var(--coffee)]">{product.name}</span>
        </nav>

        <div className="grid gap-12 md:grid-cols-2">
          {/* GALERIA */}
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm">
              <img
                src={selectedImage}
                alt={product.name}
                className="h-full w-full object-cover transition-all duration-500"
              />
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {[product.image, product.image, product.image].map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(img)}
                  className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                    selectedImage === img
                      ? "border-[var(--clay)] shadow-md"
                      : "border-transparent hover:border-[var(--border)]"
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* INFORMAÇÕES */}
          <div className="flex flex-col">
            <div className="flex-1">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[var(--clay)]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[var(--clay)]">
                <Sparkles className="h-3 w-3" /> Essencial para sua rotina
              </div>
              <h1 className="font-display text-4xl font-semibold leading-tight text-[var(--coffee)] md:text-5xl">
                {product.name}
              </h1>
              <p className="mt-2 text-lg italic text-[var(--sertao)]">
                “Mais do que um produto natural… uma experiência que vem da terra.”
              </p>

              <div className="mt-4 flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-[var(--clay)]">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < Math.round(product.rating) ? "fill-[var(--clay)] text-[var(--clay)]" : "text-[var(--border)]"}`}
                    />
                  ))}
                  <span className="ml-1 font-bold text-[var(--coffee)]">{product.rating}</span>
                </div>
                <span className="text-[var(--muted-foreground)]">
                  ({product.reviews} avaliações)
                </span>
              </div>

              <div className="mt-6 flex items-baseline gap-3">
                <span className="font-display text-4xl font-bold text-[var(--clay)]">
                  {formatBRL(product.price)}
                </span>
                <span className="text-sm text-[var(--muted-foreground)]">
                  ou 3x de {formatBRL(product.price / 3)}
                </span>
              </div>

              <p className="mt-5 text-xl font-medium leading-relaxed text-[var(--sertao)]">
                {product.description || product.short}
              </p>

              <div className="mt-4 flex items-center gap-2">
                <span className="flex h-2 w-2 animate-pulse rounded-full bg-red-500" />
                <span className="text-sm font-bold text-red-600">
                  Alta procura: 12 unidades restantes hoje!
                </span>
              </div>

              <div className="mt-8 flex flex-wrap gap-2">
                {product.badges.map((b: string) => (
                  <span
                    key={b}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[var(--leaf)]/10 px-3 py-1 text-xs font-medium text-[var(--leaf)]"
                  >
                    <Leaf className="h-3 w-3" /> {b}
                  </span>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 items-center rounded-xl border border-[var(--border)] bg-white">
                    <button
                      onClick={() => setQty(Math.max(1, qty - 1))}
                      className="flex h-12 w-12 items-center justify-center text-[var(--sertao)] transition-colors hover:bg-[var(--sand)] hover:text-[var(--clay)]"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-10 text-center font-display text-lg font-bold">{qty}</span>
                    <button
                      onClick={() => setQty(qty + 1)}
                      className="flex h-12 w-12 items-center justify-center text-[var(--sertao)] transition-colors hover:bg-[var(--sand)] hover:text-[var(--clay)]"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex-1 flex flex-col gap-2">
                    <Button
                      variant="hero"
                      size="xl"
                      className="w-full bg-[#C4682C] hover:bg-[#A35624] text-white shadow-lg shadow-[#C4682C]/20"
                      onClick={() => {
                        add(product, qty);
                        toast.success("Adicionado ao carrinho", { description: product.name });
                      }}
                    >
                      <Zap className="mr-2 h-5 w-5 fill-current" />
                      COMPRAR AGORA
                    </Button>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="xl"
                  className="w-full border-[#6B4F2A] text-[#6B4F2A] hover:bg-[#6B4F2A]/5"
                  onClick={() => {
                    add(product, qty);
                    toast.success("Adicionado ao carrinho", { description: product.name });
                  }}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Adicionar ao carrinho
                </Button>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-[var(--border)] pt-6 text-[11px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-[var(--leaf)]" /> Compra Segura
                </span>
                <span className="flex items-center gap-1.5">
                  <Truck className="h-4 w-4 text-[var(--clay)]" /> Envio Garantido
                </span>
                <span className="flex items-center gap-1.5">
                  <Leaf className="h-4 w-4 text-[var(--leaf)]" /> Produto Natural
                </span>
              </div>

              {/* FRETE PLACEHOLDER */}
              <div className="mt-6 rounded-xl bg-[var(--sand)]/30 p-4 border border-[var(--border)]">
                <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--coffee)] mb-2 flex items-center gap-2">
                  <Truck className="h-3.5 w-3.5" /> Calcular Entrega
                </h4>
                <div className="flex gap-2">
                  <input
                    placeholder="00000-000"
                    className="flex-1 rounded-md border border-[var(--border)] px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--clay)]"
                  />
                  <Button variant="soft" size="sm">
                    Calcular
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* DETALHES ADICIONAIS */}
        <div className="mt-20 grid gap-12 md:grid-cols-3">
          <section className="md:col-span-2 space-y-12">
            {/* HISTÓRIA */}
            <div className="rounded-3xl bg-white p-8 shadow-sm border border-[var(--border)]">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)] mb-4">
                <Sparkles className="h-4 w-4 text-[var(--clay)]" /> História do produto
              </div>
              <h2 className="font-display text-2xl font-semibold text-[var(--coffee)] mb-4">
                Tradição que atravessa gerações
              </h2>
              <p className="text-lg leading-relaxed text-[var(--sertao)]">{story}</p>
            </div>

            {/* BENEFÍCIOS E ESPECIFICAÇÕES */}
            <div className="grid gap-8 sm:grid-cols-2">
              <div className="space-y-4">
                <h3 className="font-display text-xl font-semibold text-[var(--coffee)]">
                  Benefícios
                </h3>
                <ul className="space-y-3">
                  {benefits.map((b, i) => (
                    <li key={i} className="flex items-start gap-3 text-[var(--sertao)]">
                      <div className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--clay)] shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="font-display text-xl font-semibold text-[var(--coffee)]">
                  Especificações
                </h3>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between border-b border-[var(--border)] pb-2">
                    <dt className="text-[var(--muted-foreground)]">Origem</dt>
                    <dd className="font-medium text-[var(--coffee)]">{specs.origem}</dd>
                  </div>
                  <div className="flex justify-between border-b border-[var(--border)] pb-2">
                    <dt className="text-[var(--muted-foreground)]">Tipo</dt>
                    <dd className="font-medium text-[var(--coffee)]">{specs.tipo}</dd>
                  </div>
                  <div className="flex justify-between border-b border-[var(--border)] pb-2">
                    <dt className="text-[var(--muted-foreground)]">Validade</dt>
                    <dd className="font-medium text-[var(--coffee)]">{specs.validade}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </section>

          {/* SIDEBAR: PRODUTOR E AVALIAÇÕES */}
          <aside className="space-y-8">
            <div className="rounded-3xl bg-[var(--coffee)] p-6 text-white shadow-xl">
              <h3 className="font-display text-lg font-semibold mb-3">Quem produziu</h3>
              <p className="text-sm opacity-90 leading-relaxed mb-4">
                Produzido pela cooperativa <strong>{product.shop}</strong>, unindo famílias do
                sertão baiano para fortalecer o comércio justo e a preservação do Licurizal.
              </p>
              <Link
                to="/sobre"
                className="text-xs font-bold uppercase tracking-widest text-[var(--clay)] hover:underline"
              >
                Conheça nossa história →
              </Link>
            </div>

            <div className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-sm">
              <h3 className="font-display text-lg font-semibold text-[var(--coffee)] mb-4">
                Avaliações
              </h3>
              <div className="space-y-4">
                <div className="border-b border-[var(--border)] pb-4">
                  <div className="flex text-[var(--clay)] mb-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-current" />
                    ))}
                  </div>
                  <p className="text-sm font-medium text-[var(--coffee)] mb-1">
                    "Qualidade excepcional!"
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">Maria S. — Salvador, BA</p>
                </div>
                <div className="pb-2">
                  <div className="flex text-[var(--clay)] mb-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-current" />
                    ))}
                  </div>
                  <p className="text-sm font-medium text-[var(--coffee)] mb-1">
                    "O sabor é incomparável."
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    João P. — Feira de Santana, BA
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* PRODUTOS RELACIONADOS */}
        {related.length > 0 && (
          <section className="mt-24">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-display text-3xl font-semibold text-[var(--coffee)]">
                Você também pode gostar
              </h2>
              <Link
                to="/categorias"
                className="text-sm font-bold text-[var(--clay)] hover:underline"
              >
                Ver todos
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* STICKY BUY BUTTON MOBILE */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 transform bg-white p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] transition-transform duration-300 md:hidden ${showSticky ? "translate-y-0" : "translate-y-full"}`}
      >
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
              Total
            </p>
            <p className="font-display text-lg font-bold text-[var(--coffee)]">
              {formatBRL(product.price)}
            </p>
          </div>
          <Button
            variant="hero"
            className="flex-[2] bg-[#C4682C] text-white"
            onClick={() => {
              add(product, qty);
              toast.success("Adicionado ao carrinho");
            }}
          >
            COMPRAR AGORA
          </Button>
        </div>
      </div>
    </div>
  );
}
