-- 1. Table structure adjustments
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS commission_rate NUMERIC DEFAULT 0.15;

-- Standardize products table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='seller_id') THEN
        ALTER TABLE public.products ADD COLUMN seller_id UUID REFERENCES auth.users(id);
        -- Sync existing vendor_id to seller_id
        UPDATE public.products SET seller_id = vendor_id WHERE vendor_id IS NOT NULL;
    END IF;
END $$;

-- Enhance order_items
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS commission_amount NUMERIC DEFAULT 0;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS net_amount NUMERIC DEFAULT 0;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- 2. Ensure RLS is enabled
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- 3. Robust RLS Policies (Idempotent)

-- Sellers
DROP POLICY IF EXISTS "Sellers can view own profile" ON public.sellers;
DROP POLICY IF EXISTS "Sellers update own profile" ON public.sellers;
DROP POLICY IF EXISTS "Sellers can view their own profile" ON public.sellers;
DROP POLICY IF EXISTS "Users can create their own seller profile" ON public.sellers;
DROP POLICY IF EXISTS "Sellers can update their own profile" ON public.sellers;

CREATE POLICY "Sellers can view their own profile" ON public.sellers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own seller profile" ON public.sellers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Sellers can update their own profile" ON public.sellers FOR UPDATE USING (auth.uid() = user_id);

-- Products
DROP POLICY IF EXISTS "Public can view published products" ON public.products;
DROP POLICY IF EXISTS "Vendors can view their own products" ON public.products;
DROP POLICY IF EXISTS "Vendors can insert their own products" ON public.products;
DROP POLICY IF EXISTS "Vendors can update their own products" ON public.products;
DROP POLICY IF EXISTS "Vendors can delete their own products" ON public.products;

CREATE POLICY "Anyone can view products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Vendors can manage their own products" ON public.products FOR ALL USING (auth.uid() = seller_id OR auth.uid() = vendor_id);

-- Orders & Items
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view their own order items" ON public.order_items;
DROP POLICY IF EXISTS "Sellers can view their order items" ON public.order_items;
DROP POLICY IF EXISTS "Sellers view own order items" ON public.order_items;
DROP POLICY IF EXISTS "Authenticated users can insert order items for their orders" ON public.order_items;

CREATE POLICY "Users can view their own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users view items of their orders" ON public.order_items FOR SELECT USING (EXISTS (SELECT 1 FROM orders WHERE id = order_id AND user_id = auth.uid()));
CREATE POLICY "Sellers view items sold by them" ON public.order_items FOR SELECT USING (auth.uid() = seller_id);
CREATE POLICY "Sellers update status of their items" ON public.order_items FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "Insert items for orders" ON public.order_items FOR INSERT WITH CHECK (true); -- Usually handled by application logic/triggers

-- Wallet
DROP POLICY IF EXISTS "Sellers view own wallet" ON public.seller_wallet;
DROP POLICY IF EXISTS "Sellers view own transactions" ON public.wallet_transactions;

CREATE POLICY "Sellers can view their own wallet" ON public.seller_wallet FOR SELECT USING (auth.uid() = seller_id);
CREATE POLICY "Sellers can view their own transactions" ON public.wallet_transactions FOR SELECT USING (EXISTS (SELECT 1 FROM seller_wallet WHERE id = wallet_id AND seller_id = auth.uid()));

-- 4. Triggers and Functions

-- Function to handle order payment and update wallet
CREATE OR REPLACE FUNCTION public.handle_order_payment()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
    v_wallet_id UUID;
BEGIN
    IF (NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid')) THEN
        FOR item IN SELECT * FROM public.order_items WHERE order_id = NEW.id LOOP
            -- Ensure wallet exists
            INSERT INTO public.seller_wallet (seller_id)
            VALUES (item.seller_id)
            ON CONFLICT (seller_id) DO NOTHING;
            
            SELECT id INTO v_wallet_id FROM public.seller_wallet WHERE seller_id = item.seller_id;
            
            -- Update balance
            UPDATE public.seller_wallet 
            SET balance = balance + item.net_amount,
                updated_at = now()
            WHERE id = v_wallet_id;
            
            -- Record transaction
            INSERT INTO public.wallet_transactions (wallet_id, amount, type, description)
            VALUES (v_wallet_id, item.net_amount, 'sale', 'Venda do item: ' || item.name || ' (Pedido #' || NEW.id || ')');
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_order_paid ON public.orders;
CREATE TRIGGER on_order_paid
    AFTER UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_order_payment();
