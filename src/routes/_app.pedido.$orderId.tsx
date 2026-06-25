import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatBRL } from "@/lib/products";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ArrowLeft,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  CreditCard,
  Receipt,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/_app/pedido/$orderId")({
  head: () => ({ meta: [{ title: "Detalhes do Pedido — Licuri Hub" }] }),
  component: OrderDetailsPage,
});

const STATUS_FLOW = [
  { key: "paid", label: "Pago", icon: CheckCircle2 },
  { key: "processing", label: "Em preparo", icon: Clock },
  { key: "shipped", label: "Enviado", icon: Truck },
  { key: "delivered", label: "Entregue", icon: Package },
];

function statusIndex(status?: string | null) {
  const idx = STATUS_FLOW.findIndex((s) => s.key === status);
  return idx;
}

function OrderDetailsPage() {
  const { orderId } = Route.useParams();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [shipments, setShipments] = useState<any[]>([]);
  const [updates, setUpdates] = useState<any[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data: orderData } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("id", orderId)
        .maybeSingle();

      if (cancelled) return;
      if (!orderData) {
        setOrder(null);
        setLoading(false);
        return;
      }
      setOrder(orderData);

      const { data: shipmentsData } = await supabase
        .from("shipments")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: true });

      if (cancelled) return;
      const ships = shipmentsData || [];
      setShipments(ships);

      if (ships.length > 0) {
        const { data: upd } = await supabase
          .from("shipment_updates")
          .select("*")
          .in(
            "shipment_id",
            ships.map((s) => s.id),
          )
          .order("created_at", { ascending: false });
        if (!cancelled) setUpdates(upd || []);
      } else {
        setUpdates([]);
      }
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (loading) {
    return (
      <div className="container-narrow py-20 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--clay)]" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container-narrow py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Pedido não encontrado</h1>
        <Button asChild variant="soft">
          <Link to="/conta">Voltar para Minha Conta</Link>
        </Button>
      </div>
    );
  }

  const currentIdx = statusIndex(order.status);
  const items = order.order_items || [];
  const subtotal = Number(order.subtotal ?? items.reduce((acc: number, i: any) => acc + Number(i.price) * i.quantity, 0));
  const shippingCost = Number(order.shipping_cost ?? 0);
  const total = Number(order.total ?? subtotal + shippingCost);
  const addr = order.address || {};

  return (
    <div className="container-narrow py-8">
      <Link
        to="/conta"
        className="inline-flex items-center text-sm text-[var(--muted-foreground)] hover:text-[var(--clay)] mb-8 transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para meus pedidos
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
        <div className="space-y-8">
          <div className="bg-white rounded-3xl border border-[var(--border)] p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
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
              </div>
              <Button asChild variant="soft" size="sm">
                <Link to="/rastreio/$orderId" params={{ orderId: order.id }}>
                  <Truck className="mr-2 h-4 w-4" />
                  Rastrear envio
                </Link>
              </Button>
            </div>

            <div className="mb-2">
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)] mb-4">
                Status da entrega
              </p>
              <div className="relative">
                <div className="absolute top-4 left-0 w-full h-0.5 bg-[var(--border)]" />
                <div
                  className="absolute top-4 left-0 h-0.5 bg-[var(--clay)] transition-all"
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
                    return (
                      <div key={s.key} className="flex flex-col items-center gap-2 w-16 text-center">
                        <div
                          className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${
                            active
                              ? "bg-[var(--clay)] border-[var(--clay)] text-white"
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
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[var(--border)] p-6 sm:p-8 shadow-sm">
            <h2 className="font-display text-xl font-semibold text-[var(--coffee)] mb-6 flex items-center gap-2">
              <Receipt className="h-5 w-5 text-[var(--clay)]" />
              Itens da compra
            </h2>
            <div className="divide-y divide-[var(--border)]">
              {items.map((item: any) => (
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
                      {item.quantity} × {formatBRL(Number(item.price))}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-[var(--clay)] whitespace-nowrap">
                    {formatBRL(Number(item.price) * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[var(--border)] p-6 sm:p-8 shadow-sm">
            <h2 className="font-display text-xl font-semibold text-[var(--coffee)] mb-6 flex items-center gap-2">
              <Truck className="h-5 w-5 text-[var(--clay)]" />
              Timeline de status
            </h2>

            {updates.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)] italic">
                O histórico ficará disponível assim que o pedido começar a ser processado.
              </p>
            ) : (
              <div className="relative space-y-0 before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-0.5 before:bg-[var(--border)]">
                {updates.map((update, index) => (
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
                    <h3
                      className={`font-semibold ${
                        index === 0
                          ? "text-[var(--clay)] text-base"
                          : "text-[var(--coffee)] text-sm"
                      }`}
                    >
                      {update.description || update.status}
                    </h3>
                    {update.location && (
                      <p className="text-xs text-[var(--muted-foreground)] mt-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {update.location}
                      </p>
                    )}
                  </div>
                ))}
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
                <dd className="text-[var(--coffee)]">{formatBRL(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--muted-foreground)]">
                  Frete {order.shipping_method ? `(${order.shipping_method})` : ""}
                </dt>
                <dd className="text-[var(--coffee)]">
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
              <p className="font-semibold text-[var(--coffee)]">{order.customer_name}</p>
              {addr.street && (
                <p>
                  {addr.street}
                  {addr.number ? `, ${addr.number}` : ""}
                </p>
              )}
              {addr.neighborhood && <p>{addr.neighborhood}</p>}
              {(addr.city || addr.state) && (
                <p>
                  {addr.city}
                  {addr.state ? ` - ${addr.state}` : ""}
                </p>
              )}
              {addr.zipCode && <p>CEP: {addr.zipCode}</p>}
            </div>
          </div>

          {shipments.length > 0 && (
            <div className="bg-[var(--sand)]/40 rounded-3xl border border-[var(--border)] p-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)] mb-3">
                Envio
              </h3>
              {shipments.map((s) => (
                <div key={s.id} className="text-sm mb-2 last:mb-0">
                  <p className="font-semibold text-[var(--coffee)]">
                    {s.carrier || "Transportadora"}
                  </p>
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
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
