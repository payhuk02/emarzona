-- Backfill emails client + vendeur pour commandes COD sans envoi préalable.
-- Exécution : npx supabase db query --linked --agent=no -f supabase/scripts/backfill-cod-order-emails.sql
-- Idempotent : send-order-confirmation-email ignore les envois déjà marqués dans metadata.

BEGIN;

DO $$
DECLARE
  v_order RECORD;
  v_supabase_url TEXT;
  v_service_key TEXT;
  v_internal_secret TEXT;
  v_customer_email TEXT;
  v_customer_name TEXT;
  v_queued INT := 0;
  v_skipped INT := 0;
BEGIN
  SELECT c.supabase_url, c.service_role_key, c.edge_internal_secret
  INTO v_supabase_url, v_service_key, v_internal_secret
  FROM private.welcome_email_hook_config c
  WHERE c.id = 1;

  IF v_supabase_url IS NULL OR v_service_key IS NULL THEN
    RAISE EXCEPTION 'backfill: configure private.welcome_email_hook_config (supabase_url, service_role_key)';
  END IF;

  FOR v_order IN
    SELECT o.id, o.order_number, o.customer_id, o.metadata
    FROM public.orders o
    WHERE o.payment_status = 'cod_pending'
      AND (
        COALESCE(o.metadata->>'confirmation_email_sent_at', '') = ''
        OR COALESCE(o.metadata->>'seller_order_email_sent_at', '') = ''
      )
    ORDER BY o.created_at ASC
    LIMIT 100
  LOOP
    SELECT COALESCE(c.email, ''), COALESCE(c.full_name, c.name, 'Client')
    INTO v_customer_email, v_customer_name
    FROM public.customers c
    WHERE c.id = v_order.customer_id;

    IF v_customer_email = '' THEN
      v_skipped := v_skipped + 1;
      RAISE WARNING 'backfill skip % (no customer email)', v_order.order_number;
      CONTINUE;
    END IF;

    PERFORM net.http_post(
      url := rtrim(v_supabase_url, '/') || '/functions/v1/send-order-confirmation-email',
      headers := jsonb_strip_nulls(
        jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || v_service_key,
          'x-internal-secret', v_internal_secret
        )
      ),
      body := jsonb_build_object(
        'order_id', v_order.id,
        'customer_email', v_customer_email,
        'customer_name', v_customer_name,
        'customer_id', v_order.customer_id
      )
    );

    v_queued := v_queued + 1;
    RAISE NOTICE 'backfill queued % → %', v_order.order_number, v_customer_email;

    -- Respecter le rate limit Resend (~10 req/s)
    PERFORM pg_sleep(1.2);
  END LOOP;

  RAISE NOTICE 'backfill summary: queued=%, skipped=%', v_queued, v_skipped;
END $$;

COMMIT;
