import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Camera, FileText, PencilLine, ArrowRight, Loader2, Link2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/vendedor/importar")({
  head: () => ({ meta: [{ title: "Importar produtos com IA — Empório do Licuri" }] }),
  component: ImportarProdutos,
});

type MethodId = "fotos" | "pdf" | "link" | "manual";
type Method = {
  id: MethodId;
  icon: typeof Camera;
  title: string;
  desc: string;
  hint: string;
  accept?: string;
};

const methods: Method[] = [
  {
    id: "fotos",
    icon: Camera,
    title: "Enviar fotos",
    desc: "Fotos dos seus produtos, vitrine ou prateleira. A IA identifica e descreve cada um.",
    hint: "JPG ou PNG, até 8MB",
    accept: "image/*",
  },
  {
    id: "pdf",
    icon: FileText,
    title: "Enviar PDF",
    desc: "Catálogo, tabela de preços ou cardápio em PDF. Extraímos os produtos automaticamente.",
    hint: "PDF até 8MB",
    accept: "application/pdf",
  },
  {
    id: "link",
    icon: Link2,
    title: "Importar por link",
    desc: "Cole o link de um anúncio (Mercado Livre, sua loja, blog) e a IA lê os dados pra você.",
    hint: "URL pública (sem login)",
  },
  {
    id: "manual",
    icon: PencilLine,
    title: "Digitar manualmente",
    desc: "Prefere cadastrar produto por produto? Vá direto ao formulário.",
    hint: "Formulário guiado",
  },
];

const MAX_BYTES = 8 * 1024 * 1024;

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function ImportarProdutos() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Method | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [preparing, setPreparing] = useState(false);

  const handleStart = async () => {
    if (!selected) return;
    if (selected.id === "manual") {
      navigate({ to: "/vendedor" });
      return;
    }

    try {
      setPreparing(true);

      if (selected.id === "link") {
        const trimmed = url.trim();
        if (!/^https?:\/\//i.test(trimmed)) {
          toast.error("Cole uma URL completa (começando com http:// ou https://).");
          return;
        }
        sessionStorage.setItem(
          "licuri:import-payload",
          JSON.stringify({ kind: "url", url: trimmed }),
        );
      } else {
        if (!file) {
          toast.error("Selecione um arquivo primeiro.");
          return;
        }
        if (file.size > MAX_BYTES) {
          toast.error("Arquivo muito grande. Limite 8MB.");
          return;
        }
        const dataUrl = await fileToDataUrl(file);
        sessionStorage.setItem(
          "licuri:import-payload",
          JSON.stringify({
            kind: selected.id === "fotos" ? "image" : "pdf",
            source: dataUrl,
            mime: file.type,
            fileName: file.name,
          }),
        );
      }

      navigate({ to: "/vendedor/importar/processando" });
    } catch (e) {
      toast.error("Erro ao preparar: " + (e instanceof Error ? e.message : "desconhecido"));
    } finally {
      setPreparing(false);
    }
  };

  const canSubmit =
    selected?.id === "manual" ||
    (selected?.id === "link" ? url.trim().length > 8 : !!file);

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
          A Licuri Inteligência analisa fotos, PDFs ou links e gera um rascunho que você revisa
          antes de publicar.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {methods.map((m) => {
          const Icon = m.icon;
          const isActive = selected?.id === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setSelected(m);
                setFile(null);
                setUrl("");
              }}
              className={`text-left rounded-2xl border p-5 transition-all ${
                isActive
                  ? "border-[var(--clay)] bg-[var(--cream)] shadow-warm"
                  : "border-[var(--border)] bg-white hover:border-[var(--clay)]/40"
              }`}
            >
              <div
                className={`mb-4 grid h-11 w-11 place-items-center rounded-xl ${
                  isActive
                    ? "bg-[var(--clay)] text-[var(--clay-foreground)]"
                    : "bg-[var(--cream)] text-[var(--clay)]"
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

          {selected.id === "link" ? (
            <div className="mt-5 space-y-2">
              <label className="text-xs font-medium text-[var(--coffee)]" htmlFor="import-url">
                Cole o link público do produto
              </label>
              <Input
                id="import-url"
                type="url"
                placeholder="https://produto.mercadolivre.com.br/MLB-..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <p className="text-xs text-[var(--muted-foreground)]">
                Funciona melhor com Mercado Livre. Para outras lojas, tentamos ler os dados
                públicos da página (Open Graph) — alguns sites bloqueiam essa leitura.
              </p>
            </div>
          ) : (
            <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[var(--clay)]/30 bg-white p-10 text-center hover:border-[var(--clay)]">
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

          <div className="mt-5 flex items-center justify-between gap-3">
            <Link
              to="/vendedor"
              className="text-sm text-[var(--muted-foreground)] hover:text-[var(--clay)]"
            >
              Cancelar
            </Link>
            <Button variant="hero" disabled={!canSubmit || preparing} onClick={handleStart}>
              {preparing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Preparando...
                </>
              ) : (
                <>
                  Analisar com IA <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
