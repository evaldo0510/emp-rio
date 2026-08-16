import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Loader2, Sparkles, Send, AlertCircle, RefreshCw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/vendedor/importar/processando")({
  head: () => ({ meta: [{ title: "Processando com IA — Empório do Licuri" }] }),
  component: ProcessingPage,
});

const STEP_LABELS = [
  "Encontrando produtos",
  "Lendo conteúdo",
  "Criando descrições",
  "Organizando categorias",
  "Salvando rascunhos",
];

type ApiPayload =
  | { kind: "image" | "pdf"; source: string; mime?: string; fileName?: string }
  | { kind: "url"; url: string };

type ExtractedProduct = {
  name: string;
  price: number | null;
  category: string;
  description: string;
  suggested_stock: number;
  image_url?: string | null;
  source_url?: string;
};

type DraftRow = {
  id: string; // products.id
  name: string;
  price: number;
  category: string;
  description: string;
  stock_quantity: number;
  image_url: string | null;
  published: boolean;
  saving?: boolean;
  regenerating?: boolean;
};

const CATEGORIES = ["alimentos", "cosméticos", "artesanato", "bebidas", "saúde", "outros"];

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function ProcessingPage() {
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);
  const [drafts, setDrafts] = useState<DraftRow[] | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [jobLog, setJobLog] = useState<{ at: string; step: string }[]>([]);
  const startedRef = useRef(false);
  const regenInputRef = useRef<HTMLInputElement>(null);
  const regenTargetRef = useRef<string | null>(null);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void runPipeline();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function appendLog(currentJobId: string, step: string) {
    const entry = { at: new Date().toISOString(), step };
    setJobLog((l) => [...l, entry]);
    const { data: row } = await supabase
      .from("ai_extraction_jobs")
      .select("steps_log")
      .eq("id", currentJobId)
      .maybeSingle();
    const prev = Array.isArray(row?.steps_log) ? (row!.steps_log as unknown as object[]) : [];
    await supabase
      .from("ai_extraction_jobs")
      .update({ current_step: step, steps_log: [...prev, entry] as never })
      .eq("id", currentJobId);
  }

  async function runPipeline() {
    const payloadRaw = sessionStorage.getItem("licuri:import-payload");
    if (!payloadRaw) {
      setError("Nenhum arquivo recebido. Volte e selecione novamente.");
      return;
    }
    const payload = JSON.parse(payloadRaw) as ApiPayload;
    sessionStorage.removeItem("licuri:import-payload");

    // Auth + vendedor
    const { data: userResp } = await supabase.auth.getUser();
    const user = userResp.user;
    if (!user) {
      setError("Faça login como vendedor para usar a importação por IA.");
      return;
    }
    const { data: seller } = await supabase
      .from("sellers")
      .select("store_name, approved")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!seller) {
      setError("Cadastre sua loja antes de importar produtos.");
      return;
    }

    // Cria job
    const sourceKind = payload.kind === "url" ? "url" : payload.kind;
    const sourceMeta =
      payload.kind === "url"
        ? { url: payload.url }
        : { fileName: payload.fileName, mime: payload.mime };
    const { data: job, error: jobErr } = await supabase
      .from("ai_extraction_jobs")
      .insert({
        seller_id: user.id,
        source_kind: sourceKind,
        source_meta: sourceMeta,
        status: "running",
        current_step: STEP_LABELS[0],
      })
      .select("id")
      .single();
    if (jobErr || !job) {
      setError("Não foi possível registrar o job: " + (jobErr?.message ?? "desconhecido"));
      return;
    }
    setJobId(job.id);
    await appendLog(job.id, STEP_LABELS[0]);

    // Animação de etapas
    const stepTimer = setInterval(() => {
      setStepIndex((i) => {
        const next = Math.min(i + 1, STEP_LABELS.length - 2);
        if (next !== i) void appendLog(job.id, STEP_LABELS[next]);
        return next;
      });
    }, 1800);

    try {
      const endpoint = payload.kind === "url" ? "/api/extract-from-url" : "/api/extract-products";
      const body =
        payload.kind === "url"
          ? { url: payload.url }
          : { kind: payload.kind, source: payload.source, mime: payload.mime };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as {
        products?: ExtractedProduct[];
        error?: string;
        detail?: string;
      };
      if (!res.ok) throw new Error(data.detail || data.error || `HTTP ${res.status}`);

      const products = Array.isArray(data.products) ? data.products : [];
      clearInterval(stepTimer);
      setStepIndex(STEP_LABELS.length - 1);
      await appendLog(job.id, STEP_LABELS[STEP_LABELS.length - 1]);

      // Insere rascunhos no banco
      const rows = [] as DraftRow[];
      for (const p of products) {
        const baseSlug = slugify(p.name || "rascunho");
        const slug = `${baseSlug || "produto"}-${Math.random().toString(36).slice(2, 6)}`;
        const insertRow = {
          name: p.name?.slice(0, 80) || "Produto sem nome",
          slug,
          price: p.price ?? 0,
          category: (p.category || "outros").toLowerCase(),
          short_description: (p.description ?? "").slice(0, 160),
          description: p.description ?? "",
          shop: seller.store_name,
          region: "Bahia",
          stock_quantity: p.suggested_stock ?? 10,
          image_url: p.image_url ?? null,
          seller_id: user.id,
          active: false,
          is_draft: true,
          ai_job_id: job.id,
        };
        const { data: prod, error: pErr } = await supabase
          .from("products")
          .insert(insertRow)
          .select("id, name, price, category, description, stock_quantity, image_url")
          .single();
        if (pErr || !prod) {
          console.error("[draft insert]", pErr);
          continue;
        }
        rows.push({
          id: prod.id,
          name: prod.name,
          price: Number(prod.price),
          category: prod.category,
          description: prod.description ?? "",
          stock_quantity: prod.stock_quantity ?? 10,
          image_url: prod.image_url,
          published: false,
        });
      }
      setDrafts(rows);

      await supabase
        .from("ai_extraction_jobs")
        .update({
          status: "done",
          current_step: "Concluído",
          result: { products } as never,
        })
        .eq("id", job.id);
      setStepIndex(STEP_LABELS.length);
    } catch (e) {
      clearInterval(stepTimer);
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      await supabase
        .from("ai_extraction_jobs")
        .update({ status: "failed", current_step: "Falhou", error_message: msg })
        .eq("id", job.id);
    }
  }

  const patch = (id: string, fn: (d: DraftRow) => DraftRow) => {
    setDrafts((rows) => (rows ? rows.map((r) => (r.id === id ? fn(r) : r)) : rows));
  };

  async function saveDraft(d: DraftRow) {
    patch(d.id, (x) => ({ ...x, saving: true }));
    const { error: err } = await supabase
      .from("products")
      .update({
        name: d.name,
        price: d.price,
        category: d.category,
        description: d.description,
        short_description: d.description.slice(0, 160),
        stock_quantity: d.stock_quantity,
        image_url: d.image_url,
      })
      .eq("id", d.id);
    patch(d.id, (x) => ({ ...x, saving: false }));
    if (err) toast.error("Erro ao salvar: " + err.message);
    else toast.success("Rascunho salvo");
  }

  async function publish(d: DraftRow) {
    if (!d.name.trim()) {
      toast.error("Dê um nome ao produto antes de publicar.");
      return;
    }
    if (d.price <= 0) {
      toast.error("Defina um preço maior que zero.");
      return;
    }
    patch(d.id, (x) => ({ ...x, saving: true }));
    const { error: err } = await supabase
      .from("products")
      .update({
        name: d.name,
        price: d.price,
        category: d.category,
        description: d.description,
        short_description: d.description.slice(0, 160),
        stock_quantity: d.stock_quantity,
        image_url: d.image_url,
        is_draft: false,
        active: true,
      })
      .eq("id", d.id);
    patch(d.id, (x) => ({ ...x, saving: false, published: !err }));
    if (err) toast.error("Erro ao publicar: " + err.message);
    else toast.success(`"${d.name}" publicado!`);
  }

  function startRegen(id: string) {
    regenTargetRef.current = id;
    regenInputRef.current?.click();
  }

  async function onRegenFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    const targetId = regenTargetRef.current;
    regenTargetRef.current = null;
    if (!file || !targetId) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Limite 8MB.");
      return;
    }
    patch(targetId, (x) => ({ ...x, regenerating: true }));
    const { data: userResp } = await supabase.auth.getUser();
    const userId = userResp.user?.id;

    // Cria novo job de regen ligado ao produto
    let regenJobId: string | null = null;
    if (userId) {
      const { data: rJob } = await supabase
        .from("ai_extraction_jobs")
        .insert({
          seller_id: userId,
          source_kind: "image",
          source_meta: { fileName: file.name, mime: file.type, regen_for: targetId },
          status: "running",
          current_step: "Regenerando produto",
          product_id: targetId,
        })
        .select("id")
        .single();
      regenJobId = rJob?.id ?? null;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      const res = await fetch("/api/extract-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "image", source: dataUrl, mime: file.type, single: true }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        products?: ExtractedProduct[];
        error?: string;
        detail?: string;
      };
      if (!res.ok) throw new Error(data.detail || data.error || `HTTP ${res.status}`);
      const p = data.products?.[0];
      if (!p) throw new Error("A IA não identificou nenhum produto na nova foto.");

      // Update existente (NÃO insere outro registro)
      const { error: uErr } = await supabase
        .from("products")
        .update({
          name: p.name?.slice(0, 80) || "Produto sem nome",
          price: p.price ?? 0,
          category: (p.category || "outros").toLowerCase(),
          description: p.description ?? "",
          short_description: (p.description ?? "").slice(0, 160),
          stock_quantity: p.suggested_stock ?? 10,
        })
        .eq("id", targetId);
      if (uErr) throw uErr;

      patch(targetId, (x) => ({
        ...x,
        name: p.name?.slice(0, 80) || x.name,
        price: p.price ?? x.price,
        category: (p.category || x.category).toLowerCase(),
        description: p.description ?? x.description,
        stock_quantity: p.suggested_stock ?? x.stock_quantity,
      }));
      toast.success("Produto atualizado pela IA");

      if (regenJobId) {
        await supabase
          .from("ai_extraction_jobs")
          .update({ status: "done", current_step: "Concluído", result: { products: [p] } as never })
          .eq("id", regenJobId);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error("Falha na regeneração: " + msg);
      if (regenJobId) {
        await supabase
          .from("ai_extraction_jobs")
          .update({ status: "failed", error_message: msg })
          .eq("id", regenJobId);
      }
    } finally {
      patch(targetId, (x) => ({ ...x, regenerating: false }));
    }
  }

  const done = drafts !== null;
  const totalSteps = STEP_LABELS.length;
  const lastLog = useMemo(() => jobLog.slice(-5).reverse(), [jobLog]);

  return (
    <div className="container-narrow py-10">
      <input
        ref={regenInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onRegenFile}
      />
      <header className="mb-8">
        <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
          Licuri Inteligência {jobId ? `· job ${jobId.slice(0, 8)}` : ""}
        </p>
        <h1 className="font-display text-3xl font-semibold text-[var(--coffee)]">
          {error
            ? "Não foi possível concluir"
            : done
              ? "Rascunhos prontos para revisão"
              : "Analisando seu material..."}
        </h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Os itens abaixo foram salvos como <strong>rascunho</strong> — ninguém vê até você clicar
          em <em>Publicar</em>.
        </p>
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

      <div className="grid gap-8 lg:grid-cols-[1fr_1.6fr]">
        <aside className="space-y-4">
          <div className="rounded-2xl border border-[var(--clay)]/20 bg-[var(--sand)]/10 p-6">
            <div className="mb-4 flex items-center gap-2 text-[var(--clay)]">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-widest">Etapas</span>
            </div>
            <ul className="space-y-2.5">
              {STEP_LABELS.map((s, i) => {
                const completed = i < stepIndex || done;
                const active = i === stepIndex && !done && !error;
                return (
                  <li
                    key={s}
                    className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all ${
                      completed
                        ? "border-[var(--leaf)]/30 bg-[var(--leaf)]/5"
                        : active
                          ? "border-[var(--clay)]/40 bg-white"
                          : "border-[var(--border)] bg-white/60 opacity-60"
                    }`}
                  >
                    <span
                      className={`grid h-6 w-6 place-items-center rounded-full text-[10px] ${
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
                        i + 1
                      )}
                    </span>
                    <span className="text-sm text-[var(--coffee)]">{s}</span>
                  </li>
                );
              })}
            </ul>
            <div className="mt-3 text-[10px] uppercase tracking-widest text-[var(--muted-foreground)]">
              {stepIndex + (done ? 1 : 0)} de {totalSteps}
            </div>
          </div>

          {lastLog.length > 0 && (
            <div className="rounded-2xl border border-[var(--border)] bg-white p-4 text-xs text-[var(--muted-foreground)]">
              <p className="mb-2 font-bold uppercase tracking-widest text-[var(--coffee)]">
                Log do job
              </p>
              <ul className="space-y-1 font-mono">
                {lastLog.map((l, i) => (
                  <li key={i}>
                    <span className="text-[var(--clay)]">
                      {new Date(l.at).toLocaleTimeString("pt-BR")}
                    </span>{" "}
                    {l.step}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>

        <div className="space-y-3">
          {!done && !error && (
            <div className="rounded-2xl border border-dashed border-[var(--clay)]/30 bg-white p-10 text-center">
              <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-[var(--clay)]" />
              <p className="text-sm text-[var(--muted-foreground)]">
                A IA está analisando seu material. Isso leva entre 10 e 30 segundos...
              </p>
            </div>
          )}

          {done && drafts!.length === 0 && (
            <div className="rounded-2xl border border-[var(--border)] bg-white p-10 text-center text-sm text-[var(--muted-foreground)]">
              Nenhum produto identificado. Tente uma foto mais nítida, outro PDF ou outra URL.
            </div>
          )}

          {done &&
            drafts!.map((d) => (
              <article
                key={d.id}
                className={`rounded-2xl border bg-white p-5 transition-all ${
                  d.published
                    ? "border-[var(--leaf)]/40 bg-[var(--leaf)]/5"
                    : "border-[var(--border)]"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-[var(--cream)] text-2xl">
                    {d.image_url ? (
                      <img
                        src={d.image_url}
                        alt={d.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      "🌿"
                    )}
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-[var(--muted-foreground)]">
                          Nome
                        </label>
                        <Input
                          value={d.name}
                          onChange={(e) => patch(d.id, (x) => ({ ...x, name: e.target.value }))}
                          disabled={d.published}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-[var(--muted-foreground)]">
                          Preço (R$)
                        </label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={d.price}
                          onChange={(e) =>
                            patch(d.id, (x) => ({ ...x, price: Number(e.target.value) || 0 }))
                          }
                          disabled={d.published}
                        />
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-[var(--muted-foreground)]">
                          Categoria
                        </label>
                        <select
                          value={d.category}
                          onChange={(e) =>
                            patch(d.id, (x) => ({ ...x, category: e.target.value }))
                          }
                          disabled={d.published}
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-[var(--muted-foreground)]">
                          Estoque
                        </label>
                        <Input
                          type="number"
                          min="0"
                          value={d.stock_quantity}
                          onChange={(e) =>
                            patch(d.id, (x) => ({
                              ...x,
                              stock_quantity: Math.max(0, Number(e.target.value) || 0),
                            }))
                          }
                          disabled={d.published}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-[var(--muted-foreground)]">
                        Descrição
                      </label>
                      <Textarea
                        rows={3}
                        value={d.description}
                        onChange={(e) =>
                          patch(d.id, (x) => ({ ...x, description: e.target.value }))
                        }
                        disabled={d.published}
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {d.published ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--leaf)]/15 px-3 py-1 text-xs font-medium text-[var(--leaf)]">
                          <Check className="h-3 w-3" /> Publicado
                        </span>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!!d.saving || !!d.regenerating}
                            onClick={() => saveDraft(d)}
                          >
                            {d.saving ? (
                              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Save className="mr-1.5 h-3.5 w-3.5" />
                            )}
                            Salvar rascunho
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!!d.regenerating || !!d.saving}
                            onClick={() => startRegen(d.id)}
                          >
                            {d.regenerating ? (
                              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                            )}
                            Regenerar com IA
                          </Button>
                          <Button
                            size="sm"
                            variant="hero"
                            disabled={!!d.saving || !!d.regenerating}
                            onClick={() => publish(d)}
                          >
                            <Send className="mr-1.5 h-3.5 w-3.5" />
                            Publicar
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))}

          {done && (
            <div className="flex items-center justify-between pt-4">
              <Link
                to="/vendedor/importar"
                className="text-sm text-[var(--muted-foreground)] hover:text-[var(--clay)]"
              >
                ← Importar outro lote
              </Link>
              <Button variant="hero" onClick={() => navigate({ to: "/vendedor" })}>
                Voltar ao painel
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
