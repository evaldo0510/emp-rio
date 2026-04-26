-- 1. Ensure Sellers table is robust
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;

-- Ensure necessary columns exist (handled in case they are missing, but based on my check they are likely there)
-- DO NOT FAIL if they exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sellers' AND column_name = 'commission_rate') THEN
        ALTER TABLE public.sellers ADD COLUMN commission_rate NUMERIC DEFAULT 10.0;
    END IF;
END $$;

-- 2. Refine RLS for Sellers
DROP POLICY IF EXISTS "Sellers can view their own profile" ON public.sellers;
CREATE POLICY "Sellers can view their own profile" 
ON public.sellers FOR SELECT 
USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.app_admins WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Anyone can view approved sellers" ON public.sellers;
CREATE POLICY "Anyone can view approved sellers" 
ON public.sellers FOR SELECT 
USING (approved = true);

-- 3. Ensure Products are linked to Sellers and secure
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sellers can manage their own products" ON public.products;
CREATE POLICY "Sellers can manage their own products" 
ON public.products FOR ALL 
USING (auth.uid() = seller_id OR EXISTS (SELECT 1 FROM public.app_admins WHERE user_id = auth.uid()))
WITH CHECK (auth.uid() = seller_id OR EXISTS (SELECT 1 FROM public.app_admins WHERE user_id = auth.uid()));

-- 4. Order Items Isolation
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sellers view their own items" ON public.order_items;
CREATE POLICY "Sellers view their own items" 
ON public.order_items FOR SELECT 
USING (seller_id = auth.uid() OR EXISTS (SELECT 1 FROM public.app_admins WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Sellers update their own items status" ON public.order_items;
CREATE POLICY "Sellers update their own items status" 
ON public.order_items FOR UPDATE 
USING (seller_id = auth.uid() OR EXISTS (SELECT 1 FROM public.app_admins WHERE user_id = auth.uid()));

-- 5. Wallet and Transactions Security
ALTER TABLE public.seller_wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sellers manage own wallet" ON public.seller_wallet;
CREATE POLICY "Sellers manage own wallet" 
ON public.seller_wallet FOR SELECT 
USING (seller_id = auth.uid() OR EXISTS (SELECT 1 FROM public.app_admins WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Sellers view own transactions" ON public.wallet_transactions;
CREATE POLICY "Sellers view own transactions" 
ON public.wallet_transactions FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.seller_wallet WHERE id = wallet_id AND (seller_id = auth.uid() OR EXISTS (SELECT 1 FROM public.app_admins WHERE user_id = auth.uid()))));

-- 6. Automate Wallet Updates on Sale (Commission)
-- Create function to update wallet when order item is marked as paid/delivered (business choice, usually paid)
CREATE OR REPLACE FUNCTION public.handle_order_item_commission()
RETURNS TRIGGER AS $$
DECLARE
    v_wallet_id UUID;
BEGIN
    -- Only trigger when payment_status changes to 'paid' in the order (or item status is 'paid')
    -- For simplicity, we'll trigger when the order item is created and its status is processed, 
    -- or better, when the main order status becomes 'paid'.
    -- But usually it's easier to record when the order item is confirmed.
    
    IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'paid') THEN
        -- Find or create wallet
        SELECT id INTO v_wallet_id FROM public.seller_wallet WHERE seller_id = NEW.seller_id;
        
        IF v_wallet_id IS NULL THEN
            INSERT INTO public.seller_wallet (seller_id, balance) VALUES (NEW.seller_id, 0) RETURNING id INTO v_wallet_id;
        END IF;

        -- Update balance
        UPDATE public.seller_wallet 
        SET balance = balance + NEW.net_amount, 
            updated_at = now() 
        WHERE id = v_wallet_id;

        -- Record transaction
        INSERT INTO public.wallet_transactions (wallet_id, amount, type, description, order_id)
        VALUES (v_wallet_id, NEW.net_amount, 'sale', 'Venda do item: ' || NEW.name, NEW.order_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for commission processing
DROP TRIGGER IF EXISTS tr_order_item_commission ON public.order_items;
CREATE TRIGGER tr_order_item_commission
AFTER UPDATE ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.handle_order_item_commission();

-- 7. Shipments Security
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sellers manage their shipments" ON public.shipments;
CREATE POLICY "Sellers manage their shipments" 
ON public.shipments FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.order_items 
        WHERE order_items.order_id = shipments.order_id 
        AND (order_items.seller_id = auth.uid() OR EXISTS (SELECT 1 FROM public.app_admins WHERE user_id = auth.uid())))
);
