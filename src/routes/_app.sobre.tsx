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
      <section className="container-narrow py-16">
        <div className="grid gap-10 md:grid-cols-[1fr_2fr]">
          <p className="text-[10px] uppercase tracking-[0.22em] text-primary">
            Nossa Raiz
          </p>
          <div>
            <h1 className="font-display text-4xl font-semibold text-[var(--coffee)] md:text-6xl uppercase">
              O licuri é nossa raiz. <br /> O futuro é nosso caminho.
            </h1>
            <p className="mt-8 text-2xl font-display italic text-primary">
              "Nós acreditamos no sertão."
            </p>
            <p className="mt-4 text-xl text-[var(--sertao)]">
              Acreditamos nas mãos que plantam. Nas mãos que colhem. Nas mãos que transformam.
              Acreditamos que tradição não precisa ficar presa ao passado. Ela pode virar inovação.
            </p>
            
            <div className="mt-12 space-y-12">
              <div>
                <h2 className="font-display text-3xl font-bold text-[var(--coffee)]">Manifesto de Marca</h2>
                <div className="mt-6 space-y-4 text-[var(--sertao)] text-lg leading-relaxed">
                  <p>Ela pode virar produto. Pode virar negócio. Pode virar renda. Pode atravessar fronteiras. E tudo isso pode começar com uma pequena amêndoa: <strong>O licuri</strong>.</p>
                  <p>Por isso criamos o <strong>Empório do Licuri</strong>. Para conectar pessoas, produtos, histórias e oportunidades.</p>
                  <p className="font-bold text-primary">Da raiz do sertão para o futuro.</p>
                </div>
              </div>
              
              <div>
                <h2 className="font-display text-3xl font-bold text-[var(--coffee)]">O Grande Objetivo</h2>
                <p className="mt-4 text-[var(--sertao)] text-lg leading-relaxed">
                  Não queremos apenas vender produtos de licuri. Nosso objetivo é <strong>CONSTRUIR A PRINCIPAL MARCA-ECOSSISTEMA DO LICURI NO BRASIL</strong>.
                </p>
                <p className="mt-2 text-[var(--sertao)]">
                  A partir dela, desenvolvemos: marca própria + marketplace + produtores + Casa do Licuri + gastronomia + cultura + turismo + educação + inovação.
                </p>
              </div>

              <div className="grid gap-8 md:grid-cols-2">
                <div>
                  <h2 className="font-display text-2xl font-bold text-[var(--coffee)]">Diferencial</h2>
                  <p className="mt-2 text-[var(--sertao)]">
                    Focamos em <strong>curadoria, origem e território</strong>. Aqui, o consumidor não encontra apenas um produto, mas a história de quem produz e a alma do sertão.
                  </p>
                </div>
                <div>
                  <h2 className="font-display text-2xl font-bold text-[var(--coffee)]">Promessa</h2>
                  <p className="mt-2 text-[var(--sertao)]">
                    Para o consumidor: produtos autênticos. Para o produtor: oportunidade de mercado. Para o território: desenvolvimento sustentável.
                  </p>
                </div>
              </div>

              <div className="grid gap-8 md:grid-cols-3 border-t border-[var(--border)] pt-12">
                <div>
                  <h3 className="font-display text-xl font-bold text-[var(--coffee)]">Propósito</h3>
                  <p className="mt-2 text-sm text-[var(--muted-foreground)]">Transformar a riqueza do licuri em oportunidades para pessoas e comunidades.</p>
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold text-[var(--coffee)]">Missão</h3>
                  <p className="mt-2 text-sm text-[var(--muted-foreground)]">Conectar produtos e experiências que valorizem o potencial econômico do sertão.</p>
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold text-[var(--coffee)]">Visão</h3>
                  <p className="mt-2 text-sm text-[var(--muted-foreground)]">Ser a principal referência brasileira em negócios e experiências ligados ao licuri.</p>
                </div>
              </div>
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
        <div className="mx-auto max-w-4xl">
          <h2 className="font-display text-4xl font-bold text-[var(--coffee)] md:text-5xl uppercase mb-8">
            Não somos apenas uma loja. <br />
            <span className="text-primary">Somos uma ponte entre o sertão e o futuro.</span>
          </h2>
          <div className="mx-auto max-w-2xl italic text-[var(--coffee)] text-2xl font-display">
            "Transformar a biodiversidade e a cultura em desenvolvimento econômico sustentável."
          </div>
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
