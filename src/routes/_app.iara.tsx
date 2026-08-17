import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/iara")({
  component: () => (
    <div className="container-narrow py-20 text-center">
      <h1 className="font-display text-5xl font-bold text-[var(--coffee)] uppercase">IARA</h1>
      <p className="mt-6 text-xl text-[var(--sertao)]">Nossa inteligência artificial a serviço da cultura e economia sertaneja.</p>
    </div>
  ),
});
