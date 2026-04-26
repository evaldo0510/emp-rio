-- Add status and payment fields to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS commission_rate NUMERIC DEFAULT 10.0; -- 10% commission
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS seller_id UUID; -- Link to a seller if applicable

-- Add seller info to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seller_id UUID;

-- Policies for orders (already exists, but ensuring it's robust)
CREATE POLICY "Users can update their own orders" ON public.orders FOR UPDATE USING (auth.uid() = user_id);
