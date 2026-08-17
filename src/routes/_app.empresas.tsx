import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/empresas")({
  component: () => (
    <div className="container-narrow py-20 text-center">
      <h1 className="font-display text-5xl font-bold text-[var(--coffee)] uppercase">Empresas</h1>
      <p className="mt-6 text-xl text-[var(--sertao)]">Soluções corporativas, brindes e parcerias estratégicas para levar o licuri ao mundo dos negócios.</p>
    </div>
  ),
});
