import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { formatBRL } from "@/lib/products";
import { toast } from "sonner";
import { createOrder, supabase } from "@/lib/supabase";

export const Route = createFileRoute("/_app/checkout")({
  head: () => ({ meta: [{ title: "Checkout — Licuri Hub" }] }),
  component: CheckoutPage,
});

const steps = ["Endereço", "Pagamento", "Confirmação"] as const;

function CheckoutPage() {
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [address, setAddress] = useState({
    name: "",
    zip: "",
    street: "",
    neighborhood: "",
    city: "",
    state: "",
  });
  const items = useCart((s) => s.items);
  const subtotal = items.reduce((a, i) => a + i.price * i.quantity, 0);
  const [shipping, setShipping] = useState(12.9);
  const clear = useCart((s) => s.clear);
  const navigate = useNavigate();

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    setAddress(prev => ({ ...prev, [key]: e.target.value }));
  };

  const handleFinish = async () => {
    try {
      setIsSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();

      // 1. Create Order in Supabase
      const order = await createOrder({
        user_id: user?.id,
        customer_name: address.name,
        customer_email: user?.email || "anon@licurihub.com",
        address: address,
        shipping_method: shipping === 12.9 ? "PAC" : "SEDEX",
        shipping_cost: shipping,
        subtotal: subtotal,
        total: total,
        status: "pending", // Start as pending
      }, items);

      // 2. Integration with Payment Gateway (Simulation of the API call provided by user)
      // In a real production app, this would be a server-side call to Mercado Pago
      toast.info("Processando pagamento...", {
        description: "Redirecionando para ambiente seguro do Mercado Pago.",
      });
      
      // Simulation of metadata tracking
      console.log("Creating MP preference with metadata:", { order_id: order.id });

      // We simulate a delay then success update (simulating the webhook)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate the webhook updating the order status
      const { error: updateError } = await supabase
        .from("orders")
        .update({ status: "paid" })
        .eq("id", order.id);

      if (updateError) throw updateError;

      toast.success("Pagamento realizado!", {
        description: "Seu pedido #" + order.id.slice(0, 8) + " foi confirmado.",
      });
      
      clear();
      navigate({ to: "/conta" });
    } catch (error) {
      console.error(error);
      toast.error("Erro ao processar pedido. Verifique os dados e tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const total = subtotal + shipping;

  return (
    <div className="container-narrow py-10">
      <h1 className="font-display text-4xl font-semibold text-[var(--coffee)]">Checkout</h1>

      <ol className="mt-6 flex items-center gap-3 text-sm">
        {steps.map((s, i) => (
          <li key={s} className="flex items-center gap-2">
            <span
              className={
                "grid h-7 w-7 place-items-center rounded-full text-xs font-semibold " +
                (i <= step
                  ? "bg-[var(--clay)] text-[var(--clay-foreground)]"
                  : "bg-[var(--sand)] text-[var(--muted-foreground)]")
              }
            >
              {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </span>
            <span className={i === step ? "font-medium text-[var(--coffee)]" : "text-[var(--muted-foreground)]"}>
              {s}
            </span>
            {i < steps.length - 1 && <span className="mx-2 h-px w-8 bg-[var(--border)]" />}
          </li>
        ))}
      </ol>

      <div className="mt-8 grid gap-8 md:grid-cols-[1fr_360px]">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-semibold">Endereço de entrega</h2>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Nome completo" placeholder="Maria Silva" value={address.name} onChange={(e) => handleAddressChange(e, 'name')} />
                <Field label="CEP" placeholder="40000-000" value={address.zip} onChange={(e) => handleAddressChange(e, 'zip')} />
                <Field label="Endereço" placeholder="Rua das Palmeiras, 123" full value={address.street} onChange={(e) => handleAddressChange(e, 'street')} />
                <Field label="Bairro" placeholder="Centro" value={address.neighborhood} onChange={(e) => handleAddressChange(e, 'neighborhood')} />
                <Field label="Cidade" placeholder="Salvador" value={address.city} onChange={(e) => handleAddressChange(e, 'city')} />
                <Field label="Estado" placeholder="BA" value={address.state} onChange={(e) => handleAddressChange(e, 'state')} />
              </div>
              <div className="pt-2">
                <h3 className="mb-2 mt-4 font-display text-base font-semibold">Forma de envio</h3>
                <div className="space-y-2">
                  <ShipOption
                    label="Correios — PAC"
                    sub="5 a 8 dias úteis"
                    price={12.9}
                    selected={shipping === 12.9}
                    onSelect={() => setShipping(12.9)}
                  />
                  <ShipOption
                    label="Correios — SEDEX"
                    sub="2 a 3 dias úteis"
                    price={18.9}
                    selected={shipping === 18.9}
                    onSelect={() => setShipping(18.9)}
                  />
                </div>
              </div>
              <Button variant="hero" size="lg" className="mt-2" onClick={() => setStep(1)}>
                Continuar
              </Button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-semibold">Pagamento</h2>
              <div className="space-y-3">
                <PayOption label="Pix" sub="Aprovação imediata, 5% off" icon="⚡" />
                <PayOption label="Cartão de Crédito" sub="Em até 6x sem juros" icon="💳" />
                <div className="rounded-xl border border-[var(--clay)]/30 bg-[var(--clay)]/5 p-4 mt-4">
                  <div className="flex items-center gap-3 mb-2">
                    <img src="https://www.mercadopago.com/instore/merchant/assets/logo-mp.png" alt="Mercado Pago" className="h-5" />
                    <span className="text-xs font-bold uppercase tracking-widest text-[var(--clay)]">Checkout Seguro</span>
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)]">Ao clicar em continuar, você será redirecionado para o ambiente seguro do Mercado Pago para concluir seu pagamento.</p>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="soft" size="lg" onClick={() => setStep(0)}>
                  Voltar
                </Button>
                <Button variant="hero" size="lg" onClick={() => setStep(2)}>
                  Revisar pedido
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-semibold">Confirmação</h2>
              <p className="text-sm text-[var(--muted-foreground)]">
                Revise seu pedido antes de finalizar.
              </p>
              <ul className="divide-y divide-[var(--border)]">
                {items.map((i) => (
                  <li key={i.id} className="flex items-center gap-3 py-3">
                    <img
                      src={i.image}
                      alt=""
                      className="h-12 w-12 rounded-md object-cover"
                    />
                    <span className="flex-1 text-sm">{i.name} × {i.quantity}</span>
                    <span className="font-semibold">{formatBRL(i.price * i.quantity)}</span>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2 pt-2">
                <Button variant="soft" size="lg" onClick={() => setStep(1)}>
                  Voltar
                </Button>
                <Button
                  variant="hero"
                  size="lg"
                  disabled={isSubmitting}
                  onClick={handleFinish}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    "Finalizar pedido"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        <aside className="h-max rounded-2xl border border-[var(--border)] bg-[var(--cream)] p-6">
          <h2 className="font-display text-lg font-semibold">Resumo</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-[var(--muted-foreground)]">Subtotal ({items.length} itens)</dt>
              <dd>{formatBRL(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--muted-foreground)]">Frete</dt>
              <dd>{formatBRL(shipping)}</dd>
            </div>
          </dl>
          <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-4">
            <span className="text-sm text-[var(--muted-foreground)]">Total</span>
            <span className="font-display text-2xl font-bold text-[var(--clay)]">
              {formatBRL(total)}
            </span>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Field({
  label,
  placeholder,
  full,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  full?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className={"block text-sm " + (full ? "md:col-span-2" : "")}>
      <span className="mb-1 block text-[var(--muted-foreground)]">{label}</span>
      <input
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 outline-none focus:border-[var(--clay)]"
      />
    </label>
  );
}

function ShipOption({
  label,
  sub,
  price,
  selected,
  onSelect,
}: {
  label: string;
  sub: string;
  price: number;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={
        "flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors " +
        (selected
          ? "border-[var(--clay)] bg-[var(--sand)]"
          : "border-[var(--border)] hover:bg-[var(--sand)]")
      }
    >
      <div className="flex items-center gap-3">
        <span
          className={
            "grid h-4 w-4 place-items-center rounded-full border " +
            (selected ? "border-[var(--clay)]" : "border-[var(--muted-foreground)]/40")
          }
        >
          {selected && <span className="h-2 w-2 rounded-full bg-[var(--clay)]" />}
        </span>
        <div>
          <div className="text-sm font-medium">{label}</div>
          <div className="text-xs text-[var(--muted-foreground)]">{sub}</div>
        </div>
      </div>
      <span className="font-semibold">{formatBRL(price)}</span>
    </button>
  );
}

function PayOption({ label, sub, icon }: { label: string; sub: string; icon?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] p-4 hover:border-[var(--clay)] hover:bg-[var(--clay)]/5 transition-all cursor-pointer group">
      <span className="h-5 w-5 rounded-full border-2 border-[var(--border)] group-hover:border-[var(--clay)] flex items-center justify-center">
        <span className="h-2.5 w-2.5 rounded-full bg-transparent group-hover:bg-[var(--clay)]" />
      </span>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-[var(--coffee)]">{label}</span>
          {icon && <span className="text-lg">{icon}</span>}
        </div>
        <div className="text-xs text-[var(--muted-foreground)]">{sub}</div>
      </div>
    </div>
  );
}
