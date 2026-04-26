-- 1. Shipments table
CREATE TABLE IF NOT EXISTS public.shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  tracking_code TEXT,
  carrier TEXT DEFAULT 'Melhor Envio',
  status TEXT DEFAULT 'processing',
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Sellers Profile and Approval table
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

-- Enable RLS
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;

-- Policies for Shipments
CREATE POLICY "Users can view shipments for their own orders" 
ON public.shipments FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid()));

CREATE POLICY "Vendors can view shipments for orders containing their products" 
ON public.shipments FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.order_items WHERE order_id = shipments.order_id AND seller_id = auth.uid()));

CREATE POLICY "Vendors can update shipments for their products" 
ON public.shipments FOR ALL
USING (EXISTS (SELECT 1 FROM public.order_items WHERE order_id = shipments.order_id AND seller_id = auth.uid()));

-- Policies for Sellers
CREATE POLICY "Public can view approved sellers" ON public.sellers FOR SELECT USING (approved = true);
CREATE POLICY "Sellers can view and update their own profile" ON public.sellers FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Admins can view all sellers" ON public.sellers FOR SELECT USING (auth.jwt()->>'role' = 'service_role' OR EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_app_meta_data->>'is_admin' = 'true'));

-- Trigger to create shipment when order is paid
CREATE OR REPLACE FUNCTION public.create_initial_shipment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
    INSERT INTO public.shipments (order_id, status)
    VALUES (NEW.id, 'processing');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_order_paid_shipment
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.create_initial_shipment();

-- Policy to prevent unapproved sellers from publishing products
-- We can add a constraint or trigger on products table
CREATE OR REPLACE FUNCTION public.check_seller_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.sellers WHERE user_id = NEW.vendor_id AND approved = true) THEN
    -- If not approved, force is_published to false
    NEW.is_published := false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_product_upsert_check_approval
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.check_seller_approval();
