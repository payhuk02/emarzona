-- E25 Epic 2.1.4: pg_cron jobs — lifecycle, dunning in-app, dunning emails, auto-renewal Moneroo
-- Ordre quotidien (UTC) : 06:00 → 06:05 → 06:10 → 06:15

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    CREATE EXTENSION IF NOT EXISTS pg_cron;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
    CREATE EXTENSION IF NOT EXISTS pg_net;
  END IF;
END $$;

-- =====================================================
-- Phase SQL (lifecycle + notifications in-app)
-- =====================================================

CREATE OR REPLACE FUNCTION public.run_physical_subscription_billing_sql_phase()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lifecycle jsonb;
  v_dunning jsonb;
BEGIN
  v_lifecycle := public.process_store_platform_subscription_lifecycle();
  v_dunning := public.process_subscription_dunning_notifications();

  RETURN jsonb_build_object(
    'lifecycle', v_lifecycle,
    'dunning_in_app', v_dunning,
    'processed_at', now()
  );
END;
$$;

COMMENT ON FUNCTION public.run_physical_subscription_billing_sql_phase IS
  'Exécute lifecycle abonnement physique puis notifications in-app dunning (E22).';

-- =====================================================
-- Setup RPC — appeler une fois en prod avec secrets réels
-- SELECT public.setup_physical_subscription_billing_cron_jobs(
--   'hbdnzajbyjakdhuavrvb',
--   '<CRON_SECRET>',
--   '<SUPABASE_ANON_KEY>'
-- );
-- =====================================================

CREATE OR REPLACE FUNCTION public.setup_physical_subscription_billing_cron_jobs(
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
  v_jobs jsonb := '[]'::jsonb;
  v_job_id bigint;
BEGIN
  IF p_project_ref IS NULL OR length(trim(p_project_ref)) = 0 THEN
    RAISE EXCEPTION 'p_project_ref is required';
  END IF;

  IF p_cron_secret IS NULL OR length(trim(p_cron_secret)) < 16 THEN
    RAISE EXCEPTION 'p_cron_secret must be at least 16 characters';
  END IF;

  v_anon := nullif(trim(p_anon_key), '');
  IF v_anon IS NULL THEN
    RAISE EXCEPTION 'p_anon_key is required (Supabase anon JWT for Edge gateway)';
  END IF;

  v_base_url := format('https://%s.supabase.co/functions/v1', trim(p_project_ref));

  -- 1. Lifecycle + dunning in-app — 06:00 UTC
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'physical-subscription-lifecycle') THEN
    PERFORM cron.unschedule('physical-subscription-lifecycle');
  END IF;

  SELECT cron.schedule(
    'physical-subscription-lifecycle',
    '0 6 * * *',
    $cmd$SELECT public.run_physical_subscription_billing_sql_phase();$cmd$
  ) INTO v_job_id;

  v_jobs := v_jobs || jsonb_build_array(jsonb_build_object(
    'job_name', 'physical-subscription-lifecycle',
    'job_id', v_job_id,
    'schedule', '0 6 * * *',
    'type', 'sql',
    'steps', jsonb_build_array('process_store_platform_subscription_lifecycle', 'process_subscription_dunning_notifications')
  ));

  -- 2. Emails dunning — 06:10 UTC (après phase SQL + marge)
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'physical-subscription-dunning-emails') THEN
    PERFORM cron.unschedule('physical-subscription-dunning-emails');
  END IF;

  SELECT cron.schedule(
    'physical-subscription-dunning-emails',
    '10 6 * * *',
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
        body := '{}'::jsonb
      ) AS request_id;
      $cmd$,
      v_base_url || '/process-subscription-dunning-emails',
      v_anon,
      v_anon,
      p_cron_secret
    )
  ) INTO v_job_id;

  v_jobs := v_jobs || jsonb_build_array(jsonb_build_object(
    'job_name', 'physical-subscription-dunning-emails',
    'job_id', v_job_id,
    'schedule', '10 6 * * *',
    'type', 'edge',
    'url', v_base_url || '/process-subscription-dunning-emails'
  ));

  -- 3. Auto-renewal Moneroo — 06:15 UTC
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'physical-subscription-auto-renewal') THEN
    PERFORM cron.unschedule('physical-subscription-auto-renewal');
  END IF;

  SELECT cron.schedule(
    'physical-subscription-auto-renewal',
    '15 6 * * *',
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
        body := '{}'::jsonb
      ) AS request_id;
      $cmd$,
      v_base_url || '/process-subscription-renewals',
      v_anon,
      v_anon,
      p_cron_secret
    )
  ) INTO v_job_id;

  v_jobs := v_jobs || jsonb_build_array(jsonb_build_object(
    'job_name', 'physical-subscription-auto-renewal',
    'job_id', v_job_id,
    'schedule', '15 6 * * *',
    'type', 'edge',
    'url', v_base_url || '/process-subscription-renewals'
  ));

  RETURN jsonb_build_object(
    'success', true,
    'project_ref', trim(p_project_ref),
    'jobs', v_jobs,
    'order_utc', jsonb_build_array(
      '06:00 physical-subscription-lifecycle (SQL)',
      '06:10 physical-subscription-dunning-emails (Edge)',
      '06:15 physical-subscription-auto-renewal (Edge)'
    ),
    'edge_secrets_required', jsonb_build_array('CRON_SECRET', 'EDGE_INTERNAL_SECRET', 'MONEROO_API_KEY')
  );
END;
$$;

COMMENT ON FUNCTION public.setup_physical_subscription_billing_cron_jobs IS
  'Planifie les crons billing abonnement physique (1x/jour UTC). Exécuter une fois avec CRON_SECRET et anon key.';

GRANT EXECUTE ON FUNCTION public.run_physical_subscription_billing_sql_phase() TO service_role;
GRANT EXECUTE ON FUNCTION public.setup_physical_subscription_billing_cron_jobs(text, text, text) TO service_role;

COMMIT;
