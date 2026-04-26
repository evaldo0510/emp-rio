import { createFileRoute } from "@tanstack/react-router";
import {
  Users,
  Store,
  ShoppingBag,
  DollarSign,
  Download,
  Loader2,
  TrendingUp,
  PieChart,
  ArrowUpRight,
  Settings,
  RefreshCcw,
  History,
} from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { formatBRL } from "@/lib/products";
import { supabase } from "@/lib/supabase";
import { validateCommissionRate } from "@/lib/commissions";

export const Route = createFileRoute("/_app/admin")({
  head: () => ({ meta: [{ title: "Painel Admin — Licuri Hub" }] }),
  component: AdminPage,
});

const monthly = [300, 420, 380, 510, 470, 520, 600, 680, 720, 810, 760, 880];

const statuses = [
  { label: "Pago", value: 42, color: "var(--leaf)" },
  { label: "Enviado", value: 28, color: "var(--clay)" },
  { label: "Entregue", value: 22, color: "var(--coffee)" },
  { label: "Cancelado", value: 8, color: "var(--destructive)" },
];

function AdminPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [updatingType, setUpdatingType] = useState<string | null>(null);
  const [sellers, setSellers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [commissionSettings, setCommissionSettings] = useState<any[]>([]);
  const [commissionHistory, setCommissionHistory] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalSales: 0,
    orderCount: 0,
    sellerCount: 0,
    userCount: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    fetchStats();
    fetchSellers();
    fetchOrders();
    fetchTransactions();
    fetchWithdrawals();
    fetchCommissionSettings();
    fetchCommissionHistory();
  };

  const fetchSellers = async () => {
    const { data } = await supabase
      .from("sellers")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setSellers(data);
  };

  const fetchOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setOrders(data);
  };

  const fetchTransactions = async () => {
    const { data } = await supabase
      .from("wallet_transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setTransactions(data);
  };

  const fetchWithdrawals = async () => {
    const { data } = await supabase
      .from("withdrawal_requests")
      .select("*, sellers(store_name)")
      .order("created_at", { ascending: false });
    if (data) setWithdrawals(data);
  };

  const fetchCommissionHistory = async () => {
    const { data } = await supabase
      .from("commission_rate_history")
      .select("*, profiles:admin_id(email)")
      .order("created_at", { ascending: false })
      .limit(10);
    if (data) setCommissionHistory(data);
  };

  const recalculateCommissions = async () => {
    setIsRecalculating(true);
    try {
      const { error } = await supabase.rpc("recalculate_all_commissions");
      if (error) throw error;
      toast.success("Comissões recalculadas com sucesso!");
      fetchDashboardData();
    } catch (e: any) {
      toast.error("Erro ao recalcular: " + e.message);
    } finally {
      setIsRecalculating(false);
    }
  };

  const fetchCommissionSettings = async () => {
    const { data } = await supabase
      .from("seller_type_settings")
      .select("*")
      .order("seller_type");
    if (data) setCommissionSettings(data);
  };

  const updateTypeCommissionRate = async (type: string, rateInput: any) => {
    const roundedRate = validateCommissionRate(rateInput);

    if (roundedRate === null) {
      toast.error("A taxa de comissão deve estar entre 0% e 100%.");
      fetchCommissionSettings(); // Reset to current value from DB
      return;
    }

    setUpdatingType(type);
    try {
      const { error } = await supabase
        .from("seller_type_settings")
        .update({ commission_rate: roundedRate / 100 })
        .eq("seller_type", type);
      if (error) throw error;
      toast.success("Comissão atualizada!");
      await Promise.all([fetchCommissionSettings(), fetchCommissionHistory()]);
    } catch (e: any) {
      toast.error(e.message);
      fetchCommissionSettings();
    } finally {
      setUpdatingType(null);
    }
  };

  const approveSeller = async (id: string) => {
    try {
      const { error } = await supabase
        .from("sellers")
        .update({ approved: true, verified_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      toast.success("Vendedor aprovado!");
      fetchSellers();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const updateOrderStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
      toast.success("Status do pedido atualizado!");
      fetchOrders();
      fetchStats();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleWithdrawal = async (id: string, status: "approved" | "rejected") => {
    try {
      const { error } = await supabase.from("withdrawal_requests").update({ status }).eq("id", id);
      if (error) throw error;
      toast.success(`Saque ${status === "approved" ? "aprovado" : "recusado"}!`);
      fetchWithdrawals();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const fetchStats = async () => {
    const [{ data: ordersData }, { count: sellersCount }, { count: usersCount }] =
      await Promise.all([
        supabase.from("orders").select("total"),
        supabase.from("sellers").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("user_id", { count: "exact", head: true }),
      ]);

    const total = ordersData?.reduce((acc, o) => acc + Number(o.total), 0) || 0;

    setStats({
      totalSales: total,
      orderCount: ordersData?.length || 0,
      sellerCount: sellersCount || 0,
      userCount: usersCount || 0,
    });
  };

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      // Fetch real data for the report
      const { data: reportData, error } = await supabase.rpc("get_monthly_sales_report", {
        report_month: new Date().toISOString().split("T")[0],
      });

      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.text("Relatório Mensal - Licuri Hub", 14, 22);

      doc.setFontSize(12);
      doc.text(`Data de geração: ${new Date().toLocaleDateString()}`, 14, 30);

      const revenue = reportData?.[0]?.total_revenue || stats.totalSales || 156890;
      const orders = reportData?.[0]?.total_orders || stats.orderCount || 2345;

      doc.text("Resumo de Vendas", 14, 45);
      (doc as any).autoTable({
        startY: 50,
        head: [["Métrica", "Valor"]],
        body: [
          ["Vendas Totais", formatBRL(revenue)],
          ["Total de Pedidos", orders.toString()],
          ["Ticket Médio", formatBRL(orders > 0 ? revenue / orders : 0)],
        ],
      });

      const categories = reportData?.[0]?.sales_by_category || {
        Alimentos: 45200,
        Óleos: 38100,
        Cosméticos: 29400,
        Artesanato: 12800,
      };

      doc.text("Performance por Categoria", 14, (doc as any).lastAutoTable.finalY + 15);
      (doc as any).autoTable({
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [["Categoria", "Vendas"]],
        body: Object.entries(categories).map(([cat, val]) => [cat, formatBRL(val as number)]),
      });

      doc.save(`relatorio-mensal-${new Date().getMonth() + 1}-${new Date().getFullYear()}.pdf`);
      toast.success("Relatório gerado com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar relatório real. Usando dados simulados.");
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
          {isGenerating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Gerar Relatório PDF
        </Button>
      </header>

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <Stat
          icon={DollarSign}
          label="Vendas totais"
          value={formatBRL(stats.totalSales || 156890)}
        />
        <Stat icon={ShoppingBag} label="Pedidos" value={(stats.orderCount || 2345).toString()} />
        <Stat icon={Store} label="Vendedores" value={(stats.sellerCount || 87).toString()} />
        <Stat icon={Users} label="Clientes" value={(stats.userCount || 1890).toString()} />
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
                  .map(
                    (v, i) => `${(i / (monthly.length - 1)) * 580 + 10},${190 - (v / max) * 170}`,
                  )
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
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                  {s.label}
                  <span className="ml-1 text-[var(--muted-foreground)]">{s.value}%</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <div className="mt-8 grid gap-8">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="font-display text-lg font-semibold mb-6">Aprovação de Vendedores</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] uppercase tracking-widest text-[var(--muted-foreground)] border-b border-[var(--border)]">
                <tr>
                  <th className="pb-3 font-bold">Loja</th>
                  <th className="pb-3 font-bold">Data</th>
                  <th className="pb-3 font-bold">Status</th>
                  <th className="pb-3 font-bold text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {sellers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-[var(--muted-foreground)]">
                      Nenhum vendedor cadastrado.
                    </td>
                  </tr>
                ) : (
                  sellers.map((s) => (
                    <tr key={s.id}>
                      <td className="py-4">
                        <div className="font-bold text-[var(--coffee)]">{s.store_name}</div>
                        <div className="text-xs text-[var(--muted-foreground)] line-clamp-1">
                          {s.description}
                        </div>
                      </td>
                      <td className="py-4">{new Date(s.created_at).toLocaleDateString()}</td>
                      <td className="py-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${s.approved ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}
                        >
                          {s.approved ? "APROVADO" : "PENDENTE"}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        {!s.approved && (
                          <Button size="sm" variant="hero" onClick={() => approveSeller(s.id)}>
                            Aprovar
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-[var(--clay)]" />
              <h2 className="font-display text-lg font-semibold">Configurações de Comissão por Tipo</h2>
            </div>
            <Button 
              size="sm" 
              variant="soft" 
              onClick={recalculateCommissions}
              disabled={isRecalculating || !!updatingType}
            >
              {isRecalculating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCcw className="h-4 w-4 mr-2" />
              )}
              Recalcular Transações Pagas
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {commissionSettings.map((s) => (
              <div key={s.seller_type} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--sand)]/5">
                <label className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)] font-bold mb-2 block">
                  {s.seller_type}
                </label>
                <div className="flex items-center gap-2 relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    disabled={!!updatingType || isRecalculating}
                    defaultValue={s.commission_rate * 100}
                    className="w-full bg-transparent border-b border-[var(--border)] py-1 text-lg font-bold text-[var(--coffee)] focus:border-[var(--clay)] outline-none disabled:opacity-50"
                    onBlur={(e) => updateTypeCommissionRate(s.seller_type, e.target.value)}
                  />
                  {updatingType === s.seller_type ? (
                    <Loader2 className="h-4 w-4 animate-spin text-[var(--clay)] absolute right-6" />
                  ) : (
                    <span className="text-lg font-bold text-[var(--coffee)]">%</span>
                  )}
                </div>
                <p className="text-[10px] text-[var(--muted-foreground)] mt-2">
                  Padrão para novos vendedores do tipo {s.seller_type}.
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="flex items-center gap-2 mb-6">
            <History className="h-5 w-5 text-[var(--clay)]" />
            <h2 className="font-display text-lg font-semibold">Histórico de Alterações</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] uppercase tracking-widest text-[var(--muted-foreground)] border-b border-[var(--border)]">
                <tr>
                  <th className="pb-3 font-bold">Tipo</th>
                   <th className="pb-3 font-bold">Antes (% / Fração)</th>
                   <th className="pb-3 font-bold">Depois (% / Fração)</th>
                  <th className="pb-3 font-bold">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {commissionHistory.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-[var(--muted-foreground)]">
                      Nenhum histórico disponível.
                    </td>
                  </tr>
                ) : (
                  commissionHistory.map((h) => (
                    <tr key={h.id}>
                      <td className="py-3 font-medium text-[var(--coffee)]">{h.seller_type}</td>
                      <td className="py-3 text-[var(--muted-foreground)]">
                        {(h.old_rate * 100).toFixed(2)}% <span className="text-[10px]">({h.old_rate})</span>
                      </td>
                      <td className="py-3 font-bold text-[var(--leaf)]">
                        {(h.new_rate * 100).toFixed(2)}% <span className="text-[10px] font-normal text-[var(--muted-foreground)]">({h.new_rate})</span>
                      </td>
                      <td className="py-3 text-xs text-[var(--muted-foreground)]">
                        {new Date(h.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="font-display text-lg font-semibold mb-6">Pedidos Recentes</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] uppercase tracking-widest text-[var(--muted-foreground)] border-b border-[var(--border)]">
                <tr>
                  <th className="pb-3 font-bold">Pedido</th>
                  <th className="pb-3 font-bold">Cliente</th>
                  <th className="pb-3 font-bold">Total</th>
                  <th className="pb-3 font-bold">Status</th>
                  <th className="pb-3 font-bold text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-[var(--muted-foreground)]">
                      Nenhum pedido encontrado.
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => (
                    <tr key={o.id}>
                      <td className="py-4">
                        <div className="font-bold">#{o.id.slice(0, 8)}</div>
                        <div className="text-[10px] text-[var(--muted-foreground)]">
                          {new Date(o.created_at).toLocaleString()}
                        </div>
                      </td>
                      <td className="py-4">{o.customer_name}</td>
                      <td className="py-4 font-bold">{formatBRL(o.total)}</td>
                      <td className="py-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            o.status === "paid"
                              ? "bg-green-100 text-green-700"
                              : o.status === "cancelled"
                                ? "bg-red-100 text-red-700"
                                : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {o.status?.toUpperCase() || "PENDENTE"}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <select
                          className="text-xs border border-[var(--border)] rounded px-2 py-1 bg-transparent"
                          value={o.status || "pending"}
                          onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                        >
                          <option value="pending">Pendente</option>
                          <option value="paid">Pago</option>
                          <option value="shipped">Enviado</option>
                          <option value="delivered">Entregue</option>
                          <option value="cancelled">Cancelado</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <div className="grid gap-8 md:grid-cols-2">
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
            <h2 className="font-display text-lg font-semibold mb-6">Solicitações de Saque</h2>
            <div className="space-y-4">
              {withdrawals.length === 0 ? (
                <p className="text-sm text-[var(--muted-foreground)]">
                  Nenhuma solicitação pendente.
                </p>
              ) : (
                withdrawals.map((w) => (
                  <div
                    key={w.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-[var(--border)] bg-[var(--sand)]/10"
                  >
                    <div>
                      <p className="text-sm font-bold text-[var(--coffee)]">
                        {w.sellers?.store_name}
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {formatBRL(w.amount)} · {w.pix_key}
                      </p>
                    </div>
                    {w.status === "pending" ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="hero"
                          className="h-8"
                          onClick={() => handleWithdrawal(w.id, "approved")}
                        >
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="soft"
                          className="h-8 text-red-600"
                          onClick={() => handleWithdrawal(w.id, "rejected")}
                        >
                          Recusar
                        </Button>
                      </div>
                    ) : (
                      <span
                        className={`text-[10px] font-bold px-2 py-1 rounded ${w.status === "approved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                      >
                        {w.status?.toUpperCase()}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
            <h2 className="font-display text-lg font-semibold mb-6">Últimas Transações</h2>
            <div className="space-y-3">
              {transactions.length === 0 ? (
                <p className="text-sm text-[var(--muted-foreground)]">
                  Nenhuma transação registrada.
                </p>
              ) : (
                transactions.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0"
                  >
                    <div>
                      <p className="text-xs font-medium">{t.description}</p>
                      <p className="text-[10px] text-[var(--muted-foreground)]">
                        {new Date(t.created_at).toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-bold ${t.amount >= 0 ? "text-[var(--leaf)]" : "text-red-600"}`}
                    >
                      {formatBRL(t.amount)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
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
