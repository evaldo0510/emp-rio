import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/clube-do-licuri")({
  component: () => (
    <div className="container-narrow py-20 text-center">
      <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-4xl text-primary">
        🌰
      </div>
      <h1 className="font-display text-5xl font-bold text-[var(--coffee)]">Clube do Licuri</h1>
      <p className="mt-4 text-2xl font-display italic text-primary">Moeda: SEMENTES</p>
      <p className="mt-6 text-xl text-[var(--sertao)] max-w-2xl mx-auto">
        O cliente acumula Sementes (R$ 1 = 1 Semente). Ganhe sementes comprando, avaliando, indicando amigos, participando de campanhas, assistindo conteúdos ou em eventos.
      </p>
      
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border)] p-6 bg-white">
          <div className="text-3xl font-bold text-primary mb-2">100</div>
          <p className="text-sm font-bold uppercase tracking-widest text-[var(--coffee)]">Sementes</p>
          <p className="mt-2 text-xs text-[var(--muted-foreground)]">Troque por descontos exclusivos.</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] p-6 bg-white">
          <div className="text-3xl font-bold text-primary mb-2">500</div>
          <p className="text-sm font-bold uppercase tracking-widest text-[var(--coffee)]">Sementes</p>
          <p className="mt-2 text-xs text-[var(--muted-foreground)]">Resgate produtos selecionados.</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] p-6 bg-white">
          <div className="text-3xl font-bold text-primary mb-2">1.000</div>
          <p className="text-sm font-bold uppercase tracking-widest text-[var(--coffee)]">Sementes</p>
          <p className="mt-2 text-xs text-[var(--muted-foreground)]">Receba um kit premium em casa.</p>
        </div>
      </div>
    </div>
  ),
});
