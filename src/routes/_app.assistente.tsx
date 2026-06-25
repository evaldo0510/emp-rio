import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Sparkles, Send, Leaf } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/assistente")({
  head: () => ({ meta: [{ title: "Licuri Inteligência — Assistente do Empório" }] }),
  component: AssistentePage,
});

const STORAGE_KEY = "licuri:chat:v1";
const suggestions = [
  "Quero produtos para energia e disposição",
  "Sugira presentes naturais até R$ 100",
  "Quais cosméticos vocês têm com licuri?",
  "Me conte sobre as cooperativas do sertão",
];

const initial: UIMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    parts: [
      {
        type: "text",
        text: "Olá! Sou a **Licuri Inteligência**, assistente do Empório. Posso te recomendar produtos do nosso catálogo, contar histórias dos produtores e ajudar você a escolher. O que procura hoje?",
      },
    ],
  },
];

function loadInitial(): UIMessage[] {
  if (typeof window === "undefined") return initial;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initial;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : initial;
  } catch {
    return initial;
  }
}

function renderMarkdown(text: string) {
  // Minimal: **bold** e quebras de linha
  const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const html = escaped
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br/>");
  return { __html: html };
}

function AssistentePage() {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [initialMessages] = useState<UIMessage[]>(loadInitial);

  const { messages, sendMessage, status, error } = useChat({
    id: "licuri-main",
    messages: initialMessages,
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      /* quota */
    }
  }, [messages]);

  useEffect(() => {
    if (!isLoading) inputRef.current?.focus();
  }, [isLoading]);

  const send = (text: string) => {
    const t = text.trim();
    if (!t || isLoading) return;
    sendMessage({ text: t });
    setInput("");
  };

  const reset = () => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  };

  return (
    <div className="container-narrow py-10">
      <header className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
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
        </div>
        <button
          onClick={reset}
          className="text-xs text-[var(--muted-foreground)] hover:text-[var(--clay)]"
        >
          Nova conversa
        </button>
      </header>

      <div className="rounded-3xl border border-[var(--border)] bg-white shadow-soft">
        <div ref={scrollRef} className="max-h-[60vh] min-h-[420px] space-y-4 overflow-y-auto p-6">
          {messages.map((m) => {
            const text = m.parts
              .map((p) => (p.type === "text" ? p.text : ""))
              .join("")
              .trim();
            if (!text) return null;
            return (
              <div
                key={m.id}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-3 ${
                    m.role === "user"
                      ? "bg-[var(--clay)] text-[var(--clay-foreground)]"
                      : "bg-[var(--cream)] text-[var(--coffee)]"
                  }`}
                >
                  {m.role === "assistant" && (
                    <div className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[var(--clay)]">
                      <Leaf className="h-3 w-3" /> Licuri IA
                    </div>
                  )}
                  <div
                    className="text-sm leading-relaxed [&_strong]:font-semibold"
                    dangerouslySetInnerHTML={renderMarkdown(text)}
                  />
                </div>
              </div>
            );
          })}
          {isLoading && (
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
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
              Não consegui responder agora. Tente novamente em alguns instantes.
            </div>
          )}
        </div>

        <div className="border-t border-[var(--border)] p-4">
          {messages.length <= 1 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  disabled={isLoading}
                  className="rounded-full border border-[var(--border)] bg-[var(--cream)] px-3 py-1 text-xs text-[var(--coffee)] hover:border-[var(--clay)] hover:text-[var(--clay)] disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--cream)] px-4 py-2"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pergunte sobre produtos do sertão, presentes, cosméticos..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--muted-foreground)]"
              disabled={isLoading}
            />
            <Button type="submit" variant="hero" size="sm" disabled={!input.trim() || isLoading}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
