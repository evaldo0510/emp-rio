import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, Search, Tag, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/blog")({
  head: () => ({
    meta: [
      { title: "Blog Empório do Licuri — Cultura, Saúde e Negócios" },
      { name: "description", content: "Artigos sobre o licuri, a vida no sertão, receitas, saúde e sustentabilidade." },
    ],
  }),
  component: BlogPage,
});

const CATEGORIES = [
  "Licuri", "Sertão", "Bahia", "Receitas", "Saúde e Alimentação", "Cultura", "Produtores", "Negócios", "Sustentabilidade"
];

const POSTS = [
  {
    title: "O despertar da Caatinga: a safra do licuri 2026",
    excerpt: "Como as chuvas deste ano estão impactando a colheita e a vida das famílias sertanejas.",
    category: "Sertão",
    date: "15 Ago, 2026",
    image: "/products/licuri-desidratado-premium.jpg"
  },
  {
    title: "Licuri na gastronomia: da tradição à alta cozinha",
    excerpt: "Chefs renomados descobrem a versatilidade do 'ouro do sertão' em pratos contemporâneos.",
    category: "Gastronomia",
    date: "12 Ago, 2026",
    image: "/products/doce-de-licuri-tradicional.jpg"
  }
];

function BlogPage() {
  return (
    <div className="container-narrow py-16">
      <div className="max-w-3xl mb-12">
        <p className="text-[10px] uppercase tracking-[0.22em] text-primary font-bold">Conteúdo & SEO</p>
        <h1 className="mt-4 font-display text-4xl font-semibold text-[var(--coffee)] md:text-6xl uppercase">
          Blog do Licuri
        </h1>
        <p className="mt-6 text-xl text-[var(--sertao)] leading-relaxed">
          Histórias, conhecimento e inovação direto do coração da Caatinga.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-12">
        {CATEGORIES.map(cat => (
          <button key={cat} className="px-4 py-2 rounded-full border border-[var(--border)] text-xs font-bold uppercase tracking-widest text-[var(--sertao)] hover:border-primary hover:text-primary transition-colors">
            {cat}
          </button>
        ))}
      </div>

      <div className="grid gap-12 md:grid-cols-2">
        {POSTS.map(post => (
          <article key={post.title} className="group cursor-pointer">
            <div className="aspect-[16/9] overflow-hidden rounded-3xl bg-[var(--sand)] mb-6 border border-[var(--border)]">
              <img src={post.image} alt={post.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-primary">
                <span>{post.category}</span>
                <span className="h-1 w-1 rounded-full bg-[var(--border)]" />
                <span className="text-[var(--muted-foreground)]">{post.date}</span>
              </div>
              <h2 className="font-display text-2xl font-bold text-[var(--coffee)] group-hover:text-primary transition-colors uppercase leading-tight">
                {post.title}
              </h2>
              <p className="text-[var(--sertao)] leading-relaxed">
                {post.excerpt}
              </p>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-20 p-12 rounded-[40px] bg-[var(--coffee)] text-[var(--cream)] text-center relative overflow-hidden">
        <TrendingUp className="absolute -right-8 -bottom-8 h-40 w-40 text-white/5" />
        <h2 className="font-display text-3xl font-bold uppercase">Assine nossa Newsletter</h2>
        <p className="mt-4 opacity-80 max-w-xl mx-auto">
          Receba receitas exclusivas, histórias dos produtores e novidades do ecossistema.
        </p>
        <form className="mt-8 flex flex-col md:flex-row gap-3 max-w-md mx-auto">
          <input type="email" placeholder="Seu melhor e-mail" className="flex-1 rounded-xl bg-white/10 border border-white/20 px-6 py-3 outline-none focus:border-white transition-colors placeholder:text-white/50" />
          <Button variant="hero" className="bg-white text-[var(--coffee)] hover:bg-[var(--cream)]">Inscrever</Button>
        </form>
      </div>

      <div className="mt-10 text-[10px] text-center text-[var(--muted-foreground)] uppercase tracking-widest leading-relaxed">
        * As informações de saúde e alimentação seguem as diretrizes técnicas aplicáveis, <br /> focando em nutrição e bem-estar sem alegações terapêuticas não autorizadas.
      </div>
    </div>
  );
}
