import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const InputSchema = z.object({
  url: z.string().url(),
});

type Extracted = {
  name: string;
  price: number | null;
  category: string;
  description: string;
  suggested_stock: number;
  image_url?: string | null;
  source_url: string;
};

const ML_ITEM_RE = /\/(MLB|MLA|MLM|MLC|MCO|MLU|MPE|MLV)-?(\d{6,})/i;

function inferCategoryFromText(t: string): string {
  const s = t.toLowerCase();
  if (/(óleo|oleo|farinha|biscoito|doce|mel|tempero|café|cafe|cocada)/.test(s)) return "alimentos";
  if (/(creme|sabonete|shampoo|hidratante|cosm)/.test(s)) return "cosméticos";
  if (/(artesan|cesto|bolsa|peça|peca|crochê|croche|cer\u00e2mica|ceramica)/.test(s)) return "artesanato";
  if (/(licor|cachaça|cachaca|bebida|suco)/.test(s)) return "bebidas";
  if (/(rem\u00e9dio|remedio|fitoter|sa\u00fade|saude|natural)/.test(s)) return "saúde";
  return "outros";
}

async function extractFromMercadoLivre(url: string): Promise<Extracted> {
  const m = url.match(ML_ITEM_RE);
  if (!m) throw new Error("ID do anúncio do Mercado Livre não encontrado na URL.");
  const id = `${m[1].toUpperCase()}${m[2]}`;
  const res = await fetch(`https://api.mercadolibre.com/items/${id}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Mercado Livre respondeu ${res.status}`);
  const item = (await res.json()) as {
    title?: string;
    price?: number;
    pictures?: { url?: string; secure_url?: string }[];
    thumbnail?: string;
    category_id?: string;
    available_quantity?: number;
  };

  let description = "";
  try {
    const dRes = await fetch(`https://api.mercadolibre.com/items/${id}/description`);
    if (dRes.ok) {
      const d = (await dRes.json()) as { plain_text?: string };
      description = (d.plain_text ?? "").slice(0, 600);
    }
  } catch {/* ignore */}

  const name = item.title ?? "Produto importado";
  return {
    name: name.slice(0, 80),
    price: typeof item.price === "number" ? item.price : null,
    category: inferCategoryFromText(`${name} ${description}`),
    description: description || `${name} importado do Mercado Livre.`,
    suggested_stock: typeof item.available_quantity === "number" ? Math.min(item.available_quantity, 50) : 10,
    image_url:
      item.pictures?.[0]?.secure_url ?? item.pictures?.[0]?.url ?? item.thumbnail ?? null,
    source_url: url,
  };
}

function pickMeta(html: string, prop: string): string | null {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']+)["']`,
    "i",
  );
  const m = html.match(re);
  return m?.[1] ?? null;
}

function parsePrice(s: string | null): number | null {
  if (!s) return null;
  const cleaned = s.replace(/[^\d,.\-]/g, "").replace(/\.(?=\d{3}\b)/g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) && n > 0 ? n : null;
}

async function extractGeneric(url: string): Promise<Extracted> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; LicuriBot/1.0; +https://licurihub.com)",
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`Falha ao ler URL (${res.status})`);
  const html = (await res.text()).slice(0, 200_000);

  const title =
    pickMeta(html, "og:title") ??
    pickMeta(html, "twitter:title") ??
    html.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim() ??
    "Produto importado";
  const description =
    pickMeta(html, "og:description") ??
    pickMeta(html, "twitter:description") ??
    pickMeta(html, "description") ??
    "";
  const image =
    pickMeta(html, "og:image:secure_url") ??
    pickMeta(html, "og:image") ??
    pickMeta(html, "twitter:image") ??
    null;
  const priceMeta =
    pickMeta(html, "product:price:amount") ??
    pickMeta(html, "og:price:amount") ??
    pickMeta(html, "price");
  const price = parsePrice(priceMeta);

  return {
    name: title.slice(0, 80),
    price,
    category: inferCategoryFromText(`${title} ${description}`),
    description: description.slice(0, 400) || `${title} importado de ${new URL(url).hostname}.`,
    suggested_stock: 10,
    image_url: image,
    source_url: url,
  };
}

export const Route = createFileRoute("/api/extract-from-url")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: z.infer<typeof InputSchema>;
        try {
          body = InputSchema.parse(await request.json());
        } catch (e) {
          return Response.json(
            { error: "URL inválida", detail: e instanceof Error ? e.message : String(e) },
            { status: 400 },
          );
        }

        try {
          const host = new URL(body.url).hostname.toLowerCase();
          let product: Extracted;
          if (host.includes("mercadolivre.") || host.includes("mercadolibre.")) {
            product = await extractFromMercadoLivre(body.url);
          } else {
            // Shopee e demais: Open Graph genérico (Shopee normalmente bloqueia; aviso na descrição se vier vazio)
            product = await extractGeneric(body.url);
          }
          return Response.json({ products: [product] });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.error("[extract-from-url]", msg);
          return Response.json({ error: "Não foi possível ler o link", detail: msg }, { status: 422 });
        }
      },
    },
  },
});
