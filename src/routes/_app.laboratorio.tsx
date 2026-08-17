import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/laboratorio")({
  component: LaboratorioPage,
});

function LaboratorioPage() {
  return (
    <div className="container-narrow py-16">
      <div className="max-w-3xl mb-16">
        <p className="text-[10px] uppercase tracking-[0.22em] text-primary font-bold">P&D • Futuro</p>
        <h1 className="mt-4 font-display text-4xl font-semibold text-[var(--coffee)] md:text-6xl uppercase">
          Laboratório de Inovação
        </h1>
        <p className="mt-6 text-xl text-[var(--sertao)] leading-relaxed">
          O que podemos criar a partir do licuri? Nossa área de P&D explora novas fronteiras para a biodiversidade sertaneja.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          "Alimentos", "Bebidas", "Cosméticos", "Biomateriais", "Óleos Nobres", "Gastronomia 2.0"
        ].map(cat => (
          <div key={cat} className="p-6 rounded-2xl border border-[var(--border)] bg-white text-center group hover:border-primary transition-colors">
            <h3 className="font-display text-sm font-bold uppercase tracking-widest text-[var(--coffee)]">{cat}</h3>
            <p className="mt-2 text-[10px] text-[var(--muted-foreground)] uppercase">Projetos Experimentais</p>
          </div>
        ))}
      </div>

      <div className="mt-20 rounded-3xl bg-[var(--sand)]/10 border border-[var(--border)] p-10 flex flex-col md:flex-row items-center gap-10">
        <div className="flex-1">
          <h2 className="font-display text-2xl font-bold text-[var(--coffee)] uppercase">Parcerias Acadêmicas</h2>
          <p className="mt-4 text-[var(--sertao)]">
            Colaboramos com universidades e institutos de pesquisa para validar benefícios nutricionais e desenvolver novas tecnologias de beneficiamento.
          </p>
        </div>
        <div className="w-full md:w-64 aspect-square rounded-2xl bg-[var(--coffee)] flex items-center justify-center text-[var(--cream)] p-6 text-center italic font-display text-xl">
          "Ciência a serviço da tradição."
        </div>
      </div>
    </div>
  );
}
