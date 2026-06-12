-- Epic 3.2 E35: sync sales_history + zones Afrique forfait
DO $$
BEGIN
  ASSERT EXISTS (
    SELECT 1 FROM pg_proc p WHERE p.proname = 'sync_store_sales_history'
  );
  ASSERT EXISTS (
    SELECT 1 FROM pg_proc p WHERE p.proname = 'seed_africa_local_shipping_zones'
  );
  RAISE NOTICE '✓ E35: RPCs sync_store_sales_history + seed_africa_local_shipping_zones';
END $$;

DO $$
BEGIN
  ASSERT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'shipping_zones'
      AND column_name = 'zone_type'
  );
  RAISE NOTICE '✓ E35: shipping_zones.zone_type column';
END $$;

DO $$
DECLARE
  v_limits jsonb;
  v_store_id UUID;
BEGIN
  SELECT s.id INTO v_store_id
  FROM public.stores s
  JOIN public.store_platform_subscriptions sub ON sub.store_id = s.id
  JOIN public.platform_vendor_plans p ON p.id = sub.plan_id
  WHERE p.slug = 'physical_standard'
    AND sub.status IN ('active', 'trialing')
  LIMIT 1;

  IF v_store_id IS NULL THEN
    RAISE NOTICE '⊘ E35 local_africa feature skipped: no physical_standard store';
    RETURN;
  END IF;

  v_limits := public.get_store_physical_plan_limits(v_store_id);
  ASSERT (v_limits -> 'features' ->> 'shipping.local_africa')::boolean IS TRUE;
  ASSERT public.store_has_physical_feature(v_store_id, 'shipping.local_africa') IS TRUE;
  RAISE NOTICE '✓ E35: Professional has shipping.local_africa';
END $$;
