import { supabase } from "./supabase";

export type Category =
  | "licuri"
  | "alimentos"
  | "farinhas"
  | "oleos"
  | "produtos-naturais"
  | "cosmeticos"
  | "bebidas"
  | "doces"
  | "snacks"
  | "artesanato"
  | "produtos-do-sertao"
  | "presentes"
  | "kits"
  | "marca-emporio";


export type Product = {
  id: string;
  slug: string;
  name: string;
  category: Category;
  price: number;
  rating: number;
  reviews: number;
  shop: string;
  region: string;
  image: string;
  short: string;
  description: string;
  badges: string[];
  external_buy_url?: string | null;
};

// URLs servidas de /public/products/<slug>.jpg
const img = (slug: string) => `/products/${slug}.jpg`;

export const categories: { id: Category; label: string; image: string; count: number }[] = [
  { id: "licuri", label: "Licuri", image: img("oleo-de-licuri-extra-virgem-200ml"), count: 12 },
  { id: "alimentos", label: "Alimentos", image: img("farinha-de-licuri-artesanal-500g"), count: 32 },
  { id: "farinhas", label: "Farinhas", image: img("farinha-de-licuri-artesanal-500g"), count: 8 },
  { id: "oleos", label: "Óleos", image: img("oleo-de-licuri-extra-virgem-200ml"), count: 15 },
  { id: "produtos-naturais", label: "Produtos Naturais", image: img("licuri-desidratado-premium"), count: 28 },
  { id: "cosmeticos", label: "Cosméticos", image: img("manteiga-corporal-de-licuri"), count: 24 },
  { id: "bebidas", label: "Bebidas", image: img("doce-de-licuri-tradicional"), count: 5 },
  { id: "doces", label: "Doces", image: img("doce-de-licuri-tradicional"), count: 20 },
  { id: "snacks", label: "Snacks", image: img("pacoca-de-licuri"), count: 18 },
  { id: "artesanato", label: "Artesanato", image: img("cesto-artesanal-palha-de-licuri"), count: 15 },
  { id: "produtos-do-sertao", label: "Produtos do Sertão", image: img("doce-de-licuri-tradicional"), count: 12 },
  { id: "presentes", label: "Presentes", image: img("kit-presente-raizes-do-nordeste"), count: 10 },
  { id: "kits", label: "Kits & Experiências", image: img("kit-presente-raizes-do-nordeste"), count: 8 },
  { id: "marca-emporio", label: "Marca Empório", image: img("kit-presente-raizes-do-nordeste"), count: 4 },
];


// Catálogo demo síncrono — espelha os mesmos slugs que existem no banco (seed via migration).
// Para uso transacional (favoritos, reviews) sempre buscar o UUID real via getProductBySlug.
export const products: Product[] = [
  {
    id: "p1",
    slug: "oleo-de-licuri-extra-virgem-200ml",
    name: "Óleo de Licuri Extra Virgem 200ml",
    category: "licuri",
    price: 49.9, rating: 4.9, reviews: 78,
    shop: "Sertão Natural", region: "Bahia",
    image: img("oleo-de-licuri-extra-virgem-200ml"),
    short: "100% puro, prensado a frio.",
    description:
      "Nosso óleo de licuri é puro e natural, extraído da polpa do licuri. Rico em antioxidantes e ácidos graxos essenciais. Ideal para alimentação, skincare e cuidados com os cabelos.",
    badges: ["100% Natural", "Prensado a frio", "Produto do Nordeste", "Não testado em animais"],
  },
  {
    id: "p2",
    slug: "farinha-de-licuri-artesanal-500g",
    name: "Farinha de Licuri Artesanal 500g",
    category: "alimentos",
    price: 18.9, rating: 4.8, reviews: 45,
    shop: "Licuri da Caatinga", region: "Bahia",
    image: img("farinha-de-licuri-artesanal-500g"),
    short: "Moída na pedra, sabor delicado.",
    description:
      "Farinha artesanal de licuri produzida por famílias da Caatinga baiana. Versátil na cozinha — vai bem em mingaus, pães e bolos.",
    badges: ["Artesanal", "Origem Bahia", "Sem aditivos"],
  },
  {
    id: "p3",
    slug: "doce-de-licuri-tradicional",
    name: "Doce de Licuri Tradicional",
    category: "alimentos",
    price: 25.9, rating: 4.9, reviews: 32,
    shop: "Sabor do Sertão", region: "Piauí",
    image: img("doce-de-licuri-tradicional"),
    short: "Receita de família, cozido em tacho.",
    description:
      "Doce cremoso preparado em tacho de cobre, no fogo lento, com licuri e rapadura.",
    badges: ["Receita tradicional", "Sem conservantes"],
  },
  {
    id: "p4",
    slug: "pacoca-de-licuri",
    name: "Paçoca de Licuri Artesanal",
    category: "alimentos",
    price: 22.9, rating: 4.7, reviews: 28,
    shop: "Delícias do Cerrado", region: "Ceará",
    image: img("pacoca-de-licuri"),
    short: "Crocante e levemente adocicada.",
    description:
      "Paçoca de licuri torrada, com toque de rapadura. Acompanha bem o cafezinho.",
    badges: ["Artesanal", "Crocante"],
  },
  {
    id: "p5",
    slug: "licuri-desidratado-premium",
    name: "Licuri Desidratado Premium 250g",
    category: "alimentos",
    price: 28.9, rating: 4.8, reviews: 21,
    shop: "Licuri da Caatinga", region: "Bahia",
    image: img("licuri-desidratado-premium"),
    short: "Crocante, ideal para snacks.",
    description:
      "Licuri desidratado em baixa temperatura para preservar nutrientes e crocância.",
    badges: ["Sem açúcar", "Snack natural"],
  },
  {
    id: "p6",
    slug: "granola-de-licuri-artesanal",
    name: "Granola de Licuri Artesanal 400g",
    category: "alimentos",
    price: 29.9, rating: 4.9, reviews: 16,
    shop: "Nutri Sertão", region: "Minas Gerais",
    image: img("granola-de-licuri-artesanal"),
    short: "Aveia, mel e pedaços de licuri.",
    description:
      "Granola produzida em pequenos lotes, com aveia, mel e licuri torrado.",
    badges: ["Sem glúten adicionado", "Pequenos lotes"],
  },
  {
    id: "p7",
    slug: "manteiga-corporal-de-licuri",
    name: "Manteiga Corporal de Licuri 100g",
    category: "cosmeticos",
    price: 64.9, rating: 4.9, reviews: 54,
    shop: "Sertão Natural", region: "Bahia",
    image: img("manteiga-corporal-de-licuri"),
    short: "Hidratação intensa para pele e cabelo.",
    description:
      "Manteiga rica em vitamina E. Hidrata profundamente e protege a barreira cutânea.",
    badges: ["Vegano", "Cruelty-free", "Pequenos produtores"],
  },
  {
    id: "p8",
    slug: "cesto-artesanal-palha-de-licuri",
    name: "Cesto Artesanal Palha de Licuri",
    category: "artesanato",
    price: 89.9, rating: 5, reviews: 12,
    shop: "Mãos da Caatinga", region: "Bahia",
    image: img("cesto-artesanal-palha-de-licuri"),
    short: "Tecido à mão por artesãs da região.",
    description:
      "Peça única, tecida em palha de licuri por mestras artesãs nordestinas.",
    badges: ["Feito à mão", "Peça única", "Comércio justo"],
  },
  {
    id: "p9",
    slug: "kit-presente-raizes-do-nordeste",
    name: "Kit Presente Raízes do Nordeste",
    category: "presentes",
    price: 159.9, rating: 4.9, reviews: 9,
    shop: "Empório do Licuri", region: "Bahia",
    image: img("kit-presente-raizes-do-nordeste"),
    short: "Óleo, doce e paçoca em embalagem especial.",
    description:
      "Kit com óleo de licuri 100ml, doce tradicional e paçoca artesanal. Ideal para presentear.",
    badges: ["Edição especial", "Embalagem sustentável"],
  },
];

export const regions = ["Todos", "Bahia", "Piauí", "Ceará", "Minas Gerais", "Outros"];

export function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Busca um produto pelo slug priorizando o banco (UUID real + external_buy_url). Cai no estático em offline. */
export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("active", true)
    .eq("is_draft", false)
    .maybeSingle();

  if (data) {
    return {
      id: data.id,
      slug: data.slug,
      name: data.name,
      category: data.category as Category,
      price: Number(data.price),
      rating: Number(data.rating ?? 0),
      reviews: data.reviews ?? 0,
      shop: data.shop ?? "Empório do Licuri",
      region: data.region ?? "Bahia",
      image: data.image_url || img(slug),
      short: data.short_description ?? "",
      description: data.description ?? "",
      badges: data.badges ?? [],
      external_buy_url: data.external_buy_url ?? null,
    };
  }
  return products.find((p) => p.slug === slug);
}

/** Resolve o UUID do produto no banco a partir do slug. Usado por favoritos e reviews. */
export async function getProductIdBySlug(slug: string): Promise<string | null> {
  const { data } = await supabase.from("products").select("id").eq("slug", slug).maybeSingle();
  return data?.id ?? null;
}
