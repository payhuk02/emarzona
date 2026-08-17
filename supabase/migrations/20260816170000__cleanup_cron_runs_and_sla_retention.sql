-- Rétention Disk IO : éviter que cron.job_run_details / platform_sla_checks saturent le budget.
-- Incident 2026-08-16 : cron.job_run_details ~465 MB / 750k rows.
-- Appliqué en prod : rétention cron 3j, SLA 7j, health-probe */15.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-cron-job-run-details') THEN
    PERFORM cron.schedule(
      'cleanup-cron-job-run-details',
      '15 3 * * *',
      $cmd$DELETE FROM cron.job_run_details WHERE end_time < now() - interval '3 days'$cmd$
    );
  ELSE
    PERFORM cron.alter_job(
      (SELECT jobid FROM cron.job WHERE jobname = 'cleanup-cron-job-run-details' LIMIT 1),
      schedule := '15 3 * * *',
      command := $cmd$DELETE FROM cron.job_run_details WHERE end_time < now() - interval '3 days'$cmd$
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-platform-sla-checks') THEN
    PERFORM cron.schedule(
      'cleanup-platform-sla-checks',
      '30 3 * * *',
      $cmd$DELETE FROM public.platform_sla_checks WHERE checked_at < now() - interval '7 days'$cmd$
    );
  ELSE
    PERFORM cron.alter_job(
      (SELECT jobid FROM cron.job WHERE jobname = 'cleanup-platform-sla-checks' LIMIT 1),
      schedule := '30 3 * * *',
      command := $cmd$DELETE FROM public.platform_sla_checks WHERE checked_at < now() - interval '7 days'$cmd$
    );
  END IF;

  -- Réduit l'écriture SLA (~2000 lignes/jour à */5) sans couper le monitoring.
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'platform-health-probe') THEN
    PERFORM cron.alter_job(
      (SELECT jobid FROM cron.job WHERE jobname = 'platform-health-probe' LIMIT 1),
      schedule := '*/15 * * * *'
    );
  END IF;
END
$$;
