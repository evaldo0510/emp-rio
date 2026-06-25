CREATE TABLE public.seller_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, seller_id)
);

CREATE INDEX seller_follows_user_id_idx ON public.seller_follows(user_id);
CREATE INDEX seller_follows_seller_id_idx ON public.seller_follows(seller_id);

GRANT SELECT, INSERT, DELETE ON public.seller_follows TO authenticated;
GRANT ALL ON public.seller_follows TO service_role;

ALTER TABLE public.seller_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own follows"
  ON public.seller_follows
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);