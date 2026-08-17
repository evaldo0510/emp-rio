import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/licuri")({
  head: () => ({
    meta: [
      { title: "O Licuri — A Palmeira do Sertão | Empório do Licuri" },
      { name: "description", content: "Conheça a história, a cultura e a economia por trás da palmeira que sustenta o Sertão." },
    ],
  }),
  component: LicuriPage,
});

function LicuriPage() {
  return (
    <div className="container-narrow py-16">
      <div className="max-w-3xl">
        <p className="text-[10px] uppercase tracking-[0.22em] text-primary font-bold">Nossa Raiz</p>
        <h1 className="mt-4 font-display text-4xl font-semibold text-[var(--coffee)] md:text-6xl uppercase">
          A Palmeira do Sertão
        </h1>
        <p className="mt-6 text-xl text-[var(--sertao)] leading-relaxed">
          O licuri (Syagrus coronata) é muito mais que uma planta. É a base de um ecossistema econômico, social e ambiental que resiste no coração do Semiárido brasileiro.
        </p>
      </div>

      <div className="mt-20 grid gap-12 md:grid-cols-2">
        <section className="space-y-6">
          <h2 className="font-display text-3xl font-bold text-[var(--coffee)]">História e Cultura</h2>
          <p className="text-[var(--sertao)]">
            Utilizado há gerações por comunidades quilombolas e pequenos agricultores, o licuri é sinônimo de resiliência. Sua colheita é um ritual que une famílias.
          </p>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--cream)] p-6">
            <h3 className="font-bold text-[var(--coffee)]">Você sabia?</h3>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              Uma única palmeira de licuri pode viver por décadas, fornecendo alimento e matéria-prima durante todo o ano, mesmo nas secas mais severas.
            </p>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="font-display text-3xl font-bold text-[var(--coffee)]">Economia e Sustentabilidade</h2>
          <p className="text-[var(--sertao)]">
            Do licuri tudo se aproveita: da palha para o artesanato ao óleo precioso da amêndoa. Nossa missão é elevar o valor percebido dessa riqueza.
          </p>
          <ul className="grid grid-cols-2 gap-4">
            {["Óleo Extra Virgem", "Artesanato", "Gastronomia", "Cosméticos"].map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm font-medium text-[var(--coffee)]">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" /> {item}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
