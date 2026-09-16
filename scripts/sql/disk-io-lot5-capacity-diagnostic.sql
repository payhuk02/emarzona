-- =============================================================================
-- LOT 5 — CAPACITY / SCALING DIAGNOSTIC (read-only)
-- Exécuter dans SQL Editor (staging puis prod). Ne modifie rien.
-- scripts/sql/disk-io-lot5-capacity-diagnostic.sql
-- =============================================================================

-- A) Taille + bloat proxy (dead tuples)
SELECT
  relname AS table_name,
  pg_size_pretty(pg_total_relation_size(c.oid)) AS total_size,
  n_live_tup,
  n_dead_tup,
  CASE WHEN n_live_tup > 0
    THEN round(100.0 * n_dead_tup / n_live_tup, 2)
    ELSE 0
  END AS dead_pct,
  last_autovacuum,
  last_analyze
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_stat_user_tables s ON s.relid = c.oid
WHERE n.nspname = 'public'
  AND relname IN (
    'analytics_events',
    'analytics_events_daily',
    'platform_visitor_events',
    'store_analytics_events',
    'orders',
    'order_items',
    'transactions',
    'messages',
    'notifications',
    'products'
  )
ORDER BY pg_total_relation_size(c.oid) DESC NULLS LAST;

-- B) Top statements (si pg_stat_statements activé)
-- SELECT LEFT(query, 120) AS query, calls, round(total_exec_time::numeric,1) AS total_ms,
--        round(mean_exec_time::numeric,2) AS mean_ms, rows
-- FROM pg_stat_statements
-- ORDER BY total_exec_time DESC
-- LIMIT 25;

-- C) Cache hit ratio tables hot
SELECT
  relname,
  heap_blks_read,
  heap_blks_hit,
  CASE WHEN (heap_blks_hit + heap_blks_read) > 0
    THEN round(100.0 * heap_blks_hit / (heap_blks_hit + heap_blks_read), 2)
    ELSE NULL
  END AS cache_hit_pct
FROM pg_statio_user_tables
WHERE schemaname = 'public'
  AND relname IN (
    'analytics_events',
    'platform_visitor_events',
    'orders',
    'products',
    'transactions'
  )
ORDER BY heap_blks_read DESC;

-- D) Crons Disk I/O related
SELECT jobid, jobname, schedule, active
FROM cron.job
WHERE jobname ILIKE '%analytics%'
   OR jobname ILIKE '%visitor%'
   OR jobname ILIKE '%webhook%'
   OR jobname ILIKE '%cleanup%'
   OR jobname ILIKE '%dashboard%'
ORDER BY jobname;

-- E) Rollup health
SELECT
  COUNT(*) AS daily_rows,
  MIN(day) AS min_day,
  MAX(day) AS max_day,
  SUM(event_count) AS total_events
FROM public.analytics_events_daily;

-- F) Scaling thresholds (estimation manuelle)
-- | Metric              | OK        | Watch     | Act        |
-- | raw analytics rows  | < 5M      | 5–20M     | > 20M partition / shorten retention |
-- | cache_hit_pct       | > 99      | 95–99     | < 95 index / query / upgrade        |
-- | dead_pct            | < 5       | 5–20      | > 20 vacuum / reduce UPDATEs        |
-- | dashboard fallback  | disabled  | rare      | frequent → fix RPC                  |
