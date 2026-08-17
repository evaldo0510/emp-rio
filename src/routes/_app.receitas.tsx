import { createFileRoute, Link } from "@tanstack/react-router";
import { Utensils, Clock, Flame, ShoppingCart, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/receitas")({
  head: () => ({
    meta: [
      { title: "Receitas com Licuri — Biblioteca Gastronômica | Empório do Licuri" },
      { name: "description", content: "Descubra sabores autênticos com nossa biblioteca de receitas exclusivas utilizando licuri." },
    ],
  }),
  component: ReceitasPage,
});

const mockReceitas = [
  {
    slug: "arroz-com-licuri",
    name: "Arroz de Licuri Tradicional",
    time: "30 min",
    difficulty: "Fácil",
    image: "/products/farinha-de-licuri-artesanal-500g.jpg", // placeholder
  },
  {
    slug: "peixe-ao-molho-licuri",
    name: "Peixe ao Molho de Licuri",
    time: "45 min",
    difficulty: "Média",
    image: "/products/oleo-de-licuri-extra-virgem-200ml.jpg", // placeholder
  },
  {
    slug: "bolo-de-licuri",
    name: "Bolo de Licuri e Rapadura",
    time: "60 min",
    difficulty: "Fácil",
    image: "/products/farinha-de-licuri-artesanal-500g.jpg", // placeholder
  }
];

function ReceitasPage() {
  return (
    <div className="container-narrow py-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="max-w-2xl">
          <p className="text-[10px] uppercase tracking-[0.22em] text-primary font-bold">Gastronomia</p>
          <h1 className="mt-4 font-display text-4xl font-semibold text-[var(--coffee)] md:text-6xl uppercase">
            Biblioteca de Sabores
          </h1>
          <p className="mt-6 text-xl text-[var(--sertao)] leading-relaxed">
            O licuri é a estrela da culinária sertaneja. Aprenda a transformar este ingrediente em pratos inesquecíveis.
          </p>
        </div>
        <Button variant="outline" className="rounded-full">
          <Bookmark className="mr-2 h-4 w-4" /> Receitas Salvas
        </Button>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {mockReceitas.map((receita) => (
          <div key={receita.slug} className="group rounded-3xl border border-[var(--border)] bg-white overflow-hidden hover:shadow-xl transition-all duration-300">
            <div className="aspect-[4/3] relative overflow-hidden bg-[var(--sand)]/10">
              <img 
                src={receita.image} 
                alt={receita.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-[var(--coffee)]">
                {receita.difficulty}
              </div>
            </div>
            <div className="p-6">
              <h3 className="font-display text-xl font-bold text-[var(--coffee)] group-hover:text-primary transition-colors">
                {receita.name}
              </h3>
              <div className="mt-4 flex items-center gap-4 text-sm text-[var(--muted-foreground)]">
                <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {receita.time}</span>
                <span className="flex items-center gap-1.5"><Utensils className="h-4 w-4" /> 4 porções</span>
              </div>
              <div className="mt-6 flex gap-2">
                <Button variant="soft" size="sm" className="flex-1" asChild>
                  <Link to={`/receitas`}>Ver Receita</Link>
                </Button>
                <Button variant="outline" size="icon" className="rounded-xl">
                  <ShoppingCart className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <section className="mt-20 p-12 rounded-[40px] bg-[var(--cream)] border-2 border-[var(--clay)]/10 text-center">
        <Flame className="h-10 w-10 text-primary mx-auto mb-6" />
        <h2 className="font-display text-3xl font-bold text-[var(--coffee)] uppercase">Compre os Ingredientes</h2>
        <p className="mt-4 text-[var(--sertao)] max-w-xl mx-auto">
          Temos tudo o que você precisa para preparar estas receitas, direto dos produtores da Caatinga.
        </p>
        <Button variant="hero" className="mt-8" asChild>
          <Link to="/categorias">Explorar o Mercado</Link>
        </Button>
      </section>
    </div>
  );
}
