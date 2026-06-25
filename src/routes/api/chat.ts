import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createClient } from "@supabase/supabase-js";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const STOPWORDS = new Set([
  "a","o","as","os","de","do","da","dos","das","um","uma","uns","umas",
  "e","ou","para","pra","por","com","sem","no","na","nos","nas","em",
  "que","qual","quais","quero","queria","preciso","tem","ter","você","voce",
  "me","meu","minha","tenho","sou","ser","mais","menos","muito","pouco",
  "produto","produtos","item","itens","sugira","sugere","sugestao","sugestão",
  "indica","indique","recomende","recomenda","mostrar","mostra","ver","achar",
  "encontrar","gostaria","gosta","oi","ola","olá","bom","boa","dia","tarde","noite",
]);

function extractKeywords(text: string): string[] {
  const tokens = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t));
  // dedup, mantém ordem
  return Array.from(new Set(tokens)).slice(0, 8);
}

type CatalogRow = {
  name: string;
  price: number | string;
  category: string | null;
  shop: string | null;
  short_description: string | null;
  region: string | null;
};

function formatCatalog(rows: CatalogRow[]): string {
  return rows
    .map(
      (p, i) =>
        `${i + 1}. ${p.name} — R$ ${Number(p.price).toFixed(2)} — ${p.category ?? "–"} — Loja: ${p.shop || "–"} — ${p.region || "–"}${p.short_description ? ` — ${p.short_description}` : ""}`,
    )
    .join("\n");
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as { messages?: UIMessage[] };
        if (!Array.isArray(messages)) return new Response("Messages required", { status: 400 });

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        // Última mensagem do usuário (para retrieval por palavras-chave)
        const lastUser = [...messages].reverse().find((m) => m.role === "user");
        const lastText = lastUser?.parts
          ?.map((p) => (p.type === "text" ? p.text : ""))
          .join(" ")
          .trim() ?? "";
        const keywords = extractKeywords(lastText);

        let catalogContext = "Catálogo indisponível no momento.";
        let totalCount = 0;
        const categoryCounts: Record<string, number> = {};

        try {
          const sb = createClient(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_PUBLISHABLE_KEY!,
            { auth: { persistSession: false, autoRefreshToken: false } },
          );

          // Agregados (categorias + total) — leve, uma query só
          const { data: agg } = await sb
            .from("products")
            .select("category")
            .eq("active", true)
            .eq("is_draft", false)
            .limit(2000);
          if (agg) {
            totalCount = agg.length;
            for (const r of agg) {
              const c = (r as { category: string | null }).category ?? "outros";
              categoryCounts[c] = (categoryCounts[c] ?? 0) + 1;
            }
          }

          // Busca relevante: ILIKE OR em nome/category/short_description quando houver keywords
          let query = sb
            .from("products")
            .select("name, price, category, shop, short_description, region")
            .eq("active", true)
            .eq("is_draft", false);

          if (keywords.length > 0) {
            const orExpr = keywords
              .flatMap((k) => [
                `name.ilike.%${k}%`,
                `category.ilike.%${k}%`,
                `short_description.ilike.%${k}%`,
                `region.ilike.%${k}%`,
              ])
              .join(",");
            query = query.or(orExpr);
          }

          const { data: relevant } = await query.limit(30);
          let rows = (relevant ?? []) as CatalogRow[];

          // Fallback: nenhum match → amostra geral de até 20
          if (rows.length === 0) {
            const { data: sample } = await sb
              .from("products")
              .select("name, price, category, shop, short_description, region")
              .eq("active", true)
              .eq("is_draft", false)
              .order("created_at", { ascending: false })
              .limit(20);
            rows = (sample ?? []) as CatalogRow[];
          }

          if (rows.length > 0) {
            catalogContext = formatCatalog(rows);
          } else {
            catalogContext = "(Sem produtos ativos publicados ainda.)";
          }
        } catch (e) {
          console.error("[chat] erro ao carregar catálogo:", e);
        }

        const categoriesSummary = Object.entries(categoryCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([c, n]) => `${c} (${n})`)
          .join(", ") || "–";

        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway("google/gemini-3-flash-preview"),
          system: `Você é a Licuri Inteligência, assistente do Empório do Licuri — marketplace de produtos do sertão brasileiro feitos por famílias, associações e cooperativas.

Responda em português do Brasil, com tom acolhedor e direto, em no máximo 4 parágrafos curtos. Use markdown leve quando ajudar (negrito, listas).

Quando o usuário buscar produtos, recomende exclusivamente itens da seleção abaixo (não invente nomes, preços ou lojas). Cite nome, preço e loja. Se nada combinar com o pedido, diga isso com honestidade e sugira categorias próximas a partir do panorama.

Panorama do catálogo: ${totalCount} produtos ativos. Categorias: ${categoriesSummary}.
Palavras-chave detectadas na pergunta: ${keywords.length ? keywords.join(", ") : "(nenhuma)"}.

Seleção relevante (${catalogContext.split("\n").length} itens):
${catalogContext}`,
          messages: await convertToModelMessages(messages),
        });

        return result.toUIMessageStreamResponse({ originalMessages: messages });
      },
    },
  },
});
