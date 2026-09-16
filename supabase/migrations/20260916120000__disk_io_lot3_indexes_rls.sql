-- =============================================================================
-- LOT 3 — Disk I/O : indexes composites/partiels + RLS analytics (safe)
-- Date: 2026-09-16
--
-- Défensif : chaque objet est créé seulement si la table cible existe
-- (prod peut ne pas avoir messages / product_analytics selon historique).
--
-- ROLLBACK (manuel si besoin) — voir commentaires en bas.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) INDEXES — analytics_events
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.analytics_events') IS NOT NULL THEN
    EXECUTE $idx$
      CREATE INDEX IF NOT EXISTS idx_analytics_events_store_created
        ON public.analytics_events (store_id, created_at DESC)
    $idx$;
    EXECUTE $idx$
      CREATE INDEX IF NOT EXISTS idx_analytics_events_store_type_created
        ON public.analytics_events (store_id, event_type, created_at DESC)
    $idx$;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2) INDEXES — platform_visitor_events
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.platform_visitor_events') IS NOT NULL THEN
    EXECUTE $idx$
      CREATE INDEX IF NOT EXISTS idx_platform_visitor_events_type_created
        ON public.platform_visitor_events (event_type, created_at DESC)
    $idx$;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3) INDEXES — messages unread (si table présente)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.messages') IS NOT NULL THEN
    EXECUTE $idx$
      CREATE INDEX IF NOT EXISTS idx_messages_conv_unread_sender
        ON public.messages (conversation_id, sender_id)
        WHERE is_read = false
    $idx$;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 4) INDEXES — dashboard operational counts
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.orders') IS NOT NULL THEN
    EXECUTE $idx$
      CREATE INDEX IF NOT EXISTS idx_orders_store_fulfillment
        ON public.orders (store_id, created_at DESC)
        WHERE status IN ('pending', 'processing', 'confirmed')
    $idx$;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'products'
      AND column_name = 'is_draft'
  ) THEN
    EXECUTE $idx$
      CREATE INDEX IF NOT EXISTS idx_products_store_draft
        ON public.products (store_id)
        WHERE is_draft IS TRUE
    $idx$;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 5) INDEXES — store_analytics_events (si table présente)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.store_analytics_events') IS NOT NULL THEN
    EXECUTE $idx$
      CREATE INDEX IF NOT EXISTS idx_store_analytics_events_store_type_created
        ON public.store_analytics_events (store_id, event_type, created_at DESC)
    $idx$;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 6) RLS — platform_visitor_events INSERT
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.platform_visitor_events') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can insert platform visitor events" ON public.platform_visitor_events';
    EXECUTE $pol$
      CREATE POLICY "Anyone can insert platform visitor events"
        ON public.platform_visitor_events
        FOR INSERT
        TO anon, authenticated
        WITH CHECK (
          event_type IN ('page_view', 'session_heartbeat', 'session_end')
          AND char_length(session_id) BETWEEN 8 AND 128
          AND char_length(page_path) BETWEEN 1 AND 500
          AND duration_ms IS NOT NULL
          AND duration_ms >= 0
          AND duration_ms <= 86400000
          AND (user_agent IS NULL OR char_length(user_agent) <= 500)
          AND (page_url IS NULL OR char_length(page_url) <= 2000)
        )
    $pol$;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 7) RLS — analytics_events (SELECT via is_store_member ; INSERT borné)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.analytics_events') IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM pg_proc p
       JOIN pg_namespace n ON n.oid = p.pronamespace
       WHERE n.nspname = 'public' AND p.proname = 'is_store_member'
     ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view events for their own products" ON public.analytics_events';
    EXECUTE $pol$
      CREATE POLICY "Users can view events for their own products"
        ON public.analytics_events
        FOR SELECT
        TO authenticated
        USING (
          public.is_store_member(store_id, auth.uid())
          OR COALESCE(public.has_role(auth.uid(), 'admin'::public.app_role), false)
        )
    $pol$;

    EXECUTE 'DROP POLICY IF EXISTS "Anyone can insert analytics events" ON public.analytics_events';
    EXECUTE $pol$
      CREATE POLICY "Anyone can insert analytics events"
        ON public.analytics_events
        FOR INSERT
        TO anon, authenticated
        WITH CHECK (
          store_id IS NOT NULL
          AND product_id IS NOT NULL
          AND event_type IN (
            'view', 'click', 'conversion', 'purchase', 'session_start',
            'session_end', 'error', 'custom'
          )
          AND (session_id IS NULL OR char_length(session_id) <= 128)
          AND EXISTS (
            SELECT 1
            FROM public.products p
            WHERE p.id = product_id
              AND p.store_id = analytics_events.store_id
          )
        )
    $pol$;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 8) RLS — product_analytics (si table présente)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.product_analytics') IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM pg_proc p
       JOIN pg_namespace n ON n.oid = p.pronamespace
       WHERE n.nspname = 'public' AND p.proname = 'is_store_member'
     ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view analytics for their own products" ON public.product_analytics';
    EXECUTE $pol$
      CREATE POLICY "Users can view analytics for their own products"
        ON public.product_analytics
        FOR SELECT
        TO authenticated
        USING (
          public.is_store_member(store_id, auth.uid())
          OR COALESCE(public.has_role(auth.uid(), 'admin'::public.app_role), false)
        )
    $pol$;

    EXECUTE 'DROP POLICY IF EXISTS "Users can update analytics for their own products" ON public.product_analytics';
    EXECUTE $pol$
      CREATE POLICY "Users can update analytics for their own products"
        ON public.product_analytics
        FOR UPDATE
        TO authenticated
        USING (
          public.is_store_member(store_id, auth.uid())
          OR COALESCE(public.has_role(auth.uid(), 'admin'::public.app_role), false)
        )
        WITH CHECK (
          public.is_store_member(store_id, auth.uid())
          OR COALESCE(public.has_role(auth.uid(), 'admin'::public.app_role), false)
        )
    $pol$;
  END IF;
END $$;

COMMIT;

NOTIFY pgrst, 'reload schema';

-- ROLLBACK hints:
-- DROP INDEX IF EXISTS public.idx_analytics_events_store_created;
-- DROP INDEX IF EXISTS public.idx_analytics_events_store_type_created;
-- DROP INDEX IF EXISTS public.idx_platform_visitor_events_type_created;
-- DROP INDEX IF EXISTS public.idx_messages_conv_unread_sender;
-- DROP INDEX IF EXISTS public.idx_orders_store_fulfillment;
-- DROP INDEX IF EXISTS public.idx_products_store_draft;
-- DROP INDEX IF EXISTS public.idx_store_analytics_events_store_type_created;
