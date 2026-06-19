-- Phase 3 : cron maintenance nocturne groupee (orphaned orders + notifications)

BEGIN;

CREATE OR REPLACE FUNCTION public.setup_nightly_maintenance_cron_job(
  p_project_ref TEXT,
  p_cron_secret TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, cron, net
AS $$
DECLARE
  v_url TEXT;
  v_job_id BIGINT;
BEGIN
  IF p_project_ref IS NULL OR length(trim(p_project_ref)) = 0 THEN
    RAISE EXCEPTION 'p_project_ref is required';
  END IF;
  IF p_cron_secret IS NULL OR length(trim(p_cron_secret)) < 16 THEN
    RAISE EXCEPTION 'p_cron_secret must be at least 16 characters';
  END IF;

  v_url := format(
    'https://%s.supabase.co/functions/v1/process-nightly-maintenance',
    trim(p_project_ref)
  );

  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'nightly-maintenance-batch') THEN
    PERFORM cron.unschedule('nightly-maintenance-batch');
  END IF;

  SELECT cron.schedule(
    'nightly-maintenance-batch',
    '0 4 * * *',
    format(
      $cmd$
      SELECT net.http_post(
        url := %L,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-cron-secret', %L
        ),
        body := '{"jobs":["orphaned-orders","notification-cleanup"]}'::jsonb
      ) AS request_id;
      $cmd$,
      v_url,
      p_cron_secret
    )
  ) INTO v_job_id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'job_id', v_job_id,
    'job_name', 'nightly-maintenance-batch',
    'schedule', '0 4 * * *',
    'edge_url', v_url
  );
END;
$$;

REVOKE ALL ON FUNCTION public.setup_nightly_maintenance_cron_job(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.setup_nightly_maintenance_cron_job(TEXT, TEXT) TO service_role;

COMMIT;
