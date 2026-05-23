-- RPC idempotente : enregistre le cron pg_net pour process-scheduled-campaigns
-- Appelée par l'Edge Function setup-email-infrastructure (secret jamais en SQL statique)

CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION public.setup_email_campaigns_cron_job(
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
    'https://%s.supabase.co/functions/v1/process-scheduled-campaigns',
    trim(p_project_ref)
  );

  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'process-scheduled-email-campaigns') THEN
    PERFORM cron.unschedule('process-scheduled-email-campaigns');
  END IF;

  SELECT cron.schedule(
    'process-scheduled-email-campaigns',
    '*/5 * * * *',
    format(
      $cmd$
      SELECT net.http_post(
        url := %L,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-cron-secret', %L
        ),
        body := jsonb_build_object('limit', 10)
      ) AS request_id;
      $cmd$,
      v_url,
      p_cron_secret
    )
  ) INTO v_job_id;

  RETURN jsonb_build_object(
    'success', true,
    'job_id', v_job_id,
    'job_name', 'process-scheduled-email-campaigns',
    'schedule', '*/5 * * * *',
    'url', v_url
  );
END;
$$;

REVOKE ALL ON FUNCTION public.setup_email_campaigns_cron_job(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.setup_email_campaigns_cron_job(text, text) TO service_role;

COMMENT ON FUNCTION public.setup_email_campaigns_cron_job IS
  'Configure le cron pg_cron pour envoyer les campagnes email programmées (toutes les 5 min)';
