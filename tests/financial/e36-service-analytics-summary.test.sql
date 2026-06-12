-- E36 Epic 3.3.3: Tests RPC get_service_analytics_summary
-- Exécution : supabase db execute -f tests/financial/e36-service-analytics-summary.test.sql

DO $$
BEGIN
  ASSERT to_regprocedure('public.get_service_analytics_summary(uuid,date,date)') IS NOT NULL,
    'get_service_analytics_summary(uuid,date,date) must exist';
  RAISE NOTICE '✓ Test 1: get_service_analytics_summary exists';
END $$;

DO $$
DECLARE
  v_service_id UUID;
  v_summary JSONB;
BEGIN
  SELECT p.id INTO v_service_id
  FROM public.products p
  WHERE p.product_type = 'service' AND p.is_active = true
  LIMIT 1;

  IF v_service_id IS NULL THEN
    RAISE NOTICE '⊘ Test 2 skipped: no active service product';
    RETURN;
  END IF;

  v_summary := public.get_service_analytics_summary(
    v_service_id,
    (CURRENT_DATE - 30)::DATE,
    CURRENT_DATE
  );

  ASSERT v_summary ? 'total_bookings', 'summary must include total_bookings';
  ASSERT v_summary ? 'daily_bookings', 'summary must include daily_bookings';
  ASSERT v_summary ? 'revenue', 'summary must include revenue';
  RAISE NOTICE '✓ Test 2: summary keys OK for service %', v_service_id;
END $$;
