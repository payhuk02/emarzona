-- P0: Pipeline livraison webhooks sortants — x-internal-secret + enqueue à l'insert

BEGIN;

CREATE EXTENSION IF NOT EXISTS pg_net;

-- Appelle webhook-delivery (batch ou delivery_id unique)
CREATE OR REPLACE FUNCTION public.call_webhook_delivery_edge_function(p_delivery_id uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, net
AS $$
DECLARE
  v_supabase_url text;
  v_internal_secret text;
  v_url text;
  v_body jsonb;
BEGIN
  BEGIN
    SELECT c.supabase_url, c.edge_internal_secret
    INTO v_supabase_url, v_internal_secret
    FROM private.welcome_email_hook_config c
    WHERE c.id = 1;
  EXCEPTION WHEN OTHERS THEN
    v_supabase_url := NULL;
    v_internal_secret := NULL;
  END;

  IF v_supabase_url IS NULL OR v_internal_secret IS NULL THEN
    v_supabase_url := nullif(trim(current_setting('app.settings.supabase_url', true)), '');
    v_internal_secret := nullif(trim(current_setting('app.settings.edge_internal_secret', true)), '');
  END IF;

  IF v_supabase_url IS NULL OR v_internal_secret IS NULL THEN
    RAISE WARNING 'webhook-delivery skipped: configure private.welcome_email_hook_config or app.settings (supabase_url, edge_internal_secret)';
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
    RAISE WARNING 'webhook-delivery skipped: pg_net extension not available';
    RETURN;
  END IF;

  v_url := rtrim(v_supabase_url, '/') || '/functions/v1/webhook-delivery';
  v_body := CASE
    WHEN p_delivery_id IS NOT NULL THEN jsonb_build_object('delivery_id', p_delivery_id)
    ELSE '{}'::jsonb
  END;

  PERFORM net.http_post(
    url := v_url,
    headers := jsonb_strip_nulls(
      jsonb_build_object(
        'Content-Type', 'application/json',
        'x-internal-secret', v_internal_secret
      )
    ),
    body := v_body
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'webhook-delivery http_post failed: %', SQLERRM;
END;
$$;

COMMENT ON FUNCTION public.call_webhook_delivery_edge_function(uuid) IS
  'Enqueue webhook-delivery Edge Function via pg_net (x-internal-secret). Optional delivery_id for immediate single delivery.';

CREATE OR REPLACE FUNCTION public.process_pending_webhook_deliveries()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.call_webhook_delivery_edge_function(NULL);
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_enqueue_webhook_delivery_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'pending' THEN
    PERFORM public.call_webhook_delivery_edge_function(NEW.id);
  END IF;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'trigger_enqueue_webhook_delivery_on_insert failed: %', SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_webhook_delivery_insert_enqueue ON public.webhook_deliveries;

CREATE TRIGGER on_webhook_delivery_insert_enqueue
  AFTER INSERT ON public.webhook_deliveries
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_enqueue_webhook_delivery_on_insert();

COMMENT ON FUNCTION public.trigger_enqueue_webhook_delivery_on_insert() IS
  'Enqueue immédiat de webhook-delivery à chaque nouvelle livraison pending (test + événements métier).';

COMMIT;
