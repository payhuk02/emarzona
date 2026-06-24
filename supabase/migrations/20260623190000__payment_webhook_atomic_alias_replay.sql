-- Phase 0.4 — Alias RPC idempotence multi-PSP + helpers replay staging

CREATE OR REPLACE FUNCTION public.process_payment_webhook_atomic(
    p_provider text,
    p_external_event_id text,
    p_event_type text,
    p_transaction_id uuid,
    p_payload jsonb,
    p_mapped_status text,
    p_provider_session_id text DEFAULT NULL,
    p_provider_payment_intent_id text DEFAULT NULL,
    p_connected_account_id text DEFAULT NULL,
    p_application_fee_amount numeric DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.process_moneroo_webhook_atomic(
    p_provider,
    p_external_event_id,
    p_event_type,
    p_transaction_id,
    p_payload,
    p_mapped_status,
    p_provider_session_id,
    p_provider_payment_intent_id,
    p_connected_account_id,
    p_application_fee_amount
  );
END;
$$;

COMMENT ON FUNCTION public.process_payment_webhook_atomic IS
  'Alias multi-PSP (Moneroo, Stripe Connect, PayPal) — idempotence atomique webhook + transaction.';

GRANT EXECUTE ON FUNCTION public.process_payment_webhook_atomic(
  text, text, text, uuid, jsonb, text, text, text, text, numeric
) TO service_role;

-- Rapport contrat idempotence (staging / CI SQL)
CREATE OR REPLACE FUNCTION public.verify_webhook_idempotency_contract()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_unique boolean;
  v_has_atomic boolean;
  v_has_alias boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'payment_webhook_events'
      AND c.contype = 'u'
  ) INTO v_has_unique;

  SELECT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'process_moneroo_webhook_atomic'
  ) INTO v_has_atomic;

  SELECT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'process_payment_webhook_atomic'
  ) INTO v_has_alias;

  RETURN jsonb_build_object(
    'ok', v_has_unique AND v_has_atomic AND v_has_alias,
    'payment_webhook_events_unique', v_has_unique,
    'process_moneroo_webhook_atomic', v_has_atomic,
    'process_payment_webhook_atomic', v_has_alias,
    'checked_at', now()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_webhook_idempotency_contract() TO service_role;
GRANT EXECUTE ON FUNCTION public.verify_webhook_idempotency_contract() TO authenticated;
