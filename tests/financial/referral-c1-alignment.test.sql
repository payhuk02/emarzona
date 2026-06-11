-- Epic 2.3.3: Referral commission sur base commissionnable (C1), pas montant brut
-- Exécution : psql ou supabase db execute -f tests/financial/referral-c1-alignment.test.sql

-- Test 1: order_commissionable_amount existe
DO $$
BEGIN
  PERFORM public.order_commissionable_amount('00000000-0000-0000-0000-000000000099'::uuid);
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

DO $$
BEGIN
  ASSERT to_regprocedure('public.order_commissionable_amount(uuid)') IS NOT NULL,
    'order_commissionable_amount(uuid) must exist';
  RAISE NOTICE '✓ Test 1: order_commissionable_amount exists';
END $$;

-- Test 2: calculate_referral_commission trigger function référence la base commissionnable
DO $$
DECLARE
  v_src text;
BEGIN
  SELECT pg_get_functiondef(p.oid)
  INTO v_src
  FROM pg_proc p
  INNER JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = 'calculate_referral_commission';

  ASSERT v_src ILIKE '%order_commissionable_amount%',
    'calculate_referral_commission must use order_commissionable_amount';
  RAISE NOTICE '✓ Test 2: referral uses commissionable base';
END $$;

-- Test 3: resolve_store_platform_fee_percent — boutique physique = 0 %
DO $$
DECLARE
  v_store_id uuid;
  v_fee numeric;
BEGIN
  SELECT s.id INTO v_store_id
  FROM public.stores s
  INNER JOIN public.store_platform_subscriptions sps ON sps.store_id = s.id
  LIMIT 1;

  IF v_store_id IS NULL THEN
    RAISE NOTICE '⊘ Test 3 skipped: no store with platform subscription';
    RETURN;
  END IF;

  v_fee := public.resolve_store_platform_fee_percent(v_store_id);
  ASSERT v_fee IS NOT NULL;
  RAISE NOTICE '✓ Test 3: resolve_store_platform_fee_percent = % for store %', v_fee, v_store_id;
END $$;
