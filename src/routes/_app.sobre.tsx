import { createFileRoute, Link } from "@tanstack/react-router";
import { Leaf, Sprout, Sun } from "lucide-react";
import hero from "@/assets/hero-licuri.jpg";

export const Route = createFileRoute("/_app/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre o Licuri — Licuri Hub" },
      {
        name: "description",
        content:
          "A história do licuri, palmeira do Sertão que sustenta famílias e ecossistemas no Nordeste brasileiro.",
      },
      { property: "og:title", content: "Sobre o Licuri" },
      { property: "og:image", content: hero },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div>
      <section className="container-narrow pt-10">
        <div className="overflow-hidden rounded-3xl border border-[var(--border)]">
          <img src={hero} alt="Coqueiral de licuri" className="h-[40vh] w-full object-cover" />
        </div>
      </section>
      <section className="container-narrow grid gap-10 py-16 md:grid-cols-[1fr_2fr]">
        <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
          Sobre o Licuri
        </p>
        <div>
          <h1 className="font-display text-4xl font-semibold text-[var(--coffee)] md:text-5xl">
            Uma palmeira que sustenta o Sertão.
          </h1>
          <p className="mt-6 text-lg text-[var(--sertao)]">
            O licuri (<em>Syagrus coronata</em>) é uma palmeira nativa da Caatinga. Suas amêndoas
            alimentam famílias, animais e ecossistemas inteiros — e, há séculos, fazem parte da
            culinária e do artesanato do Nordeste brasileiro.
          </p>
          <p className="mt-4 text-[var(--sertao)]">
            O Licuri Hub conecta cooperativas e pequenos produtores diretamente a quem valoriza
            origem, tradição e sustentabilidade. Cada compra fortalece comunidades inteiras.
          </p>
        </div>
      </section>

      <section className="container-narrow grid gap-4 pb-16 md:grid-cols-3">
        {[
          { icon: Sprout, title: "Bioma vivo", text: "Preservar o licuri é preservar a Caatinga." },
          { icon: Leaf, title: "Tradição", text: "Receitas e saberes que atravessam gerações." },
          { icon: Sun, title: "Renda justa", text: "Comércio direto com famílias produtoras." },
        ].map((c) => (
          <div key={c.title} className="rounded-2xl border border-[var(--border)] bg-[var(--cream)] p-6">
            <c.icon className="h-6 w-6 text-[var(--clay)]" />
            <h3 className="mt-3 font-display text-xl font-semibold">{c.title}</h3>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">{c.text}</p>
          </div>
        ))}
      </section>

      <section className="container-narrow pb-20">
        <Link to="/categorias" className="text-[var(--clay)] underline">
          Conhecer os produtos →
        </Link>
      </section>
    </div>
  );
}
