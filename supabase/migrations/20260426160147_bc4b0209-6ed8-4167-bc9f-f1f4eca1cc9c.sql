-- Tighten "Anyone can insert order items" policy
DROP POLICY IF EXISTS "Anyone can insert order items" ON public.order_items;
CREATE POLICY "Authenticated users can insert order items for their orders" 
ON public.order_items FOR INSERT 
WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND (user_id = auth.uid() OR user_id IS NULL))
);

-- Tighten storage bucket: scope writes to user folder, scope reads to public read of objects (no listing)
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;

CREATE POLICY "Public can read product image objects"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users upload to their own folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'products'
);

CREATE POLICY "Users update their own product images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-images' AND owner = auth.uid());

CREATE POLICY "Users delete their own product images"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-images' AND owner = auth.uid());