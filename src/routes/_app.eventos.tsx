import { createFileRoute } from "@tanstack/react-router";
import { Calendar, MapPin, Ticket, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/eventos")({
  head: () => ({
    meta: [
      { title: "Eventos e Vivências | Empório do Licuri" },
      { name: "description", content: "Participe de festivais, feiras, oficinas e vivências culturais no Sertão." },
    ],
  }),
  component: EventosPage,
});

const mockEventos = [
  {
    title: "Festival do Licuri",
    date: "15-18 Setembro, 2026",
    location: "Sertão Baiano",
    desc: "A maior celebração da palmeira do sertão com música, gastronomia e feira de produtores."
  },
  {
    title: "Oficina de Gastronomia",
    date: "05 Outubro, 2026",
    location: "Casa do Licuri",
    desc: "Aprenda técnicas ancestrais e contemporâneas com chefs especialistas no licuri."
  }
];

function EventosPage() {
  return (
    <div className="container-narrow py-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="max-w-2xl">
          <p className="text-[10px] uppercase tracking-[0.22em] text-primary font-bold">Calendário</p>
          <h1 className="mt-4 font-display text-4xl font-semibold text-[var(--coffee)] md:text-6xl uppercase">
            Agenda Cultural
          </h1>
          <p className="mt-6 text-xl text-[var(--sertao)] leading-relaxed">
            Vivencie a alma do Sertão através de festivais, oficinas e encontros.
          </p>
        </div>
        <Button variant="soft" className="rounded-full">
          <Bell className="mr-2 h-4 w-4" /> Me avise sobre novos eventos
        </Button>
      </div>

      <div className="grid gap-6">
        {mockEventos.map((evento, i) => (
          <div key={i} className="flex flex-col md:flex-row gap-6 p-8 rounded-3xl border border-[var(--border)] bg-white hover:border-primary/30 transition-all">
            <div className="flex-1">
              <div className="flex items-center gap-4 text-primary text-sm font-bold mb-3">
                <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {evento.date}</span>
                <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {evento.location}</span>
              </div>
              <h3 className="font-display text-2xl font-bold text-[var(--coffee)]">{evento.title}</h3>
              <p className="mt-2 text-[var(--muted-foreground)] max-w-xl">{evento.desc}</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="rounded-xl">Ver Detalhes</Button>
              <Button variant="hero" className="rounded-xl"><Ticket className="mr-2 h-4 w-4" /> Garantir Vaga</Button>
            </div>
          </div>
        ))}
      </div>

      <section className="mt-20 grid md:grid-cols-2 gap-8">
        <div className="p-8 rounded-3xl bg-[var(--sand)]/20 border border-[var(--clay)]/20">
          <h3 className="font-display text-xl font-bold text-[var(--coffee)] uppercase">Vivências Turísticas</h3>
          <p className="mt-2 text-sm text-[var(--sertao)]">
            Agende uma visita guiada às comunidades produtoras e conheça o ciclo do licuri de perto.
          </p>
          <Button variant="link" className="mt-4 p-0 text-primary font-bold">Saber mais →</Button>
        </div>
        <div className="p-8 rounded-3xl bg-[var(--sand)]/20 border border-[var(--clay)]/20">
          <h3 className="font-display text-xl font-bold text-[var(--coffee)] uppercase">Encontro de Produtores</h3>
          <p className="mt-2 text-sm text-[var(--sertao)]">
            Fóruns de discussão e capacitação técnica para parceiros do ecossistema.
          </p>
          <Button variant="link" className="mt-4 p-0 text-primary font-bold">Calendário técnico →</Button>
        </div>
      </section>
    </div>
  );
}
