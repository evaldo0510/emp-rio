import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/academia")({
  component: AcademiaPage,
});

function AcademiaPage() {
  return (
    <div className="container-narrow py-16">
      <div className="max-w-3xl mb-16">
        <p className="text-[10px] uppercase tracking-[0.22em] text-primary font-bold">Educação • Capacitação</p>
        <h1 className="mt-4 font-display text-4xl font-semibold text-[var(--coffee)] md:text-6xl uppercase">
          Academia do Licuri
        </h1>
        <p className="mt-6 text-xl text-[var(--sertao)] leading-relaxed">
          Conhecimento que gera autonomia. Nossa trilha educacional para produtores, chefs e empreendedores do ecossistema.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {[
          { title: "Produção", desc: "Manejo sustentável e coleta seletiva das palmeiras." },
          { title: "Beneficiamento", desc: "Técnicas de extração de óleo e produção de farinhas." },
          { title: "Gastronomia", desc: "Uso culinário do licuri em cardápios profissionais." },
          { title: "Gestão", desc: "Empreendedorismo rural e finanças para cooperativas." },
          { title: "Marketing", desc: "Como contar a história do seu produto no digital." },
          { title: "Sustentabilidade", desc: "Certificações e boas práticas ambientais." }
        ].map(trilha => (
          <div key={trilha.title} className="p-8 rounded-3xl border border-[var(--border)] bg-white shadow-sm">
            <h3 className="font-display text-lg font-bold text-[var(--coffee)] uppercase tracking-wider">{trilha.title}</h3>
            <p className="mt-2 text-sm text-[var(--muted-foreground)] leading-relaxed">{trilha.desc}</p>
            <button className="mt-6 text-xs font-bold text-primary uppercase tracking-widest hover:underline">Iniciar Trilha →</button>
          </div>
        ))}
      </div>
    </div>
  );
}
