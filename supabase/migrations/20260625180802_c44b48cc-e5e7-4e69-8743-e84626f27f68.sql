
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_draft boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_job_id uuid;

CREATE TABLE IF NOT EXISTS public.ai_extraction_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_kind text NOT NULL CHECK (source_kind IN ('image','pdf','url')),
  source_meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','done','failed')),
  current_step text,
  steps_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  error_message text,
  result jsonb,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_extraction_jobs TO authenticated;
GRANT ALL ON public.ai_extraction_jobs TO service_role;

ALTER TABLE public.ai_extraction_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sellers manage own jobs" ON public.ai_extraction_jobs;
CREATE POLICY "Sellers manage own jobs" ON public.ai_extraction_jobs
  FOR ALL
  USING (auth.uid() = seller_id OR public.is_admin())
  WITH CHECK (auth.uid() = seller_id OR public.is_admin());

DROP TRIGGER IF EXISTS ai_jobs_updated_at ON public.ai_extraction_jobs;
CREATE TRIGGER ai_jobs_updated_at
  BEFORE UPDATE ON public.ai_extraction_jobs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_ai_jobs_seller ON public.ai_extraction_jobs(seller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_draft ON public.products(seller_id) WHERE is_draft = true;
