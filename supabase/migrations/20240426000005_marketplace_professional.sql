-- Ensure order_items has seller_id
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES auth.users(id);

-- Seller Wallet table
CREATE TABLE IF NOT EXISTS public.seller_wallet (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  balance NUMERIC DEFAULT 0,
  total_withdrawn NUMERIC DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Wallet Transactions (for history)
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID REFERENCES public.seller_wallet(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL, -- 'sale', 'withdrawal'
  description TEXT,
  order_id UUID REFERENCES public.orders(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.seller_wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Sellers can view their own wallet" ON public.seller_wallet FOR SELECT USING (auth.uid() = seller_id);
CREATE POLICY "Sellers can view their own transactions" ON public.wallet_transactions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.seller_wallet WHERE id = wallet_id AND seller_id = auth.uid())
);

-- Automatically create a wallet for new sellers (or when first sale happens)
-- This function can be called via RPC or trigger, but for simplicity we'll check in code or use a trigger

-- Trigger to update wallet on order status change to 'paid'
CREATE OR REPLACE FUNCTION public.process_order_commissions()
RETURNS TRIGGER AS $$
DECLARE
  item RECORD;
  seller_wallet_id UUID;
  commission_rate NUMERIC := 0.15; -- 15%
  net_amount NUMERIC;
BEGIN
  IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
    FOR item IN SELECT * FROM public.order_items WHERE order_id = NEW.id LOOP
      -- Get or create wallet
      INSERT INTO public.seller_wallet (seller_id)
      VALUES (item.seller_id)
      ON CONFLICT (seller_id) DO NOTHING;
      
      SELECT id INTO seller_wallet_id FROM public.seller_wallet WHERE seller_id = item.seller_id;
      
      net_amount := item.price * item.quantity * (1 - commission_rate);
      
      -- Update balance
      UPDATE public.seller_wallet
      SET balance = balance + net_amount,
          updated_at = now()
      WHERE id = seller_wallet_id;
      
      -- Record transaction
      INSERT INTO public.wallet_transactions (wallet_id, amount, type, description, order_id)
      VALUES (seller_wallet_id, net_amount, 'sale', 'Venda do produto: ' || item.name, NEW.id);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_order_paid
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.process_order_commissions();
