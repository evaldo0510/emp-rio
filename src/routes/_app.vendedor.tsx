import { createFileRoute } from "@tanstack/react-router";
import { Package, ShoppingBag, Star, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_app/vendedor")({
  head: () => ({ meta: [{ title: "Painel do Vendedor — Licuri Hub" }] }),
  component: VendorDashboard,
});

const sales = [
  { day: "13/05", v: 320 }, { day: "14/05", v: 410 },
  { day: "15/05", v: 360 }, { day: "16/05", v: 520 },
  { day: "17/05", v: 480 }, { day: "18/05", v: 610 }, { day: "19/05", v: 730 },
];

const orders = [
  { id: "#1245", date: "19/05/2024", value: "R$ 98,80", status: "Entregue" },
  { id: "#1244", date: "18/05/2024", value: "R$ 49,90", status: "Enviado" },
  { id: "#1243", date: "18/05/2024", value: "R$ 75,90", status: "Pago" },
  { id: "#1242", date: "17/05/2024", value: "R$ 159,90", status: "Pago" },
];

function VendorDashboard() {
  const max = Math.max(...sales.map((s) => s.v));
  return (
    <div className="container-narrow py-10">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
            Painel do vendedor
          </p>
          <h1 className="font-display text-3xl font-semibold text-[var(--coffee)]">
            Resumo do mês
          </h1>
        </div>
        <span className="rounded-full border border-[var(--border)] bg-[var(--cream)] px-3 py-1 text-xs">
          Sertão Natural
        </span>
      </header>

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <Stat icon={TrendingUp} label="Vendas" value="R$ 8.450,00" />
        <Stat icon={ShoppingBag} label="Pedidos" value="126" />
        <Stat icon={Package} label="Produtos" value="24" />
        <Stat icon={Star} label="Avaliação" value="4,9" />
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-[1.6fr_1fr]">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="font-display text-lg font-semibold">Vendas nos últimos 7 dias</h2>
          <div className="mt-6 flex h-52 items-end gap-3">
            {sales.map((s) => (
              <div key={s.day} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-md bg-gradient-to-t from-[var(--clay)] to-[color-mix(in_oklab,var(--clay)_60%,white)]"
                  style={{ height: `${(s.v / max) * 100}%` }}
                />
                <span className="text-[10px] text-[var(--muted-foreground)]">{s.day}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="font-display text-lg font-semibold">Pedidos recentes</h2>
          <ul className="mt-4 divide-y divide-[var(--border)]">
            {orders.map((o) => (
              <li key={o.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <div className="font-semibold">{o.id}</div>
                  <div className="text-xs text-[var(--muted-foreground)]">{o.date}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{o.value}</div>
                  <span
                    className={
                      "text-[10px] uppercase tracking-[0.18em] " +
                      (o.status === "Entregue"
                        ? "text-[var(--leaf)]"
                        : o.status === "Enviado"
                          ? "text-[var(--clay)]"
                          : "text-[var(--muted-foreground)]")
                    }
                  >
                    {o.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="mt-10 text-xs text-[var(--muted-foreground)]">
        Dados de demonstração. Cadastro de produtos, gestão de pedidos e métricas em tempo real
        serão ativados quando o backend (Lovable Cloud) estiver conectado.
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
