-- H-03 suite : notification gagnant + cron pg_net → process-auction-statuses

ALTER TABLE public.artist_product_auctions
  ADD COLUMN IF NOT EXISTS winner_notified_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_auctions_winner_notify_pending
  ON public.artist_product_auctions(status, winner_notified_at)
  WHERE status = 'sold' AND winner_notified_at IS NULL;

COMMENT ON COLUMN public.artist_product_auctions.winner_notified_at IS
'Horodatage de l''email « enchère gagnée » envoyé au lauréat.';

-- Configure le cron (à exécuter une fois en prod avec secrets réels)
CREATE OR REPLACE FUNCTION public.setup_auction_statuses_cron_job(
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
    'https://%s.supabase.co/functions/v1/process-auction-statuses',
    trim(p_project_ref)
  );

  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'process-auction-statuses') THEN
    PERFORM cron.unschedule('process-auction-statuses');
  END IF;

  SELECT cron.schedule(
    'process-auction-statuses',
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
    'job_name', 'process-auction-statuses',
    'schedule', '*/5 * * * *',
    'url', v_url
  );
END;
$$;

COMMENT ON FUNCTION public.setup_auction_statuses_cron_job IS
'Cron pg_cron → process-auction-statuses (toutes les 5 min, header x-cron-secret).';

GRANT EXECUTE ON FUNCTION public.setup_auction_statuses_cron_job(text, text) TO service_role;
