-- Évite le pic 02:00 UTC qui sature Postgres/GoTrue :
-- auto-pay, cleanup notifications, email tags, puis maintenance 04h/05h.
-- Symptôme : login prod « Le serveur met trop de temps à répondre » (~20-25s).

BEGIN;

DO $$
DECLARE
  v_jobid BIGINT;
BEGIN
  SELECT jobid INTO v_jobid FROM cron.job WHERE jobname = 'auto-pay-commissions' LIMIT 1;
  IF v_jobid IS NOT NULL THEN
    PERFORM cron.alter_job(v_jobid, schedule := '15 3 * * *');
  END IF;

  SELECT jobid INTO v_jobid FROM cron.job WHERE jobname = 'cleanup-expired-email-tags' LIMIT 1;
  IF v_jobid IS NOT NULL THEN
    PERFORM cron.alter_job(v_jobid, schedule := '50 2 * * *');
  END IF;

  -- Doublon du batch nightly (04:00) : décaler hors de 02:00 pile.
  SELECT jobid INTO v_jobid FROM cron.job WHERE jobname = 'cleanup-notifications' LIMIT 1;
  IF v_jobid IS NOT NULL THEN
    PERFORM cron.alter_job(v_jobid, schedule := '40 4 * * *');
  END IF;

  -- Doublon de process-nightly-maintenance (email-maintenance à 04:00).
  SELECT jobid INTO v_jobid FROM cron.job WHERE jobname = 'email-maintenance-daily' LIMIT 1;
  IF v_jobid IS NOT NULL THEN
    PERFORM cron.alter_job(v_jobid, schedule := '20 5 * * *');
  END IF;

  -- Jobs horaires à :00 qui s'ajoutent au pic 02:00.
  SELECT jobid INTO v_jobid FROM cron.job WHERE jobname = 'retry-failed-transactions' LIMIT 1;
  IF v_jobid IS NOT NULL THEN
    PERFORM cron.alter_job(v_jobid, schedule := '7 * * * *');
  END IF;
END
$$;

COMMIT;
