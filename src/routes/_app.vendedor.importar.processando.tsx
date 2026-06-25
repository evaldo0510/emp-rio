import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Check, Loader2, Sparkles, Edit2, Send, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/vendedor/importar/processando")({
  head: () => ({ meta: [{ title: "Processando com IA — Licuri Hub" }] }),
  component: ProcessingPage,
});

const steps = [
  "Encontrando produtos",
  "Melhorando imagens",
  "Criando descrições",
  "Organizando categorias",
  "Montando sua vitrine",
];

type ExtractedProduct = {
  name: string;
  price: number | null;
  category: string;
  description: string;
  suggested_stock: number;
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

function ProcessingPage() {
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);
  const [products, setProducts] = useState<ExtractedProduct[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [published, setPublished] = useState<Record<number, "saving" | "ok" | "error">>({});
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const payloadRaw = sessionStorage.getItem("licuri:import-payload");
    if (!payloadRaw) {
      setError("Nenhum arquivo recebido. Volte e selecione novamente.");
      return;
    }
    const payload = JSON.parse(payloadRaw);

    // Progresso visual: avança até a penúltima etapa enquanto IA roda
    const stepTimer = setInterval(() => {
      setStepIndex((i) => (i < steps.length - 1 ? i + 1 : i));
    }, 1500);

    (async () => {
      try {
        const res = await fetch("/api/extract-products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `HTTP ${res.status}`);
        }
        const data = await res.json();
        clearInterval(stepTimer);
        setStepIndex(steps.length);
        setProducts(Array.isArray(data?.products) ? data.products : []);
        sessionStorage.removeItem("licuri:import-payload");
      } catch (e: any) {
        clearInterval(stepTimer);
        setError(e?.message ?? "Falha ao analisar o material.");
      }
    })();

    return () => clearInterval(stepTimer);
  }, []);

  const publishOne = async (idx: number, p: ExtractedProduct) => {
    setPublished((s) => ({ ...s, [idx]: "saving" }));
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Faça login como vendedor para publicar.");

      // Vendedor (busca dados da loja)
      const { data: seller } = await supabase
        .from("sellers")
        .select("store_name, approved")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!seller) throw new Error("Cadastre sua loja antes de publicar produtos.");

      const slug = `${slugify(p.name)}-${Math.random().toString(36).slice(2, 6)}`;
      const { error } = await supabase.from("products").insert([
        {
          name: p.name,
          slug,
          price: p.price ?? 0,
          category: (p.category || "outros").toLowerCase(),
          short_description: p.description?.slice(0, 160) ?? "",
          description: p.description ?? "",
          shop: seller.store_name,
          region: "Bahia",
          stock_quantity: p.suggested_stock ?? 10,
          seller_id: user.id,
          active: true,
        },
      ]);
      if (error) throw error;
      setPublished((s) => ({ ...s, [idx]: "ok" }));
      toast.success(`"${p.name}" publicado!`);
    } catch (e: any) {
      setPublished((s) => ({ ...s, [idx]: "error" }));
      toast.error(e?.message ?? "Erro ao publicar");
    }
  };

  const done = products !== null;

  return (
    <div className="container-narrow py-10">
      <header className="mb-8">
        <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
          Licuri Inteligência
        </p>
        <h1 className="font-display text-3xl font-semibold text-[var(--coffee)]">
          {error
            ? "Não foi possível analisar"
            : done
              ? "Catálogo pronto para revisão"
              : "Analisando seu catálogo..."}
        </h1>
      </header>

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="flex-1">
            <p className="font-medium">Erro</p>
            <p className="mt-1 text-red-700">{error}</p>
            <Link
              to="/vendedor/importar"
              className="mt-3 inline-block text-red-900 underline underline-offset-2"
            >
              Tentar novamente
            </Link>
          </div>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
        <div className="rounded-2xl border border-[var(--clay)]/20 bg-[var(--sand)]/10 p-6">
          <div className="mb-4 flex items-center gap-2 text-[var(--clay)]">
            <Sparkles className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Etapas</span>
          </div>
          <ul className="space-y-3">
            {steps.map((s, i) => {
              const completed = i < stepIndex;
              const active = i === stepIndex && !done && !error;
              return (
                <li
                  key={s}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all ${
                    completed
                      ? "border-[var(--leaf)]/30 bg-[var(--leaf)]/5"
                      : active
                        ? "border-[var(--clay)]/40 bg-white"
                        : "border-[var(--border)] bg-white/60 opacity-60"
                  }`}
                >
                  <span
                    className={`grid h-6 w-6 place-items-center rounded-full ${
                      completed
                        ? "bg-[var(--leaf)] text-white"
                        : active
                          ? "bg-[var(--clay)] text-white"
                          : "bg-[var(--cream)] text-[var(--muted-foreground)]"
                    }`}
                  >
                    {completed ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : active ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <span className="text-[10px]">{i + 1}</span>
                    )}
                  </span>
                  <span className="text-sm text-[var(--coffee)]">{s}</span>
                </li>
              );
            })}
          </ul>

          {done && !error && (
            <div className="mt-6 rounded-xl bg-[var(--leaf)]/10 px-4 py-3 text-sm text-[var(--coffee)]">
              ✨ Encontramos <strong>{products!.length} produto(s)</strong>. Revise e publique.
            </div>
          )}
        </div>

        <div className="space-y-3">
          {!done && !error && (
            <div className="rounded-2xl border border-dashed border-[var(--clay)]/30 bg-white p-10 text-center">
              <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-[var(--clay)]" />
              <p className="text-sm text-[var(--muted-foreground)]">
                A IA está analisando seu material. Isso leva entre 10 e 30 segundos...
              </p>
            </div>
          )}

          {done && products!.length === 0 && (
            <div className="rounded-2xl border border-[var(--border)] bg-white p-10 text-center text-sm text-[var(--muted-foreground)]">
              Nenhum produto identificado. Tente uma foto mais nítida ou um PDF com tabela legível.
            </div>
          )}

          {done &&
            products!.map((p, i) => {
              const state = published[i];
              return (
                <article
                  key={i}
                  className={`flex items-start gap-4 rounded-2xl border bg-white p-5 transition-all ${
                    state === "ok"
                      ? "border-[var(--leaf)]/40 bg-[var(--leaf)]/5"
                      : "border-[var(--border)]"
                  }`}
                >
                  <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-[var(--cream)] text-2xl">
                    🌿
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-[var(--muted-foreground)]">
                          {p.category}
                        </p>
                        <h3 className="font-display text-lg font-semibold text-[var(--coffee)]">
                          {p.name}
                        </h3>
                      </div>
                      <span className="font-display text-base font-semibold text-[var(--clay)]">
                        {p.price != null
                          ? `R$ ${p.price.toFixed(2).replace(".", ",")}`
                          : "a definir"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-[var(--muted-foreground)]">{p.description}</p>
                    <div className="mt-4 flex items-center gap-2">
                      {state === "ok" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--leaf)]/15 px-3 py-1 text-xs font-medium text-[var(--leaf)]">
                          <Check className="h-3 w-3" /> Publicado
                        </span>
                      ) : (
                        <>
                          <Button size="sm" variant="outline" disabled>
                            <Edit2 className="mr-1.5 h-3.5 w-3.5" /> Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="hero"
                            disabled={state === "saving"}
                            onClick={() => publishOne(i, p)}
                          >
                            {state === "saving" ? (
                              <>
                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Publicando
                              </>
                            ) : (
                              <>
                                <Send className="mr-1.5 h-3.5 w-3.5" /> Publicar
                              </>
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}

          {done && (
            <div className="flex items-center justify-between pt-4">
              <Link
                to="/vendedor/importar"
                className="text-sm text-[var(--muted-foreground)] hover:text-[var(--clay)]"
              >
                ← Importar outro lote
              </Link>
              <Button variant="hero" onClick={() => navigate({ to: "/vendedor" })}>
                Concluir
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
