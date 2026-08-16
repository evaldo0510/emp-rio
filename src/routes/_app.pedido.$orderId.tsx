import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { formatBRL } from "@/lib/products";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  CreditCard,
  Receipt,
  AlertTriangle,
  Download,
  Inbox,
  XCircle,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/_app/pedido/$orderId")({
  head: () => ({ meta: [{ title: "Detalhes do Pedido — Empório do Licuri" }] }),
  component: OrderDetailsPage,
});

const STATUS_FLOW = [
  { key: "paid", label: "Pago", icon: CheckCircle2 },
  { key: "processing", label: "Em preparo", icon: Clock },
  { key: "shipped", label: "Enviado", icon: Truck },
  { key: "delivered", label: "Entregue", icon: Package },
];

const STATUS_LABELS: Record<string, { label: string; tone: "neutral" | "success" | "warn" | "info" | "danger" }> = {
  pending: { label: "Aguardando processamento", tone: "neutral" },
  paid: { label: "Pagamento confirmado", tone: "info" },
  processing: { label: "Em preparo pelo vendedor", tone: "info" },
  shipped: { label: "Em trânsito", tone: "info" },
  in_transit: { label: "Em trânsito", tone: "info" },
  out_for_delivery: { label: "Saiu para entrega", tone: "info" },
  delivered: { label: "Entregue", tone: "success" },
  delayed: { label: "Atrasado", tone: "warn" },
  canceled: { label: "Cancelado", tone: "danger" },
  cancelled: { label: "Cancelado", tone: "danger" },
  returned: { label: "Devolvido", tone: "danger" },
};

const TONE_CLASSES: Record<string, string> = {
  neutral: "bg-[var(--sand)] text-[var(--coffee)]",
  info: "bg-blue-50 text-blue-700 border-blue-100",
  success: "bg-green-50 text-green-700 border-green-100",
  warn: "bg-amber-50 text-amber-700 border-amber-100",
  danger: "bg-red-50 text-red-700 border-red-100",
};

function statusIndex(status?: string | null) {
  return STATUS_FLOW.findIndex((s) => s.key === status);
}

function OrderDetailsPage() {
  const { orderId } = Route.useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<any>(null);
  const [shipments, setShipments] = useState<any[]>([]);
  const [updates, setUpdates] = useState<any[]>([]);

  const load = useCallback(async () => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    try {
      const { data: orderData, error: oErr } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("id", orderId)
        .maybeSingle();
      if (oErr) throw oErr;
      if (cancelled) return;
      if (!orderData) {
        setOrder(null);
        setLoading(false);
        return;
      }
      setOrder(orderData);

      const { data: shipmentsData, error: sErr } = await supabase
        .from("shipments")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: true });
      if (sErr) throw sErr;
      if (cancelled) return;
      const ships = shipmentsData || [];
      setShipments(ships);

      if (ships.length > 0) {
        const { data: upd, error: uErr } = await supabase
          .from("shipment_updates")
          .select("*")
          .in("shipment_id", ships.map((s) => s.id))
          .order("created_at", { ascending: false });
        if (uErr) throw uErr;
        if (!cancelled) setUpdates(upd || []);
      } else {
        setUpdates([]);
      }
    } catch (e: any) {
      if (!cancelled) setError(e?.message || "Não foi possível carregar o pedido.");
    } finally {
      if (!cancelled) setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    let cancelled = false;
    load();
    return () => {
      cancelled = true;
    };
  }, [load]);

  if (loading) return <OrderSkeleton />;

  if (error) {
    return (
      <div className="container-narrow py-20">
        <EmptyState
          icon={XCircle}
          title="Não foi possível carregar o pedido"
          description={error}
          primaryAction={{ label: "Tentar novamente", onClick: load, variant: "hero" }}
          secondaryAction={{ label: "Voltar para Minha Conta", to: "/conta" }}
        />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container-narrow py-20">
        <EmptyState
          icon={Inbox}
          title="Pedido não encontrado"
          description="Verifique se o link está correto ou se o pedido foi removido."
          primaryAction={{ label: "Voltar para Minha Conta", to: "/conta", variant: "hero" }}
          secondaryAction={{ label: "Ir à loja", to: "/categorias" }}
        />
      </div>
    );
  }

  const currentIdx = statusIndex(order.status);
  const items = order.order_items || [];
  const subtotal = Number(
    order.subtotal ??
      items.reduce((acc: number, i: any) => acc + Number(i.price) * i.quantity, 0),
  );
  const shippingCost = Number(order.shipping_cost ?? 0);
  const total = Number(order.total ?? subtotal + shippingCost);
  const addr = order.address || {};
  const mainShipment = shipments[0];

  // Delay detection: shipped > 10 days and not delivered
  let isDelayed = false;
  if (mainShipment && mainShipment.status === "shipped" && order.status !== "delivered") {
    const ref = mainShipment.updated_at || mainShipment.created_at;
    if (ref && differenceInDays(new Date(), new Date(ref)) >= 10) isDelayed = true;
  }

  const isCompleted = order.status === "delivered";
  const statusInfo = STATUS_LABELS[isDelayed ? "delayed" : order.status] || {
    label: order.status || "—",
    tone: "neutral" as const,
  };

  function handleDownloadReceipt() {
    window.print();
  }

  return (
    <div className="container-narrow py-8">
      <Link
        to="/conta"
        className="inline-flex items-center text-sm text-[var(--muted-foreground)] hover:text-[var(--clay)] mb-8 transition-colors print:hidden"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para meus pedidos
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
        <div className="space-y-8">
          <div className="bg-white rounded-3xl border border-[var(--border)] p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
                  Pedido
                </p>
                <h1 className="font-display text-2xl font-semibold text-[var(--coffee)]">
                  #{order.id.slice(0, 8)}
                </h1>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">
                  Realizado em{" "}
                  {format(new Date(order.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </p>
                <span
                  className={`inline-flex items-center gap-1.5 mt-3 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${TONE_CLASSES[statusInfo.tone]}`}
                >
                  {isDelayed && <AlertTriangle className="h-3 w-3" />}
                  {statusInfo.label}
                </span>
              </div>
              <div className="flex flex-col gap-2 print:hidden">
                <Button asChild variant="soft" size="sm">
                  <Link to="/rastreio/$orderId" params={{ orderId: order.id }}>
                    <Truck className="mr-2 h-4 w-4" />
                    Rastrear envio
                  </Link>
                </Button>
                {isCompleted && (
                  <Button variant="hero" size="sm" onClick={handleDownloadReceipt}>
                    <Download className="mr-2 h-4 w-4" />
                    Baixar comprovante
                  </Button>
                )}
              </div>
            </div>

            <div className="mb-2">
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)] mb-4">
                Status da entrega
              </p>
              <div className="relative">
                <div className="absolute top-4 left-0 w-full h-0.5 bg-[var(--border)]" />
                <div
                  className={`absolute top-4 left-0 h-0.5 transition-all ${isDelayed ? "bg-amber-500" : "bg-[var(--clay)]"}`}
                  style={{
                    width:
                      currentIdx <= 0
                        ? "0%"
                        : `${(currentIdx / (STATUS_FLOW.length - 1)) * 100}%`,
                  }}
                />
                <div className="relative flex justify-between">
                  {STATUS_FLOW.map((s, idx) => {
                    const Icon = s.icon;
                    const active = currentIdx >= idx;
                    const isCurrent = currentIdx === idx;
                    return (
                      <div key={s.key} className="flex flex-col items-center gap-2 w-16 text-center">
                        <div
                          className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${
                            active
                              ? isDelayed && isCurrent
                                ? "bg-amber-500 border-amber-500 text-white"
                                : "bg-[var(--clay)] border-[var(--clay)] text-white"
                              : "bg-white border-[var(--border)] text-[var(--muted-foreground)]"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <span
                          className={`text-[10px] font-semibold ${
                            active ? "text-[var(--coffee)]" : "text-[var(--muted-foreground)]"
                          }`}
                        >
                          {s.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {isDelayed && (
                <div className="mt-6 flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-800">
                    Sua entrega está demorando mais do que o esperado. Em caso de dúvida, entre em contato com a transportadora ou com o vendedor.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[var(--border)] p-6 sm:p-8 shadow-sm">
            <h2 className="font-display text-xl font-semibold text-[var(--coffee)] mb-6 flex items-center gap-2">
              <Receipt className="h-5 w-5 text-[var(--clay)]" />
              Itens da compra
            </h2>
            <div className="divide-y divide-[var(--border)]">
              {items.map((item: any) => {
                const lineTotal = Number(item.price) * item.quantity;
                return (
                  <div key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                    <div className="h-16 w-16 rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--sand)] shrink-0">
                      {item.image_url && (
                        <img src={item.image_url} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--coffee)] line-clamp-2">
                        {item.name}
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)] mt-1">
                        Qtd. {item.quantity} · Unit. {formatBRL(Number(item.price))}
                      </p>
                    </div>
                    <div className="text-right whitespace-nowrap">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
                        Total
                      </p>
                      <p className="text-sm font-bold text-[var(--clay)]">
                        {formatBRL(lineTotal)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[var(--border)] p-6 sm:p-8 shadow-sm">
            <h2 className="font-display text-xl font-semibold text-[var(--coffee)] mb-6 flex items-center gap-2">
              <Truck className="h-5 w-5 text-[var(--clay)]" />
              Timeline de status
            </h2>

            {!mainShipment ? (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-[var(--sand)]/50 border border-[var(--border)]">
                <Clock className="h-4 w-4 text-[var(--muted-foreground)] mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-[var(--coffee)]">
                    Envio ainda não criado
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)] mt-1">
                    O vendedor ainda não preparou seu envio. Assim que houver atualizações, elas aparecerão aqui.
                  </p>
                </div>
              </div>
            ) : updates.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)] italic">
                O histórico ficará disponível assim que o pedido começar a ser processado.
              </p>
            ) : (
              <div className="relative space-y-0 before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-0.5 before:bg-[var(--border)]">
                {updates.map((update, index) => {
                  const info =
                    STATUS_LABELS[update.status] || { label: update.status, tone: "neutral" as const };
                  return (
                    <div key={update.id} className="relative pl-12 pb-6 last:pb-0">
                      <div
                        className={`absolute left-0 top-1 w-[36px] h-[36px] -translate-x-1/2 rounded-full border-4 border-white shadow-sm flex items-center justify-center z-10 ${
                          index === 0
                            ? "bg-[var(--clay)] text-white"
                            : "bg-[var(--sand)] text-[var(--muted-foreground)]"
                        }`}
                      >
                        {index === 0 ? (
                          <Truck className="h-4 w-4" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-current" />
                        )}
                      </div>
                      <p className="text-xs font-bold text-[var(--muted-foreground)] mb-1">
                        {format(new Date(update.created_at), "dd 'de' MMM 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3
                          className={`font-semibold ${
                            index === 0
                              ? "text-[var(--clay)] text-base"
                              : "text-[var(--coffee)] text-sm"
                          }`}
                        >
                          {update.description || info.label}
                        </h3>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${TONE_CLASSES[info.tone]}`}
                        >
                          {info.label}
                        </span>
                      </div>
                      {update.location && (
                        <p className="text-xs text-[var(--muted-foreground)] mt-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {update.location}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="bg-white rounded-3xl border border-[var(--border)] p-6 shadow-sm">
            <h3 className="font-display text-lg font-semibold mb-4 text-[var(--coffee)]">
              Resumo
            </h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-[var(--muted-foreground)]">Subtotal</dt>
                <dd className="text-[var(--coffee)] font-medium">{formatBRL(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--muted-foreground)]">
                  Frete {order.shipping_method ? `(${order.shipping_method})` : ""}
                </dt>
                <dd className="text-[var(--coffee)] font-medium">
                  {shippingCost > 0 ? formatBRL(shippingCost) : "Grátis"}
                </dd>
              </div>
              <div className="flex justify-between border-t border-[var(--border)] pt-3 mt-3">
                <dt className="font-bold text-[var(--coffee)]">Total</dt>
                <dd className="font-bold text-[var(--clay)]">{formatBRL(total)}</dd>
              </div>
            </dl>
          </div>

          <div className="bg-white rounded-3xl border border-[var(--border)] p-6 shadow-sm">
            <h3 className="font-display text-lg font-semibold mb-4 text-[var(--coffee)] flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-[var(--clay)]" />
              Pagamento
            </h3>
            <p className="text-sm text-[var(--coffee)] capitalize">
              {order.payment_status || "Aguardando"}
            </p>
            {order.payment_id && (
              <p className="text-xs text-[var(--muted-foreground)] mt-1 font-mono break-all">
                ID: {order.payment_id}
              </p>
            )}
          </div>

          <div className="bg-white rounded-3xl border border-[var(--border)] p-6 shadow-sm">
            <h3 className="font-display text-lg font-semibold mb-4 text-[var(--coffee)] flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[var(--clay)]" />
              Entrega
            </h3>
            <div className="text-sm text-[var(--muted-foreground)] space-y-1">
              {order.customer_name && (
                <p className="font-semibold text-[var(--coffee)]">{order.customer_name}</p>
              )}
              {order.customer_phone && <p>Tel.: {order.customer_phone}</p>}
              {addr.street && (
                <p>
                  {addr.street}
                  {addr.number ? `, ${addr.number}` : ""}
                  {addr.complement ? ` — ${addr.complement}` : ""}
                </p>
              )}
              {addr.neighborhood && <p>Bairro: {addr.neighborhood}</p>}
              {(addr.city || addr.state) && (
                <p>
                  {addr.city}
                  {addr.state ? ` - ${addr.state}` : ""}
                </p>
              )}
              {(addr.zipCode || addr.zip_code || addr.cep) && (
                <p>CEP: {addr.zipCode || addr.zip_code || addr.cep}</p>
              )}
              {addr.reference && (
                <p className="text-xs italic">Ref.: {addr.reference}</p>
              )}
            </div>
          </div>

          {shipments.length > 0 && (
            <div className="bg-[var(--sand)]/40 rounded-3xl border border-[var(--border)] p-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)] mb-3">
                Envio
              </h3>
              {shipments.map((s) => {
                const sInfo = STATUS_LABELS[s.status] || { label: s.status || "—", tone: "neutral" as const };
                return (
                  <div key={s.id} className="text-sm mb-3 last:mb-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-[var(--coffee)]">
                        {s.carrier || "Transportadora"}
                      </p>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${TONE_CLASSES[sInfo.tone]}`}
                      >
                        {sInfo.label}
                      </span>
                    </div>
                    {s.tracking_code ? (
                      <p className="font-mono text-xs text-[var(--clay)] font-bold mt-1">
                        {s.tracking_code}
                      </p>
                    ) : (
                      <p className="text-xs text-[var(--muted-foreground)] mt-1">
                        Aguardando código
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function OrderSkeleton() {
  return (
    <div className="container-narrow py-8">
      <Skeleton className="h-4 w-40 mb-8" />
      <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
        <div className="space-y-8">
          <div className="bg-white rounded-3xl border border-[var(--border)] p-6 sm:p-8 space-y-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-3 w-64" />
            <Skeleton className="h-16 w-full mt-4" />
          </div>
          <div className="bg-white rounded-3xl border border-[var(--border)] p-6 sm:p-8 space-y-3">
            <Skeleton className="h-5 w-40" />
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex gap-4 py-2">
                <Skeleton className="h-16 w-16 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
          <div className="bg-white rounded-3xl border border-[var(--border)] p-6 sm:p-8 space-y-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
        <aside className="space-y-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-white rounded-3xl border border-[var(--border)] p-6 space-y-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}
