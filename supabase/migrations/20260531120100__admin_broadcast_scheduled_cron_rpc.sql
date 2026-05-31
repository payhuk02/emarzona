-- RPC: cron pg_net pour process-scheduled-broadcasts (envois admin programmés)
BEGIN;

CREATE OR REPLACE FUNCTION public.setup_scheduled_admin_broadcasts_cron_job(
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
  v_url text;
  v_job_id bigint;
  v_anon text;
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

  v_url := format(
    'https://%s.supabase.co/functions/v1/process-scheduled-broadcasts',
    trim(p_project_ref)
  );

  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'process-scheduled-admin-broadcasts') THEN
    PERFORM cron.unschedule('process-scheduled-admin-broadcasts');
  END IF;

  SELECT cron.schedule(
    'process-scheduled-admin-broadcasts',
    '*/5 * * * *',
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
      v_url,
      v_anon,
      v_anon,
      p_cron_secret
    )
  ) INTO v_job_id;

  RETURN jsonb_build_object(
    'success', true,
    'job_id', v_job_id,
    'job_name', 'process-scheduled-admin-broadcasts',
    'schedule', '*/5 * * * *',
    'url', v_url
  );
END;
$$;

REVOKE ALL ON FUNCTION public.setup_scheduled_admin_broadcasts_cron_job(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.setup_scheduled_admin_broadcasts_cron_job(text, text, text) TO service_role;

COMMENT ON FUNCTION public.setup_scheduled_admin_broadcasts_cron_job IS
  'Enregistre le cron pg_net process-scheduled-admin-broadcasts (toutes les 5 min).';

COMMIT;
