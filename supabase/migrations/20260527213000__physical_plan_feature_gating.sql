-- Physical plans feature gating (Basic / Standard / Premium)
-- Enforce advanced ops access by store plan slug.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) Helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_store_physical_plan_slug(p_store_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.slug
  FROM public.store_platform_subscriptions s
  JOIN public.platform_vendor_plans p ON p.id = s.plan_id
  WHERE s.store_id = p_store_id
    AND p.applies_to_product_type = 'physical'
    AND (
      s.status = 'active'
      OR (s.status = 'trialing' AND (s.trial_ends_at IS NULL OR s.trial_ends_at > now()))
    )
  LIMIT 1;
$$;

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
BEGIN
  IF public.is_platform_admin() THEN
    RETURN TRUE;
  END IF;

  v_slug := public.get_store_physical_plan_slug(p_store_id);
  IF v_slug IS NULL THEN
    RETURN FALSE;
  END IF;

  v_rank := CASE v_slug
    WHEN 'physical_basic' THEN 1
    WHEN 'physical_standard' THEN 2
    WHEN 'physical_premium' THEN 3
    ELSE 0
  END;

  v_required := CASE p_feature_key
    WHEN 'shipping.tracking' THEN 2
    WHEN 'suppliers.manage' THEN 2
    WHEN 'analytics.physical' THEN 2
    WHEN 'batch_shipping.manage' THEN 3
    WHEN 'warehouses.manage' THEN 3
    WHEN 'lots_expiration.manage' THEN 3
    WHEN 'serial_tracking.manage' THEN 3
    WHEN 'barcode_scanner.use' THEN 3
    WHEN 'preorders.manage' THEN 3
    WHEN 'backorders.manage' THEN 3
    WHEN 'bundles.manage' THEN 3
    WHEN 'forecasting.demand' THEN 3
    WHEN 'cost_optimization.manage' THEN 3
    ELSE 99
  END;

  RETURN v_rank >= v_required;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_store_physical_plan_slug(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.store_has_physical_feature(UUID, TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- 2) Premium ops tables RLS gating
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  -- batch_shipments => premium
  IF to_regclass('public.batch_shipments') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Store owners manage batch_shipments by plan" ON public.batch_shipments';
    EXECUTE 'CREATE POLICY "Store owners manage batch_shipments by plan" ON public.batch_shipments
      FOR ALL TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.stores s
          WHERE s.id = batch_shipments.store_id
            AND s.user_id = auth.uid()
        )
        AND public.store_has_physical_feature(batch_shipments.store_id, ''batch_shipping.manage'')
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.stores s
          WHERE s.id = batch_shipments.store_id
            AND s.user_id = auth.uid()
        )
        AND public.store_has_physical_feature(batch_shipments.store_id, ''batch_shipping.manage'')
      )';
  END IF;

  -- product_lots => premium
  IF to_regclass('public.product_lots') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Store owners manage product_lots by plan" ON public.product_lots';
    EXECUTE 'CREATE POLICY "Store owners manage product_lots by plan" ON public.product_lots
      FOR ALL TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.physical_products pp
          JOIN public.products p ON p.id = pp.product_id
          JOIN public.stores s ON s.id = p.store_id
          WHERE pp.id = product_lots.physical_product_id
            AND s.user_id = auth.uid()
            AND public.store_has_physical_feature(s.id, ''lots_expiration.manage'')
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.physical_products pp
          JOIN public.products p ON p.id = pp.product_id
          JOIN public.stores s ON s.id = p.store_id
          WHERE pp.id = product_lots.physical_product_id
            AND s.user_id = auth.uid()
            AND public.store_has_physical_feature(s.id, ''lots_expiration.manage'')
        )
      )';
  END IF;

  -- warehouses => premium
  IF to_regclass('public.warehouses') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Store owners manage warehouses by plan" ON public.warehouses';
    EXECUTE 'CREATE POLICY "Store owners manage warehouses by plan" ON public.warehouses
      FOR ALL TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.stores s
          WHERE s.id = warehouses.store_id
            AND s.user_id = auth.uid()
            AND public.store_has_physical_feature(s.id, ''warehouses.manage'')
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.stores s
          WHERE s.id = warehouses.store_id
            AND s.user_id = auth.uid()
            AND public.store_has_physical_feature(s.id, ''warehouses.manage'')
        )
      )';
  END IF;

  -- serial_numbers => premium
  IF to_regclass('public.serial_numbers') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Store owners manage serial_numbers by plan" ON public.serial_numbers';
    EXECUTE 'CREATE POLICY "Store owners manage serial_numbers by plan" ON public.serial_numbers
      FOR ALL TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.physical_products pp
          JOIN public.products p ON p.id = pp.product_id
          JOIN public.stores s ON s.id = p.store_id
          WHERE pp.id = serial_numbers.physical_product_id
            AND s.user_id = auth.uid()
            AND public.store_has_physical_feature(s.id, ''serial_tracking.manage'')
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.physical_products pp
          JOIN public.products p ON p.id = pp.product_id
          JOIN public.stores s ON s.id = p.store_id
          WHERE pp.id = serial_numbers.physical_product_id
            AND s.user_id = auth.uid()
            AND public.store_has_physical_feature(s.id, ''serial_tracking.manage'')
        )
      )';
  END IF;
END $$;

COMMIT;

