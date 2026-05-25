-- Audit emailing Emarzona (read-only)
SELECT 'migrations' AS section, version::text AS item, 'applied' AS status
FROM supabase_migrations.schema_migrations
WHERE version::text LIKE '202605251%'
ORDER BY version;

SELECT 'templates_core' AS section, slug, is_active
FROM email_templates
WHERE slug IN (
  'welcome-user',
  'order-confirmation-digital',
  'order-confirmation-physical',
  'order-confirmation-service'
)
ORDER BY slug;

SELECT count(*)::int AS active_marketing_templates
FROM email_templates
WHERE is_active = true AND category = 'marketing';

SELECT jobname, schedule, active
FROM cron.job
WHERE jobname IN (
  'process-scheduled-email-campaigns',
  'process-email-sequences',
  'abandoned-cart-recovery'
)
ORDER BY jobname;

SELECT count(*)::int AS recent_200
FROM net._http_response
WHERE created > now() - interval '6 hours'
  AND status_code = 200
  AND content::text LIKE '%"success":true%';

SELECT proname
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND proname IN (
    'record_email_unsubscribe',
    'check_user_unsubscribed',
    'increment_campaign_metric',
    'aggregate_daily_email_analytics',
    'calculate_ab_test_winner',
    'setup_email_campaigns_cron_job'
  )
ORDER BY proname;
