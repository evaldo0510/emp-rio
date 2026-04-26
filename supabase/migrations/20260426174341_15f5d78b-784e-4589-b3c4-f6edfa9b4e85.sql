ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS seller_type TEXT CHECK (seller_type IN ('individual', 'store', 'association', 'cooperative')) DEFAULT 'store';
