import { createFileRoute } from "@tanstack/react-router";
import { MapPin, Info, Users, BookOpen, ExternalLink, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/origem")({
  head: () => ({
    meta: [
      { title: "Origem e Rastreabilidade | Empório do Licuri" },
      { name: "description", content: "Explore o mapa interativo do território do licuri. Conheça as comunidades, cooperativas e a história por trás de cada produto." },
    ],
  }),
  component: OrigemPage,
});

function OrigemPage() {
  return (
    <div className="container-narrow py-16">
      <div className="max-w-3xl mb-12">
        <p className="text-[10px] uppercase tracking-[0.22em] text-primary font-bold">Rastreabilidade</p>
        <h1 className="mt-4 font-display text-4xl font-semibold text-[var(--coffee)] md:text-6xl uppercase">
          Território do Licuri
        </h1>
        <p className="mt-6 text-xl text-[var(--sertao)] leading-relaxed">
          Navegue pelas raízes do nosso ecossistema. Descubra de onde vem cada sabor e conheça as mãos que transformam a Caatinga.
        </p>
      </div>

      {/* Mapa Placeholder */}
      <div className="relative aspect-video w-full rounded-3xl bg-[var(--sand)]/20 border-2 border-dashed border-[var(--clay)]/30 flex items-center justify-center overflow-hidden group">
        <div className="text-center p-8">
          <MapPin className="h-12 w-12 text-[var(--clay)] mx-auto mb-4 animate-bounce" />
          <h3 className="font-display text-2xl font-bold text-[var(--coffee)]">Mapa Interativo</h3>
          <p className="text-[var(--sertao)] mt-2 max-w-sm">
            Em breve: explore Bahia, comunidades, municípios e cooperativas em tempo real.
          </p>
        </div>
      </div>

      <div className="mt-20 grid gap-8 md:grid-cols-3">
        <div className="p-6 rounded-2xl bg-white border border-[var(--border)] shadow-sm">
          <Users className="h-8 w-8 text-primary mb-4" />
          <h3 className="font-bold text-[var(--coffee)]">Comunidades</h3>
          <p className="text-sm text-[var(--muted-foreground)] mt-2">
            Acompanhe o impacto direto em cada município e agrupamento produtivo.
          </p>
        </div>
        <div className="p-6 rounded-2xl bg-white border border-[var(--border)] shadow-sm">
          <BookOpen className="h-8 w-8 text-primary mb-4" />
          <h3 className="font-bold text-[var(--coffee)]">Histórias</h3>
          <p className="text-sm text-[var(--muted-foreground)] mt-2">
            Cada coordenada no mapa revela uma trajetória de resistência e inovação.
          </p>
        </div>
        <div className="p-6 rounded-2xl bg-white border border-[var(--border)] shadow-sm">
          <ExternalLink className="h-8 w-8 text-primary mb-4" />
          <h3 className="font-bold text-[var(--coffee)]">Rastreio Total</h3>
          <p className="text-sm text-[var(--muted-foreground)] mt-2">
            Do produto ao produtor: transparência total sobre a cadeia produtiva.
          </p>
        </div>
      </div>

      <section className="mt-20 p-10 rounded-3xl bg-[var(--clay)] text-[var(--cream)]">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-lg">
            <h2 className="font-display text-3xl font-bold uppercase">Conheça quem produz</h2>
            <p className="mt-4 opacity-90">
              Acreditamos que o consumidor compra de uma pessoa, não apenas de um catálogo. Conheça as histórias por trás das cooperativas.
            </p>
          </div>
          <Button variant="outline" className="border-white text-white hover:bg-white hover:text-[var(--clay)]" asChild>
            <a href="/vendedor">Ver Produtores <ArrowRight className="ml-2 h-4 w-4" /></a>
          </Button>
        </div>
      </section>
    </div>
  );
}
