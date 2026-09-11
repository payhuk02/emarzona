-- Admin grant sponsorship + allow source admin_grant (idempotent for DBs that
-- already applied 20260911160000 with the previous source CHECK).

DO $$
BEGIN
  ALTER TABLE public.marketplace_sponsorships
    DROP CONSTRAINT IF EXISTS marketplace_sponsorships_source_check;

  ALTER TABLE public.marketplace_sponsorships
    ADD CONSTRAINT marketplace_sponsorships_source_check
    CHECK (source IN ('plan_entitlement', 'paid_boost', 'admin_grant'));
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

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

GRANT EXECUTE ON FUNCTION public.admin_grant_marketplace_sponsorship(UUID, TEXT) TO authenticated;
