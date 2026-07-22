-- Backfill one order (payhuk02@gmail.com COD sans email)
-- Usage: npx supabase db query --linked --agent=no -f supabase/scripts/backfill-order-ORD-202607180005.sql

BEGIN;

DO $$
DECLARE
  v_order RECORD;
  v_supabase_url TEXT;
  v_service_key TEXT;
  v_internal_secret TEXT;
  v_customer_email TEXT;
  v_customer_name TEXT;
BEGIN
  SELECT c.supabase_url, c.service_role_key, c.edge_internal_secret
  INTO v_supabase_url, v_service_key, v_internal_secret
  FROM private.welcome_email_hook_config c
  WHERE c.id = 1;

  IF v_supabase_url IS NULL OR v_service_key IS NULL THEN
    RAISE EXCEPTION 'backfill: configure private.welcome_email_hook_config';
  END IF;

  SELECT o.id, o.order_number, o.customer_id, o.metadata
  INTO v_order
  FROM public.orders o
  WHERE o.order_number = 'ORD-202607180005';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'order ORD-202607180005 not found';
  END IF;

  SELECT COALESCE(c.email, ''), COALESCE(c.full_name, c.name, 'Client')
  INTO v_customer_email, v_customer_name
  FROM public.customers c
  WHERE c.id = v_order.customer_id;

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

  RAISE NOTICE 'backfill queued % → %', v_order.order_number, v_customer_email;
END $$;

COMMIT;
