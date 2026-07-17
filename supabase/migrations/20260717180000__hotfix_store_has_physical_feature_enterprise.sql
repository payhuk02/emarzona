-- P0 hotfix: restore Enterprise feature keys dropped in 20260616000000
-- api.public (Pro+), team.sso + audit.export (Business)
-- Preserves non-physical bypass: emails.manage only for digital/service/course/artist

BEGIN;

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
  'Plan gating physical stores; non-physical stores get emails.manage only. Enterprise keys: api.public (rank 2), team.sso + audit.export (rank 3).';

GRANT EXECUTE ON FUNCTION public.store_has_physical_feature(UUID, TEXT) TO authenticated, service_role;

COMMIT;
