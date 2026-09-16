-- =============================================================================
-- LOT 3 — DIAGNOSTIC READ-ONLY (ne modifie rien)
-- Exécuter dans SQL Editor Supabase (staging puis prod) AVANT/APRÈS migration.
-- Fichier: scripts/sql/disk-io-lot3-diagnostic.sql
-- =============================================================================

-- 1) Taille tables hot path
SELECT
  relname AS table_name,
  pg_size_pretty(pg_total_relation_size(c.oid)) AS total_size,
  pg_size_pretty(pg_relation_size(c.oid)) AS heap_size,
  n_live_tup,
  n_dead_tup,
  last_vacuum,
  last_autovacuum,
  last_analyze
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_stat_user_tables s ON s.relid = c.oid
WHERE n.nspname = 'public'
  AND relname IN (
    'analytics_events',
    'platform_visitor_events',
    'store_analytics_events',
    'messages',
    'orders',
    'products',
    'notifications',
    'transactions',
    'store_members'
  )
ORDER BY pg_total_relation_size(c.oid) DESC;

-- 2) Indexes existants sur ces tables
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'analytics_events',
    'platform_visitor_events',
    'store_analytics_events',
    'messages',
    'orders',
    'products',
    'store_members'
  )
ORDER BY tablename, indexname;

-- 3) Usage indexes (après charge réelle) — idx_scan = 0 ≠ forcément inutile
SELECT
  schemaname,
  relname AS table_name,
  indexrelname AS index_name,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND relname IN (
    'analytics_events',
    'platform_visitor_events',
    'store_analytics_events',
    'messages',
    'orders',
    'products',
    'store_members'
  )
ORDER BY idx_scan ASC, pg_relation_size(indexrelid) DESC;

-- 4) Policies RLS analytics / visitor
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'analytics_events',
    'product_analytics',
    'platform_visitor_events'
  )
ORDER BY tablename, policyname;

-- 5) EXPLAIN candidats (remplacer les UUID) — ANALYZE optionnel hors pic
-- EXPLAIN (ANALYZE, BUFFERS)
-- SELECT count(*) FROM public.analytics_events
-- WHERE store_id = '00000000-0000-0000-0000-000000000000'
--   AND created_at >= now() - interval '30 days';

-- EXPLAIN (ANALYZE, BUFFERS)
-- SELECT count(*) FROM public.messages
-- WHERE conversation_id = '00000000-0000-0000-0000-000000000000'
--   AND is_read = false
--   AND sender_id <> '00000000-0000-0000-0000-000000000001';

-- EXPLAIN (ANALYZE, BUFFERS)
-- SELECT count(*) FROM public.platform_visitor_events
-- WHERE event_type = 'page_view'
--   AND created_at >= now() - interval '30 days';
