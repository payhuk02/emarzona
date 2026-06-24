-- E50 — Webhook idempotency replay contract (Phase 0.4)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'process_payment_webhook_atomic'
  ) THEN
    RAISE EXCEPTION 'process_payment_webhook_atomic missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'verify_webhook_idempotency_contract'
  ) THEN
    RAISE EXCEPTION 'verify_webhook_idempotency_contract missing';
  END IF;
END $$;

SELECT
  (public.verify_webhook_idempotency_contract()->>'ok')::boolean AS contract_ok,
  public.verify_webhook_idempotency_contract()->'payment_webhook_events_unique' AS has_unique;

-- Replay duplicate guard (in-memory transaction — no persistent side effects on real orders)
DO $$
DECLARE
  v_tx_id uuid;
  v_event_id text := 'sql-replay-test-' || gen_random_uuid()::text;
  v_first jsonb;
  v_second jsonb;
BEGIN
  SELECT id INTO v_tx_id
  FROM public.transactions
  WHERE status = 'completed' AND order_id IS NOT NULL
  ORDER BY updated_at DESC
  LIMIT 1;

  IF v_tx_id IS NULL THEN
    RAISE NOTICE 'SKIP replay simulation — no completed transaction in DB';
    RETURN;
  END IF;

  v_first := public.process_payment_webhook_atomic(
    'moneroo_platform',
    v_event_id,
    'sql.replay.test',
    v_tx_id,
    '{"replay": true}'::jsonb,
    'completed'
  );

  v_second := public.process_payment_webhook_atomic(
    'moneroo_platform',
    v_event_id,
    'sql.replay.test',
    v_tx_id,
    '{"replay": true}'::jsonb,
    'completed'
  );

  IF NOT (v_second->>'success' = 'false' AND v_second->>'reason' = 'duplicate_webhook') THEN
    RAISE EXCEPTION 'Replay duplicate guard failed: %', v_second;
  END IF;

  RAISE NOTICE 'Replay duplicate guard OK for transaction %', v_tx_id;
END $$;
