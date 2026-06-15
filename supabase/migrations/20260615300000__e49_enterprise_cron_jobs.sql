-- E49 — Cron pg_cron : platform-health + Google Indexing (Epic 5.2/5.3 ops)

CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ---------------------------------------------------------------------------
-- platform-health — sonde SLA toutes les 5 minutes
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.setup_platform_health_cron_job(
  p_project_ref text,
  p_cron_secret text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, cron, net
AS $$
DECLARE
  v_url text;
  v_job_id bigint;
BEGIN
  IF p_project_ref IS NULL OR length(trim(p_project_ref)) = 0 THEN
    RAISE EXCEPTION 'p_project_ref is required';
  END IF;
  IF p_cron_secret IS NULL OR length(trim(p_cron_secret)) < 16 THEN
    RAISE EXCEPTION 'p_cron_secret must be at least 16 characters';
  END IF;

  v_url := format(
    'https://%s.supabase.co/functions/v1/platform-health',
    trim(p_project_ref)
  );

  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'platform-health-probe') THEN
    PERFORM cron.unschedule('platform-health-probe');
  END IF;

  SELECT cron.schedule(
    'platform-health-probe',
    '*/5 * * * *',
    format(
      $cmd$
      SELECT net.http_post(
        url := %L,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-cron-secret', %L
        ),
        body := '{}'::jsonb
      ) AS request_id;
      $cmd$,
      v_url,
      p_cron_secret
    )
  ) INTO v_job_id;

  RETURN jsonb_build_object(
    'success', true,
    'job_id', v_job_id,
    'job_name', 'platform-health-probe',
    'schedule', '*/5 * * * *',
    'edge_url', v_url
  );
END;
$$;

REVOKE ALL ON FUNCTION public.setup_platform_health_cron_job(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.setup_platform_health_cron_job(text, text) TO service_role;

-- ---------------------------------------------------------------------------
-- Google Indexing — enqueue hebdo + traitement horaire
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.setup_google_indexing_cron_jobs(
  p_project_ref text,
  p_cron_secret text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, cron, net
AS $$
DECLARE
  v_base text;
  v_enqueue_url text;
  v_process_url text;
  v_enqueue_job bigint;
  v_process_job bigint;
BEGIN
  IF p_project_ref IS NULL OR length(trim(p_project_ref)) = 0 THEN
    RAISE EXCEPTION 'p_project_ref is required';
  END IF;
  IF p_cron_secret IS NULL OR length(trim(p_cron_secret)) < 16 THEN
    RAISE EXCEPTION 'p_cron_secret must be at least 16 characters';
  END IF;

  v_base := format('https://%s.supabase.co/functions/v1/google-indexing-submit', trim(p_project_ref));
  v_enqueue_url := v_base || '?action=enqueue-sitemaps&limit=200';
  v_process_url := v_base || '?limit=25';

  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'google-indexing-enqueue-weekly') THEN
    PERFORM cron.unschedule('google-indexing-enqueue-weekly');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'google-indexing-process-hourly') THEN
    PERFORM cron.unschedule('google-indexing-process-hourly');
  END IF;

  SELECT cron.schedule(
    'google-indexing-enqueue-weekly',
    '0 3 * * 0',
    format(
      $cmd$
      SELECT net.http_post(
        url := %L,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-cron-secret', %L
        ),
        body := '{}'::jsonb
      ) AS request_id;
      $cmd$,
      v_enqueue_url,
      p_cron_secret
    )
  ) INTO v_enqueue_job;

  SELECT cron.schedule(
    'google-indexing-process-hourly',
    '15 * * * *',
    format(
      $cmd$
      SELECT net.http_post(
        url := %L,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-cron-secret', %L
        ),
        body := '{}'::jsonb
      ) AS request_id;
      $cmd$,
      v_process_url,
      p_cron_secret
    )
  ) INTO v_process_job;

  RETURN jsonb_build_object(
    'success', true,
    'enqueue_job_id', v_enqueue_job,
    'process_job_id', v_process_job,
    'enqueue_schedule', '0 3 * * 0',
    'process_schedule', '15 * * * *',
    'enqueue_url', v_enqueue_url,
    'process_url', v_process_url
  );
END;
$$;

REVOKE ALL ON FUNCTION public.setup_google_indexing_cron_jobs(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.setup_google_indexing_cron_jobs(text, text) TO service_role;

COMMENT ON FUNCTION public.setup_platform_health_cron_job IS
  'Epic 5.3 — Cron pg_cron sonde SLA platform-health (5 min)';
COMMENT ON FUNCTION public.setup_google_indexing_cron_jobs IS
  'Epic 5.2 — Cron enqueue sitemaps (dim 03:00 UTC) + traitement file (horaire)';
