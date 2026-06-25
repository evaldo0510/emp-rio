import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Check, Loader2, Sparkles, Edit2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

const searchSchema = z.object({
  method: z.string().optional(),
  source: z.string().optional(),
});

export const Route = createFileRoute("/_app/vendedor/importar/processando")({
  validateSearch: (s: Record<string, unknown>) => {
    const r = searchSchema.safeParse(s);
    return r.success ? r.data : {};
  },
  head: () => ({ meta: [{ title: "Processando com IA — Licuri Hub" }] }),
  component: ProcessingPage,
});

const steps = [
  "Encontrando produtos",
  "Melhorando imagens",
  "Criando descrições",
  "Organizando categorias",
  "Montando sua vitrine",
];

const mockProducts = [
  {
    name: "Óleo de Licuri 100ml",
    price: "R$ 49,90",
    category: "Cosméticos naturais",
    description:
      "Óleo prensado a frio do coquinho do licuri. Hidrata cabelo e pele com riqueza nutricional do sertão.",
    image: "🫒",
  },
  {
    name: "Castanha de Licuri Torrada 200g",
    price: "R$ 28,00",
    category: "Alimentação",
    description:
      "Castanhas torradas e levemente salgadas. Snack natural, fonte de proteína e energia.",
    image: "🥜",
  },
  {
    name: "Mel Silvestre do Sertão 500g",
    price: "R$ 42,00",
    category: "Alimentação",
    description:
      "Mel colhido por apicultores familiares da Bahia. Aroma floral, sabor intenso e puro.",
    image: "🍯",
  },
];

function ProcessingPage() {
  const navigate = useNavigate();
  const { method } = Route.useSearch();
  const [stepIndex, setStepIndex] = useState(0);
  const [done, setDone] = useState(false);
  const [published, setPublished] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (stepIndex >= steps.length) {
      setDone(true);
      return;
    }
    const t = setTimeout(() => setStepIndex((i) => i + 1), 1100);
    return () => clearTimeout(t);
  }, [stepIndex]);

  return (
    <div className="container-narrow py-10">
      <header className="mb-8">
        <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
          IA do Licuri {method && `· via ${method}`}
        </p>
        <h1 className="font-display text-3xl font-semibold text-[var(--coffee)]">
          {done ? "Catálogo pronto para revisão" : "Analisando seu catálogo..."}
        </h1>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
        {/* Steps */}
        <div className="rounded-2xl border border-[var(--clay)]/20 bg-[var(--sand)]/10 p-6">
          <div className="mb-4 flex items-center gap-2 text-[var(--clay)]">
            <Sparkles className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Licuri Inteligência</span>
          </div>
          <ul className="space-y-3">
            {steps.map((s, i) => {
              const completed = i < stepIndex;
              const active = i === stepIndex && !done;
              return (
                <li
                  key={s}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all ${
                    completed
                      ? "border-[var(--leaf)]/30 bg-[var(--leaf)]/5"
                      : active
                        ? "border-[var(--clay)]/40 bg-white"
                        : "border-[var(--border)] bg-white/60 opacity-60"
                  }`}
                >
                  <span
                    className={`grid h-6 w-6 place-items-center rounded-full ${
                      completed
                        ? "bg-[var(--leaf)] text-white"
                        : active
                          ? "bg-[var(--clay)] text-white"
                          : "bg-[var(--cream)] text-[var(--muted-foreground)]"
                    }`}
                  >
                    {completed ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : active ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <span className="text-[10px]">{i + 1}</span>
                    )}
                  </span>
                  <span className="text-sm text-[var(--coffee)]">{s}</span>
                </li>
              );
            })}
          </ul>

          {done && (
            <div className="mt-6 rounded-xl bg-[var(--leaf)]/10 px-4 py-3 text-sm text-[var(--coffee)]">
              ✨ Encontramos <strong>{mockProducts.length} produtos</strong>. Revise e publique.
            </div>
          )}
        </div>

        {/* Results */}
        <div className="space-y-3">
          {!done && (
            <div className="rounded-2xl border border-dashed border-[var(--clay)]/30 bg-white p-10 text-center">
              <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-[var(--clay)]" />
              <p className="text-sm text-[var(--muted-foreground)]">
                Aguarde alguns segundos enquanto preparamos suas sugestões...
              </p>
            </div>
          )}

          {done &&
            mockProducts.map((p, i) => (
              <article
                key={i}
                className={`flex items-start gap-4 rounded-2xl border bg-white p-5 transition-all ${
                  published[i]
                    ? "border-[var(--leaf)]/40 bg-[var(--leaf)]/5"
                    : "border-[var(--border)]"
                }`}
              >
                <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-[var(--cream)] text-3xl">
                  {p.image}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-[var(--muted-foreground)]">
                        {p.category}
                      </p>
                      <h3 className="font-display text-lg font-semibold text-[var(--coffee)]">
                        {p.name}
                      </h3>
                    </div>
                    <span className="font-display text-base font-semibold text-[var(--clay)]">
                      {p.price}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[var(--muted-foreground)]">{p.description}</p>
                  <div className="mt-4 flex items-center gap-2">
                    {published[i] ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--leaf)]/15 px-3 py-1 text-xs font-medium text-[var(--leaf)]">
                        <Check className="h-3 w-3" /> Publicado
                      </span>
                    ) : (
                      <>
                        <Button size="sm" variant="outline">
                          <Edit2 className="mr-1.5 h-3.5 w-3.5" /> Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="hero"
                          onClick={() => setPublished((p) => ({ ...p, [i]: true }))}
                        >
                          <Send className="mr-1.5 h-3.5 w-3.5" /> Publicar
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </article>
            ))}

          {done && (
            <div className="flex items-center justify-between pt-4">
              <Link
                to="/vendedor/importar"
                className="text-sm text-[var(--muted-foreground)] hover:text-[var(--clay)]"
              >
                ← Importar outro lote
              </Link>
              <Button variant="hero" onClick={() => navigate({ to: "/vendedor" })}>
                Concluir e voltar ao painel
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
