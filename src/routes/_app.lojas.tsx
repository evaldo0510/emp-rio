import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, Star } from "lucide-react";

export const Route = createFileRoute("/_app/lojas")({
  head: () => ({ meta: [{ title: "Lojas parceiras — Licuri Hub" }] }),
  component: ShopsPage,
});

const shops = [
  { name: "Sertão Natural", region: "Senhor do Bonfim — BA", rating: 4.9, items: 12 },
  { name: "Licuri da Caatinga", region: "Capim Grosso — BA", rating: 4.8, items: 18 },
  { name: "Sabor do Sertão", region: "Picos — PI", rating: 4.9, items: 9 },
  { name: "Delícias do Cerrado", region: "Crateús — CE", rating: 4.7, items: 7 },
  { name: "Mãos da Caatinga", region: "Jeremoabo — BA", rating: 5, items: 15 },
  { name: "Nutri Sertão", region: "Montes Claros — MG", rating: 4.9, items: 11 },
];

function ShopsPage() {
  return (
    <div className="container-narrow py-10">
      <h1 className="font-display text-4xl font-semibold text-[var(--coffee)]">Lojas parceiras</h1>
      <p className="mt-2 max-w-xl text-[var(--muted-foreground)]">
        Cooperativas e pequenas marcas familiares que produzem com respeito ao licuri e à Caatinga.
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {shops.map((s) => (
          <Link
            key={s.name}
            to="/categorias"
            className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)]"
          >
            <h3 className="font-display text-xl font-semibold text-[var(--coffee)]">{s.name}</h3>
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
              <MapPin className="h-3.5 w-3.5" /> {s.region}
            </p>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="inline-flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-[var(--clay)] text-[var(--clay)]" /> {s.rating}
              </span>
              <span className="text-[var(--muted-foreground)]">{s.items} produtos</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
