import { createFileRoute } from "@tanstack/react-router";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const InputSchema = z.object({
  kind: z.enum(["image", "pdf"]),
  // data URL "data:<mime>;base64,..." OR https URL
  source: z.string().min(20),
  mime: z.string().optional(),
});

const ProductSchema = z.object({
  name: z.string(),
  price: z.number().nullable(),
  category: z.string(),
  description: z.string(),
  suggested_stock: z.number().int().min(0).default(10),
});

const OutputSchema = z.object({
  products: z.array(ProductSchema).max(20),
});

export const Route = createFileRoute("/api/extract-products")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        let body: z.infer<typeof InputSchema>;
        try {
          body = InputSchema.parse(await request.json());
        } catch (e: any) {
          return Response.json({ error: "Invalid input", detail: e?.message }, { status: 400 });
        }

        const gateway = createLovableAiGatewayProvider(key);

        const contentBlocks: any[] = [
          {
            type: "text",
            text: `Analise o material enviado (foto de produto, vitrine, prateleira, catálogo, cardápio ou tabela de preços) e extraia até 20 produtos para um marketplace de artesanato e produtos naturais do sertão brasileiro.

Para cada produto retorne:
- name: nome curto e claro em português (máx 60 chars)
- price: preço em REAIS como número (ex: 49.90). Se não houver preço, retorne null.
- category: uma das categorias: "alimentos", "cosméticos", "artesanato", "bebidas", "saúde", "outros".
- description: 1-2 frases vendedoras, naturais, sem clichês de IA, mencionando origem/sertão quando fizer sentido.
- suggested_stock: 10 por padrão.

Se for uma única foto de um produto único, retorne apenas 1 item. Não invente produtos.`,
          },
        ];

        if (body.kind === "image") {
          contentBlocks.push({ type: "image_url", image_url: { url: body.source } });
        } else {
          contentBlocks.push({
            type: "file",
            file: {
              filename: "catalog.pdf",
              file_data: body.source.startsWith("data:")
                ? body.source
                : `data:${body.mime || "application/pdf"};base64,${body.source}`,
            },
          });
        }

        try {
          const { output } = await generateText({
            model: gateway("google/gemini-3-flash-preview"),
            output: Output.object({ schema: OutputSchema }),
            messages: [{ role: "user", content: contentBlocks }],
          });
          return Response.json(output);
        } catch (e: any) {
          console.error("[extract-products] erro:", e);
          return Response.json(
            { error: "AI extraction failed", detail: e?.message ?? String(e) },
            { status: 500 },
          );
        }
      },
    },
  },
});
