-- =============================================================================
-- LOT C — DIAGNOSTIC / VERIFY (read-only)
-- scripts/sql/disk-io-lotc-verify.sql
-- =============================================================================

-- 1) user_behavior_events must be gone
SELECT to_regclass('public.user_behavior_events') AS user_behavior_events; -- expect NULL

-- 2) visitor table kept + cleanup fn
SELECT to_regclass('public.platform_visitor_events') AS platform_visitor_events;
SELECT proname
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND proname IN (
    'cleanup_platform_visitor_events',
    'get_behavioral_analytics_summary',
    'cleanup_old_behavior_events'
  )
ORDER BY 1;

-- 3) cron
SELECT jobname, schedule, active
FROM cron.job
WHERE jobname IN (
  'cleanup-platform-visitor-events',
  'cleanup-analytics-events',
  'rollup-analytics-events-daily'
)
ORDER BY 1;

-- 4) sizes after retention (optional)
SELECT
  relname,
  pg_size_pretty(pg_total_relation_size(c.oid)) AS total_size,
  n_live_tup
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_stat_user_tables s ON s.relid = c.oid
WHERE n.nspname = 'public'
  AND relname IN (
    'platform_visitor_events',
    'analytics_events',
    'store_analytics_events'
  )
ORDER BY 1;
