-- Sponsorship hardening follow-up (audit P0/P1):
-- 1) Activate recovery: cancelled unpaid paid_boost can still activate after late payment
-- 2) Block overlapping live active campaigns on same product (paid + admin grant)
-- 3) Plan quota race: advisory lock per store
-- 4) Expire paused past ends_at (keep prior abandon rules)

-- ---------------------------------------------------------------------------
-- activate: pending_payment OR cancelled unpaid paid_boost
-- ---------------------------------------------------------------------------
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
  v_other UUID;
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

  IF v_row.status = 'pending_payment' THEN
    NULL; -- ok
  ELSIF v_row.status = 'cancelled'
    AND v_row.source = 'paid_boost'
    AND (v_row.payment_ref IS NULL OR btrim(v_row.payment_ref) = '') THEN
    NULL; -- late payment after seller cancel / abandon
  ELSE
    RAISE EXCEPTION 'Cannot activate sponsorship in status %', v_row.status;
  END IF;

  -- Ne pas activer si une autre campagne live existe déjà sur le produit
  SELECT s.id INTO v_other
  FROM public.marketplace_sponsorships s
  WHERE s.product_id = v_row.product_id
    AND s.id IS DISTINCT FROM v_row.id
    AND s.status = 'active'
    AND s.starts_at IS NOT NULL
    AND s.ends_at IS NOT NULL
    AND now() >= s.starts_at
    AND now() < s.ends_at
  LIMIT 1;

  IF v_other IS NOT NULL THEN
    RAISE EXCEPTION 'Product already has an active sponsorship';
  END IF;

  IF v_row.sku_id IS NOT NULL THEN
    SELECT COALESCE(sku.duration_days, 7)
    INTO v_days
    FROM public.marketplace_sponsorship_products sku
    WHERE sku.id = v_row.sku_id;
  ELSE
    v_days := COALESCE((v_row.metadata->>'duration_days')::integer, 7);
  END IF;

  v_days := GREATEST(COALESCE(v_days, 7), 1);

  UPDATE public.marketplace_sponsorships
  SET
    status = 'active',
    starts_at = now(),
    ends_at = now() + make_interval(days => v_days),
    payment_ref = COALESCE(p_payment_ref, payment_ref),
    updated_at = now()
  WHERE id = p_sponsorship_id
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.activate_marketplace_sponsorship(UUID, TEXT) TO service_role;
REVOKE ALL ON FUNCTION public.activate_marketplace_sponsorship(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.activate_marketplace_sponsorship(UUID, TEXT) FROM anon, authenticated;

-- ---------------------------------------------------------------------------
-- create_paid: refuse if live active exists
-- ---------------------------------------------------------------------------
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

  IF EXISTS (
    SELECT 1 FROM public.marketplace_sponsorships s
    WHERE s.product_id = p_product_id
      AND s.status = 'active'
      AND s.starts_at IS NOT NULL
      AND s.ends_at IS NOT NULL
      AND now() >= s.starts_at
      AND now() < s.ends_at
  ) THEN
    RAISE EXCEPTION 'Product already sponsored';
  END IF;

  SELECT * INTO v_sku
  FROM public.marketplace_sponsorship_products
  WHERE slug = p_sku_slug AND is_active = true;

  IF v_sku.id IS NULL THEN
    RAISE EXCEPTION 'Unknown or inactive SKU';
  END IF;

  -- Remplace un pending_payment orphelin sur le même produit (évite doubles checkouts)
  UPDATE public.marketplace_sponsorships s
  SET status = 'cancelled', updated_at = now()
  WHERE s.product_id = p_product_id
    AND s.status = 'pending_payment'
    AND s.source = 'paid_boost'
    AND (s.payment_ref IS NULL OR btrim(s.payment_ref) = '');

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

-- ---------------------------------------------------------------------------
-- create_plan: advisory lock + already-active check (existing) kept
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

  -- Serialize quota checks per store for this transaction
  PERFORM pg_advisory_xact_lock(hashtext('msp-quota:' || v_store_id::text));

  IF EXISTS (
    SELECT 1 FROM public.marketplace_sponsorships s
    WHERE s.product_id = p_product_id
      AND s.status = 'active'
      AND s.starts_at IS NOT NULL
      AND s.ends_at IS NOT NULL
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
    AND s.starts_at IS NOT NULL
    AND s.ends_at IS NOT NULL
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

-- ---------------------------------------------------------------------------
-- admin_grant: refuse if live active exists
-- ---------------------------------------------------------------------------
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

  IF EXISTS (
    SELECT 1 FROM public.marketplace_sponsorships s
    WHERE s.product_id = p_product_id
      AND s.status = 'active'
      AND s.starts_at IS NOT NULL
      AND s.ends_at IS NOT NULL
      AND now() >= s.starts_at
      AND now() < s.ends_at
  ) THEN
    RAISE EXCEPTION 'Product already sponsored';
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

-- ---------------------------------------------------------------------------
-- expire: active + paused
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.expire_marketplace_sponsorships()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER := 0;
  v_abandoned INTEGER := 0;
BEGIN
  WITH expired AS (
    UPDATE public.marketplace_sponsorships s
    SET status = 'expired', updated_at = now()
    WHERE s.status IN ('active', 'paused')
      AND s.ends_at IS NOT NULL
      AND s.ends_at <= now()
    RETURNING s.product_id
  )
  SELECT COUNT(*)::integer INTO v_count FROM expired;

  UPDATE public.marketplace_sponsorships s
  SET status = 'cancelled', updated_at = now()
  WHERE s.status = 'pending_payment'
    AND s.source = 'paid_boost'
    AND s.created_at < now() - INTERVAL '7 days';

  GET DIAGNOSTICS v_abandoned = ROW_COUNT;

  RETURN v_count + v_abandoned;
END;
$$;

GRANT EXECUTE ON FUNCTION public.expire_marketplace_sponsorships() TO service_role;
