-- P2: Rapport contrat config pipeline webhook-delivery (sans exposer les secrets)

BEGIN;

CREATE OR REPLACE FUNCTION public.verify_webhook_delivery_config()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_fn boolean;
  v_has_pg_net boolean;
  v_has_trigger boolean;
  v_config_source text := NULL;
  v_has_url boolean := false;
  v_has_secret boolean := false;
  v_url_setting text;
  v_secret_setting text;
BEGIN
  SELECT to_regprocedure('public.call_webhook_delivery_edge_function(uuid)') IS NOT NULL
  INTO v_has_fn;

  SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net')
  INTO v_has_pg_net;

  SELECT EXISTS (
    SELECT 1
    FROM pg_trigger t
    INNER JOIN pg_class c ON c.oid = t.tgrelid
    INNER JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'webhook_deliveries'
      AND t.tgname = 'on_webhook_delivery_insert_enqueue'
      AND NOT t.tgisinternal
  )
  INTO v_has_trigger;

  BEGIN
    SELECT
      c.supabase_url IS NOT NULL AND length(trim(c.supabase_url)) > 0,
      c.edge_internal_secret IS NOT NULL AND length(trim(c.edge_internal_secret)) > 0
    INTO v_has_url, v_has_secret
    FROM private.welcome_email_hook_config c
    WHERE c.id = 1;

    IF v_has_url AND v_has_secret THEN
      v_config_source := 'welcome_email_hook_config';
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      v_has_url := false;
      v_has_secret := false;
  END;

  IF v_config_source IS NULL THEN
    v_url_setting := nullif(trim(current_setting('app.settings.supabase_url', true)), '');
    v_secret_setting := nullif(trim(current_setting('app.settings.edge_internal_secret', true)), '');
    v_has_url := v_url_setting IS NOT NULL;
    v_has_secret := v_secret_setting IS NOT NULL;

    IF v_has_url AND v_has_secret THEN
      v_config_source := 'app.settings';
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'ok', v_has_fn AND v_has_pg_net AND v_has_trigger AND v_config_source IS NOT NULL,
    'call_webhook_delivery_edge_function', v_has_fn,
    'pg_net', v_has_pg_net,
    'enqueue_trigger', v_has_trigger,
    'config_source', v_config_source,
    'has_supabase_url', v_has_url,
    'has_edge_internal_secret', v_has_secret,
    'checked_at', now()
  );
END;
$$;

COMMENT ON FUNCTION public.verify_webhook_delivery_config() IS
  'Contrat prod/staging : pipeline webhook-delivery (pg_net, trigger, URL + secret internes configurés).';

REVOKE ALL ON FUNCTION public.verify_webhook_delivery_config() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_webhook_delivery_config() TO service_role;
GRANT EXECUTE ON FUNCTION public.verify_webhook_delivery_config() TO authenticated;

COMMIT;
