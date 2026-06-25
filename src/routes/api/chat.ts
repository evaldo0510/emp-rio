import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createClient } from "@supabase/supabase-js";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as { messages?: UIMessage[] };
        if (!Array.isArray(messages)) return new Response("Messages required", { status: 400 });

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        // Carregar snapshot do catálogo (produtos ativos de vendedores aprovados)
        let catalogContext = "Catálogo indisponível no momento.";
        try {
          const sb = createClient(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_PUBLISHABLE_KEY!,
            { auth: { persistSession: false, autoRefreshToken: false } },
          );
          const { data: products } = await sb
            .from("products")
            .select("name, price, category, shop, short_description, region")
            .eq("active", true)
            .limit(40);

          if (products && products.length) {
            catalogContext = products
              .map(
                (p: any, i: number) =>
                  `${i + 1}. ${p.name} — R$ ${Number(p.price).toFixed(2)} — ${p.category} — Loja: ${p.shop || "–"} — Região: ${p.region || "–"}${p.short_description ? ` — ${p.short_description}` : ""}`,
              )
              .join("\n");
          }
        } catch (e) {
          console.error("[chat] erro ao carregar catálogo:", e);
        }

        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway("google/gemini-3-flash-preview"),
          system: `Você é a Licuri Inteligência, assistente do Empório do Licuri — marketplace de produtos do sertão brasileiro feitos por famílias, associações e cooperativas.

Responda em português do Brasil, com tom acolhedor e direto, em no máximo 4 parágrafos curtos. Use markdown leve quando ajudar (negrito, listas).

Quando o usuário buscar produtos, recomende exclusivamente itens do catálogo abaixo (não invente). Cite nome, preço e loja. Se nada combinar, diga isso com honestidade e sugira categorias próximas.

Catálogo atual (${catalogContext.split("\n").length} produtos):
${catalogContext}`,
          messages: await convertToModelMessages(messages),
        });

        return result.toUIMessageStreamResponse({ originalMessages: messages });
      },
    },
  },
});
