import { createFileRoute } from "@tanstack/react-router";
import { Heart, Globe, Users, TreePalm } from "lucide-react";

export const Route = createFileRoute("/_app/impacto")({
  head: () => ({
    meta: [
      { title: "Impacto Social e Ambiental | Empório do Licuri" },
      { name: "description", content: "Conheça o impacto do ecossistema do licuri no desenvolvimento sustentável do Sertão." },
    ],
  }),
  component: ImpactoPage,
});

function ImpactoPage() {
  return (
    <div className="container-narrow py-16">
      <div className="max-w-3xl mb-16">
        <p className="text-[10px] uppercase tracking-[0.22em] text-primary font-bold">Nosso Legado</p>
        <h1 className="mt-4 font-display text-4xl font-semibold text-[var(--coffee)] md:text-6xl uppercase">
          Impacto que Transforma
        </h1>
        <p className="mt-6 text-xl text-[var(--sertao)] leading-relaxed">
          Cada produto do Empório do Licuri carrega um propósito: gerar renda, preservar a biodiversidade e fortalecer a cultura sertaneja.
        </p>
      </div>

      <div className="grid gap-12 md:grid-cols-2">
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-[var(--leaf)]/10 flex items-center justify-center shrink-0">
              <TreePalm className="h-6 w-6 text-[var(--leaf)]" />
            </div>
            <div>
              <h3 className="font-display text-2xl font-bold text-[var(--coffee)] uppercase">Preservação da Caatinga</h3>
              <p className="mt-2 text-[var(--sertao)] leading-relaxed">
                Ao valorizar o licuri, incentivamos a manutenção das palmeiras nativas, protegendo o único bioma exclusivamente brasileiro contra a desertificação.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-display text-2xl font-bold text-[var(--coffee)] uppercase">Fortalecimento Comunitário</h3>
              <p className="mt-2 text-[var(--sertao)] leading-relaxed">
                Trabalhamos com cooperativas e associações, garantindo que a maior parte do valor gerado retorne para quem está na ponta da produção.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-[var(--coffee)] p-10 text-[var(--cream)] relative overflow-hidden">
          <Heart className="absolute -right-8 -bottom-8 h-40 w-40 text-white/5" />
          <h3 className="font-display text-2xl font-bold uppercase mb-6">Métricas de Mudança</h3>
          <div className="space-y-8">
            <div>
              <div className="text-4xl font-bold text-primary">+500</div>
              <p className="text-sm opacity-80 uppercase tracking-widest mt-1">Famílias Impactadas</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary">15</div>
              <p className="text-sm opacity-80 uppercase tracking-widest mt-1">Comunidades Parceiras</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary">100%</div>
              <p className="text-sm opacity-80 uppercase tracking-widest mt-1">Origem Rastreável</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-20 p-12 rounded-3xl bg-[var(--sand)]/10 border border-[var(--border)] text-center">
        <Globe className="h-10 w-10 text-primary mx-auto mb-6" />
        <h2 className="font-display text-3xl font-bold text-[var(--coffee)] uppercase">Do Sertão para o Mundo</h2>
        <p className="mt-4 text-[var(--sertao)] max-w-2xl mx-auto">
          Nossa visão global é levar a riqueza da sociobiodiversidade sertaneja para novos mercados, garantindo um futuro digno para as próximas gerações.
        </p>
      </div>
    </div>
  );
}
