import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/blog")({
  head: () => ({ meta: [{ title: "Blog — Licuri Hub" }] }),
  component: BlogPage,
});

const posts = [
  {
    title: "Por que o licuri é o ouro do Sertão",
    excerpt: "A palmeira que sustenta famílias, fauna e a memória da Caatinga.",
    date: "15 mai 2024",
    tag: "Cultura",
  },
  {
    title: "Receita: bolo de farinha de licuri",
    excerpt: "Uma sobremesa simples que celebra o sabor delicado da farinha artesanal.",
    date: "02 jun 2024",
    tag: "Receitas",
  },
  {
    title: "Cooperativas que mudam vidas",
    excerpt: "Histórias de mulheres da Bahia que vivem do extrativismo sustentável.",
    date: "21 jul 2024",
    tag: "Comunidade",
  },
];

function BlogPage() {
  return (
    <div className="container-narrow py-10">
      <h1 className="font-display text-4xl font-semibold text-[var(--coffee)]">Blog</h1>
      <p className="mt-2 text-[var(--muted-foreground)]">
        Histórias, receitas e curiosidades do mundo do licuri.
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {posts.map((p) => (
          <article
            key={p.title}
            className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6"
          >
            <span className="text-[10px] uppercase tracking-[0.22em] text-[var(--clay)]">
              {p.tag}
            </span>
            <h3 className="mt-2 font-display text-xl font-semibold text-[var(--coffee)]">
              {p.title}
            </h3>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">{p.excerpt}</p>
            <p className="mt-4 text-xs text-[var(--muted-foreground)]">{p.date}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
