-- Marketplace sponsorship system: SKUs, campaigns, sync is_featured, ranking, RPCs

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Columns on products
-- ---------------------------------------------------------------------------

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS sponsored_until TIMESTAMPTZ;

COMMENT ON COLUMN public.products.sponsored_until IS
  'Fin de la sponsorisation active (dérivé). NULL si non sponsorisé.';

CREATE INDEX IF NOT EXISTS idx_products_sponsored_until
  ON public.products (sponsored_until)
  WHERE sponsored_until IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 2. Catalog SKUs
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.marketplace_sponsorship_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  duration_days INTEGER NOT NULL CHECK (duration_days > 0),
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'XOF',
  placement TEXT NOT NULL DEFAULT 'marketplace_feed'
    CHECK (placement IN ('marketplace_feed', 'category_top', 'search')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.marketplace_sponsorship_products
  (slug, name, description, duration_days, price_cents, currency, placement, sort_order)
VALUES
  (
    'boost_7d',
    'Boost 7 jours',
    'Mise en avant sponsorisée sur le Marketplace pendant 7 jours — 500 FCFA.',
    7,
    50000,
    'XOF',
    'marketplace_feed',
    10
  ),
  (
    'boost_30d',
    'Boost 30 jours',
    'Mise en avant sponsorisée sur le Marketplace pendant 30 jours — 1000 FCFA.',
    30,
    100000,
    'XOF',
    'marketplace_feed',
    20
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  duration_days = EXCLUDED.duration_days,
  price_cents = EXCLUDED.price_cents,
  currency = EXCLUDED.currency,
  placement = EXCLUDED.placement,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- 3. Campaigns
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.marketplace_sponsorships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sku_id UUID REFERENCES public.marketplace_sponsorship_products(id) ON DELETE SET NULL,
  source TEXT NOT NULL CHECK (source IN ('plan_entitlement', 'paid_boost', 'admin_grant')),
  status TEXT NOT NULL DEFAULT 'pending_payment'
    CHECK (status IN ('pending_payment', 'active', 'expired', 'cancelled', 'rejected')),
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  amount_paid_cents INTEGER,
  currency TEXT,
  payment_ref TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT marketplace_sponsorships_dates_chk CHECK (
    starts_at IS NULL OR ends_at IS NULL OR ends_at > starts_at
  )
);

CREATE INDEX IF NOT EXISTS idx_msp_sponsorships_status_ends
  ON public.marketplace_sponsorships (status, ends_at);

CREATE INDEX IF NOT EXISTS idx_msp_sponsorships_product
  ON public.marketplace_sponsorships (product_id);

CREATE INDEX IF NOT EXISTS idx_msp_sponsorships_store_status
  ON public.marketplace_sponsorships (store_id, status);

CREATE INDEX IF NOT EXISTS idx_msp_sponsorships_active_window
  ON public.marketplace_sponsorships (product_id, starts_at, ends_at)
  WHERE status = 'active';

-- ---------------------------------------------------------------------------
-- 4. Events (impressions / clicks)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.marketplace_sponsorship_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsorship_id UUID NOT NULL REFERENCES public.marketplace_sponsorships(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('impression', 'click', 'purchase')),
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_msp_events_sponsorship_created
  ON public.marketplace_sponsorship_events (sponsorship_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- 5. Sync products.is_featured / sponsored_until from active campaigns
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.sync_product_sponsorship_flags(p_product_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_until TIMESTAMPTZ;
BEGIN
  SELECT MAX(s.ends_at) INTO v_until
  FROM public.marketplace_sponsorships s
  WHERE s.product_id = p_product_id
    AND s.status = 'active'
    AND s.starts_at IS NOT NULL
    AND s.ends_at IS NOT NULL
    AND now() >= s.starts_at
    AND now() < s.ends_at;

  UPDATE public.products p
  SET
    is_featured = (v_until IS NOT NULL),
    sponsored_until = v_until,
    updated_at = now()
  WHERE p.id = p_product_id
    AND (
      p.is_featured IS DISTINCT FROM (v_until IS NOT NULL)
      OR p.sponsored_until IS DISTINCT FROM v_until
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_marketplace_sponsorships_sync_featured()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product_id UUID;
BEGIN
  v_product_id := COALESCE(NEW.product_id, OLD.product_id);
  PERFORM public.sync_product_sponsorship_flags(v_product_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_marketplace_sponsorships_sync_featured ON public.marketplace_sponsorships;
CREATE TRIGGER trg_marketplace_sponsorships_sync_featured
AFTER INSERT OR UPDATE OF status, starts_at, ends_at, product_id OR DELETE
ON public.marketplace_sponsorships
FOR EACH ROW
EXECUTE FUNCTION public.trg_marketplace_sponsorships_sync_featured();

-- Prevent free manual featured toggles: always recompute from sponsorships
CREATE OR REPLACE FUNCTION public.trg_products_featured_from_sponsorship()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_until TIMESTAMPTZ;
BEGIN
  SELECT MAX(s.ends_at) INTO v_until
  FROM public.marketplace_sponsorships s
  WHERE s.product_id = NEW.id
    AND s.status = 'active'
    AND s.starts_at IS NOT NULL
    AND s.ends_at IS NOT NULL
    AND now() >= s.starts_at
    AND now() < s.ends_at;

  NEW.is_featured := (v_until IS NOT NULL);
  NEW.sponsored_until := v_until;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_products_featured_from_sponsorship ON public.products;
CREATE TRIGGER trg_products_featured_from_sponsorship
BEFORE INSERT OR UPDATE OF is_featured, sponsored_until
ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.trg_products_featured_from_sponsorship();

-- ---------------------------------------------------------------------------
-- 6. Expire job
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.expire_marketplace_sponsorships()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  WITH expired AS (
    UPDATE public.marketplace_sponsorships s
    SET status = 'expired', updated_at = now()
    WHERE s.status = 'active'
      AND s.ends_at IS NOT NULL
      AND s.ends_at <= now()
    RETURNING s.product_id
  )
  SELECT COUNT(*)::integer INTO v_count FROM expired;

  -- Flags synced via trigger per row
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.expire_marketplace_sponsorships() TO service_role;

-- Schedule if pg_cron available (best-effort)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'expire-marketplace-sponsorships') THEN
      PERFORM cron.unschedule('expire-marketplace-sponsorships');
    END IF;
    PERFORM cron.schedule(
      'expire-marketplace-sponsorships',
      '*/15 * * * *',
      $cron$SELECT public.expire_marketplace_sponsorships();$cron$
    );
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron schedule skipped: %', SQLERRM;
END;
$$;

-- ---------------------------------------------------------------------------
-- 7. Plan feature: marketplace.sponsor (rank 2 = physical_standard+)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.store_has_physical_feature(
  p_store_id UUID,
  p_feature_key TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_slug TEXT;
  v_rank INT := 0;
  v_required INT := 99;
  v_max_wh INT;
BEGIN
  IF public.is_platform_admin() THEN
    RETURN TRUE;
  END IF;

  IF NOT public.store_uses_physical_ecommerce(p_store_id) THEN
    IF p_feature_key = 'emails.manage' THEN
      RETURN TRUE;
    END IF;
    -- Paid boosts available to all verticals; plan entitlement only for physical.
    IF p_feature_key = 'marketplace.sponsor' THEN
      RETURN FALSE;
    END IF;
    RETURN FALSE;
  END IF;

  v_slug := public.get_store_physical_plan_slug(p_store_id);
  IF v_slug IS NULL THEN
    RETURN FALSE;
  END IF;

  v_rank := public.physical_plan_rank(v_slug);

  SELECT p.max_warehouses INTO v_max_wh
  FROM public.platform_vendor_plans p
  WHERE p.slug = v_slug
  LIMIT 1;

  v_required := CASE p_feature_key
    WHEN 'whatsapp.product_button' THEN 1
    WHEN 'emails.manage' THEN 2
    WHEN 'shipping.tracking' THEN 2
    WHEN 'shipping.fedex_live' THEN 2
    WHEN 'shipping.local_africa' THEN 2
    WHEN 'suppliers.manage' THEN 2
    WHEN 'analytics.physical' THEN 2
    WHEN 'serial_tracking.manage' THEN 2
    WHEN 'warehouses.manage' THEN 2
    WHEN 'api.public' THEN 2
    WHEN 'marketplace.sponsor' THEN 2
    WHEN 'batch_shipping.manage' THEN 3
    WHEN 'lots_expiration.manage' THEN 3
    WHEN 'barcode_scanner.use' THEN 3
    WHEN 'preorders.manage' THEN 3
    WHEN 'backorders.manage' THEN 3
    WHEN 'bundles.manage' THEN 3
    WHEN 'forecasting.demand' THEN 3
    WHEN 'cost_optimization.manage' THEN 3
    WHEN 'team.sso' THEN 3
    WHEN 'audit.export' THEN 3
    ELSE 99
  END;

  IF p_feature_key = 'warehouses.manage' AND COALESCE(v_max_wh, 0) = 0 THEN
    RETURN FALSE;
  END IF;

  RETURN v_rank >= v_required;
END;
$$;

COMMENT ON FUNCTION public.store_has_physical_feature(UUID, TEXT) IS
  'Plan gating physical stores; marketplace.sponsor at rank 2 (Professional+). Non-physical: emails.manage only.';

-- Default quota for plan entitlement (overridable via plan features JSON later)
CREATE OR REPLACE FUNCTION public.marketplace_sponsor_plan_quota(p_store_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quota INTEGER;
  v_slug TEXT;
BEGIN
  IF NOT public.store_has_physical_feature(p_store_id, 'marketplace.sponsor') THEN
    RETURN 0;
  END IF;

  v_slug := public.get_store_physical_plan_slug(p_store_id);

  SELECT COALESCE((p.features->>'sponsor_active_quota')::integer, 3)
  INTO v_quota
  FROM public.platform_vendor_plans p
  WHERE p.slug = v_slug
  LIMIT 1;

  RETURN COALESCE(v_quota, 3);
END;
$$;

GRANT EXECUTE ON FUNCTION public.marketplace_sponsor_plan_quota(UUID) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 8. RPCs: create / activate / cancel / list helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.create_plan_sponsorship(p_product_id UUID)
RETURNS public.marketplace_sponsorships
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_store_id UUID;
  v_uid UUID := auth.uid();
  v_active_count INTEGER;
  v_quota INTEGER;
  v_row public.marketplace_sponsorships;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT p.store_id INTO v_store_id
  FROM public.products p
  WHERE p.id = p_product_id;

  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'Product not found';
  END IF;

  IF NOT public.is_store_member(v_store_id, v_uid) AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  IF NOT public.store_has_physical_feature(v_store_id, 'marketplace.sponsor') THEN
    RAISE EXCEPTION 'Plan does not include marketplace sponsorship';
  END IF;

  -- Already active?
  IF EXISTS (
    SELECT 1 FROM public.marketplace_sponsorships s
    WHERE s.product_id = p_product_id
      AND s.status = 'active'
      AND now() >= s.starts_at AND now() < s.ends_at
  ) THEN
    RAISE EXCEPTION 'Product already sponsored';
  END IF;

  v_quota := public.marketplace_sponsor_plan_quota(v_store_id);

  SELECT COUNT(*)::integer INTO v_active_count
  FROM public.marketplace_sponsorships s
  WHERE s.store_id = v_store_id
    AND s.source = 'plan_entitlement'
    AND s.status = 'active'
    AND now() >= s.starts_at AND now() < s.ends_at;

  IF v_active_count >= v_quota THEN
    RAISE EXCEPTION 'Sponsorship quota reached (% active / % max)', v_active_count, v_quota;
  END IF;

  INSERT INTO public.marketplace_sponsorships (
    store_id, product_id, sku_id, source, status,
    starts_at, ends_at, created_by, metadata
  ) VALUES (
    v_store_id,
    p_product_id,
    NULL,
    'plan_entitlement',
    'active',
    now(),
    now() + INTERVAL '30 days',
    v_uid,
    jsonb_build_object('quota_slot', true)
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_paid_sponsorship(
  p_product_id UUID,
  p_sku_slug TEXT
)
RETURNS public.marketplace_sponsorships
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_store_id UUID;
  v_uid UUID := auth.uid();
  v_sku public.marketplace_sponsorship_products%ROWTYPE;
  v_row public.marketplace_sponsorships;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT p.store_id INTO v_store_id
  FROM public.products p
  WHERE p.id = p_product_id;

  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'Product not found';
  END IF;

  IF NOT public.is_store_member(v_store_id, v_uid) AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT * INTO v_sku
  FROM public.marketplace_sponsorship_products
  WHERE slug = p_sku_slug AND is_active = true;

  IF v_sku.id IS NULL THEN
    RAISE EXCEPTION 'Unknown or inactive SKU';
  END IF;

  INSERT INTO public.marketplace_sponsorships (
    store_id, product_id, sku_id, source, status,
    amount_paid_cents, currency, created_by, metadata
  ) VALUES (
    v_store_id,
    p_product_id,
    v_sku.id,
    'paid_boost',
    'pending_payment',
    v_sku.price_cents,
    v_sku.currency,
    v_uid,
    jsonb_build_object('sku_slug', v_sku.slug, 'duration_days', v_sku.duration_days)
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.activate_marketplace_sponsorship(
  p_sponsorship_id UUID,
  p_payment_ref TEXT DEFAULT NULL
)
RETURNS public.marketplace_sponsorships
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.marketplace_sponsorships;
  v_days INTEGER := 7;
BEGIN
  SELECT * INTO v_row
  FROM public.marketplace_sponsorships
  WHERE id = p_sponsorship_id
  FOR UPDATE;

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'Sponsorship not found';
  END IF;

  IF v_row.status = 'active' THEN
    RETURN v_row;
  END IF;

  IF v_row.status NOT IN ('pending_payment', 'cancelled') THEN
    RAISE EXCEPTION 'Cannot activate sponsorship in status %', v_row.status;
  END IF;

  SELECT COALESCE(sku.duration_days, (v_row.metadata->>'duration_days')::integer, 7)
  INTO v_days
  FROM public.marketplace_sponsorship_products sku
  WHERE sku.id = v_row.sku_id;

  UPDATE public.marketplace_sponsorships
  SET
    status = 'active',
    starts_at = now(),
    ends_at = now() + make_interval(days => GREATEST(v_days, 1)),
    payment_ref = COALESCE(p_payment_ref, payment_ref),
    updated_at = now()
  WHERE id = p_sponsorship_id
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_marketplace_sponsorship(p_sponsorship_id UUID)
RETURNS public.marketplace_sponsorships
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.marketplace_sponsorships;
  v_uid UUID := auth.uid();
BEGIN
  SELECT * INTO v_row
  FROM public.marketplace_sponsorships
  WHERE id = p_sponsorship_id
  FOR UPDATE;

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'Sponsorship not found';
  END IF;

  IF NOT public.is_platform_admin()
     AND (v_uid IS NULL OR NOT public.is_store_member(v_row.store_id, v_uid)) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  IF v_row.status NOT IN ('pending_payment', 'active') THEN
    RAISE EXCEPTION 'Cannot cancel sponsorship in status %', v_row.status;
  END IF;

  UPDATE public.marketplace_sponsorships
  SET status = 'cancelled', updated_at = now()
  WHERE id = p_sponsorship_id
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

-- Admin: create + activate a sponsorship without payment (comp / support).
CREATE OR REPLACE FUNCTION public.admin_grant_marketplace_sponsorship(
  p_product_id UUID,
  p_sku_slug TEXT
)
RETURNS public.marketplace_sponsorships
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_store_id UUID;
  v_sku public.marketplace_sponsorship_products%ROWTYPE;
  v_row public.marketplace_sponsorships;
  v_days INTEGER;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT p.store_id INTO v_store_id
  FROM public.products p
  WHERE p.id = p_product_id;

  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'Product not found';
  END IF;

  SELECT * INTO v_sku
  FROM public.marketplace_sponsorship_products
  WHERE slug = p_sku_slug AND is_active = true;

  IF v_sku.id IS NULL THEN
    RAISE EXCEPTION 'Unknown or inactive SKU';
  END IF;

  v_days := GREATEST(COALESCE(v_sku.duration_days, 7), 1);

  INSERT INTO public.marketplace_sponsorships (
    store_id, product_id, sku_id, source, status,
    starts_at, ends_at,
    amount_paid_cents, currency, created_by, reviewed_by, metadata
  ) VALUES (
    v_store_id,
    p_product_id,
    v_sku.id,
    'admin_grant',
    'active',
    now(),
    now() + make_interval(days => v_days),
    0,
    v_sku.currency,
    v_uid,
    v_uid,
    jsonb_build_object(
      'sku_slug', v_sku.slug,
      'duration_days', v_days,
      'admin_grant', true
    )
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_sponsorship_event(
  p_sponsorship_id UUID,
  p_event_type TEXT,
  p_meta JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  IF p_event_type NOT IN ('impression', 'click', 'purchase') THEN
    RAISE EXCEPTION 'Invalid event type';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.marketplace_sponsorships s
    WHERE s.id = p_sponsorship_id AND s.status = 'active'
  ) THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.marketplace_sponsorship_events (sponsorship_id, event_type, meta)
  VALUES (p_sponsorship_id, p_event_type, COALESCE(p_meta, '{}'::jsonb))
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_plan_sponsorship(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_paid_sponsorship(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_grant_marketplace_sponsorship(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.activate_marketplace_sponsorship(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.cancel_marketplace_sponsorship(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.record_sponsorship_event(UUID, TEXT, JSONB) TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 9. RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.marketplace_sponsorship_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_sponsorships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_sponsorship_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS msp_products_select ON public.marketplace_sponsorship_products;
CREATE POLICY msp_products_select ON public.marketplace_sponsorship_products
  FOR SELECT TO anon, authenticated
  USING (is_active = true OR public.is_platform_admin());

DROP POLICY IF EXISTS msp_products_admin_all ON public.marketplace_sponsorship_products;
CREATE POLICY msp_products_admin_all ON public.marketplace_sponsorship_products
  FOR ALL TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS msp_sponsorships_select ON public.marketplace_sponsorships;
CREATE POLICY msp_sponsorships_select ON public.marketplace_sponsorships
  FOR SELECT TO authenticated
  USING (
    public.is_platform_admin()
    OR public.is_store_member(store_id, auth.uid())
  );

DROP POLICY IF EXISTS msp_sponsorships_insert ON public.marketplace_sponsorships;
CREATE POLICY msp_sponsorships_insert ON public.marketplace_sponsorships
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_platform_admin()
    OR public.is_store_member(store_id, auth.uid())
  );

DROP POLICY IF EXISTS msp_sponsorships_update ON public.marketplace_sponsorships;
CREATE POLICY msp_sponsorships_update ON public.marketplace_sponsorships
  FOR UPDATE TO authenticated
  USING (
    public.is_platform_admin()
    OR public.is_store_member(store_id, auth.uid())
  )
  WITH CHECK (
    public.is_platform_admin()
    OR public.is_store_member(store_id, auth.uid())
  );

DROP POLICY IF EXISTS msp_events_select ON public.marketplace_sponsorship_events;
CREATE POLICY msp_events_select ON public.marketplace_sponsorship_events
  FOR SELECT TO authenticated
  USING (
    public.is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM public.marketplace_sponsorships s
      WHERE s.id = sponsorship_id
        AND public.is_store_member(s.store_id, auth.uid())
    )
  );

DROP POLICY IF EXISTS msp_events_insert ON public.marketplace_sponsorship_events;
CREATE POLICY msp_events_insert ON public.marketplace_sponsorship_events
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- 10. Marketplace view + ranking RPC (sponsored-first + diversity + cap)
-- ---------------------------------------------------------------------------

-- CREATE OR REPLACE VIEW cannot safely reorder columns — drop then recreate.
DROP VIEW IF EXISTS public.marketplace_products_optimized;

CREATE VIEW public.marketplace_products_optimized AS
SELECT
  src.*,
  COALESCE(src.package_starting_price, src.effective_price) AS listing_price,
  COALESCE(
    (
      SELECT sp.category_attributes
      FROM public.service_products sp
      WHERE sp.product_id = src.id
      LIMIT 1
    ),
    '{}'::jsonb
  ) AS category_attributes,
  (
    src.sponsored_until IS NOT NULL AND src.sponsored_until > now()
  ) AS is_sponsored
FROM (
  SELECT
    p.id,
    p.name,
    p.slug,
    p.description,
    p.short_description,
    p.price,
    p.promotional_price,
    p.currency,
    p.category,
    p.product_type,
    p.licensing_type,
    p.license_terms,
    p.is_featured,
    p.sponsored_until,
    p.is_active,
    p.rating,
    p.reviews_count,
    0::integer AS purchases_count,
    p.created_at,
    p.updated_at,
    p.image_url,
    p.tags,
    s.id AS store_id,
    s.name AS store_name,
    s.slug AS store_slug,
    sa.logo_url AS store_logo_url,
    pas.commission_rate,
    pas.affiliate_enabled,
    COALESCE(p.rating, 0) AS sort_rating,
    COALESCE(p.reviews_count, 0) AS sort_reviews,
    0::integer AS sort_purchases,
    CASE
      WHEN p.promotional_price IS NOT NULL AND p.promotional_price < p.price
      THEN p.promotional_price
      ELSE p.price
    END AS effective_price,
    p.payment_options,
    p.whatsapp_number,
    p.whatsapp_enabled,
    sp.pricing_type,
    sp.fulfillment_mode,
    sp.duration_minutes,
    EXISTS (
      SELECT 1 FROM public.service_availability_slots sas
      WHERE sas.service_product_id = sp.id
    ) AS calendar_available,
    COALESCE(sp.requires_staff, false) AS requires_staff,
    (
      SELECT MIN(COALESCE(NULLIF(pkg.price, 0), NULLIF(pkg.package_price, 0)))
      FROM public.service_packages pkg
      WHERE pkg.service_product_id = sp.id
        AND pkg.package_kind = 'delivery_tier'
        AND COALESCE(pkg.is_active, true) = true
    ) AS package_starting_price
  FROM public.products p
  JOIN public.stores s ON p.store_id = s.id
  LEFT JOIN public.store_appearance sa ON sa.store_id = s.id
  LEFT JOIN public.product_affiliate_settings pas ON p.id = pas.product_id
  LEFT JOIN public.service_products sp ON sp.product_id = p.id AND p.product_type = 'service'
  WHERE p.is_active = true
    AND (p.is_draft IS NULL OR p.is_draft = false)
    AND s.is_active = true
) src;

COMMENT ON VIEW public.marketplace_products_optimized IS
  'Vue marketplace ; listing_price + category_attributes + is_sponsored.';

GRANT SELECT ON public.marketplace_products_optimized TO anon, authenticated;

DROP FUNCTION IF EXISTS public.get_marketplace_products_filtered(
  INTEGER, INTEGER, TEXT, TEXT, DECIMAL, DECIMAL, DECIMAL, TEXT, TEXT, TEXT, BOOLEAN
);

DROP FUNCTION IF EXISTS public.get_marketplace_products_filtered(
  INTEGER, INTEGER, TEXT, TEXT, DECIMAL, DECIMAL, DECIMAL, TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN
);

CREATE FUNCTION public.get_marketplace_products_filtered(
  p_limit INTEGER DEFAULT 24,
  p_offset INTEGER DEFAULT 0,
  p_category TEXT DEFAULT NULL,
  p_product_type TEXT DEFAULT NULL,
  p_min_price DECIMAL DEFAULT NULL,
  p_max_price DECIMAL DEFAULT NULL,
  p_min_rating DECIMAL DEFAULT NULL,
  p_sort_by TEXT DEFAULT 'created_at',
  p_sort_order TEXT DEFAULT 'desc',
  p_search_query TEXT DEFAULT NULL,
  p_featured_only BOOLEAN DEFAULT false,
  p_sponsored_only BOOLEAN DEFAULT false
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  description TEXT,
  short_description TEXT,
  price DECIMAL,
  promotional_price DECIMAL,
  currency TEXT,
  category TEXT,
  product_type TEXT,
  licensing_type TEXT,
  license_terms TEXT,
  is_featured BOOLEAN,
  is_sponsored BOOLEAN,
  rating DECIMAL,
  reviews_count INTEGER,
  purchases_count INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  image_url TEXT,
  tags TEXT[],
  store_id UUID,
  store_name TEXT,
  store_slug TEXT,
  store_logo_url TEXT,
  commission_rate DECIMAL,
  affiliate_enabled BOOLEAN,
  payment_options JSONB,
  whatsapp_number TEXT,
  whatsapp_enabled BOOLEAN,
  pricing_type TEXT,
  fulfillment_mode TEXT,
  duration_minutes INTEGER,
  calendar_available BOOLEAN,
  requires_staff BOOLEAN,
  package_starting_price DECIMAL,
  category_attributes JSONB,
  active_sponsorship_id UUID,
  total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Best-effort expire before ranking
  PERFORM public.expire_marketplace_sponsorships();

  RETURN QUERY
  WITH filtered AS (
    SELECT
      m.*,
      (
        SELECT s.id
        FROM public.marketplace_sponsorships s
        WHERE s.product_id = m.id
          AND s.status = 'active'
          AND s.starts_at IS NOT NULL
          AND s.ends_at IS NOT NULL
          AND now() >= s.starts_at
          AND now() < s.ends_at
        ORDER BY s.starts_at ASC
        LIMIT 1
      ) AS active_sponsorship_id,
      (
        SELECT s.starts_at
        FROM public.marketplace_sponsorships s
        WHERE s.product_id = m.id
          AND s.status = 'active'
          AND s.starts_at IS NOT NULL
          AND s.ends_at IS NOT NULL
          AND now() >= s.starts_at
          AND now() < s.ends_at
        ORDER BY s.starts_at ASC
        LIMIT 1
      ) AS sponsored_at
    FROM marketplace_products_optimized m
    WHERE
      (p_product_type IS NULL OR p_product_type = 'all' OR m.product_type = p_product_type)
      AND (
        p_category IS NULL
        OR p_category = 'all'
        OR m.category = p_category
        OR EXISTS (
          SELECT 1
          FROM public.categories child
          JOIN public.categories parent ON child.parent_id = parent.id
          WHERE parent.slug = p_category
            AND child.slug = m.category
        )
      )
      AND (p_min_price IS NULL OR m.listing_price >= p_min_price)
      AND (p_max_price IS NULL OR m.listing_price <= p_max_price)
      AND (p_min_rating IS NULL OR m.sort_rating >= p_min_rating)
      AND (
        p_search_query IS NULL
        OR TRIM(p_search_query) = ''
        OR m.name ILIKE '%' || TRIM(p_search_query) || '%'
        OR m.description ILIKE '%' || TRIM(p_search_query) || '%'
      )
      AND (NOT p_featured_only OR m.is_featured = true)
      AND (NOT p_sponsored_only OR m.is_sponsored = true)
  ),
  with_store_rank AS (
    SELECT
      f.*,
      CASE
        WHEN f.is_sponsored THEN
          ROW_NUMBER() OVER (
            PARTITION BY f.store_id
            ORDER BY f.sponsored_at ASC NULLS LAST, f.created_at DESC
          )
        ELSE NULL
      END AS store_sponsored_rn
    FROM filtered f
  ),
  capped AS (
    SELECT
      w.*,
      CASE
        WHEN w.is_sponsored AND COALESCE(w.store_sponsored_rn, 1) = 1 THEN true
        ELSE false
      END AS eligible_sponsored
    FROM with_store_rank w
  ),
  numbered AS (
    SELECT
      c.*,
      CASE
        WHEN c.eligible_sponsored THEN
          ROW_NUMBER() OVER (
            ORDER BY c.sponsored_at ASC NULLS LAST, c.created_at DESC
          )
        ELSE NULL
      END AS global_sponsored_rn
    FROM capped c
  ),
  ranked AS (
    SELECT
      n.*,
      CASE
        WHEN n.eligible_sponsored AND n.global_sponsored_rn <= 3 THEN true
        ELSE false
      END AS feed_sponsored
    FROM numbered n
  ),
  counted AS (
    SELECT COUNT(*)::bigint AS cnt FROM ranked
  )
  SELECT
    r.id,
    r.name,
    r.slug,
    r.description,
    r.short_description,
    r.price,
    r.promotional_price,
    r.currency,
    r.category,
    r.product_type,
    r.licensing_type,
    r.license_terms,
    r.is_featured,
    r.feed_sponsored AS is_sponsored,
    r.rating,
    r.reviews_count,
    r.purchases_count,
    r.created_at,
    r.updated_at,
    r.image_url,
    r.tags,
    r.store_id,
    r.store_name,
    r.store_slug,
    r.store_logo_url,
    r.commission_rate,
    r.affiliate_enabled,
    r.payment_options,
    r.whatsapp_number,
    r.whatsapp_enabled,
    r.pricing_type,
    r.fulfillment_mode,
    r.duration_minutes,
    r.calendar_available,
    r.requires_staff,
    r.package_starting_price,
    r.category_attributes,
    CASE WHEN r.feed_sponsored THEN r.active_sponsorship_id ELSE NULL END AS active_sponsorship_id,
    c.cnt AS total_count
  FROM ranked r
  CROSS JOIN counted c
  ORDER BY
    r.feed_sponsored DESC,
    CASE WHEN p_sort_by = 'price' AND UPPER(p_sort_order) = 'ASC' THEN r.listing_price END ASC,
    CASE WHEN p_sort_by = 'price' AND UPPER(p_sort_order) <> 'ASC' THEN r.listing_price END DESC,
    CASE WHEN p_sort_by = 'rating' AND UPPER(p_sort_order) = 'ASC' THEN r.sort_rating END ASC,
    CASE WHEN p_sort_by = 'rating' AND UPPER(p_sort_order) <> 'ASC' THEN r.sort_rating END DESC,
    CASE WHEN p_sort_by IN ('popular', 'sales_count') AND UPPER(p_sort_order) = 'ASC' THEN r.sort_purchases END ASC,
    CASE WHEN p_sort_by IN ('popular', 'sales_count') AND UPPER(p_sort_order) <> 'ASC' THEN r.sort_purchases END DESC,
    CASE WHEN p_sort_by = 'oldest' THEN r.created_at END ASC,
    CASE WHEN p_sort_by IN ('newest', 'created_at') OR p_sort_by IS NULL THEN r.created_at END DESC,
    r.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_marketplace_products_filtered(
  INTEGER, INTEGER, TEXT, TEXT, DECIMAL, DECIMAL, DECIMAL, TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN
) TO anon, authenticated;

COMMIT;
