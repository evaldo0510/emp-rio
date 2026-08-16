import { createFileRoute, Link } from "@tanstack/react-router";
import { Leaf, Sprout, Sun } from "lucide-react";
import hero from "@/assets/hero-licuri.jpg";
import { Button } from "@/components/ui/button";


export const Route = createFileRoute("/_app/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre o Empório do Licuri — Ecossistema Sertanejo" },
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
        <p className="text-[10px] uppercase tracking-[0.22em] text-primary">
          Nossa Raiz
        </p>
        <div>
          <h1 className="font-display text-4xl font-semibold text-[var(--coffee)] md:text-6xl">
            O ecossistema que transforma o licuri em futuro.
          </h1>
          <p className="mt-6 text-xl text-[var(--sertao)]">
            O Empório do Licuri nasce do encontro entre <strong>natureza, tradição, tecnologia e empreendedorismo</strong>. 
            Somos uma plataforma brasileira de valorização do licuri, do sertão e das pessoas que transformam recursos naturais em produtos, histórias e oportunidades.
          </p>
          <div className="mt-12 space-y-8">
            <div>
              <h2 className="font-display text-2xl font-bold text-[var(--coffee)]">Propósito</h2>
              <p className="mt-2 text-[var(--sertao)] text-lg">Transformar a riqueza do licuri em oportunidades para pessoas, comunidades e negócios.</p>
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-[var(--coffee)]">Missão</h2>
              <p className="mt-2 text-[var(--sertao)]">Criar, conectar e comercializar produtos, marcas e experiências que valorizem o licuri e o potencial econômico do sertão.</p>
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-[var(--coffee)]">Visão</h2>
              <p className="mt-2 text-[var(--sertao)]">Ser a principal referência brasileira em produtos, negócios e experiências relacionados ao licuri.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[var(--cream)] py-20">
        <div className="container-narrow">
          <h2 className="text-center font-display text-3xl font-bold text-[var(--coffee)] mb-12">Nossos Valores</h2>
          <div className="grid gap-6 md:grid-cols-4">
            {[
              { title: "Território", desc: "Desenvolvimento que nasce dentro do próprio sertão." },
              { title: "Cooperação", desc: "Produtores e comunidades crescendo juntos." },
              { title: "Sustentabilidade", desc: "Aproveitamento responsável e preservação da Caatinga." },
              { title: "Inovação", desc: "Tecnologia que ajuda a tradição a chegar mais longe." },
            ].map((v) => (
              <div key={v.title} className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
                <h3 className="font-display text-lg font-bold text-primary">{v.title}</h3>
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-narrow py-24 text-center">
        <div className="mx-auto max-w-2xl italic text-[var(--coffee)] text-2xl font-display">
          "O sertão sempre teve riqueza. Nós acreditamos que aquilo que nasce no sertão pode chegar ao mundo sem perder sua identidade."
        </div>
      </section>


      <section className="container-narrow pb-20 text-center">
        <Button asChild variant="hero" size="xl">
          <Link to="/categorias">Conhecer o ecossistema →</Link>
        </Button>
      </section>

    </div>
  );
}
