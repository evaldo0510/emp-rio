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
  Info,
  BookOpen,
  ChefHat,
  History,
  CheckCircle2,
  MapPin,
  Store
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
          { title: `${loaderData.name} — Empório do Licuri` },
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
                {product.external_buy_url ? (
                  <a
                    href={product.external_buy_url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-[#FFE600] px-6 py-4 font-bold text-[#2D3277] shadow-lg shadow-[#FFE600]/30 transition-transform hover:scale-[1.01]"
                  >
                    <Zap className="h-5 w-5" />
                    Comprar na loja oficial do vendedor
                  </a>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 items-center rounded-xl border border-[var(--border)] bg-white">
                      <button
                        onClick={() => setQty(Math.max(1, qty - 1))}
                        className="flex h-12 w-12 items-center justify-center text-[var(--sertao)] transition-colors hover:bg-[var(--sand)] hover:text-[var(--clay)]"
                        aria-label="Diminuir quantidade"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-10 text-center font-display text-lg font-bold">{qty}</span>
                      <button
                        onClick={() => setQty(qty + 1)}
                        className="flex h-12 w-12 items-center justify-center text-[var(--sertao)] transition-colors hover:bg-[var(--sand)] hover:text-[var(--clay)]"
                        aria-label="Aumentar quantidade"
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
                )}

                {!product.external_buy_url && (
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
                )}
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

        {/* DETALHES ESTRATÉGICOS */}
        <div className="mt-20 grid gap-12 md:grid-cols-3">
          <section className="md:col-span-2 space-y-12">
            
            {/* SOBRE O PRODUTO */}
            <div className="rounded-3xl bg-white p-8 shadow-sm border border-[var(--border)]">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)] mb-4">
                <Info className="h-4 w-4 text-[var(--clay)]" /> Sobre o produto
              </div>
              <h2 className="font-display text-2xl font-semibold text-[var(--coffee)] mb-4">
                O que é e como é feito?
              </h2>
              <p className="text-lg leading-relaxed text-[var(--sertao)]">
                {product.description || product.short}
              </p>
            </div>

            {/* HISTÓRIA E ORIGEM */}
            <div className="grid gap-8 sm:grid-cols-2">
              <div className="rounded-2xl bg-[var(--sand)]/20 p-6 border border-[var(--border)]">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)] mb-3">
                  <History className="h-4 w-4 text-[var(--clay)]" /> História
                </div>
                <h3 className="font-display text-xl font-semibold text-[var(--coffee)] mb-3">
                  A jornada deste produto
                </h3>
                <p className="text-sm leading-relaxed text-[var(--sertao)]">
                  {story}
                </p>
              </div>

              <div className="rounded-2xl bg-[var(--sand)]/20 p-6 border border-[var(--border)]">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)] mb-3">
                  <MapPin className="h-4 w-4 text-[var(--clay)]" /> Origem
                </div>
                <h3 className="font-display text-xl font-semibold text-[var(--coffee)] mb-3">
                  Produzido no Sertão
                </h3>
                <p className="text-sm text-[var(--sertao)] mb-2"><strong>Região:</strong> {specs.origem}</p>
                <p className="text-sm text-[var(--sertao)]">Este produto carrega a identidade e a força do território onde o licuri é rei.</p>
              </div>
            </div>

            {/* COMO USAR E BENEFÍCIOS */}
            <div className="grid gap-8 sm:grid-cols-2">
              <div className="space-y-4">
                <h3 className="font-display text-xl font-semibold text-[var(--coffee)] flex items-center gap-2">
                  <ChefHat className="h-5 w-5 text-primary" /> Como usar
                </h3>
                <p className="text-sm text-[var(--muted-foreground)]">Receitas e sugestões de uso variam conforme o produto, garantindo o melhor aproveitamento do licuri.</p>
                <ul className="space-y-3">
                  {benefits.map((b, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-[var(--sertao)]">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 text-[var(--leaf)] shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-6">
                <h3 className="font-display text-xl font-semibold text-[var(--coffee)] flex items-center gap-2">
                  <Store className="h-5 w-5 text-primary" /> Quem produz
                </h3>
                <div className="rounded-2xl border border-[var(--border)] p-5 bg-white">
                  <div className="font-bold text-[var(--coffee)]">{product.shop}</div>
                  <div className="text-xs text-[var(--muted-foreground)] mt-1 uppercase tracking-wider">{product.region}</div>
                  <p className="mt-3 text-sm text-[var(--sertao)]">Produtor parceiro do ecossistema Empório do Licuri.</p>
                </div>
                
                <div className="rounded-2xl border border-[var(--border)] p-5 bg-white">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)] mb-3">Informações</h4>
                  <div className="space-y-2">
                    {Object.entries(specs).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-sm">
                        <span className="text-[var(--muted-foreground)] capitalize">{k}:</span>
                        <span className="font-medium text-[var(--coffee)]">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SIDEBAR DE AÇÕES/INFOS */}
          <aside className="space-y-8">
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--clay)]/5 p-8">
              <h3 className="font-display text-xl font-bold text-[var(--coffee)] mb-4 italic">Selo Curadoria</h3>
              <p className="text-sm text-[var(--sertao)] leading-relaxed">
                Este produto passou pelo nosso sistema de curadoria, garantindo origem identificada, qualidade e responsabilidade ambiental.
              </p>
            </div>
            
            <div className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-sm">
              <h3 className="font-display text-lg font-semibold text-[var(--coffee)] mb-4">
                Avaliações
              </h3>
              <div className="flex items-center gap-1 text-[var(--clay)] mb-4">
                <Star className="h-5 w-5 fill-current" />
                <span className="font-display text-2xl font-bold text-[var(--coffee)]">{product.rating}</span>
                <span className="text-sm text-[var(--muted-foreground)]">/ 5.0</span>
              </div>
              <p className="text-xs text-[var(--muted-foreground)]">Baseado em {product.reviews} experiências reais.</p>
            </div>
          </aside>
        </div>

        {/* PRODUTOS RELACIONADOS */}
        {related.length > 0 && (
          <section className="mt-32">
            <div className="mb-10 flex items-end justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted-foreground)] mb-2">
                  Descubra mais
                </p>
                <h2 className="font-display text-3xl font-semibold text-[var(--coffee)] md:text-5xl">
                  Também pode gostar
                </h2>
              </div>
              <Link
                to="/categorias"
                search={{ cat: product.category }}
                className="text-sm font-bold text-primary hover:underline"
              >
                Ver tudo
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>


      {/* STICKY ADD TO CART */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-40 bg-white/95 border-t border-[var(--border)] p-4 backdrop-blur-md transition-transform duration-300 md:hidden ${
          showSticky ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <h4 className="line-clamp-1 text-sm font-bold text-[var(--coffee)]">{product.name}</h4>
            <p className="font-display text-lg font-bold text-[var(--clay)]">{formatBRL(product.price)}</p>
          </div>
          <Button
            size="lg"
            variant="hero"
            className="px-8"
            onClick={() => {
              add(product, qty);
              toast.success("Adicionado ao carrinho");
            }}
          >
            Comprar
          </Button>
        </div>
      </div>
    </div>
  );
}
