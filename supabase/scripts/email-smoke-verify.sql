-- Smoke verification queries (read-only + one test unsubscribe row)
SELECT 'record_email_unsubscribe' AS check_name,
  EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'record_email_unsubscribe'
  ) AS ok;

SELECT jobname, schedule, active
FROM cron.job
WHERE jobname IN (
  'process-scheduled-email-campaigns',
  'process-email-sequences',
  'abandoned-cart-recovery'
)
ORDER BY jobname;

SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'email_logs'
  AND column_name IN ('to_email', 'status', 'sendgrid_message_id')
ORDER BY column_name;

SELECT public.check_user_unsubscribed('smoke-test-unsub@emarzona.invalid', 'marketing') AS was_unsubscribed_before;

SELECT proname
FROM pg_proc
WHERE proname IN (
  'increment_campaign_metric',
  'calculate_daily_email_analytics',
  'aggregate_daily_email_analytics',
  'calculate_ab_test_winner'
)
ORDER BY proname;
