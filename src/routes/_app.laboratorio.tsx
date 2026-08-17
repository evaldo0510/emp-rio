import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/laboratorio")({
  component: () => (
    <div className="container-narrow py-20 text-center">
      <h1 className="font-display text-5xl font-bold text-[var(--coffee)] uppercase">Laboratório</h1>
      <p className="mt-6 text-xl text-[var(--sertao)]">Pesquisa, desenvolvimento e inovação tecnológica aplicados ao potencial do licuri.</p>
    </div>
  ),
});
