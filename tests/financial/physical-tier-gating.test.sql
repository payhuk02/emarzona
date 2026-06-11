-- Epic 3.2.7: Tier gating physique — limites plans + feature matrix
-- Exécution : supabase db execute -f tests/financial/physical-tier-gating.test.sql

DO $$
BEGIN
  ASSERT (SELECT max_products FROM public.platform_vendor_plans WHERE slug = 'physical_basic') = 50;
  ASSERT (SELECT max_variants_per_product FROM public.platform_vendor_plans WHERE slug = 'physical_basic') = 3;
  ASSERT (SELECT max_warehouses FROM public.platform_vendor_plans WHERE slug = 'physical_basic') = 0;
  RAISE NOTICE '✓ Test 1: physical_basic limits';
END $$;

DO $$
BEGIN
  ASSERT (SELECT max_products FROM public.platform_vendor_plans WHERE slug = 'physical_standard') = 200;
  ASSERT (SELECT max_variants_per_product FROM public.platform_vendor_plans WHERE slug = 'physical_standard') = 10;
  ASSERT (SELECT max_warehouses FROM public.platform_vendor_plans WHERE slug = 'physical_standard') = 1;
  RAISE NOTICE '✓ Test 2: physical_standard limits';
END $$;

DO $$
BEGIN
  ASSERT (SELECT max_products FROM public.platform_vendor_plans WHERE slug = 'physical_premium') IS NULL;
  ASSERT public.physical_plan_rank('physical_premium') = 3;
  RAISE NOTICE '✓ Test 3: physical_premium unlimited';
END $$;

DO $$
BEGIN
  ASSERT public.store_has_physical_feature(
    '00000000-0000-0000-0000-000000000001'::uuid,
    'serial_tracking.manage'
  ) IS NOT NULL;
  RAISE NOTICE '✓ Test 4: store_has_physical_feature callable';
END $$;

DO $$
DECLARE
  v_store_id UUID;
  v_limits jsonb;
BEGIN
  SELECT s.id INTO v_store_id FROM public.stores s LIMIT 1;
  IF v_store_id IS NULL THEN
    RAISE NOTICE '⊘ Test 5 skipped: no store';
    RETURN;
  END IF;

  v_limits := public.get_store_physical_plan_limits(v_store_id);
  ASSERT v_limits ? 'max_products';
  ASSERT v_limits ? 'active_physical_products';
  RAISE NOTICE '✓ Test 5: get_store_physical_plan_limits for store %', v_store_id;
END $$;
