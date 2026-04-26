import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, ArrowLeft, Package, Truck, CheckCircle2, Clock, MapPin, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/_app/rastreio/$orderId")({
  head: () => ({ meta: [{ title: "Rastreamento do Pedido — Licuri Hub" }] }),
  component: TrackingPage,
});

function TrackingPage() {
  const { orderId } = useParams({ from: "/_app/rastreio/$orderId" });
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [shipment, setShipment] = useState<any>(null);
  const [updates, setUpdates] = useState<any[]>([]);

  useEffect(() => {
    fetchTrackingData();
  }, [orderId]);

  async function fetchTrackingData() {
    try {
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("id", orderId)
        .single();

      if (orderError) throw orderError;
      setOrder(orderData);

      const { data: shipmentData, error: shipmentError } = await supabase
        .from("shipments")
        .select("*")
        .eq("order_id", orderId)
        .single();

      if (shipmentError && shipmentError.code !== "PGRST116") throw shipmentError;
      
      if (shipmentData) {
        setShipment(shipmentData);
        
        const { data: updatesData, error: updatesError } = await supabase
          .from("shipment_updates")
          .select("*")
          .eq("shipment_id", shipmentData.id)
          .order("created_at", { ascending: false });

        if (updatesError) throw updatesError;
        setUpdates(updatesData || []);
      }
    } catch (error: any) {
      console.error("Erro ao carregar rastreio:", error);
    } finally {
      setLoading(false);
    }
  }

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

  const statusMap: any = {
    'paid': { label: 'Pago', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
    'processing': { label: 'Em Processamento', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
    'shipped': { label: 'Enviado', icon: Truck, color: 'text-[var(--clay)]', bg: 'bg-[var(--sand)]' },
    'delivered': { label: 'Entregue', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
    'pending': { label: 'Pendente', icon: Clock, color: 'text-gray-500', bg: 'bg-gray-50' }
  };

  const currentStatus = statusMap[shipment?.status || order.status] || statusMap['pending'];

  return (
    <div className="container-narrow py-8">
      <Link to="/conta" className="flex items-center text-sm text-[var(--muted-foreground)] hover:text-[var(--clay)] mb-8 transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para meus pedidos
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
        <div className="space-y-8">
          <div className="bg-white rounded-3xl border border-[var(--border)] p-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)] mb-1">Rastreamento do Pedido</p>
                <h1 className="font-display text-2xl font-semibold text-[var(--coffee)]">#{order.id.slice(0, 8)}</h1>
              </div>
              <div className={`px-4 py-2 rounded-full ${currentStatus.bg} ${currentStatus.color} flex items-center gap-2 font-semibold text-sm`}>
                <currentStatus.icon className="h-4 w-4" />
                {currentStatus.label}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 rounded-2xl bg-[var(--sand)]/30 border border-[var(--border)]">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)] mb-1">Transportadora</p>
                <p className="text-sm font-semibold text-[var(--coffee)]">{shipment?.carrier || "Aguardando"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)] mb-1">Código de Rastreio</p>
                <p className="text-sm font-mono font-bold text-[var(--clay)]">{shipment?.tracking_code || "---"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)] mb-1">Data da Compra</p>
                <p className="text-sm font-semibold text-[var(--coffee)]">
                  {format(new Date(order.created_at), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)] mb-1">Previsão</p>
                <p className="text-sm font-semibold text-[var(--coffee)]">7-10 dias úteis</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[var(--border)] p-8 shadow-sm">
            <h2 className="font-display text-xl font-semibold text-[var(--coffee)] mb-8 flex items-center gap-2">
              <Package className="h-5 w-5 text-[var(--clay)]" />
              Histórico de Envio
            </h2>

            <div className="space-y-0 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-0.5 before:bg-[var(--border)]">
              {updates.length === 0 ? (
                <div className="pl-12 py-4">
                  <p className="text-sm text-[var(--muted-foreground)] italic">O histórico de rastreamento ficará disponível assim que o pedido for processado.</p>
                </div>
              ) : (
                updates.map((update, index) => (
                  <div key={update.id} className="relative pl-12 pb-8 last:pb-0">
                    <div className={`absolute left-0 top-1.5 w-[36px] h-[36px] -translate-x-1/2 rounded-full border-4 border-white shadow-sm flex items-center justify-center z-10 ${
                      index === 0 ? 'bg-[var(--clay)] text-white' : 'bg-[var(--sand)] text-[var(--muted-foreground)]'
                    }`}>
                      {index === 0 ? <Truck className="h-4 w-4" /> : <div className="w-2 h-2 rounded-full bg-current" />}
                    </div>
                    
                    <div className={index === 0 ? 'bg-[var(--sand)]/30 p-4 rounded-2xl border border-[var(--border)]' : ''}>
                      <p className="text-xs font-bold text-[var(--muted-foreground)] mb-1">
                        {format(new Date(update.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                      </p>
                      <h3 className={`font-semibold ${index === 0 ? 'text-[var(--clay)] text-base' : 'text-[var(--coffee)] text-sm'}`}>
                        {update.description}
                      </h3>
                      {update.location && (
                        <p className="text-xs text-[var(--muted-foreground)] mt-2 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {update.location}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="bg-white rounded-3xl border border-[var(--border)] p-6 shadow-sm">
            <h3 className="font-display text-lg font-semibold mb-4 text-[var(--coffee)]">Detalhes da Entrega</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <MapPin className="h-5 w-5 text-[var(--muted-foreground)] shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold text-[var(--coffee)]">{order.customer_name}</p>
                  <p className="text-[var(--muted-foreground)]">
                    {order.address.street}, {order.address.number}<br />
                    {order.address.neighborhood}<br />
                    {order.address.city} - {order.address.state}<br />
                    CEP: {order.address.zipCode}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[var(--border)] p-6 shadow-sm">
            <h3 className="font-display text-lg font-semibold mb-4 text-[var(--coffee)]">Produtos</h3>
            <div className="space-y-4">
              {order.order_items?.map((item: any) => (
                <div key={item.id} className="flex gap-3">
                  <div className="h-12 w-12 rounded-xl border border-[var(--border)] overflow-hidden shrink-0 bg-[var(--sand)]">
                    <img src={item.image_url} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--coffee)] line-clamp-2">{item.name}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">Qtd: {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {shipment?.carrier && (
            <div className="bg-[var(--sand)]/50 rounded-3xl border border-[var(--border)] p-6 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--muted-foreground)] mb-3">Transportadora</h3>
              <p className="text-sm font-semibold text-[var(--coffee)] mb-1">{shipment.carrier}</p>
              {shipment.carrier === 'Melhor Envio' && (
                <>
                  <p className="text-xs text-[var(--muted-foreground)] mb-4 leading-relaxed">
                    Acompanhe também no site oficial da transportadora.
                  </p>
                  <Button asChild variant="soft" size="sm" className="w-full">
                    <a href="https://melhorenvio.com.br/rastreamento" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center">
                      Site Oficial
                      <ExternalLink className="ml-2 h-3 w-3" />
                    </a>
                  </Button>
                </>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
