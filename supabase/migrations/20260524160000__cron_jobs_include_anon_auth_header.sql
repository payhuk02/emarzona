-- pg_net doit envoyer Authorization + apikey (gateway Supabase) en plus de x-cron-secret

CREATE OR REPLACE FUNCTION public.setup_email_campaigns_cron_job(
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
          'Authorization', 'Bearer ' || %L,
          'apikey', %L,
          'x-cron-secret', %L
        ),
        body := jsonb_build_object('limit', 10)
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
    'job_name', 'process-scheduled-email-campaigns',
    'schedule', '*/5 * * * *',
    'url', v_url
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.setup_email_sequences_cron_job(
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
    'https://%s.supabase.co/functions/v1/process-email-sequences',
    trim(p_project_ref)
  );

  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'process-email-sequences') THEN
    PERFORM cron.unschedule('process-email-sequences');
  END IF;

  SELECT cron.schedule(
    'process-email-sequences',
    '*/15 * * * *',
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
        body := jsonb_build_object('limit', 100)
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
    'job_name', 'process-email-sequences',
    'schedule', '*/15 * * * *',
    'url', v_url
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.setup_abandoned_cart_recovery_cron_job(
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
    'https://%s.supabase.co/functions/v1/abandoned-cart-recovery',
    trim(p_project_ref)
  );

  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'abandoned-cart-recovery') THEN
    PERFORM cron.unschedule('abandoned-cart-recovery');
  END IF;

  SELECT cron.schedule(
    'abandoned-cart-recovery',
    '0 * * * *',
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
    'job_name', 'abandoned-cart-recovery',
    'schedule', '0 * * * *',
    'url', v_url
  );
END;
$$;
