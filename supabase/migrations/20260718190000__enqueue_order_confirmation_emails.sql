-- P0: Enqueue client + seller order confirmation emails when order is confirmed.
-- Covers cod_pending (COD) and paid/completed (online) — backup when client-side invoke fails.

BEGIN;

CREATE OR REPLACE FUNCTION public.enqueue_order_confirmation_emails()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_supabase_url TEXT;
  v_service_key TEXT;
  v_internal_secret TEXT;
  v_customer_email TEXT;
  v_customer_name TEXT;
  v_metadata JSONB;
BEGIN
  IF NEW.payment_status NOT IN ('paid', 'completed', 'cod_pending') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE'
    AND COALESCE(OLD.payment_status, '') IS NOT DISTINCT FROM NEW.payment_status THEN
    RETURN NEW;
  END IF;

  v_metadata := COALESCE(NEW.metadata, '{}'::jsonb);

  IF COALESCE(v_metadata->>'confirmation_email_sent_at', '') <> ''
     AND COALESCE(v_metadata->>'seller_order_email_sent_at', '') <> '' THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(c.email, ''), COALESCE(c.full_name, c.name, 'Client')
  INTO v_customer_email, v_customer_name
  FROM public.customers c
  WHERE c.id = NEW.customer_id;

  IF v_customer_email = '' OR v_customer_email IS NULL THEN
    RAISE WARNING 'enqueue_order_confirmation_emails: no customer email for order %', NEW.id;
    RETURN NEW;
  END IF;

  SELECT c.supabase_url, c.service_role_key, c.edge_internal_secret
  INTO v_supabase_url, v_service_key, v_internal_secret
  FROM private.welcome_email_hook_config c
  WHERE c.id = 1;

  IF v_supabase_url IS NULL OR v_service_key IS NULL THEN
    RAISE WARNING 'enqueue_order_confirmation_emails: welcome_email_hook_config missing for order %', NEW.id;
    RETURN NEW;
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
      'order_id', NEW.id,
      'customer_email', v_customer_email,
      'customer_name', v_customer_name,
      'customer_id', NEW.customer_id
    )
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'enqueue_order_confirmation_emails failed for order %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enqueue_order_confirmation_emails ON public.orders;
CREATE TRIGGER trg_enqueue_order_confirmation_emails
  AFTER INSERT OR UPDATE OF payment_status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.enqueue_order_confirmation_emails();

COMMENT ON FUNCTION public.enqueue_order_confirmation_emails() IS
  'HTTP enqueue send-order-confirmation-email on paid/completed/cod_pending (idempotent via order metadata).';

COMMIT;
