import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/impacto")({
  component: () => (
    <div className="container-narrow py-20 text-center">
      <h1 className="font-display text-5xl font-bold text-[var(--coffee)] uppercase">Impacto</h1>
      <p className="mt-6 text-xl text-[var(--sertao)]">Nossas métricas de desenvolvimento, preservação ambiental e transformação social no Semiárido.</p>
    </div>
  ),
});
