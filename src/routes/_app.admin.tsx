import { createFileRoute } from "@tanstack/react-router";
import { Users, Store, ShoppingBag, DollarSign, Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { formatBRL } from "@/lib/products";

export const Route = createFileRoute("/_app/admin")({
  head: () => ({ meta: [{ title: "Painel Admin — Licuri Hub" }] }),
  component: AdminPage,
});

const monthly = [
  300, 420, 380, 510, 470, 520, 600, 680, 720, 810, 760, 880,
];

const statuses = [
  { label: "Pago", value: 42, color: "var(--leaf)" },
  { label: "Enviado", value: 28, color: "var(--clay)" },
  { label: "Entregue", value: 22, color: "var(--coffee)" },
  { label: "Cancelado", value: 8, color: "var(--destructive)" },
];

function AdminPage() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateReport = () => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.text("Relatório Mensal - Licuri Hub", 14, 22);
      
      doc.setFontSize(12);
      doc.text(`Data de geração: ${new Date().toLocaleDateString()}`, 14, 30);
      
      doc.text("Resumo de Vendas", 14, 45);
      (doc as any).autoTable({
        startY: 50,
        head: [['Métrica', 'Valor']],
        body: [
          ['Vendas Totais', 'R$ 156.890,00'],
          ['Total de Pedidos', '2.345'],
          ['Ticket Médio', 'R$ 66,90'],
        ],
      });

      doc.text("Performance por Categoria", 14, (doc as any).lastAutoTable.finalY + 15);
      (doc as any).autoTable({
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [['Categoria', 'Vendas', 'Crescimento']],
        body: [
          ['Alimentos', 'R$ 45.200', '+12%'],
          ['Óleos', 'R$ 38.100', '+8%'],
          ['Cosméticos', 'R$ 29.400', '+15%'],
          ['Artesanato', 'R$ 12.800', '-2%'],
        ],
      });

      doc.save("relatorio-mensal-licuri.pdf");
    } finally {
      setIsGenerating(false);
    }
  };
  const total = statuses.reduce((a, s) => a + s.value, 0);
  let acc = 0;
  const arcs = statuses.map((s) => {
    const start = (acc / total) * 360;
    acc += s.value;
    const end = (acc / total) * 360;
    return { ...s, start, end };
  });

  const max = Math.max(...monthly);

  return (
    <div className="container-narrow py-10">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
            Painel admin
          </p>
          <h1 className="font-display text-3xl font-semibold text-[var(--coffee)]">Visão geral</h1>
        </div>
        <span className="rounded-full border border-[var(--border)] bg-[var(--cream)] px-3 py-1 text-xs">
          Licuri Hub · Admin
        </span>
        <Button variant="hero" size="sm" onClick={generateReport} disabled={isGenerating}>
          {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          Gerar Relatório PDF
        </Button>
      </header>

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <Stat icon={DollarSign} label="Vendas totais" value="R$ 156.890,00" />
        <Stat icon={ShoppingBag} label="Pedidos" value="2.345" />
        <Stat icon={Store} label="Vendedores" value="87" />
        <Stat icon={Users} label="Clientes" value="1.890" />
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-[1.7fr_1fr]">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="font-display text-lg font-semibold">Vendas (últimos 30 dias)</h2>
          <svg viewBox="0 0 600 200" className="mt-4 h-48 w-full">
            <polyline
              fill="none"
              stroke="var(--clay)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={monthly
                .map((v, i) => `${(i / (monthly.length - 1)) * 580 + 10},${190 - (v / max) * 170}`)
                .join(" ")}
            />
            <polygon
              fill="color-mix(in oklab, var(--clay) 18%, transparent)"
              points={
                monthly
                  .map((v, i) => `${(i / (monthly.length - 1)) * 580 + 10},${190 - (v / max) * 170}`)
                  .join(" ") + " 590,190 10,190"
              }
            />
          </svg>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="font-display text-lg font-semibold">Pedidos por status</h2>
          <div className="mt-4 flex items-center gap-6">
            <svg viewBox="0 0 100 100" className="h-32 w-32 -rotate-90">
              {arcs.map((a) => {
                const r = 40;
                const c = 2 * Math.PI * r;
                const len = ((a.end - a.start) / 360) * c;
                const offset = (a.start / 360) * c;
                return (
                  <circle
                    key={a.label}
                    cx="50"
                    cy="50"
                    r={r}
                    fill="transparent"
                    stroke={a.color}
                    strokeWidth="14"
                    strokeDasharray={`${len} ${c - len}`}
                    strokeDashoffset={-offset}
                  />
                );
              })}
            </svg>
            <ul className="space-y-2 text-sm">
              {statuses.map((s) => (
                <li key={s.label} className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: s.color }}
                  />
                  {s.label}
                  <span className="ml-1 text-[var(--muted-foreground)]">{s.value}%</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <p className="mt-10 text-xs text-[var(--muted-foreground)]">
        Dados de demonstração. Listagem real de vendedores, produtos e financeiro será ativada
        com a integração do banco de dados (Lovable Cloud).
      </p>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
          {label}
        </span>
        <Icon className="h-4 w-4 text-[var(--clay)]" />
      </div>
      <div className="mt-3 font-display text-2xl font-bold text-[var(--coffee)]">{value}</div>
    </div>
  );
}
