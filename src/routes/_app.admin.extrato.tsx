import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { formatBRL } from "@/lib/products";
import { Button } from "@/components/ui/button";
import {
  Download,
  Search,
  ArrowLeft,
  Filter,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/admin/extrato")({
  head: () => ({ meta: [{ title: "Extrato Financeiro — Licuri Hub" }] }),
  component: AdminExtratoPage,
});

function AdminExtratoPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: "",
    end: "",
  });

  useEffect(() => {
    const init = async () => {
      await fetchSellers();
      await fetchTransactions();
    };
    init();
  }, [filterType, filterStatus, dateRange]);

  const fetchSellers = async () => {
    const { data } = await supabase.from("sellers").select("user_id, store_name");
    if (data) setSellers(data);
  };

  const getSellerName = (sellerUserId: string) => {
    return sellers.find((s) => s.user_id === sellerUserId)?.store_name || "Plataforma";
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("wallet_transactions")
        .select("*, orders(status, customer_name, id), seller_wallet(seller_id)")
        .order("created_at", { ascending: false });

      if (filterType !== "all") {
        query = query.eq("type", filterType);
      }

      if (dateRange.start) {
        query = query.gte("created_at", `${dateRange.start}T00:00:00`);
      }
      if (dateRange.end) {
        query = query.lte("created_at", `${dateRange.end}T23:59:59`);
      }

      const { data, error } = await query;

      if (error) throw error;

      let filteredData = data || [];

      // Apply search term filter (client-side for simplicity on joined fields)
      if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        filteredData = filteredData.filter((t: any) => {
          const sellerName = getSellerName(t.seller_wallet?.seller_id);
          return (
            t.description?.toLowerCase().includes(lowerSearch) ||
            sellerName.toLowerCase().includes(lowerSearch) ||
            t.orders?.customer_name?.toLowerCase().includes(lowerSearch) ||
            t.id.toLowerCase().includes(lowerSearch) ||
            t.order_id?.toLowerCase().includes(lowerSearch)
          );
        });
      }

      // Apply status filter (based on order status)
      if (filterStatus !== "all") {
        filteredData = filteredData.filter((t: any) => {
          if (t.type === "sale") {
            return t.orders?.status === filterStatus;
          }
          return true; 
        });
      }

      setTransactions(filteredData);
    } catch (err: any) {
      console.error("Error fetching transactions:", err);
      toast.error("Erro ao carregar transações");
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (transactions.length === 0) {
      toast.error("Nenhuma transação para exportar");
      return;
    }

    const headers = [
      "ID",
      "Data",
      "Tipo",
      "Descrição",
      "Vendedor",
      "Valor Bruto",
      "Comissão",
      "Valor Líquido",
      "Status Pedido",
    ];

    const rows = transactions.map((t) => [
      t.id,
      new Date(t.created_at).toLocaleString(),
      t.type === "sale" ? "Venda" : t.type === "withdrawal" ? "Saque" : t.type,
      t.description || "",
      getSellerName(t.seller_wallet?.seller_id),
      (Number(t.amount) + Number(t.commission || 0)).toFixed(2),
      Number(t.commission || 0).toFixed(2),
      Number(t.amount).toFixed(2),
      t.orders?.status || "N/A",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map(cell => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `extrato-financeiro-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV exportado com sucesso!");
  };

  return (
    <div className="container-narrow py-10">
      <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Link
            to="/admin"
            className="mb-2 flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--clay)]"
          >
            <ArrowLeft className="h-3 w-3" />
            Voltar ao Dashboard
          </Link>
          <h1 className="font-display text-3xl font-semibold text-[var(--coffee)]">
            Extrato Financeiro
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Relatório detalhado de todas as movimentações financeiras da plataforma.
          </p>
        </div>
        <Button variant="hero" onClick={exportToCSV} disabled={loading || transactions.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      </header>

      <div className="mb-6 grid gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 md:grid-cols-4 lg:grid-cols-5">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)] font-bold">
            Buscar
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              type="text"
              placeholder="Vendedor, ID, descrição..."
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--cream)] py-2 pl-9 pr-3 text-sm outline-none focus:border-[var(--clay)]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchTransactions()}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)] font-bold">
            Tipo
          </label>
          <select
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--cream)] p-2 text-sm outline-none focus:border-[var(--clay)]"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">Todos os tipos</option>
            <option value="sale">Vendas</option>
            <option value="withdrawal">Saques</option>
            <option value="refund">Reembolsos</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)] font-bold">
            Status (Pedidos)
          </label>
          <select
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--cream)] p-2 text-sm outline-none focus:border-[var(--clay)]"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Todos os status</option>
            <option value="pending">Pendente</option>
            <option value="paid">Pago</option>
            <option value="shipped">Enviado</option>
            <option value="delivered">Entregue</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>

        <div className="flex flex-col gap-1 lg:col-span-2">
          <label className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)] font-bold">
            Período
          </label>
          <div className="flex items-center gap-2">
            <input
              type="date"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--cream)] p-2 text-sm outline-none focus:border-[var(--clay)]"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            />
            <span className="text-[var(--muted-foreground)]">—</span>
            <input
              type="date"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--cream)] p-2 text-sm outline-none focus:border-[var(--clay)]"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--sand)]/30 text-[10px] uppercase tracking-widest text-[var(--muted-foreground)]">
              <tr>
                <th className="px-6 py-4 font-bold">Transação / Data</th>
                <th className="px-6 py-4 font-bold">Tipo</th>
                <th className="px-6 py-4 font-bold">Vendedor</th>
                <th className="px-6 py-4 font-bold">Descrição</th>
                <th className="px-6 py-4 font-bold text-right">Valor</th>
                <th className="px-6 py-4 font-bold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-[var(--clay)]" />
                    <p className="mt-2 text-[var(--muted-foreground)]">Carregando transações...</p>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[var(--muted-foreground)]">
                    Nenhuma transação encontrada para os filtros aplicados.
                  </td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-[var(--sand)]/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-[var(--coffee)]">#{t.id.slice(0, 8)}</div>
                      <div className="text-[10px] text-[var(--muted-foreground)] flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(t.created_at).toLocaleString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        t.type === 'sale' ? 'bg-green-100 text-green-700' : 
                        t.type === 'withdrawal' ? 'bg-blue-100 text-blue-700' : 
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {t.type === 'sale' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownLeft className="h-3 w-3" />}
                        {t.type === 'sale' ? 'VENDA' : t.type === 'withdrawal' ? 'SAQUE' : t.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-[var(--coffee)]">
                        {getSellerName(t.seller_wallet?.seller_id)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="max-w-[200px] truncate text-xs text-[var(--muted-foreground)]" title={t.description}>
                        {t.description}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className={`font-bold ${t.amount >= 0 ? 'text-[var(--leaf)]' : 'text-red-600'}`}>
                        {t.amount >= 0 ? '+' : ''}{formatBRL(t.amount)}
                      </div>
                      {t.commission > 0 && (
                        <div className="text-[10px] text-[var(--muted-foreground)]">
                          Plat: {formatBRL(t.commission)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        {t.type === 'sale' ? (
                           <span className={`flex items-center gap-1 text-[10px] font-bold ${
                            t.orders?.status === 'delivered' ? 'text-green-600' :
                            t.orders?.status === 'cancelled' ? 'text-red-600' :
                            'text-amber-600'
                          }`}>
                            {t.orders?.status === 'delivered' ? <CheckCircle2 className="h-3 w-3" /> :
                             t.orders?.status === 'cancelled' ? <XCircle className="h-3 w-3" /> :
                             <Clock className="h-3 w-3" />}
                            {t.orders?.status?.toUpperCase() || 'PAGO'}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-blue-600 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            CONCLUÍDO
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {!loading && transactions.length > 0 && (
        <div className="mt-4 flex items-center justify-between text-xs text-[var(--muted-foreground)]">
          <p>Mostrando {transactions.length} transações</p>
          <div className="flex gap-4">
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[var(--leaf)]" />
              <span>Entradas: {formatBRL(transactions.filter(t => t.amount > 0).reduce((acc, t) => acc + Number(t.amount), 0))}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-600" />
              <span>Saídas: {formatBRL(Math.abs(transactions.filter(t => t.amount < 0).reduce((acc, t) => acc + Number(t.amount), 0)))}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
