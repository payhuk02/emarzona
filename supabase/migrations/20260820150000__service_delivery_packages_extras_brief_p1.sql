-- ============================================================
-- P1 Services: delivery packages (Basic/Standard/Premium), gig extras, brief fields
-- ============================================================

-- 1) Delivery-tier columns on service_packages (session packs remain package_kind=session_credits)
ALTER TABLE public.service_packages
  ADD COLUMN IF NOT EXISTS package_kind text NOT NULL DEFAULT 'session_credits';

ALTER TABLE public.service_packages
  ADD COLUMN IF NOT EXISTS tier text;

ALTER TABLE public.service_packages
  ADD COLUMN IF NOT EXISTS delivery_days integer;

ALTER TABLE public.service_packages
  ADD COLUMN IF NOT EXISTS revisions integer;

ALTER TABLE public.service_packages
  ADD COLUMN IF NOT EXISTS features jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.service_packages
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'service_packages_package_kind_check'
  ) THEN
    ALTER TABLE public.service_packages
      ADD CONSTRAINT service_packages_package_kind_check
      CHECK (package_kind IN ('session_credits', 'delivery_tier'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'service_packages_tier_check'
  ) THEN
    ALTER TABLE public.service_packages
      ADD CONSTRAINT service_packages_tier_check
      CHECK (tier IS NULL OR tier IN ('basic', 'standard', 'premium', 'custom'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_service_packages_delivery
  ON public.service_packages (service_product_id, package_kind, sort_order)
  WHERE package_kind = 'delivery_tier';

-- Allow session-credit fields to be optional for delivery tiers
ALTER TABLE public.service_packages
  ALTER COLUMN sessions_count DROP NOT NULL;

ALTER TABLE public.service_packages
  ALTER COLUMN credits_per_session DROP NOT NULL;

-- 2) Gig extras (inline price + extra days — distinct from product addons)
CREATE TABLE IF NOT EXISTS public.service_gig_extras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_product_id uuid NOT NULL REFERENCES public.service_products(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0 CHECK (price >= 0),
  currency text NOT NULL DEFAULT 'XOF',
  extra_days integer NOT NULL DEFAULT 0 CHECK (extra_days >= 0),
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_gig_extras_service
  ON public.service_gig_extras (service_product_id, display_order);

ALTER TABLE public.service_gig_extras ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active gig extras" ON public.service_gig_extras;
CREATE POLICY "Public can view active gig extras"
  ON public.service_gig_extras FOR SELECT
  USING (
    is_active = true
    OR EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = service_gig_extras.store_id AND s.user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "Store owners manage gig extras" ON public.service_gig_extras;
CREATE POLICY "Store owners manage gig extras"
  ON public.service_gig_extras FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = service_gig_extras.store_id AND s.user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = service_gig_extras.store_id AND s.user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
  );

DROP TRIGGER IF EXISTS update_service_gig_extras_updated_at ON public.service_gig_extras;
CREATE TRIGGER update_service_gig_extras_updated_at
  BEFORE UPDATE ON public.service_gig_extras
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Brief field definitions on service_products
ALTER TABLE public.service_products
  ADD COLUMN IF NOT EXISTS brief_fields jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.service_products.brief_fields IS
  'Seller-defined buyer brief questions: [{id,label,type,required,options?,placeholder?}]';

COMMENT ON COLUMN public.service_packages.package_kind IS
  'session_credits = multi-session packs; delivery_tier = Basic/Standard/Premium gig packages';
