-- Smoke verification — emailing Phases 0-3 + guest sequence enrollment (read-only + safe RPC test)

-- Phase 0: colonnes email_logs
SELECT 'email_logs_columns' AS check_name,
  COUNT(*) FILTER (WHERE column_name = 'to_email') AS has_to_email,
  COUNT(*) FILTER (WHERE column_name = 'provider_message_id') AS has_provider_message_id,
  COUNT(*) FILTER (WHERE column_name = 'status') AS has_status
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'email_logs';

-- Phase 1: RLS hardening (pas de policy INSERT permissive service)
SELECT 'email_logs_insert_policies' AS check_name,
  COUNT(*) AS insert_policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'email_logs'
  AND cmd = 'INSERT';

-- Phase 3: idempotence webhooks
SELECT 'email_webhook_events_table' AS check_name,
  EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'email_webhook_events'
  ) AS ok;

SELECT 'claim_email_webhook_event' AS check_name,
  EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'claim_email_webhook_event'
  ) AS ok;

-- Phase 3 P3: archivage
SELECT 'email_logs_archive_table' AS check_name,
  EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'email_logs_archive'
  ) AS ok;

SELECT 'run_email_maintenance_batch' AS check_name,
  EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'run_email_maintenance_batch'
  ) AS ok;

-- Guest enrollment
SELECT 'enroll_store_email_in_sequence' AS check_name,
  EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'enroll_store_email_in_sequence'
  ) AS ok;

SELECT 'enroll_email_in_sequence' AS check_name,
  EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'enroll_email_in_sequence'
  ) AS ok;

SELECT 'recipient_email_column' AS check_name,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'email_sequence_enrollments'
      AND column_name = 'recipient_email'
  ) AS ok;

SELECT 'user_id_nullable_enrollments' AS check_name,
  is_nullable = 'YES' AS ok
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'email_sequence_enrollments'
  AND column_name = 'user_id';

-- Crons email actifs
SELECT jobname, schedule, active
FROM cron.job
WHERE jobname IN (
  'process-scheduled-email-campaigns',
  'process-email-sequences',
  'abandoned-cart-recovery',
  'email-maintenance-daily',
  'nightly-maintenance-batch'
)
ORDER BY jobname;

-- RPC analytics + compliance
SELECT proname
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'record_email_unsubscribe',
    'check_user_unsubscribed',
    'aggregate_daily_email_analytics',
    'get_next_sequence_emails_to_send',
    'resolve_user_id_for_store_email'
  )
ORDER BY proname;
