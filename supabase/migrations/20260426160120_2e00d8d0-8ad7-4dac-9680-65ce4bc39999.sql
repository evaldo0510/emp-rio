-- Products
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC NOT NULL,
  rating NUMERIC DEFAULT 0,
  reviews INTEGER DEFAULT 0,
  shop TEXT,
  shop_name TEXT,
  region TEXT,
  image_url TEXT,
  short_description TEXT,
  description TEXT,
  badges TEXT[],
  vendor_id UUID REFERENCES auth.users(id),
  stock_quantity INTEGER DEFAULT 10,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Orders
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  address JSONB NOT NULL,
  shipping_method TEXT NOT NULL,
  shipping_cost NUMERIC NOT NULL,
  subtotal NUMERIC NOT NULL,
  total NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending',
  payment_id TEXT,
  payment_status TEXT,
  commission_rate NUMERIC DEFAULT 15.0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Order items
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  seller_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  quantity INTEGER NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Cart items
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Sellers
CREATE TABLE IF NOT EXISTS public.sellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  store_name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  approved BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seller wallet
CREATE TABLE IF NOT EXISTS public.seller_wallet (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  balance NUMERIC DEFAULT 0,
  total_withdrawn NUMERIC DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Wallet transactions
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID REFERENCES public.seller_wallet(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  order_id UUID REFERENCES public.orders(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Shipments
CREATE TABLE IF NOT EXISTS public.shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  tracking_code TEXT,
  carrier TEXT DEFAULT 'Melhor Envio',
  status TEXT DEFAULT 'processing',
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

-- Products policies
CREATE POLICY "Public can view published products" ON public.products FOR SELECT USING (is_published = true);
CREATE POLICY "Vendors can view their own products" ON public.products FOR SELECT USING (auth.uid() = vendor_id);
CREATE POLICY "Vendors can insert their own products" ON public.products FOR INSERT WITH CHECK (auth.uid() = vendor_id);
CREATE POLICY "Vendors can update their own products" ON public.products FOR UPDATE USING (auth.uid() = vendor_id);
CREATE POLICY "Vendors can delete their own products" ON public.products FOR DELETE USING (auth.uid() = vendor_id);

-- Orders policies
CREATE POLICY "Users can view their own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can update their own orders" ON public.orders FOR UPDATE USING (auth.uid() = user_id);

-- Order items policies
CREATE POLICY "Users can view their own order items" ON public.order_items FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid()));
CREATE POLICY "Sellers can view their order items" ON public.order_items FOR SELECT USING (auth.uid() = seller_id);
CREATE POLICY "Anyone can insert order items" ON public.order_items FOR INSERT WITH CHECK (true);

-- Cart items policies
CREATE POLICY "Users manage their own cart" ON public.cart_items FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Sellers policies
CREATE POLICY "Public can view approved sellers" ON public.sellers FOR SELECT USING (approved = true);
CREATE POLICY "Sellers can view own profile" ON public.sellers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Sellers can insert own profile" ON public.sellers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Sellers can update own profile" ON public.sellers FOR UPDATE USING (auth.uid() = user_id);

-- Wallet policies
CREATE POLICY "Sellers view own wallet" ON public.seller_wallet FOR SELECT USING (auth.uid() = seller_id);
CREATE POLICY "Sellers view own transactions" ON public.wallet_transactions FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.seller_wallet WHERE id = wallet_id AND seller_id = auth.uid()));

-- Shipments policies
CREATE POLICY "Users view shipments for their orders" ON public.shipments FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid()));
CREATE POLICY "Sellers view shipments for their items" ON public.shipments FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.order_items WHERE order_id = shipments.order_id AND seller_id = auth.uid()));
CREATE POLICY "Sellers update shipments for their items" ON public.shipments FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.order_items WHERE order_id = shipments.order_id AND seller_id = auth.uid()));

-- Storage bucket for product images
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view product images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Authenticated users can upload product images" ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- Trigger: process commissions when order paid
CREATE OR REPLACE FUNCTION public.process_order_commissions()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  item RECORD;
  wallet_id_var UUID;
  commission_rate NUMERIC := 0.15;
  net_amount NUMERIC;
BEGIN
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status <> 'paid') THEN
    FOR item IN SELECT * FROM public.order_items WHERE order_id = NEW.id LOOP
      IF item.seller_id IS NOT NULL THEN
        INSERT INTO public.seller_wallet (seller_id) VALUES (item.seller_id) ON CONFLICT (seller_id) DO NOTHING;
        SELECT id INTO wallet_id_var FROM public.seller_wallet WHERE seller_id = item.seller_id;
        net_amount := item.price * item.quantity * (1 - commission_rate);
        UPDATE public.seller_wallet SET balance = balance + net_amount, updated_at = now() WHERE id = wallet_id_var;
        INSERT INTO public.wallet_transactions (wallet_id, amount, type, description, order_id)
        VALUES (wallet_id_var, net_amount, 'sale', 'Venda: ' || item.name, NEW.id);
      END IF;
    END LOOP;
    INSERT INTO public.shipments (order_id, status) VALUES (NEW.id, 'processing');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_order_paid AFTER UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.process_order_commissions();

-- Trigger: enforce seller approval before publishing products
CREATE OR REPLACE FUNCTION public.check_seller_approval()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.vendor_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.sellers WHERE user_id = NEW.vendor_id AND approved = true
  ) THEN
    NEW.is_published := false;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER products_check_approval BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.check_seller_approval();

-- Monthly report RPC
CREATE OR REPLACE FUNCTION public.get_monthly_sales_report(report_month DATE)
RETURNS TABLE (total_orders BIGINT, total_revenue NUMERIC, orders_by_status JSONB, sales_by_category JSONB)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(o.id),
    COALESCE(SUM(o.total), 0),
    (SELECT jsonb_object_agg(status, count) FROM (
      SELECT status, COUNT(*) as count FROM public.orders 
      WHERE date_trunc('month', created_at) = date_trunc('month', report_month) GROUP BY status
    ) s),
    (SELECT jsonb_object_agg(category, revenue) FROM (
      SELECT p.category, SUM(oi.price * oi.quantity) as revenue
      FROM public.order_items oi
      JOIN public.products p ON oi.product_id = p.id
      JOIN public.orders o2 ON oi.order_id = o2.id
      WHERE date_trunc('month', o2.created_at) = date_trunc('month', report_month)
      GROUP BY p.category
    ) c)
  FROM public.orders o
  WHERE date_trunc('month', o.created_at) = date_trunc('month', report_month);
END;
$$;

-- Cleanup old local migration files (no-op for the database)