import { createFileRoute } from "@tanstack/react-router";
import { MessageSquare, Sparkles, Brain, Cpu } from "lucide-react";

export const Route = createFileRoute("/_app/iara")({
  head: () => ({
    meta: [
      { title: "IARA — Inteligência Artificial do Licuri | Empório do Licuri" },
      { name: "description", content: "Conheça IARA, nossa inteligência artificial dedicada a conectar tradição e tecnologia no ecossistema do licuri." },
    ],
  }),
  component: IaraPage,
});

function IaraPage() {
  return (
    <div className="container-narrow py-16">
      <div className="max-w-3xl mb-16">
        <p className="text-[10px] uppercase tracking-[0.22em] text-primary font-bold">Tecnologia & Inovação</p>
        <h1 className="mt-4 font-display text-4xl font-semibold text-[var(--coffee)] md:text-6xl uppercase">
          IARA
        </h1>
        <p className="mt-6 text-xl text-[var(--sertao)] leading-relaxed italic">
          Inteligência Artificial de Relacionamento e Aprendizado.
        </p>
        <p className="mt-4 text-lg text-[var(--sertao)]">
          IARA é a nossa ponte tecnológica entre o conhecimento ancestral do sertão e as possibilidades do futuro digital.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-6">
          <div className="p-8 rounded-3xl border border-[var(--border)] bg-white shadow-sm">
            <MessageSquare className="h-8 w-8 text-primary mb-4" />
            <h3 className="font-display text-xl font-bold text-[var(--coffee)] uppercase">Apoio ao Produtor</h3>
            <p className="mt-2 text-sm text-[var(--muted-foreground)] leading-relaxed">
              IARA auxilia produtores na precificação, gestão de estoque e criação de narrativas de marca para seus produtos.
            </p>
          </div>
          <div className="p-8 rounded-3xl border border-[var(--border)] bg-white shadow-sm">
            <Sparkles className="h-8 w-8 text-primary mb-4" />
            <h3 className="font-display text-xl font-bold text-[var(--coffee)] uppercase">Curadoria Inteligente</h3>
            <p className="mt-2 text-sm text-[var(--muted-foreground)] leading-relaxed">
              Sugestões personalizadas para consumidores baseadas em perfis de sabor e impacto social desejado.
            </p>
          </div>
        </div>

        <div className="rounded-[40px] bg-[var(--clay)] p-10 text-[var(--cream)] flex flex-col justify-center items-center text-center">
          <div className="relative">
            <Cpu className="h-20 w-20 text-white/20 animate-pulse" />
            <Brain className="h-10 w-10 text-primary absolute inset-0 m-auto" />
          </div>
          <h2 className="mt-8 font-display text-3xl font-bold uppercase">Tradição Algorítmica</h2>
          <p className="mt-4 opacity-90 max-w-xs mx-auto">
            Processamos dados da Caatinga para prever safras e otimizar a logística das cooperativas parceiras.
          </p>
        </div>
      </div>

      <div className="mt-20 p-12 rounded-3xl bg-[var(--sand)]/10 border border-[var(--border)] text-center">
        <h2 className="font-display text-2xl font-bold text-[var(--coffee)] uppercase">Em Desenvolvimento</h2>
        <p className="mt-4 text-[var(--sertao)] max-w-2xl mx-auto">
          IARA está em fase de aprendizado contínuo, sendo alimentada pelas histórias reais das comunidades quilombolas e pequenos agricultores do Sertão.
        </p>
      </div>
    </div>
  );
}
