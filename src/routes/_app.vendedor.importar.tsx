import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Camera, FileText, MessageCircle, Link2, ShoppingBag, PencilLine, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/vendedor/importar")({
  head: () => ({ meta: [{ title: "Importar produtos com IA — Licuri Hub" }] }),
  component: ImportarProdutos,
});

type Method = {
  id: string;
  icon: any;
  title: string;
  desc: string;
  hint: string;
  inputType: "file" | "text" | "url";
  accept?: string;
  placeholder?: string;
};

const methods: Method[] = [
  {
    id: "fotos",
    icon: Camera,
    title: "Enviar fotos",
    desc: "Tire ou envie fotos dos seus produtos. A IA identifica, recorta e descreve cada um.",
    hint: "JPG, PNG até 10MB cada",
    inputType: "file",
    accept: "image/*",
  },
  {
    id: "pdf",
    icon: FileText,
    title: "Enviar PDF",
    desc: "Catálogo, tabela de preços ou cardápio em PDF. Extraímos produtos automaticamente.",
    hint: "PDF até 20MB",
    inputType: "file",
    accept: "application/pdf",
  },
  {
    id: "whatsapp",
    icon: MessageCircle,
    title: "Catálogo WhatsApp",
    desc: "Cole o link do seu catálogo do WhatsApp Business e importamos tudo.",
    hint: "Ex: wa.me/c/55119...",
    inputType: "url",
    placeholder: "https://wa.me/c/...",
  },
  {
    id: "mercadolivre",
    icon: Link2,
    title: "Link Mercado Livre",
    desc: "Cole o link da sua loja ou de um anúncio. Trazemos preços, fotos e variações.",
    hint: "Ex: mercadolivre.com.br/perfil/...",
    inputType: "url",
    placeholder: "https://www.mercadolivre.com.br/perfil/...",
  },
  {
    id: "shopee",
    icon: ShoppingBag,
    title: "Link Shopee",
    desc: "Importe sua loja da Shopee diretamente para o Licuri Hub.",
    hint: "Ex: shopee.com.br/loja...",
    inputType: "url",
    placeholder: "https://shopee.com.br/...",
  },
  {
    id: "manual",
    icon: PencilLine,
    title: "Digitar manualmente",
    desc: "Prefere o cadastro tradicional? Adicione produto por produto.",
    hint: "Formulário guiado",
    inputType: "text",
  },
];

function ImportarProdutos() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Method | null>(null);
  const [value, setValue] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const canSubmit =
    selected &&
    (selected.inputType === "text" ||
      (selected.inputType === "file" && file) ||
      (selected.inputType === "url" && value.trim().length > 5));

  const handleStart = () => {
    if (!selected) return;
    if (selected.id === "manual") {
      navigate({ to: "/vendedor" });
      return;
    }
    navigate({
      to: "/vendedor/importar/processando",
      search: { method: selected.id, source: value || file?.name || "" } as never,
    });
  };

  return (
    <div className="container-narrow py-10">
      <header className="mb-10">
        <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
          Vendedor / Importar
        </p>
        <h1 className="font-display text-3xl font-semibold text-[var(--coffee)]">
          Como você quer adicionar seus produtos?
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted-foreground)]">
          A inteligência do Licuri organiza, descreve e categoriza tudo para você. Escolha o
          jeito mais prático.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {methods.map((m) => {
          const Icon = m.icon;
          const isActive = selected?.id === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setSelected(m);
                setValue("");
                setFile(null);
              }}
              className={`text-left rounded-2xl border p-5 transition-all ${
                isActive
                  ? "border-[var(--clay)] bg-[var(--cream)] shadow-warm"
                  : "border-[var(--border)] bg-white hover:border-[var(--clay)]/40"
              }`}
            >
              <div
                className={`mb-4 grid h-11 w-11 place-items-center rounded-xl ${
                  isActive ? "bg-[var(--clay)] text-[var(--clay-foreground)]" : "bg-[var(--cream)] text-[var(--clay)]"
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-lg font-semibold text-[var(--coffee)]">
                {m.title}
              </h3>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">{m.desc}</p>
              <p className="mt-3 text-[10px] uppercase tracking-widest text-[var(--muted-foreground)]">
                {m.hint}
              </p>
            </button>
          );
        })}
      </div>

      {selected && selected.id !== "manual" && (
        <div className="mt-10 rounded-2xl border border-[var(--clay)]/20 bg-[var(--sand)]/10 p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--clay)]">
            Próximo passo
          </p>
          <h2 className="mt-1 font-display text-xl font-semibold text-[var(--coffee)]">
            {selected.title}
          </h2>

          <div className="mt-5">
            {selected.inputType === "file" && (
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[var(--clay)]/30 bg-white p-10 text-center hover:border-[var(--clay)]">
                <selected.icon className="mb-3 h-8 w-8 text-[var(--clay)]" />
                <span className="text-sm font-medium text-[var(--coffee)]">
                  {file ? file.name : "Clique para selecionar ou arraste aqui"}
                </span>
                <span className="mt-1 text-xs text-[var(--muted-foreground)]">{selected.hint}</span>
                <input
                  type="file"
                  accept={selected.accept}
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </label>
            )}

            {selected.inputType === "url" && (
              <input
                type="url"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={selected.placeholder}
                className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--clay)]"
              />
            )}
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <Link
              to="/vendedor"
              className="text-sm text-[var(--muted-foreground)] hover:text-[var(--clay)]"
            >
              Cancelar
            </Link>
            <Button variant="hero" disabled={!canSubmit} onClick={handleStart}>
              Analisar com IA
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
