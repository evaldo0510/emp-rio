import { createFileRoute } from "@tanstack/react-router";
import { Package, ShoppingBag, Star, TrendingUp, Upload, Loader2, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase, uploadProductImage } from "@/lib/supabase";
import { toast } from "sonner";
import { formatBRL } from "@/lib/products";

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
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    category: "alimentos",
    description: "",
    image_url: "",
    shop: "Sertão Natural", // Default shop
  });

  const max = Math.max(...sales.map((s) => s.v));

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    if (data) setDbProducts(data);
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
      fetchProducts();
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
                  value={newProduct.shop}
                  onChange={(e) => setNewProduct({...newProduct, shop: e.target.value})}
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
                    const { error } = await supabase.from("products").insert([{
                      ...newProduct,
                      price: parseFloat(newProduct.price),
                      slug: newProduct.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''),
                      region: "Bahia",
                      seller_id: user?.id
                    }]);
                    if (error) throw error;
                    toast.success("Produto cadastrado com sucesso!");
                    setShowAddForm(false);
                    fetchProducts();
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
