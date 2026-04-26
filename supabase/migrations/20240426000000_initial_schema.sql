-- Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC NOT NULL,
  rating NUMERIC DEFAULT 0,
  reviews INTEGER DEFAULT 0,
  shop TEXT NOT NULL,
  region TEXT NOT NULL,
  image_url TEXT,
  short_description TEXT,
  description TEXT,
  badges TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Orders Table
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
  status TEXT DEFAULT 'pago', -- pago, em preparo, enviado, entregue
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  quantity INTEGER NOT NULL,
  image_url TEXT
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow public read on products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to create products" ON public.products FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow users to view their own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow public to create orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public to create order items" ON public.order_items FOR INSERT WITH CHECK (true);
