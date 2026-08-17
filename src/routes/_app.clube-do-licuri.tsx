import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/clube-do-licuri")({
  component: () => (
    <div className="container-narrow py-20 text-center">
      <h1 className="font-display text-5xl font-bold text-[var(--coffee)]">Clube do Licuri</h1>
      <p className="mt-6 text-xl text-[var(--sertao)]">Em breve, uma assinatura mensal com produtos exclusivos e experiências diretas do Sertão.</p>
    </div>
  ),
});
