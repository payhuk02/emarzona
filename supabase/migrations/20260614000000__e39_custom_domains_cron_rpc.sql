-- E39 Epic 4.2 — Cron automatisé vérification domaines personnalisés (pg_cron + pg_net)
-- Secret jamais en SQL statique : RPC paramétrée (pattern setup_email_campaigns_cron_job)

CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION public.setup_verify_domains_cron_job(
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
    'https://%s.supabase.co/functions/v1/verify-domains',
    trim(p_project_ref)
  );

  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'verify-domains-periodically') THEN
    PERFORM cron.unschedule('verify-domains-periodically');
  END IF;

  SELECT cron.schedule(
    'verify-domains-periodically',
    '*/15 * * * *',
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
    'job_name', 'verify-domains-periodically',
    'schedule', '*/15 * * * *',
    'edge_url', v_url
  );
END;
$$;

REVOKE ALL ON FUNCTION public.setup_verify_domains_cron_job(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.setup_verify_domains_cron_job(text, text) TO service_role;

COMMENT ON FUNCTION public.setup_verify_domains_cron_job IS
  'Epic 4.2 — Enregistre le cron pg_cron verify-domains (DNS + Vercel API) toutes les 15 min';
