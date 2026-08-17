import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/academia")({
  component: () => (
    <div className="container-narrow py-20 text-center">
      <h1 className="font-display text-5xl font-bold text-[var(--coffee)] uppercase">Academia</h1>
      <p className="mt-6 text-xl text-[var(--sertao)]">Espaço de formação para produtores, cursos de culinária sertaneja e educação ambiental.</p>
    </div>
  ),
});
