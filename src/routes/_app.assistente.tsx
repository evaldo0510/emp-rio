import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/assistente")({
  head: () => ({ meta: [{ title: "Licuri Inteligência — Assistente do Empório" }] }),
  component: AssistentePage,
});

type Msg = { role: "user" | "ai"; text: string; products?: { name: string; price: string; emoji: string }[] };

const suggestions = [
  "Quero produtos para energia",
  "Quero presentes naturais",
  "Quero conhecer produtos do sertão",
  "Cosméticos com licuri",
];

const mockReplies: Record<string, Msg> = {
  energia: {
    role: "ai",
    text:
      "Encontrei ótimas opções para energia e disposição, todas com licuri e ingredientes do sertão:",
    products: [
      { name: "Sertão Energy Caps", price: "R$ 89,90", emoji: "💊" },
      { name: "Castanha de Licuri Torrada", price: "R$ 28,00", emoji: "🥜" },
      { name: "Mel com Própolis", price: "R$ 52,00", emoji: "🍯" },
    ],
  },
  presente: {
    role: "ai",
    text: "Que tal um kit artesanal com produtos do sertão? Selecionei estas joias:",
    products: [
      { name: "Kit Bem-Estar Licuri", price: "R$ 149,00", emoji: "🎁" },
      { name: "Sabonete Artesanal de Licuri", price: "R$ 18,00", emoji: "🧼" },
    ],
  },
  sertao: {
    role: "ai",
    text:
      "O sertão da Bahia tem riquezas únicas. Aqui estão produtos das nossas cooperativas parceiras:",
    products: [
      { name: "Óleo de Licuri 100ml", price: "R$ 49,90", emoji: "🫒" },
      { name: "Farinha de Licuri 500g", price: "R$ 24,00", emoji: "🌾" },
      { name: "Doce de Umbu", price: "R$ 19,00", emoji: "🍮" },
    ],
  },
  cosmetico: {
    role: "ai",
    text: "Nossa linha de cosméticos naturais é feita por mulheres do semiárido:",
    products: [
      { name: "Hidratante Corporal Licuri", price: "R$ 68,00", emoji: "🧴" },
      { name: "Máscara Capilar de Licuri", price: "R$ 54,00", emoji: "💆" },
    ],
  },
};

function matchReply(q: string): Msg {
  const lower = q.toLowerCase();
  if (lower.includes("energ") || lower.includes("dispos")) return mockReplies.energia;
  if (lower.includes("presente") || lower.includes("kit")) return mockReplies.presente;
  if (lower.includes("sertão") || lower.includes("sertao") || lower.includes("conhec"))
    return mockReplies.sertao;
  if (lower.includes("cosmetic") || lower.includes("cosmét") || lower.includes("pele") || lower.includes("cabelo"))
    return mockReplies.cosmetico;
  return {
    role: "ai",
    text:
      "Posso te ajudar a encontrar produtos naturais, presentes ou histórias de produtores do sertão. Me conta o que está procurando?",
  };
}

function AssistentePage() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "ai",
      text:
        "Olá! Sou a Licuri Inteligência, sua assistente do Empório. Posso te recomendar produtos, contar histórias dos produtores e te ajudar a comprar. O que você procura hoje?",
    },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  const send = (text: string) => {
    if (!text.trim()) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setThinking(true);
    setTimeout(() => {
      setMessages((m) => [...m, matchReply(text)]);
      setThinking(false);
    }, 900);
  };

  return (
    <div className="container-narrow py-10">
      <header className="mb-6 flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--clay)] text-[var(--clay-foreground)]">
          <Sparkles className="h-6 w-6" />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
            Assistente do Empório
          </p>
          <h1 className="font-display text-3xl font-semibold text-[var(--coffee)]">
            Licuri Inteligência
          </h1>
        </div>
      </header>

      <div className="rounded-3xl border border-[var(--border)] bg-white shadow-soft">
        <div ref={scrollRef} className="max-h-[60vh] min-h-[400px] space-y-4 overflow-y-auto p-6">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  m.role === "user"
                    ? "bg-[var(--clay)] text-[var(--clay-foreground)]"
                    : "bg-[var(--cream)] text-[var(--coffee)]"
                }`}
              >
                {m.role === "ai" && (
                  <div className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[var(--clay)]">
                    <Leaf className="h-3 w-3" /> Licuri IA
                  </div>
                )}
                <p className="text-sm leading-relaxed">{m.text}</p>
                {m.products && (
                  <div className="mt-3 space-y-2">
                    {m.products.map((p) => (
                      <div
                        key={p.name}
                        className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{p.emoji}</span>
                          <span className="text-sm font-medium text-[var(--coffee)]">{p.name}</span>
                        </div>
                        <span className="text-sm font-semibold text-[var(--clay)]">{p.price}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {thinking && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-[var(--cream)] px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--clay)]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--clay)] [animation-delay:0.15s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--clay)] [animation-delay:0.3s]" />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-[var(--border)] p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-full border border-[var(--border)] bg-[var(--cream)] px-3 py-1 text-xs text-[var(--coffee)] hover:border-[var(--clay)] hover:text-[var(--clay)]"
              >
                {s}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--cream)] px-4 py-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pergunte qualquer coisa sobre produtos do sertão..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--muted-foreground)]"
            />
            <Button type="submit" variant="hero" size="sm" disabled={!input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
