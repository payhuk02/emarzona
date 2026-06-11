-- E28b: Autorisation vendeur sur apply_transaction_refund + grant authenticated

BEGIN;

CREATE OR REPLACE FUNCTION public.apply_transaction_refund(
  p_transaction_id UUID,
  p_refund_amount NUMERIC,
  p_refund_id TEXT DEFAULT NULL,
  p_provider TEXT DEFAULT 'unknown',
  p_reason TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tx public.transactions%ROWTYPE;
  v_prev_refunded NUMERIC;
  v_new_refunded NUMERIC;
  v_tx_amount NUMERIC;
  v_new_status TEXT;
  v_order_payment_status TEXT;
  v_refund_ratio NUMERIC;
  v_now TIMESTAMPTZ := now();
BEGIN
  IF p_refund_amount IS NULL OR p_refund_amount <= 0 THEN
    RAISE EXCEPTION 'INVALID_REFUND_AMOUNT';
  END IF;

  SELECT * INTO v_tx
  FROM public.transactions
  WHERE id = p_transaction_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'TRANSACTION_NOT_FOUND';
  END IF;

  IF auth.uid() IS NOT NULL
     AND NOT public.is_platform_admin()
     AND NOT EXISTS (
       SELECT 1 FROM public.stores s
       WHERE s.id = v_tx.store_id AND s.user_id = auth.uid()
     ) THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  IF v_tx.status NOT IN ('completed', 'partially_refunded') THEN
    RAISE EXCEPTION 'CANNOT_REFUND_STATUS_%', v_tx.status;
  END IF;

  v_tx_amount := COALESCE(v_tx.amount, 0);
  v_prev_refunded := COALESCE(v_tx.refunded_amount, v_tx.moneroo_refund_amount, 0);
  v_new_refunded := v_prev_refunded + p_refund_amount;

  IF v_new_refunded > v_tx_amount + 0.01 THEN
    RAISE EXCEPTION 'REFUND_EXCEEDS_TRANSACTION_AMOUNT';
  END IF;

  IF v_new_refunded >= v_tx_amount - 0.01 THEN
    v_new_status := 'refunded';
    v_order_payment_status := 'refunded';
    v_refund_ratio := 1.0;
  ELSE
    v_new_status := 'partially_refunded';
    v_order_payment_status := 'partially_refunded';
    v_refund_ratio := v_new_refunded / NULLIF(v_tx_amount, 0);
  END IF;

  UPDATE public.transactions
  SET
    status = v_new_status,
    refunded_amount = ROUND(v_new_refunded, 2),
    moneroo_refund_amount = ROUND(v_new_refunded, 2),
    moneroo_refund_id = COALESCE(p_refund_id, moneroo_refund_id),
    moneroo_refund_reason = COALESCE(p_reason, moneroo_refund_reason),
    refunded_at = COALESCE(refunded_at, v_now),
    updated_at = v_now,
    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
      'last_refund', jsonb_build_object(
        'refund_id', p_refund_id,
        'amount', p_refund_amount,
        'cumulative', v_new_refunded,
        'provider', p_provider,
        'reason', p_reason,
        'at', v_now
      )
    ) || COALESCE(p_metadata, '{}'::jsonb)
  WHERE id = p_transaction_id;

  IF v_tx.order_id IS NOT NULL THEN
    UPDATE public.orders
    SET
      payment_status = v_order_payment_status,
      refunded_amount = ROUND(v_new_refunded, 2),
      updated_at = v_now
    WHERE id = v_tx.order_id;

    PERFORM public.revoke_digital_access_for_order(v_tx.order_id, v_refund_ratio);
    PERFORM public.update_store_earnings(v_tx.store_id);
  END IF;

  INSERT INTO public.transaction_logs (
    transaction_id, event_type, status, response_data
  )
  VALUES (
    p_transaction_id,
    CASE WHEN v_new_status = 'refunded' THEN 'refund_completed' ELSE 'partial_refund_completed' END,
    'completed',
    jsonb_build_object(
      'refund_id', p_refund_id,
      'amount', p_refund_amount,
      'cumulative_refunded', v_new_refunded,
      'provider', p_provider,
      'status', v_new_status
    )
  );

  RETURN jsonb_build_object(
    'transaction_id', p_transaction_id,
    'order_id', v_tx.order_id,
    'status', v_new_status,
    'refunded_amount', v_new_refunded,
    'refund_ratio', v_refund_ratio
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_transaction_refund(UUID, NUMERIC, TEXT, TEXT, TEXT, JSONB)
  TO authenticated, service_role;

COMMIT;
