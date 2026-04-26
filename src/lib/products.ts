import oleo from "@/assets/product-oleo-licuri.jpg";
import farinha from "@/assets/product-farinha-licuri.jpg";
import doce from "@/assets/product-doce-licuri.jpg";
import pacoca from "@/assets/product-pacoca-licuri.jpg";
import desidratado from "@/assets/product-licuri-desidratado.jpg";
import granola from "@/assets/product-granola-licuri.jpg";
import cosmetico from "@/assets/product-cosmetico-licuri.jpg";
import artesanato from "@/assets/product-artesanato-licuri.jpg";
import kit from "@/assets/product-kit-presente.jpg";

export type Category =
  | "alimentos"
  | "oleos-extratos"
  | "cosmeticos"
  | "artesanato"
  | "kits-presentes";

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
};

export const categories: { id: Category; label: string; image: string; count: number }[] = [
  { id: "alimentos", label: "Alimentos", image: farinha, count: 32 },
  { id: "oleos-extratos", label: "Óleos e Extratos", image: oleo, count: 18 },
  { id: "cosmeticos", label: "Cosméticos", image: cosmetico, count: 24 },
  { id: "artesanato", label: "Artesanato", image: artesanato, count: 15 },
  { id: "kits-presentes", label: "Kits e Presentes", image: kit, count: 12 },
];

export const products: Product[] = [
  {
    id: "p1",
    slug: "oleo-de-licuri-extra-virgem-200ml",
    name: "Óleo de Licuri Extra Virgem 200ml",
    category: "oleos-extratos",
    price: 49.9,
    rating: 4.9,
    reviews: 78,
    shop: "Sertão Natural",
    region: "Bahia",
    image: oleo,
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
    price: 18.9,
    rating: 4.8,
    reviews: 45,
    shop: "Licuri da Caatinga",
    region: "Bahia",
    image: farinha,
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
    price: 25.9,
    rating: 4.9,
    reviews: 32,
    shop: "Sabor do Sertão",
    region: "Piauí",
    image: doce,
    short: "Receita de família, cozido em tacho.",
    description: "Doce cremoso preparado em tacho de cobre, no fogo lento, com licuri e rapadura.",
    badges: ["Receita tradicional", "Sem conservantes"],
  },
  {
    id: "p4",
    slug: "pacoca-de-licuri",
    name: "Paçoca de Licuri Artesanal",
    category: "alimentos",
    price: 22.9,
    rating: 4.7,
    reviews: 28,
    shop: "Delícias do Cerrado",
    region: "Ceará",
    image: pacoca,
    short: "Crocante e levemente adocicada.",
    description: "Paçoca de licuri torrada, com toque de rapadura. Acompanha bem o cafezinho.",
    badges: ["Artesanal", "Crocante"],
  },
  {
    id: "p5",
    slug: "licuri-desidratado-premium",
    name: "Licuri Desidratado Premium 250g",
    category: "alimentos",
    price: 28.9,
    rating: 4.8,
    reviews: 21,
    shop: "Licuri da Caatinga",
    region: "Bahia",
    image: desidratado,
    short: "Crocante, ideal para snacks.",
    description: "Licuri desidratado em baixa temperatura para preservar nutrientes e crocância.",
    badges: ["Sem açúcar", "Snack natural"],
  },
  {
    id: "p6",
    slug: "granola-de-licuri-artesanal",
    name: "Granola de Licuri Artesanal 400g",
    category: "alimentos",
    price: 29.9,
    rating: 4.9,
    reviews: 16,
    shop: "Nutri Sertão",
    region: "Minas Gerais",
    image: granola,
    short: "Aveia, mel e pedaços de licuri.",
    description: "Granola produzida em pequenos lotes, com aveia, mel e licuri torrado.",
    badges: ["Sem glúten adicionado", "Pequenos lotes"],
  },
  {
    id: "p7",
    slug: "manteiga-corporal-de-licuri",
    name: "Manteiga Corporal de Licuri 100g",
    category: "cosmeticos",
    price: 64.9,
    rating: 4.9,
    reviews: 54,
    shop: "Sertão Natural",
    region: "Bahia",
    image: cosmetico,
    short: "Hidratação intensa para pele e cabelo.",
    description: "Manteiga rica em vitamina E. Hidrata profundamente e protege a barreira cutânea.",
    badges: ["Vegano", "Cruelty-free", "Pequenos produtores"],
  },
  {
    id: "p8",
    slug: "cesto-artesanal-palha-de-licuri",
    name: "Cesto Artesanal Palha de Licuri",
    category: "artesanato",
    price: 89.9,
    rating: 5,
    reviews: 12,
    shop: "Mãos da Caatinga",
    region: "Bahia",
    image: artesanato,
    short: "Tecido à mão por artesãs da região.",
    description: "Peça única, tecida em palha de licuri por mestras artesãs nordestinas.",
    badges: ["Feito à mão", "Peça única", "Comércio justo"],
  },
  {
    id: "p9",
    slug: "kit-presente-raizes-do-nordeste",
    name: "Kit Presente Raízes do Nordeste",
    category: "kits-presentes",
    price: 159.9,
    rating: 4.9,
    reviews: 9,
    shop: "Licuri Hub",
    region: "Bahia",
    image: kit,
    short: "Óleo, doce e paçoca em embalagem especial.",
    description: "Kit com óleo de licuri 100ml, doce tradicional e paçoca artesanal. Ideal para presentear.",
    badges: ["Edição especial", "Embalagem sustentável"],
  },
];

export const regions = ["Todos", "Bahia", "Piauí", "Ceará", "Minas Gerais", "Outros"];

export function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export async function getProductBySlug(slug: string) {
  // Check mock data first
  const mock = products.find((p) => p.slug === slug);
  if (mock) return mock;

  // Then check DB
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .single();

  if (data) {
    return {
      id: data.id,
      slug: data.slug,
      name: data.name,
      category: data.category as Category,
      price: Number(data.price),
      rating: Number(data.rating),
      reviews: data.reviews,
      shop: data.shop,
      region: data.region,
      image: data.image_url,
      short: data.short_description,
      description: data.description,
      badges: data.badges || [],
    } as Product;
  }
  return undefined;
}

import { supabase } from "./supabase";
