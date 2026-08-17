import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/sertao")({
  head: () => ({
    meta: [
      { title: "O Sertão — Histórias, Pessoas e Cultura | Empório do Licuri" },
      { name: "description", content: "Explore a alma do Sertão: suas histórias, sua cultura e as pessoas que transformam a Caatinga." },
    ],
  }),
  component: SertaoPage,
});

function SertaoPage() {
  return (
    <div className="container-narrow py-16">
      <div className="max-w-3xl">
        <p className="text-[10px] uppercase tracking-[0.22em] text-primary font-bold">Nosso Território</p>
        <h1 className="mt-4 font-display text-4xl font-semibold text-[var(--coffee)] md:text-6xl uppercase">
          A Alma do Sertão
        </h1>
        <p className="mt-6 text-xl text-[var(--sertao)] leading-relaxed">
          O Sertão não é apenas um lugar geográfico; é um estado de espírito, uma cultura de resistência e uma fonte inesgotável de inovação e beleza.
        </p>
      </div>

      <div className="mt-20 grid gap-16 md:grid-cols-3">
        {[
          { title: "Pessoas", desc: "Os guardiões da Caatinga que transformam o licuri em vida." },
          { title: "Cultura", desc: "Música, arte e tradições que ecoam sob o sol do Nordeste." },
          { title: "Gastronomia", desc: "Sabores autênticos que nascem da criatividade sertaneja." },
        ].map((item) => (
          <div key={item.title} className="text-center">
            <h3 className="font-display text-2xl font-bold text-[var(--coffee)]">{item.title}</h3>
            <p className="mt-3 text-[var(--sertao)]">{item.desc}</p>
          </div>
        ))}
      </div>

      <section className="mt-24 rounded-3xl bg-[var(--coffee)] p-12 text-[var(--cream)] text-center">
        <h2 className="font-display text-3xl font-bold md:text-5xl uppercase">Do Sertão para o Mundo</h2>
        <p className="mt-6 text-lg opacity-80 max-w-2xl mx-auto italic">
          "O sertão é do tamanho do mundo. O sertão é dentro da gente." — Guimarães Rosa
        </p>
      </section>
    </div>
  );
}
