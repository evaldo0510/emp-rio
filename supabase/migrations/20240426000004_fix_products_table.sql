-- Add shop_id and additional fields to products table for better vendor management
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES auth.users(id);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS shop_name TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 10;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;

-- Ensure RLS is enabled
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read published products
CREATE POLICY IF NOT EXISTS "Everyone can view published products" 
ON public.products FOR SELECT 
USING (is_published = true);

-- Policy: Vendors can manage their own products
CREATE POLICY IF NOT EXISTS "Vendors can manage their own products" 
ON public.products FOR ALL 
USING (auth.uid() = vendor_id)
WITH CHECK (auth.uid() = vendor_id);

-- Ensure storage policies are correct for product images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY IF NOT EXISTS "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'product-images');

CREATE POLICY IF NOT EXISTS "Authenticated users can upload" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');
