-- Durable webhook idempotency: no 5-minute window for terminal statuses.

CREATE OR REPLACE FUNCTION public.is_webhook_already_processed(
  p_transaction_id UUID,
  p_status TEXT,
  p_provider TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_status TEXT;
  v_webhook_processed TIMESTAMPTZ;
BEGIN
  SELECT status, webhook_processed_at
  INTO v_current_status, v_webhook_processed
  FROM public.transactions
  WHERE id = p_transaction_id;

  IF v_current_status IS NULL THEN
    RETURN false;
  END IF;

  -- Terminal status + already processed => ignore duplicate forever
  IF v_current_status IN ('completed', 'failed', 'refunded', 'cancelled')
     AND v_current_status = p_status
     AND v_webhook_processed IS NOT NULL THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

COMMENT ON FUNCTION public.is_webhook_already_processed(UUID, TEXT, TEXT) IS
  'Returns true when webhook would be a duplicate for an already-processed terminal transaction status.';
