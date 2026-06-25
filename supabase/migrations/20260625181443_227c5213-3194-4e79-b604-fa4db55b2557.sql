-- 1. Produtos: link externo, origem e galeria
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS external_buy_url text,
  ADD COLUMN IF NOT EXISTS origin text NOT NULL DEFAULT 'own',
  ADD COLUMN IF NOT EXISTS gallery text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.products
  ADD CONSTRAINT products_origin_check
  CHECK (origin IN ('own','mercadolivre','shopee','instagram','whatsapp','imported'));

-- 2. Reviews
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, user_id)
);

GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are public to read"
  ON public.reviews FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users create own review"
  ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own review"
  ON public.reviews FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own review"
  ON public.reviews FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Recalcular agregados em products
CREATE OR REPLACE FUNCTION public.refresh_product_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product uuid;
BEGIN
  v_product := COALESCE(NEW.product_id, OLD.product_id);
  UPDATE public.products p
  SET rating = COALESCE((SELECT ROUND(AVG(rating)::numeric, 2) FROM public.reviews WHERE product_id = v_product), 0),
      reviews = (SELECT COUNT(*) FROM public.reviews WHERE product_id = v_product)
  WHERE p.id = v_product;
  RETURN NULL;
END;
$$;

CREATE TRIGGER reviews_refresh_aggregates
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.refresh_product_rating();

-- 3. Favoritos
CREATE TABLE public.favorites (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, product_id)
);

GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own favorites"
  ON public.favorites FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Integrações de vendedores (esqueleto)
CREATE TABLE public.seller_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('mercadolivre','shopee','instagram','whatsapp')),
  status text NOT NULL DEFAULT 'disconnected' CHECK (status IN ('disconnected','connected','error')),
  access_token text,
  refresh_token text,
  external_account text,
  last_sync_at timestamptz,
  config jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (seller_id, platform)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.seller_integrations TO authenticated;
GRANT ALL ON public.seller_integrations TO service_role;

ALTER TABLE public.seller_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers manage own integrations"
  ON public.seller_integrations FOR ALL TO authenticated
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Admins view all integrations"
  ON public.seller_integrations FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE TRIGGER seller_integrations_updated_at
  BEFORE UPDATE ON public.seller_integrations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();