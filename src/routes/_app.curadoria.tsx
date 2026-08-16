import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ShieldCheck, Award, Leaf, Star, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/curadoria")({
  head: () => ({
    meta: [
      { title: "Curadoria e Selo de Qualidade — Empório do Licuri" },
      {
        name: "description",
        content: "Conheça nossos critérios de seleção e o processo do Selo Empório do Licuri.",
      },
    ],
  }),
  component: CuradoriaPage,
});

function CuradoriaPage() {
  return (
    <div className="container-narrow py-16">
      <div className="max-w-3xl">
        <p className="text-[10px] uppercase tracking-[0.22em] text-primary font-bold">
          Excelência e Origem
        </p>
        <h1 className="mt-4 font-display text-4xl font-semibold text-[var(--coffee)] md:text-6xl uppercase">
          Curadoria Empório do Licuri
        </h1>
        <p className="mt-6 text-xl text-[var(--sertao)]">
          Nosso selo não é apenas uma marca, é uma garantia de que o produto carrega a alma do sertão, respeita a natureza e valoriza quem produz.
        </p>
      </div>

      <div className="mt-20 grid gap-12 md:grid-cols-2">
        <section>
          <h2 className="font-display text-3xl font-bold text-[var(--coffee)]">Critérios de Seleção</h2>
          <div className="mt-8 space-y-6">
            {[
              {
                icon: Leaf,
                title: "Sustentabilidade",
                desc: "Produção que respeita a Caatinga e utiliza métodos de extração que preservam a palmeira do licuri.",
              },
              {
                icon: ShieldCheck,
                title: "Origem Garantida",
                desc: "Rastreabilidade total: sabemos de onde vem, quem colheu e como foi processado.",
              },
              {
                icon: Star,
                title: "Qualidade Premium",
                desc: "Análise sensorial e técnica para garantir que o consumidor receba o melhor do sertão.",
              },
              {
                icon: Award,
                title: "Impacto Social",
                desc: "Priorizamos cooperativas, associações e produtores que geram renda justa na comunidade.",
              },
            ].map((item) => (
              <div key={item.title} className="flex gap-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold text-[var(--coffee)]">{item.title}</h3>
                  <p className="mt-1 text-[var(--sertao)]">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--border)] bg-[var(--cream)] p-8 md:p-12">
          <h2 className="font-display text-3xl font-bold text-[var(--coffee)]">O Processo do Selo</h2>
          <div className="mt-8 space-y-8 relative">
            <div className="absolute left-4 top-2 bottom-2 w-px bg-primary/20" />
            {[
              { step: "01", title: "Inscrição", desc: "O produtor cadastra sua loja e produtos em nossa plataforma." },
              { step: "02", title: "Avaliação Ténica", desc: "Nossa equipe analisa a história, o processo e a qualidade da amostra." },
              { step: "03", title: "Certificação", desc: "O selo é concedido e o produto ganha destaque máximo no marketplace." },
              { step: "04", title: "Monitoramento", desc: "Visitas periódicas e feedback de clientes para manter o padrão." },
            ].map((item) => (
              <div key={item.step} className="relative pl-10">
                <div className="absolute left-0 top-1 grid h-8 w-8 place-items-center rounded-full bg-primary text-[10px] font-bold text-white">
                  {item.step}
                </div>
                <h3 className="font-display text-lg font-bold text-[var(--coffee)]">{item.title}</h3>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-24 rounded-3xl bg-[var(--coffee)] p-10 text-[var(--cream)] text-center">
        <h2 className="font-display text-3xl font-bold md:text-4xl uppercase">Pronto para elevar seu produto?</h2>
        <p className="mt-4 text-lg opacity-80 max-w-2xl mx-auto">
          Ao conquistar o Selo Empório do Licuri, você não está apenas vendendo, está construindo um legado.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Button asChild variant="hero" size="xl">
            <Link to="/vendedor">Iniciar Cadastro de Vendedor</Link>
          </Button>
          <Button asChild variant="soft" size="xl">
            <Link to="/sobre">Nossa História</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
