-- =============================================================================
-- LOT 3 — CANDIDATE ONLY : CREATE INDEX CONCURRENTLY (prod large tables)
-- NE PAS exécuter via `supabase db push` / migration transactionnelle.
-- Utiliser uniquement si les tables sont déjà volumineuses et que
-- 20260916120000__disk_io_lot3_indexes_rls.sql risque de lock trop long.
-- Chaque statement = session séparée, hors transaction.
-- =============================================================================

-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_events_store_created
--   ON public.analytics_events (store_id, created_at DESC);

-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_events_store_type_created
--   ON public.analytics_events (store_id, event_type, created_at DESC);

-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_platform_visitor_events_type_created
--   ON public.platform_visitor_events (event_type, created_at DESC);

-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_conv_unread_sender
--   ON public.messages (conversation_id, sender_id)
--   WHERE is_read = false;

-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_store_fulfillment
--   ON public.orders (store_id, created_at DESC)
--   WHERE status IN ('pending', 'processing', 'confirmed');

-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_store_draft
--   ON public.products (store_id)
--   WHERE is_draft IS TRUE;

-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_store_analytics_events_store_type_created
--   ON public.store_analytics_events (store_id, event_type, created_at DESC);