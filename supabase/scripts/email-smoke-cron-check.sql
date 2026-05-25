SELECT count(*)::int AS c
FROM cron.job
WHERE jobname IN (
  'process-scheduled-email-campaigns',
  'process-email-sequences',
  'abandoned-cart-recovery'
)
AND active = true;
