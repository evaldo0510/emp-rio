import { createFileRoute } from "@tanstack/react-router";
import { Package, ShoppingBag, Star, TrendingUp, Upload, Loader2, Plus, Wallet, ArrowUpRight } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase, uploadProductImage } from "@/lib/supabase";
import { toast } from "sonner";
import { formatBRL } from "@/lib/products";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [isUploading, setIsUploading] = useState(false);
  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [wallet, setWallet] = useState<any>(null);
  const [sellerProfile, setSellerProfile] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [realOrders, setRealOrders] = useState<any[]>([]);
  const [shipments, setShipments] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    category: "alimentos",
    description: "",
    image_url: "",
    shop_name: "Sertão Natural", // Default shop
    stock_quantity: 10
  });

  const max = Math.max(...sales.map((s) => s.v));

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch Seller Profile
    const { data: profile } = await supabase.from("sellers").select("*").eq('user_id', user.id).maybeSingle();
    setSellerProfile(profile);

    // Fetch products
    const { data: prods } = await supabase.from("products").select("*").eq('vendor_id', user.id).order("created_at", { ascending: false });
    if (prods) setDbProducts(prods);

    // Fetch Wallet
    const { data: walletData } = await supabase.from("seller_wallet").select("*").eq('seller_id', user.id).maybeSingle();
    if (walletData) {
      setWallet(walletData);
      
      // Fetch Transactions
      const { data: txs } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq('wallet_id', walletData.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (txs) setTransactions(txs);
    }

    // Fetch Real Orders (sales)
    const { data: salesData } = await supabase
      .from("order_items")
      .select("*, orders!inner(*)")
      .eq('seller_id', user.id)
      .order("created_at", { ascending: false });
    
    if (salesData) {
      setRealOrders(salesData);
      
      // Fetch Shipments for these orders
      const orderIds = [...new Set(salesData.map(o => o.order_id))];
      if (orderIds.length > 0) {
        const { data: shipData } = await supabase.from("shipments").select("*").in('order_id', orderIds);
        if (shipData) setShipments(shipData);
      }
    }
  };

  const handleRegisterSeller = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("store_name") as string;
    const desc = formData.get("description") as string;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("sellers").insert([{
        user_id: user.id,
        store_name: name,
        description: desc
      }]);

      if (error) throw error;
      toast.success("Perfil enviado para aprovação!");
      fetchDashboardData();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const updateTracking = async (shipmentId: string, code: string) => {
    try {
      const { error } = await supabase
        .from("shipments")
        .update({ tracking_code: code, status: 'shipped' })
        .eq('id', shipmentId);
      
      if (error) throw error;
      toast.success("Rastreio atualizado!");
      fetchDashboardData();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const url = await uploadProductImage(file);
      
      // For demo, create a product with this image
      const { error } = await supabase.from("products").insert([{
        name: "Novo Produto",
        slug: `novo-produto-${Math.random().toString(36).substr(2, 5)}`,
        category: "alimentos",
        price: 0,
        shop: "Sertão Natural",
        region: "Bahia",
        image_url: url,
        short_description: "Descrição curta do novo produto",
      }]);

      if (error) throw error;
      
      toast.success("Imagem enviada e produto criado!");
      fetchDashboardData();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao enviar imagem.");
    } finally {
      setIsUploading(false);
    }
  };

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
        <div className="flex flex-col items-end gap-1">
          <span className="rounded-full border border-[var(--border)] bg-[var(--cream)] px-3 py-1 text-xs">
            {sellerProfile?.store_name || "Vendedor não cadastrado"}
          </span>
          {sellerProfile && !sellerProfile.approved && (
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              Aguardando Aprovação
            </span>
          )}
        </div>
      </header>

      {!sellerProfile && (
        <div className="mt-8 rounded-2xl border border-[var(--clay)]/20 bg-[var(--sand)]/10 p-10 text-center">
          <h2 className="font-display text-2xl font-semibold text-[var(--coffee)] mb-2">Torne-se um Vendedor</h2>
          <p className="text-[var(--muted-foreground)] mb-8">Cadastre sua loja ou associação para começar a vender no Licuri Hub.</p>
          <form onSubmit={handleRegisterSeller} className="max-w-md mx-auto space-y-4 text-left">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Nome da Loja</label>
              <input name="store_name" required className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 outline-none focus:border-[var(--clay)]" placeholder="Ex: Cooperativa Sertão Vivo" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Descrição / História</label>
              <textarea name="description" required className="w-full h-24 rounded-xl border border-[var(--border)] bg-white px-4 py-3 outline-none focus:border-[var(--clay)]" placeholder="Conte um pouco sobre sua produção..." />
            </div>
            <Button type="submit" variant="hero" className="w-full">Enviar para Avaliação</Button>
          </form>
        </div>
      )}

      {sellerProfile && (
        <>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <Stat icon={TrendingUp} label="Vendas Brutas" value={formatBRL(realOrders.reduce((acc, o) => acc + (o.price * o.quantity), 0))} />
            <Stat icon={ShoppingBag} label="Pedidos" value={realOrders.length.toString()} />
            <Stat icon={Package} label="Produtos" value={dbProducts.length.toString()} />
            <Stat icon={Star} label="Saldo Disponível" value={formatBRL(wallet?.balance || 0)} />
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
          <h2 className="font-display text-lg font-semibold">Vendas Recentes</h2>
          <ul className="mt-4 divide-y divide-[var(--border)]">
            {realOrders.length === 0 ? (
              <p className="py-4 text-sm text-[var(--muted-foreground)]">Nenhuma venda realizada ainda.</p>
            ) : (
              realOrders.slice(0, 5).map((o) => (
                <li key={o.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <div className="font-semibold line-clamp-1">{o.name}</div>
                    <div className="text-xs text-[var(--muted-foreground)]">{new Date(o.created_at).toLocaleDateString()}</div>
      </div>

      <div className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="font-display text-lg font-semibold mb-4">Histórico da Carteira</h2>
        {transactions.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">Nenhuma transação registrada.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] uppercase tracking-widest text-[var(--muted-foreground)] border-b border-[var(--border)]">
                <tr>
                  <th className="pb-3 font-bold">Data</th>
                  <th className="pb-3 font-bold">Tipo</th>
                  <th className="pb-3 font-bold">Descrição</th>
                  <th className="pb-3 font-bold text-right">Valor Líquido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {transactions.map(tx => (
                  <tr key={tx.id}>
                    <td className="py-3">{new Date(tx.created_at).toLocaleDateString()}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${tx.type === 'sale' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {tx.type === 'sale' ? 'VENDA' : 'SAQUE'}
                      </span>
                    </td>
                    <td className="py-3 text-[var(--muted-foreground)]">{tx.description}</td>
                    <td className={`py-3 text-right font-bold ${tx.amount >= 0 ? 'text-[var(--leaf)]' : 'text-red-600'}`}>
                      {formatBRL(tx.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
                  <div className="text-right">
                    <div className="font-medium">{formatBRL(o.price * o.quantity)}</div>
                    <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--leaf)]">
                      {o.orders.status}
                    </span>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-lg font-semibold">Meus Produtos</h2>
          <Button variant="hero" size="sm" onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="mr-2 h-4 w-4" />
            {showAddForm ? "Cancelar" : "Novo Produto"}
          </Button>
        </div>

        {showAddForm && (
          <div className="mb-8 p-6 rounded-xl border border-[var(--clay)]/20 bg-[var(--sand)]/30">
            <h3 className="font-display text-md font-semibold mb-4 text-[var(--coffee)]">Cadastrar Novo Item</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Nome do Produto</label>
                <input 
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--clay)]"
                  placeholder="Ex: Óleo de Licuri Premium"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Preço (R$)</label>
                <input 
                  type="number"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                  className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--clay)]"
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Loja / Associação</label>
                <input 
                  value={newProduct.shop_name}
                  onChange={(e) => setNewProduct({...newProduct, shop_name: e.target.value})}
                  className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--clay)]"
                  placeholder="Nome da sua loja ou associação"
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Descrição</label>
                <textarea 
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                  className="w-full h-24 rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--clay)]"
                  placeholder="Descreva as qualidades e origem do produto..."
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Imagem (Upload ou URL)</label>
                <div className="flex gap-2">
                  <input 
                    value={newProduct.image_url}
                    onChange={(e) => setNewProduct({...newProduct, image_url: e.target.value})}
                    className="flex-1 rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--clay)]"
                    placeholder="https://..."
                  />
                  <label className="cursor-pointer">
                    <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" disabled={isUploading} />
                    <Button variant="soft" disabled={isUploading}>
                      {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    </Button>
                  </label>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button 
                variant="hero" 
                onClick={async () => {
                  try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) throw new Error("Você precisa estar logado para cadastrar produtos.");
                    
                    const { error } = await supabase.from("products").insert([{
                      ...newProduct,
                      price: parseFloat(newProduct.price),
                      slug: newProduct.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''),
                      region: "Bahia",
                      vendor_id: user.id
                    }]);
                    if (error) throw error;
                    toast.success("Produto cadastrado com sucesso!");
                    setShowAddForm(false);
                    fetchDashboardData();
                  } catch (e: any) {
                    toast.error("Erro ao salvar: " + e.message);
                  }
                }}
              >
                Salvar Produto
              </Button>
            </div>
          </div>
        )}

        {dbProducts.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-[var(--muted-foreground)]">
            <Package className="h-10 w-10 mb-2 opacity-20" />
            <p>Nenhum produto cadastrado no banco ainda.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {dbProducts.map((p) => (
              <div key={p.id} className="group relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--background)]">
                <div className="aspect-square overflow-hidden bg-[var(--sand)]">
                  <img src={p.image_url} alt={p.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  {!p.is_published && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-4 text-center">
                      <span className="text-[10px] font-bold text-white uppercase tracking-widest bg-amber-600 px-2 py-1 rounded">Aguardando Aprovação do Vendedor</span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-sm text-[var(--coffee)] truncate">{p.name}</h3>
                  <p className="text-xs text-[var(--muted-foreground)]">{formatBRL(p.price)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="mt-10 text-xs text-[var(--muted-foreground)]">
        Dados de demonstração. Cadastro de produtos, gestão de pedidos e métricas em tempo real
         seriam ativados quando o backend (Lovable Cloud) estiver conectado.
      </p>

      {realOrders.length > 0 && (
        <div className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="font-display text-lg font-semibold mb-6">Gestão de Envios</h2>
          <div className="space-y-4">
            {realOrders.filter(o => o.orders.status === 'paid').map(order => {
              const shipment = shipments.find(s => s.order_id === order.order_id);
              return (
                <div key={order.id} className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--sand)]/20">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg overflow-hidden border border-[var(--border)]">
                      <img src={order.image_url} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[var(--coffee)]">{order.name}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">Pedido #{order.order_id.slice(0, 8)}</p>
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-[200px]">
                    {shipment?.tracking_code ? (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold uppercase">Enviado</span>
                        <span className="font-mono text-[var(--muted-foreground)]">{shipment.tracking_code}</span>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input 
                          id={`track-${order.id}`}
                          placeholder="Código de rastreio" 
                          className="flex-1 rounded-md border border-[var(--border)] bg-white px-3 py-1.5 text-xs outline-none focus:border-[var(--clay)]" 
                        />
                        <Button 
                          size="sm" 
                          variant="soft"
                          onClick={() => {
                            const input = document.getElementById(`track-${order.id}`) as HTMLInputElement;
                            if (input?.value && shipment) updateTracking(shipment.id, input.value);
                          }}
                        >
                          Salvar
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>)}
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
