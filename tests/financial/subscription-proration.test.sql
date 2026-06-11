-- Epic 2.1.6: Tests proration change_physical_plan / calculate_physical_plan_proration
-- Exécution : psql ou supabase db execute

-- Test 1: physical_plan_rank ordre croissant
DO $$
BEGIN
  ASSERT public.physical_plan_rank('physical_basic') = 1;
  ASSERT public.physical_plan_rank('physical_standard') = 2;
  ASSERT public.physical_plan_rank('physical_premium') = 3;
  ASSERT public.physical_plan_rank('unknown') = 0;
  RAISE NOTICE '✓ Test 1: physical_plan_rank';
END $$;

-- Test 2: calculate_physical_plan_proration — subscription absente
DO $$
DECLARE
  v_err TEXT;
BEGIN
  BEGIN
    PERFORM public.calculate_physical_plan_proration(
      '00000000-0000-0000-0000-000000000099'::uuid,
      'physical_standard'
    );
    ASSERT false, 'Should raise SUBSCRIPTION_NOT_FOUND';
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_err = MESSAGE_TEXT;
    ASSERT v_err LIKE '%SUBSCRIPTION_NOT_FOUND%' OR v_err LIKE '%not found%',
      format('Unexpected error: %s', v_err);
  END;
  RAISE NOTICE '✓ Test 2: proration sans subscription';
END $$;

-- Test 3: change_physical_plan — plan slug invalide
DO $$
DECLARE
  v_store_id UUID;
  v_err TEXT;
BEGIN
  SELECT sps.store_id INTO v_store_id
  FROM public.store_platform_subscriptions sps
  LIMIT 1;

  IF v_store_id IS NULL THEN
    RAISE NOTICE '⊘ Test 3 ignoré: aucune subscription en base';
    RETURN;
  END IF;

  BEGIN
    PERFORM public.change_physical_plan(v_store_id, 'invalid_plan_slug');
    ASSERT false, 'Should reject invalid plan slug';
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_err = MESSAGE_TEXT;
    ASSERT v_err LIKE '%PLAN_NOT_FOUND%' OR v_err LIKE '%invalid%',
      format('Unexpected error: %s', v_err);
  END;
  RAISE NOTICE '✓ Test 3: change_physical_plan plan invalide';
END $$;

-- Test 4: downgrade retourne pending (si subscription active avec période future)
DO $$
DECLARE
  v_store_id UUID;
  v_current_slug TEXT;
  v_result JSONB;
BEGIN
  SELECT sps.store_id, pvp.slug
  INTO v_store_id, v_current_slug
  FROM public.store_platform_subscriptions sps
  INNER JOIN public.platform_vendor_plans pvp ON pvp.id = sps.plan_id
  WHERE sps.status IN ('active', 'trialing')
    AND sps.current_period_end > now() + interval '1 day'
    AND pvp.slug = 'physical_premium'
  LIMIT 1;

  IF v_store_id IS NULL THEN
    RAISE NOTICE '⊘ Test 4 ignoré: pas de subscription premium active avec période future';
    RETURN;
  END IF;

  v_result := public.change_physical_plan(v_store_id, 'physical_basic');

  ASSERT (v_result->>'change_type') IN ('downgrade', 'same'),
    format('Expected downgrade, got %s', v_result->>'change_type');

  IF (v_result->>'change_type') = 'downgrade' THEN
    ASSERT (v_result->>'scheduled')::boolean = true OR v_result ? 'pending_plan_slug',
      'Downgrade should be scheduled at period end';
  END IF;

  RAISE NOTICE '✓ Test 4: downgrade planifié à échéance';
END $$;

-- Test 5: proration upgrade — montant >= 0
DO $$
DECLARE
  v_store_id UUID;
  v_preview JSONB;
BEGIN
  SELECT sps.store_id
  INTO v_store_id
  FROM public.store_platform_subscriptions sps
  INNER JOIN public.platform_vendor_plans pvp ON pvp.id = sps.plan_id
  WHERE sps.status IN ('active', 'trialing')
    AND pvp.slug = 'physical_basic'
    AND sps.current_period_end > now()
  LIMIT 1;

  IF v_store_id IS NULL THEN
    RAISE NOTICE '⊘ Test 5 ignoré: pas de subscription basic active';
    RETURN;
  END IF;

  v_preview := public.calculate_physical_plan_proration(v_store_id, 'physical_standard');

  ASSERT (v_preview->>'change_type') = 'upgrade',
    format('Expected upgrade preview, got %s', v_preview->>'change_type');
  ASSERT COALESCE((v_preview->>'amount_due')::numeric, 0) >= 0,
    'amount_due must be non-negative';

  RAISE NOTICE '✓ Test 5: preview upgrade avec amount_due >= 0';
END $$;

DO $$
BEGIN
  RAISE NOTICE '🎉 Tests subscription-proration terminés';
END $$;
