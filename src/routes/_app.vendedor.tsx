import { createFileRoute, useNavigate, Link, Outlet } from "@tanstack/react-router";
import { z } from "zod";
import {
  Package,
  ShoppingBag,
  Star,
  TrendingUp,
  Upload,
  Loader2,
  Plus,
  Wallet,
  ArrowUpRight,
  Share2,
  Tag,
  Megaphone,
  Layout,
  FileText,
} from "lucide-react";
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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

const VALID_VENDOR_PERIODS = ["7", "30"] as const;

const vendorSearchSchema = z.object({
  period: z.enum(VALID_VENDOR_PERIODS).optional(),
});

export const Route = createFileRoute("/_app/vendedor")({
  validateSearch: (search: Record<string, unknown>) => {
    const result = vendorSearchSchema.safeParse(search);
    if (result.success) return result.data;
    if (typeof window !== "undefined" && search.period) {
      console.warn(`[vendedor] period inválido "${search.period}" — usando padrão.`);
    }
    return { period: undefined };
  },
  head: () => ({ meta: [{ title: "Painel do Vendedor — Empório do Licuri" }] }),
  component: VendorDashboard,
});

// Constants for mock data removed. Using real database data.

export function VendorDashboard() {
  const navigate = useNavigate({ from: Route.fullPath });
  const { period: urlPeriod } = Route.useSearch();
  const period = urlPeriod || "7";

  const [isUploading, setIsUploading] = useState(false);
  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [wallet, setWallet] = useState<any>(null);
  const [sellerProfile, setSellerProfile] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [realOrders, setRealOrders] = useState<any[]>([]);
  const [shipments, setShipments] = useState<any[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    category: "alimentos",
    description: "",
    image_url: "",
    shop_name: "",
    stock_quantity: 10,
  });

  const [isGeneratingLogo, setIsGeneratingLogo] = useState(false);
  const [logoInsight, setLogoInsight] = useState<any>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Form persistence for mobile/refresh
  const [regData, setRegData] = useState(() => {
    if (typeof window === "undefined") return { type: "store", name: "", desc: "" };
    const saved = localStorage.getItem("vendor_reg_draft");
    return saved ? JSON.parse(saved) : { type: "store", name: "", desc: "" };
  });

  useEffect(() => {
    localStorage.setItem("vendor_reg_draft", JSON.stringify(regData));
  }, [regData]);

  const [dailySales, setDailySales] = useState<any[]>([]);
  const maxSales = Math.max(...dailySales.map((s) => s.v), 1);

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  const fetchDashboardData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch Seller Profile
    const { data: profile } = await supabase
      .from("sellers")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    setSellerProfile(profile);
    if (profile && !newProduct.shop_name) {
      setNewProduct((prev) => ({ ...prev, shop_name: profile.store_name }));
    }

    // Fetch products
    const { data: prods } = await supabase
      .from("products")
      .select("*")
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false });
    if (prods) setDbProducts(prods);

    // Fetch Wallet
    const { data: walletData } = await supabase
      .from("seller_wallet")
      .select("*")
      .eq("seller_id", user.id)
      .maybeSingle();
    if (walletData) {
      setWallet(walletData);

      // Fetch Transactions
      const { data: txs } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("wallet_id", walletData.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (txs) setTransactions(txs);
    }

    // Fetch Real Orders (sales)
    const { data: salesData } = await supabase
      .from("order_items")
      .select("*, orders!inner(*)")
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false });

    if (salesData) {
      setRealOrders(salesData);

      // Calculate daily sales for chart (based on period)
      const numDays = parseInt(period);
      const days = [...Array(numDays)]
        .map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
        })
        .reverse();

      const dailyTotals = days.map((day) => {
        const total = salesData
          .filter(
            (o) =>
              o.created_at &&
              new Date(o.created_at).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
              }) === day,
          )
          .reduce((acc, o) => acc + (Number(o.net_amount) || Number(o.price) * o.quantity), 0);
        return { day, v: total };
      });
      setDailySales(dailyTotals);

      // Fetch Shipments for these orders
      const orderIds = [...new Set(salesData.map((o) => o.order_id))].filter(
        (id): id is string => id !== null,
      );
      if (orderIds.length > 0) {
        const { data: shipData } = await supabase
          .from("shipments")
          .select("*")
          .in("order_id", orderIds);
        if (shipData) setShipments(shipData);
      }
    }

    // Fetch Withdrawal Requests
    const { data: withdrawals } = await supabase
      .from("withdrawal_requests")
      .select("*")
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false });
    if (withdrawals) setWithdrawalRequests(withdrawals);
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);

    if (!amount || amount <= 0) {
      toast.error("Insira um valor válido para o saque.");
      return;
    }

    if (amount > (wallet?.balance || 0)) {
      toast.error("Saldo insuficiente para este valor.");
      return;
    }

    if (!pixKey) {
      toast.error("Informe sua chave PIX para o recebimento.");
      return;
    }

    try {
      setIsSubmittingWithdraw(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("withdrawal_requests").insert([
        {
          seller_id: user.id,
          amount,
          pix_key: pixKey,
          status: "pending",
        },
      ]);

      if (error) throw error;

      toast.success("Solicitação de saque enviada com sucesso!");
      setIsWithdrawOpen(false);
      setWithdrawAmount("");
      setPixKey("");
      fetchDashboardData();
    } catch (e: any) {
      toast.error("Erro ao solicitar saque: " + e.message);
    } finally {
      setIsSubmittingWithdraw(false);
    }
  };

  const handleRegisterSeller = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("store_name") as string;
    const desc = formData.get("description") as string;
    const type = formData.get("seller_type") as string;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("sellers").insert([
        {
          user_id: user.id,
          store_name: name,
          description: desc,
          seller_type: type,
          approved: false,
          commission_rate: 0.15,
        },
      ]);

      if (error) throw error;
      localStorage.removeItem("vendor_reg_draft");
      setRegData({ type: "store", name: "", desc: "" });
      toast.success("Perfil enviado para aprovação!");
      fetchDashboardData();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const updateOrderItemStatus = async (itemId: string, status: string) => {
    try {
      const { error } = await supabase.from("order_items").update({ status }).eq("id", itemId);

      if (error) throw error;

      // If status is "shipped", ensure a shipment record exists or update it
      if (status === "shipped") {
        const item = realOrders.find((o) => o.id === itemId);
        if (item) {
          const existingShipment = shipments.find((s) => s.order_id === item.order_id);
          if (!existingShipment) {
            await supabase.from("shipments").insert([
              {
                order_id: item.order_id,
                status: "shipped",
              },
            ]);
          }
        }
      }

      toast.success("Status do item atualizado!");
      fetchDashboardData();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const updateShipmentStatus = async (
    shipmentId: string,
    status: string,
    trackingCode?: string,
  ) => {
    try {
      const updateData: any = { status };
      if (trackingCode) updateData.tracking_code = trackingCode;

      const { error } = await supabase.from("shipments").update(updateData).eq("id", shipmentId);

      if (error) throw error;
      toast.success("Status de envio atualizado!");
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
      const { error } = await supabase.from("products").insert([
        {
          name: "Novo Produto",
          slug: `novo-produto-${Math.random().toString(36).substr(2, 5)}`,
          category: "alimentos",
          price: 0,
          shop: "Sertão Natural",
          region: "Bahia",
          image_url: url,
          short_description: "Descrição curta do novo produto",
        },
      ]);

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

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success("Link do seu painel copiado!");
  };

  return (
    <div className="container-narrow py-10">
      <Outlet />
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-primary font-bold">
            Portal do Produtor
          </p>
          <h1 className="font-display text-3xl font-semibold text-[var(--coffee)] md:text-4xl uppercase mt-2">
            Dashboard
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="mr-2 h-4 w-4" />
            Compartilhar Loja
          </Button>
          <div className="flex flex-col items-end gap-1">
            <span className="rounded-full border border-[var(--border)] bg-[var(--cream)] px-3 py-1 text-xs font-bold text-[var(--coffee)]">
              {sellerProfile?.store_name || "Visitante"}
            </span>
            {sellerProfile && !sellerProfile.approved && (
              <div className="flex flex-col items-end gap-1">
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Fase de Avaliação
                </span>
                <span className="text-[9px] text-amber-700 max-w-[150px] text-right leading-tight">
                  Seu perfil está em análise. O marketplace e o selo de curadoria serão liberados após a aprovação.
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {!sellerProfile && (
        <div className="mt-8 space-y-12">
          {/* Seção de Login para quem já é vendedor */}
          <div className="rounded-2xl border border-[var(--border)] bg-white p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <h2 className="font-display text-xl font-semibold text-[var(--coffee)] mb-2">
                Já é um parceiro?
              </h2>
              <p className="text-sm text-[var(--muted-foreground)]">
                Acesse seu painel para gerenciar seus produtos, pedidos e finanças.
              </p>
            </div>
            <Button asChild variant="soft" className="shrink-0">
              <Link to="/vendedor/login">Acessar Painel do Vendedor</Link>
            </Button>
          </div>

          {/* Formulário de Registro */}
          <div id="registro" className="rounded-2xl border border-[var(--clay)]/20 bg-[var(--sand)]/10 p-10 text-center scroll-mt-24">
            <h2 className="font-display text-2xl font-semibold text-[var(--coffee)] mb-2">
              Seja um Produtor Parceiro
            </h2>
            <p className="text-[var(--muted-foreground)] mb-8">
              Cadastre sua loja, associação ou cooperativa e conecte-se a consumidores que valorizam a origem e a sustentabilidade.
            </p>
            <div className="max-w-2xl mx-auto mb-10 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                "Vitrine Digital", "Divulgação", "Gestão de Pedidos", "Campanhas"
              ].map(benefit => (
                <div key={benefit} className="bg-white/50 rounded-xl p-3 border border-[var(--clay)]/10 text-[10px] font-bold uppercase tracking-wider text-[var(--coffee)]">
                  {benefit}
                </div>
              ))}
            </div>
            <form onSubmit={handleRegisterSeller} className="max-w-md mx-auto space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
                  Tipo de Empreendimento
                </label>
                <select
                  name="seller_type"
                  required
                  value={regData.type}
                  onChange={(e) => setRegData({ ...regData, type: e.target.value })}
                  className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 outline-none focus:border-[var(--clay)] text-sm"
                >
                  <option value="store">Loja / Comércio</option>
                  <option value="association">Associação</option>
                  <option value="cooperative">Cooperativa</option>
                  <option value="individual">Produtor Individual</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
                  Nome do Empreendimento
                </label>
                <input
                  name="store_name"
                  required
                  value={regData.name}
                  onChange={(e) => setRegData({ ...regData, name: e.target.value })}
                  className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 outline-none focus:border-[var(--clay)]"
                  placeholder="Ex: Cooperativa Sertão Vivo"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
                  Descrição / História
                </label>
                <textarea
                  name="description"
                  required
                  value={regData.desc}
                  onChange={(e) => setRegData({ ...regData, desc: e.target.value })}
                  className="w-full h-24 rounded-xl border border-[var(--border)] bg-white px-4 py-3 outline-none focus:border-[var(--clay)]"
                  placeholder="Conte um pouco sobre sua produção..."
                />
              </div>
              <Button type="submit" variant="hero" className="w-full">
                Enviar para Avaliação
              </Button>
            </form>
          </div>
        </div>
      )}

      {sellerProfile && (
        <>
          {/* Painel Administrador Mockup */}
          <div className="mt-8 mb-12 p-8 rounded-3xl border border-[var(--border)] bg-white shadow-sm">
            <h2 className="font-display text-xl font-bold text-[var(--coffee)] uppercase mb-6 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> Painel Central
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[10px] font-bold uppercase tracking-widest text-[var(--sertao)]">
              {[
                "Vendas", "Pedidos", "Clientes", "Produtores", "Comissões", "Estoque", "Sementes", "Financeiro"
              ].map(item => (
                <div key={item} className="p-3 bg-[var(--cream)] rounded-xl border border-[var(--border)] text-center">
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Módulo de Marketing e Campanhas (Produtor) */}
          <div className="mt-8 p-8 rounded-3xl border border-[var(--border)] bg-[var(--cream)]/30">
            <h2 className="font-display text-xl font-bold text-[var(--coffee)] uppercase mb-6 flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" /> Marketing & Campanhas
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-6 rounded-2xl bg-white border border-[var(--border)] shadow-sm">
                <Tag className="h-6 w-6 text-primary mb-3" />
                <h3 className="font-bold text-sm text-[var(--coffee)] uppercase mb-1">Cupons Ativos</h3>
                <div className="space-y-2 mt-3">
                  {["LICURI10", "BAHIA20", "PRIMEIRACOMPRA"].map(coupon => (
                    <div key={coupon} className="flex items-center justify-between text-[10px] font-mono border-b border-[var(--border)] pb-1">
                      <span>{coupon}</span>
                      <span className="text-green-600 font-bold">ATIVO</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-6 rounded-2xl bg-white border border-[var(--border)] shadow-sm">
                <Layout className="h-6 w-6 text-primary mb-3" />
                <h3 className="font-bold text-sm text-[var(--coffee)] uppercase mb-1">Vitrines & Banners</h3>
                <p className="text-[10px] text-[var(--muted-foreground)]">Gerencie como sua loja aparece no marketplace.</p>
                <Button variant="soft" size="sm" className="w-full mt-4 text-[10px]">Configurar</Button>
              </div>
              <div className="p-6 rounded-2xl bg-white border border-[var(--border)] shadow-sm">
                <FileText className="h-6 w-6 text-primary mb-3" />
                <h3 className="font-bold text-sm text-[var(--coffee)] uppercase mb-1">Conteúdo & Blog</h3>
                <p className="text-[10px] text-[var(--muted-foreground)]">Crie histórias para engajar seus clientes.</p>
                <Button variant="soft" size="sm" className="w-full mt-4 text-[10px]">Escrever Artigo</Button>
              </div>
            </div>
          </div>

          {/* Logo Generation Tool */}
          <div className="mt-8 rounded-2xl border border-[var(--clay)]/20 bg-[var(--sand)]/5 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-semibold text-[var(--coffee)]">
                Branding & Logo Insights (IA)
              </h2>
              <span className="text-[10px] bg-[var(--clay)]/10 text-[var(--clay)] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">
                Experimental
              </span>
            </div>
            <p className="text-sm text-[var(--muted-foreground)] mb-6">
              Use nossa inteligência artificial para obter sugestões de cores, símbolos e conceitos
              espirituais para a identidade da sua loja baseada no Licuri.
            </p>

            <div className="flex gap-2">
              <Input
                id="logo-prompt"
                placeholder="Ex: Uma cooperativa de mulheres focada em cosméticos naturais e sustentabilidade..."
                className="flex-1 rounded-xl border-[var(--border)] focus:border-[var(--clay)] bg-white"
              />
              <Button
                variant="hero"
                disabled={isGeneratingLogo}
                onClick={async () => {
                  const prompt = (document.getElementById("logo-prompt") as HTMLInputElement)
                    ?.value;
                  if (!prompt) {
                    toast.error("Por favor, descreva sua loja para gerar os insights.");
                    return;
                  }

                  try {
                    setIsGeneratingLogo(true);
                    setGenerationError(null);

                    const { data, error } = await supabase.functions.invoke(
                      "logos-spiritual-insight",
                      {
                        body: { prompt, model: "gemini-1.5-flash" },
                      },
                    );

                    if (error) throw error;

                    setLogoInsight(data);
                    toast.success("Insights gerados com sucesso!");
                  } catch (e: any) {
                    console.error("Erro na geração de logo:", e);
                    // Return detailed error message as requested
                    const detailedError =
                      e.message || (e.details ? JSON.stringify(e.details) : "Erro desconhecido");
                    setGenerationError(`Falha na geração: ${detailedError}`);
                    toast.error("Falha ao gerar insights da marca.");
                  } finally {
                    setIsGeneratingLogo(false);
                  }
                }}
              >
                {isGeneratingLogo ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  "Gerar Insights"
                )}
              </Button>
            </div>

            {generationError && (
              <div className="mt-4 p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm">
                <p className="font-bold mb-1">Ops! Ocorreu um erro no Gateway de IA:</p>
                <p className="font-mono text-xs overflow-auto max-h-20">{generationError}</p>
                <p className="mt-2 text-xs">
                  Tentamos usar modelos de fallback, mas o serviço está temporariamente instável.
                  Por favor, tente novamente em instantes.
                </p>
              </div>
            )}

            {logoInsight && (
              <div className="mt-6 p-6 rounded-xl border border-[var(--clay)]/20 bg-white animate-in fade-in slide-in-from-top-4 duration-500">
                <h3 className="font-display font-semibold text-[var(--coffee)] mb-4 flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500" />
                  Sugestão de Identidade Visual
                </h3>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-[10px] uppercase tracking-widest font-bold text-[var(--muted-foreground)] mb-1">
                        Conceito e Descrição
                      </h4>
                      <p className="text-sm text-[var(--coffee)] leading-relaxed">
                        {logoInsight.description}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-[10px] uppercase tracking-widest font-bold text-[var(--muted-foreground)] mb-1">
                        Símbolos Recomendados
                      </h4>
                      <p className="text-sm text-[var(--coffee)]">{logoInsight.symbols}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-[10px] uppercase tracking-widest font-bold text-[var(--muted-foreground)] mb-1">
                        Paleta de Cores
                      </h4>
                      <div className="flex gap-2 mt-2">
                        {logoInsight.colors && Array.isArray(logoInsight.colors) ? (
                          logoInsight.colors.map((color: string, i: number) => (
                            <div key={i} className="group relative">
                              <div
                                className="h-8 w-8 rounded-full border border-[var(--border)] shadow-sm"
                                style={{ backgroundColor: color }}
                              />
                              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white px-1 rounded">
                                {color}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm">{logoInsight.colors}</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-[10px] uppercase tracking-widest font-bold text-[var(--muted-foreground)] mb-1">
                        Racional do Design
                      </h4>
                      <p className="text-sm italic text-[var(--muted-foreground)]">
                        "{logoInsight.rationale}"
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <Stat
              icon={TrendingUp}
              label="Vendas Líquidas"
              value={formatBRL(
                realOrders.reduce(
                  (acc, o) => acc + (Number(o.net_amount) || o.price * o.quantity),
                  0,
                ),
              )}
            />
            <Stat icon={ShoppingBag} label="Pedidos" value={realOrders.length.toString()} />
            <Stat icon={Package} label="Produtos" value={dbProducts.length.toString()} />
            <Stat icon={Star} label="Saldo Disponível" value={formatBRL(wallet?.balance || 0)}>
              <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-[10px] uppercase tracking-widest text-[var(--clay)] hover:bg-[var(--clay)]/10"
                  >
                    <ArrowUpRight className="mr-1 h-3 w-3" />
                    Sacar
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle className="font-display text-xl text-[var(--coffee)]">
                      Solicitar Saque
                    </DialogTitle>
                    <DialogDescription>
                      O valor será transferido para sua chave PIX após aprovação.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleWithdraw} className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="balance"
                        className="text-xs uppercase tracking-widest text-[var(--muted-foreground)]"
                      >
                        Saldo Atual
                      </Label>
                      <div className="text-xl font-bold text-[var(--leaf)]">
                        {formatBRL(wallet?.balance || 0)}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="amount"
                        className="text-xs uppercase tracking-widest text-[var(--muted-foreground)]"
                      >
                        Valor do Saque (R$)
                      </Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="rounded-xl border-[var(--border)] focus:border-[var(--clay)]"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="pix"
                        className="text-xs uppercase tracking-widest text-[var(--muted-foreground)]"
                      >
                        Chave PIX para Recebimento
                      </Label>
                      <Input
                        id="pix"
                        placeholder="CPF, E-mail, Celular ou Chave Aleatória"
                        value={pixKey}
                        onChange={(e) => setPixKey(e.target.value)}
                        className="rounded-xl border-[var(--border)] focus:border-[var(--clay)]"
                        required
                      />
                    </div>
                    <DialogFooter>
                      <Button
                        type="submit"
                        variant="hero"
                        className="w-full"
                        disabled={isSubmittingWithdraw}
                      >
                        {isSubmittingWithdraw ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          "Confirmar Solicitação"
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </Stat>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)] mb-3">
                Status dos Pedidos
              </h3>
              <div className="space-y-2">
                {[
                  {
                    label: "Pendentes",
                    count: realOrders.filter((o) => o.status === "pending").length,
                    color: "text-amber-600",
                  },
                  {
                    label: "Preparando",
                    count: realOrders.filter((o) => o.status === "processing").length,
                    color: "text-blue-600",
                  },
                  {
                    label: "Enviados",
                    count: realOrders.filter((o) => o.status === "shipped").length,
                    color: "text-indigo-600",
                  },
                  {
                    label: "Entregues",
                    count: realOrders.filter((o) => o.status === "delivered").length,
                    color: "text-green-600",
                  },
                ].map((s) => (
                  <div key={s.label} className="flex justify-between items-center text-sm">
                    <span className="text-[var(--muted-foreground)]">{s.label}</span>
                    <span className={`font-bold ${s.color}`}>{s.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-2 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
                  Vendas por Período
                </h3>
                <select
                  value={period}
                  onChange={(e) => navigate({ search: (prev: any) => ({ ...prev, period: e.target.value as any }) })}
                  className="text-[10px] uppercase border border-[var(--border)] rounded px-2 py-1 bg-transparent"
                >
                  <option value="7">Últimos 7 dias</option>
                  <option value="30">Últimos 30 dias</option>
                </select>
              </div>
              <div className="h-40 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailySales}>
                    <defs>
                      <linearGradient id="colorSalesV" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--clay)" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="var(--clay)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis 
                      dataKey="day" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }} 
                    />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--card)', 
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '11px'
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="v" 
                      name="Vendas"
                      stroke="var(--clay)" 
                      fillOpacity={1} 
                      fill="url(#colorSalesV)" 
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-[1.6fr_1fr]">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
              <h2 className="font-display text-lg font-semibold">Vendas Recentes</h2>
              <ul className="mt-4 divide-y divide-[var(--border)]">
                {realOrders.length === 0 ? (
                  <p className="py-4 text-sm text-[var(--muted-foreground)]">
                    Nenhuma venda realizada ainda.
                  </p>
                ) : (
                  realOrders.slice(0, 5).map((o) => (
                    <li key={o.id} className="flex items-center justify-between py-3 text-sm">
                      <div>
                        <div className="font-semibold line-clamp-1">{o.name}</div>
                        <div className="text-xs text-[var(--muted-foreground)]">
                          {new Date(o.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatBRL(o.price * o.quantity)}</div>
                        <select
                          value={o.status || "pending"}
                          onChange={(e) => updateOrderItemStatus(o.id, e.target.value)}
                          className="text-[10px] uppercase tracking-[0.18em] text-[var(--leaf)] bg-transparent border-none outline-none cursor-pointer"
                        >
                          <option value="pending">Pendente</option>
                          <option value="processing">Preparando</option>
                          <option value="shipped">Enviado</option>
                          <option value="paid">Pago (Liberar Saldo)</option>
                          <option value="delivered">Entregue</option>
                          <option value="cancelled">Cancelado</option>
                        </select>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
            <h2 className="font-display text-lg font-semibold mb-4">Histórico da Carteira</h2>
            {transactions.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">
                Nenhuma transação registrada.
              </p>
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
                    {transactions.map((tx) => (
                      <tr key={tx.id}>
                        <td className="py-3">{new Date(tx.created_at).toLocaleDateString()}</td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${tx.type === "sale" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}
                          >
                            {tx.type === "sale" ? "VENDA" : "SAQUE"}
                          </span>
                        </td>
                        <td className="py-3 text-[var(--muted-foreground)]">{tx.description}</td>
                        <td
                          className={`py-3 text-right font-bold ${tx.amount >= 0 ? "text-[var(--leaf)]" : "text-red-600"}`}
                        >
                          {formatBRL(tx.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {withdrawalRequests.length > 0 && (
            <div className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
              <h2 className="font-display text-lg font-semibold mb-4">Solicitações de Saque</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-[10px] uppercase tracking-widest text-[var(--muted-foreground)] border-b border-[var(--border)]">
                    <tr>
                      <th className="pb-3 font-bold">Data</th>
                      <th className="pb-3 font-bold">Valor</th>
                      <th className="pb-3 font-bold">Chave PIX</th>
                      <th className="pb-3 font-bold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {withdrawalRequests.map((req) => (
                      <tr key={req.id}>
                        <td className="py-3">{new Date(req.created_at).toLocaleDateString()}</td>
                        <td className="py-3 font-bold">{formatBRL(req.amount)}</td>
                        <td className="py-3 text-[var(--muted-foreground)]">{req.pix_key}</td>
                        <td className="py-3 text-right">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              req.status === "approved"
                                ? "bg-green-100 text-green-700"
                                : req.status === "rejected"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {req.status === "approved"
                              ? "APROVADO"
                              : req.status === "rejected"
                                ? "RECUSADO"
                                : "PENDENTE"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-lg font-semibold uppercase tracking-wider">Meus Produtos</h2>
              <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
                <DialogTrigger asChild>
                  <Button variant="hero" size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Cadastrar Produto
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Novo Produto</DialogTitle>
                    <DialogDescription>
                      Preencha as informações detalhadas para que seu produto se destaque.
                    </DialogDescription>
                  </DialogHeader>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      try {
                        const {
                          data: { user },
                        } = await supabase.auth.getUser();
                        if (!user) return;
                        const { error } = await supabase.from("products").insert([
                          {
                            ...newProduct,
                            price: parseFloat(newProduct.price),
                            seller_id: user.id,
                            slug: newProduct.name
                              .toLowerCase()
                              .replace(/ /g, "-")
                              .replace(/[^\w-]+/g, ""),
                            active: true,
                            is_draft: false,
                          },
                        ]);
                        if (error) throw error;
                        toast.success("Produto enviado para análise!");
                        setShowAddForm(false);
                        fetchDashboardData();
                      } catch (e: any) {
                        toast.error(e.message);
                      }
                    }}
                    className="space-y-6 py-4"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nome do Produto</Label>
                        <Input
                          value={newProduct.name}
                          onChange={(e) =>
                            setNewProduct({ ...newProduct, name: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Categoria</Label>
                        <select
                          className="w-full h-10 px-3 rounded-md border border-input bg-background"
                          value={newProduct.category}
                          onChange={(e) =>
                            setNewProduct({ ...newProduct, category: e.target.value })
                          }
                        >
                          <option value="alimentos">Alimentos</option>
                          <option value="farinhas">Farinhas</option>
                          <option value="oleos">Óleos</option>
                          <option value="cosmeticos">Cosméticos</option>
                          <option value="artesanato">Artesanato</option>
                          <option value="bebidas">Bebidas</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Preço (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={newProduct.price}
                          onChange={(e) =>
                            setNewProduct({ ...newProduct, price: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Estoque</Label>
                        <Input
                          type="number"
                          value={newProduct.stock_quantity}
                          onChange={(e) =>
                            setNewProduct({
                              ...newProduct,
                              stock_quantity: parseInt(e.target.value),
                            })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Peso (g)</Label>
                        <Input type="number" placeholder="Ex: 500" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Descrição Completa</Label>
                      <textarea
                        className="w-full h-24 p-3 rounded-md border border-input bg-background"
                        value={newProduct.description}
                        onChange={(e) =>
                          setNewProduct({ ...newProduct, description: e.target.value })
                        }
                        placeholder="Descreva a origem, ingredientes e benefícios..."
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                        <Label>Origem (Comunidade/Cidade)</Label>
                        <Input placeholder="Ex: Comunidade Quilombola..." />
                      </div>
                      <div className="space-y-2">
                        <Label>Validade</Label>
                        <Input placeholder="Ex: 12 meses" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>URL da Imagem</Label>
                      <div className="flex gap-2">
                        <Input
                          type="url"
                          value={newProduct.image_url}
                          onChange={(e) =>
                            setNewProduct({ ...newProduct, image_url: e.target.value })
                          }
                          placeholder="Link da foto do produto"
                          required
                        />
                         <label className="cursor-pointer">
                          <input
                            type="file"
                            className="hidden"
                            onChange={handleFileUpload}
                            accept="image/*"
                            disabled={isUploading}
                          />
                          <Button variant="soft" disabled={isUploading} type="button">
                            {isUploading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Upload className="h-4 w-4" />
                            )}
                          </Button>
                        </label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" variant="hero" className="w-full">
                        Cadastrar e Enviar para Análise
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {dbProducts.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-[var(--muted-foreground)]">
                <Package className="h-10 w-10 mb-2 opacity-20" />
                <p>Nenhum produto cadastrado no banco ainda.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {dbProducts.map((p) => (
                  <div
                    key={p.id}
                    className="group relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--background)]"
                  >
                    <div className="aspect-square overflow-hidden bg-[var(--sand)] relative">
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute top-2 right-2">
                        <span className="text-[8px] font-bold text-white uppercase tracking-widest bg-amber-600 px-2 py-0.5 rounded shadow-sm">
                          Em Análise
                        </span>
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="font-bold text-xs text-[var(--coffee)] truncate">{p.name}</h3>
                      <p className="text-[10px] font-bold text-primary mt-1">{formatBRL(p.price)}</p>
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
                {realOrders
                  .filter((o) => o.orders.status === "paid")
                  .map((order) => {
                    const shipment = shipments.find((s) => s.order_id === order.order_id);
                    return (
                      <div
                        key={order.id}
                        className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--sand)]/20"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-lg overflow-hidden border border-[var(--border)]">
                            <img
                              src={order.image_url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[var(--coffee)]">{order.name}</p>
                            <p className="text-xs text-[var(--muted-foreground)]">
                              Pedido #{order.order_id.slice(0, 8)}
                            </p>
                          </div>
                        </div>

                        <div className="flex-1 min-w-[200px]">
                          {!shipment?.tracking_code ? (
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
                                  const input = document.getElementById(
                                    `track-${order.id}`,
                                  ) as HTMLInputElement;
                                  if (input?.value && shipment)
                                    updateShipmentStatus(shipment.id, "shipped", input.value);
                                }}
                              >
                                Enviar
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-2 text-sm">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                    shipment.status === "delivered"
                                      ? "bg-green-100 text-green-700"
                                      : "bg-blue-100 text-blue-700"
                                  }`}
                                >
                                  {shipment.status === "shipped" ? "Enviado" : "Entregue"}
                                </span>
                                <span className="font-mono text-[var(--muted-foreground)] text-xs">
                                  {shipment.tracking_code}
                                </span>
                              </div>
                              {shipment.status === "shipped" && (
                                <Button
                                  size="sm"
                                  variant="soft"
                                  className="h-7 px-2 text-[10px]"
                                  onClick={() => updateShipmentStatus(shipment.id, "delivered")}
                                >
                                  Marcar Entregue
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
          {label}
        </span>
        <Icon className="h-4 w-4 text-[var(--clay)]" />
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-2">
        <div className="font-display text-2xl font-bold text-[var(--coffee)]">{value}</div>
        {children}
      </div>
    </div>
  );
}
