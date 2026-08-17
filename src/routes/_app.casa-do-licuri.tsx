import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/casa-do-licuri")({
  head: () => ({
    meta: [
      { title: "Casa do Licuri — Experiência e Cultura | Empório do Licuri" },
    ],
  }),
  component: CasaDoLicuriPage,
});

function CasaDoLicuriPage() {
  return (
    <div className="container-narrow py-16">
      <div className="max-w-3xl">
        <p className="text-[10px] uppercase tracking-[0.22em] text-primary font-bold">Espaço Físico</p>
        <h1 className="mt-4 font-display text-4xl font-semibold text-[var(--coffee)] md:text-6xl uppercase">
          Casa do Licuri
        </h1>
        <p className="mt-6 text-xl text-[var(--sertao)] leading-relaxed">
          Em breve, um espaço físico que combina Empório, Cafeteria, Espaço Cultural e Experiência. Onde a tradição encontra o futuro.
        </p>
      </div>

      <div className="mt-20 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Loja", desc: "Todo o catálogo do Empório disponível fisicamente." },
          { title: "Café", desc: "Sabores do sertão em um ambiente acolhedor." },
          { title: "Eventos", desc: "Workshops, palestras e encontros culturais." },
          { title: "Cultura", desc: "Exposições e vivências sobre a Caatinga." },
        ].map((item) => (
          <div key={item.title} className="rounded-2xl border border-[var(--border)] bg-white p-6">
            <h3 className="font-bold text-[var(--coffee)]">{item.title}</h3>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
