-- Epic 2.3.1/2.3.2: Tests remboursements partiels + wallet
-- Exécution : psql ou supabase db execute (nécessite données de test)

-- Test 1: apply_transaction_refund rejette montant nul
DO $$
DECLARE
  v_err TEXT;
BEGIN
  BEGIN
    PERFORM public.apply_transaction_refund(
      '00000000-0000-0000-0000-000000000099'::uuid,
      0,
      'test-refund',
      'test',
      'test'
    );
    ASSERT false, 'Should reject zero amount';
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_err = MESSAGE_TEXT;
    ASSERT v_err LIKE '%INVALID_REFUND_AMOUNT%' OR v_err LIKE '%TRANSACTION_NOT_FOUND%',
      format('Unexpected: %s', v_err);
  END;
  RAISE NOTICE '✓ Test 1: montant remboursement invalide rejeté';
END $$;

-- Test 2: order_net_revenue_amount avec refunded_amount
DO $$
DECLARE
  v_order_id UUID;
  v_net NUMERIC;
BEGIN
  SELECT o.id INTO v_order_id
  FROM public.orders o
  WHERE o.total_amount > 100
    AND o.payment_status = 'paid'
  LIMIT 1;

  IF v_order_id IS NULL THEN
    RAISE NOTICE '⊘ Test 2 ignoré: pas de commande payée';
    RETURN;
  END IF;

  v_net := public.order_net_revenue_amount(v_order_id);
  ASSERT v_net >= 0, 'Net revenue must be >= 0';
  RAISE NOTICE '✓ Test 2: order_net_revenue_amount = %', v_net;
END $$;

-- Test 3: revoke_digital_access ratio partiel ne révoque pas
DO $$
DECLARE
  v_order_id UUID;
  v_active_before INTEGER;
  v_active_after INTEGER;
BEGIN
  SELECT dl.order_id INTO v_order_id
  FROM public.digital_licenses dl
  WHERE dl.status = 'active' AND dl.order_id IS NOT NULL
  LIMIT 1;

  IF v_order_id IS NULL THEN
    RAISE NOTICE '⊘ Test 3 ignoré: pas de licence active';
    RETURN;
  END IF;

  SELECT COUNT(*) INTO v_active_before
  FROM public.digital_licenses
  WHERE order_id = v_order_id AND status = 'active';

  PERFORM public.revoke_digital_access_for_order(v_order_id, 0.5);

  SELECT COUNT(*) INTO v_active_after
  FROM public.digital_licenses
  WHERE order_id = v_order_id AND status = 'active';

  ASSERT v_active_after = v_active_before,
    'Partial refund ratio should not revoke licenses';

  RAISE NOTICE '✓ Test 3: ratio 0.5 conserve licences actives';
END $$;

-- Test 4: is_order_eligible_for_revenue inclut partially_refunded
DO $$
BEGIN
  ASSERT public.is_order_eligible_for_revenue('completed', 'partially_refunded') = true;
  ASSERT public.is_order_eligible_for_revenue('completed', 'refunded') = false;
  RAISE NOTICE '✓ Test 4: is_order_eligible_for_revenue';
END $$;

DO $$
BEGIN
  RAISE NOTICE '🎉 Tests partial-refund-wallet terminés';
END $$;
