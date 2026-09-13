-- Disk IO Budget relief (FREE plan): reduce high-frequency cron write amplification.
-- Context: ~5k cron.job_run_details rows/day; webhook jobs every minute; GHA duplicates.

DO $$
DECLARE
  jid bigint;
BEGIN
  -- 1) Webhook workers: * * * * * → */5 * * * * (~80% fewer runs)
  SELECT jobid INTO jid FROM cron.job WHERE jobname = 'process-webhook-deliveries' LIMIT 1;
  IF jid IS NOT NULL THEN
    PERFORM cron.alter_job(jid, schedule := '*/5 * * * *');
  END IF;

  SELECT jobid INTO jid FROM cron.job WHERE jobname = 'process-webhook-dlq-worker' LIMIT 1;
  IF jid IS NOT NULL THEN
    PERFORM cron.alter_job(jid, schedule := '*/5 * * * *');
  END IF;

  -- 2) Low-traffic scheduled jobs: */5 → */10
  SELECT jobid INTO jid FROM cron.job WHERE jobname = 'process-scheduled-email-campaigns' LIMIT 1;
  IF jid IS NOT NULL THEN
    PERFORM cron.alter_job(jid, schedule := '*/10 * * * *');
  END IF;

  SELECT jobid INTO jid FROM cron.job WHERE jobname = 'process-scheduled-admin-broadcasts' LIMIT 1;
  IF jid IS NOT NULL THEN
    PERFORM cron.alter_job(jid, schedule := '*/10 * * * *');
  END IF;

  SELECT jobid INTO jid FROM cron.job WHERE jobname = 'process-scheduled-notifications' LIMIT 1;
  IF jid IS NOT NULL THEN
    PERFORM cron.alter_job(jid, schedule := '*/10 * * * *');
  END IF;

  SELECT jobid INTO jid FROM cron.job WHERE jobname = 'cleanup-expired-physical-reservations' LIMIT 1;
  IF jid IS NOT NULL THEN
    PERFORM cron.alter_job(jid, schedule := '*/10 * * * *');
  END IF;

  -- 3) Cleanup cron history more aggressively (3d → 2d)
  SELECT jobid INTO jid FROM cron.job WHERE jobname = 'cleanup-cron-job-run-details' LIMIT 1;
  IF jid IS NOT NULL THEN
    PERFORM cron.alter_job(
      jid,
      schedule := '15 3 * * *',
      command := $cmd$DELETE FROM cron.job_run_details WHERE end_time < now() - interval '2 days'$cmd$
    );
  ELSE
    PERFORM cron.schedule(
      'cleanup-cron-job-run-details',
      '15 3 * * *',
      $cmd$DELETE FROM cron.job_run_details WHERE end_time < now() - interval '2 days'$cmd$
    );
  END IF;

  -- 4) SLA checks retention 7d → 3d
  SELECT jobid INTO jid FROM cron.job WHERE jobname = 'cleanup-platform-sla-checks' LIMIT 1;
  IF jid IS NOT NULL THEN
    PERFORM cron.alter_job(
      jid,
      schedule := '30 3 * * *',
      command := $cmd$DELETE FROM public.platform_sla_checks WHERE checked_at < now() - interval '3 days'$cmd$
    );
  ELSE
    PERFORM cron.schedule(
      'cleanup-platform-sla-checks',
      '30 3 * * *',
      $cmd$DELETE FROM public.platform_sla_checks WHERE checked_at < now() - interval '3 days'$cmd$
    );
  END IF;
END
$$;

-- Immediate reclaim (safe deletes; VACUUM run separately outside txn)
DELETE FROM cron.job_run_details WHERE end_time < now() - interval '2 days';
DELETE FROM public.platform_sla_checks WHERE checked_at < now() - interval '3 days';
