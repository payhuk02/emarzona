-- Phase 3: idempotence webhooks Resend (déduplication svix-id / clé composite)

BEGIN;

CREATE TABLE IF NOT EXISTS public.email_webhook_events (
  dedup_key TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  provider_message_id TEXT,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_webhook_events_processed_at
  ON public.email_webhook_events (processed_at DESC);

COMMENT ON TABLE public.email_webhook_events IS
  'Journal idempotent des événements webhook email (Resend/Svix). INSERT via claim_email_webhook_event uniquement.';

ALTER TABLE public.email_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.claim_email_webhook_event(
  p_dedup_key TEXT,
  p_event_type TEXT,
  p_provider_message_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_dedup_key IS NULL OR trim(p_dedup_key) = '' THEN
    RETURN TRUE;
  END IF;

  INSERT INTO public.email_webhook_events (dedup_key, event_type, provider_message_id)
  VALUES (trim(p_dedup_key), trim(p_event_type), p_provider_message_id)
  ON CONFLICT (dedup_key) DO NOTHING;

  RETURN FOUND;
END;
$$;

COMMENT ON FUNCTION public.claim_email_webhook_event IS
  'Réserve un événement webhook (retourne false si déjà traité). Réservé service_role.';

REVOKE EXECUTE ON FUNCTION public.claim_email_webhook_event(TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.claim_email_webhook_event(TEXT, TEXT, TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.claim_email_webhook_event(TEXT, TEXT, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.claim_email_webhook_event(TEXT, TEXT, TEXT) TO service_role;

COMMIT;
