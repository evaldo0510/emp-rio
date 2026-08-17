import { createFileRoute } from "@tanstack/react-router";
import { Briefcase, ShoppingBag, TrendingUp, Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/empresas")({
  head: () => ({
    meta: [
      { title: "Para Empresas — B2B e Parcerias | Empório do Licuri" },
      { name: "description", content: "Soluções de licuri para indústrias, presentes corporativos e parcerias estratégicas." },
    ],
  }),
  component: EmpresasPage,
});

function EmpresasPage() {
  return (
    <div className="container-narrow py-16">
      <div className="max-w-3xl mb-16">
        <p className="text-[10px] uppercase tracking-[0.22em] text-primary font-bold">B2B & Parcerias</p>
        <h1 className="mt-4 font-display text-4xl font-semibold text-[var(--coffee)] md:text-6xl uppercase">
          Empório do Licuri para Empresas
        </h1>
        <p className="mt-6 text-xl text-[var(--sertao)] leading-relaxed">
          Leve a essência do Sertão para o seu negócio. Oferecemos soluções personalizadas para marcas que buscam impacto e autenticidade.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {[
          {
            icon: ShoppingBag,
            title: "Venda no Atacado",
            desc: "Fornecimento de óleos, farinhas e ingredientes para indústrias alimentícias e de cosméticos."
          },
          {
            icon: Handshake,
            title: "Presentes Corporativos",
            desc: "Kits exclusivos com história e propósito para seus colaboradores e clientes."
          },
          {
            icon: TrendingUp,
            title: "Parcerias de Impacto",
            desc: "Projetos de responsabilidade socioambiental vinculados à cadeia do licuri."
          }
        ].map((item, i) => (
          <div key={i} className="p-8 rounded-3xl border border-[var(--border)] bg-white shadow-sm hover:shadow-md transition-shadow">
            <item.icon className="h-8 w-8 text-primary mb-6" />
            <h3 className="font-display text-xl font-bold text-[var(--coffee)] uppercase tracking-wider mb-3">{item.title}</h3>
            <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

      <section className="mt-20 p-12 rounded-[40px] bg-[var(--coffee)] text-[var(--cream)] text-center">
        <Briefcase className="h-10 w-10 text-primary mx-auto mb-6" />
        <h2 className="font-display text-3xl font-bold uppercase">Vamos Conversar?</h2>
        <p className="mt-4 opacity-80 max-w-xl mx-auto">
          Nossa equipe está pronta para entender as necessidades do seu negócio e apresentar o potencial do ecossistema do licuri.
        </p>
        <Button variant="hero" className="mt-8 bg-white text-[var(--coffee)] hover:bg-[var(--cream)]" asChild>
          <a href="mailto:contato@emporiodolicuri.com.br">Solicitar Proposta</a>
        </Button>
      </section>
    </div>
  );
}
