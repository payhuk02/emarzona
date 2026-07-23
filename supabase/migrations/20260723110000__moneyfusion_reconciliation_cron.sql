-- Cron MoneyFusion : appelle moneyfusion.reconcile_stuck (pas de nouvelle Edge Function)
CREATE OR REPLACE FUNCTION public.setup_moneyfusion_reconciliation_cron_job(
  p_project_ref text,
  p_cron_secret text,
  p_anon_key text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, cron, net
AS $$
DECLARE
  v_anon text;
  v_base_url text;
  v_job_id bigint;
BEGIN
  IF p_project_ref IS NULL OR length(trim(p_project_ref)) = 0 THEN
    RAISE EXCEPTION 'p_project_ref is required';
  END IF;
  IF p_cron_secret IS NULL OR length(trim(p_cron_secret)) = 0 THEN
    RAISE EXCEPTION 'p_cron_secret is required';
  END IF;

  v_anon := COALESCE(NULLIF(trim(p_anon_key), ''), current_setting('app.settings.anon_key', true));
  IF v_anon IS NULL OR v_anon = '' THEN
    RAISE EXCEPTION 'p_anon_key is required';
  END IF;

  v_base_url := format('https://%s.supabase.co/functions/v1', trim(p_project_ref));

  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'moneyfusion-reconciliation-10m') THEN
    PERFORM cron.unschedule('moneyfusion-reconciliation-10m');
  END IF;

  SELECT cron.schedule(
    'moneyfusion-reconciliation-10m',
    '*/10 * * * *',
    format(
      $cmd$
      SELECT net.http_post(
        url := %L,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || %L,
          'apikey', %L,
          'x-cron-secret', %L
        ),
        body := jsonb_build_object(
          'action', 'reconcile_stuck',
          'data', jsonb_build_object('hours_back', 72, 'limit', 50, 'min_age_minutes', 2)
        )
      ) AS request_id;
      $cmd$,
      v_base_url || '/moneyfusion',
      v_anon,
      v_anon,
      p_cron_secret
    )
  ) INTO v_job_id;

  RETURN jsonb_build_object(
    'job_name', 'moneyfusion-reconciliation-10m',
    'job_id', v_job_id,
    'schedule', '*/10 * * * *',
    'url', v_base_url || '/moneyfusion',
    'action', 'reconcile_stuck'
  );
END;
$$;

COMMENT ON FUNCTION public.setup_moneyfusion_reconciliation_cron_job(text, text, text) IS
  'Schedules MoneyFusion stuck-payment reconciliation every 10 minutes via moneyfusion.reconcile_stuck';

GRANT EXECUTE ON FUNCTION public.setup_moneyfusion_reconciliation_cron_job(text, text, text) TO service_role;
