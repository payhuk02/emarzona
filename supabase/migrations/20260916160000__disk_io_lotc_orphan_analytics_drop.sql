-- =============================================================================
-- LOT C — Drop analytics orphelines + rétention visitor (Disk I/O)
-- Date: 2026-09-16
--
-- Périmètre (validé) :
--   1) DROP public.user_behavior_events (pipeline mort ; PostHog LOT B)
--   2) Stub RPCs marketing qui lisaient cette table (UI ne casse pas)
--   3) Rétention batched platform_visitor_events (90j) — table CONSERVÉE
--      (AdminVisitors / get_platform_visitor_analytics)
--
-- NON droppé (toujours lus par dashboards métier) :
--   analytics_events, store_analytics_events, product_analytics, product_views,
--   platform_visitor_events, analytics_events_daily
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1) Stub RPCs dépendantes AVANT drop (évite erreurs si appelées après)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_behavioral_analytics_summary(
  timeframe TEXT DEFAULT '30d'
)
RETURNS TABLE (
  date DATE,
  page_views BIGINT,
  product_views BIGINT,
  cart_adds BIGINT,
  purchases BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- LOT C: source Postgres retirée — PostHog porte le comportemental.
  -- Retourne 0 ligne (dashboard marketing affiche vide, sans erreur).
  RETURN;
END;
$$;

COMMENT ON FUNCTION public.get_behavioral_analytics_summary(TEXT) IS
  'LOT C: stub — user_behavior_events dropped; use PostHog for behavioral analytics';

CREATE OR REPLACE FUNCTION public.update_segment_user_count(segment_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- LOT C: ne dépend plus de user_behavior_events ; conserve le compteur existant.
  UPDATE public.user_segments
  SET last_updated = NOW()
  WHERE id = segment_id;
  RETURN COALESCE(
    (SELECT user_count FROM public.user_segments WHERE id = segment_id),
    0
  );
EXCEPTION
  WHEN undefined_table THEN
    RETURN 0;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_old_behavior_events()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- LOT C: no-op (table dropped)
  RETURN 0;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_behavior_event()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- 2) Drop table orpheline (+ trigger / indexes / policies)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.user_behavior_events') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS notify_behavior_event_trigger ON public.user_behavior_events;
    DROP TABLE public.user_behavior_events CASCADE;
    RAISE NOTICE 'LOT C: dropped public.user_behavior_events';
  ELSE
    RAISE NOTICE 'LOT C: public.user_behavior_events already absent';
  END IF;
END $$;

-- Drop dead notify helper if nothing else depends on it
DROP FUNCTION IF EXISTS public.notify_behavior_event();

-- Unschedule any behavior cleanup cron if present
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-old-behavior-events') THEN
      PERFORM cron.unschedule('cleanup-old-behavior-events');
    END IF;
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    NULL;
END $$;

-- -----------------------------------------------------------------------------
-- 3) Rétention platform_visitor_events (table conservée pour AdminVisitors)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.platform_visitor_events') IS NULL THEN
    RAISE NOTICE 'LOT C: platform_visitor_events absent — skip retention';
    RETURN;
  END IF;

  CREATE OR REPLACE FUNCTION public.cleanup_platform_visitor_events(
    p_retention_days INTEGER DEFAULT 90
  )
  RETURNS INTEGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $fn$
  DECLARE
    v_days INTEGER;
    v_cutoff TIMESTAMPTZ;
    v_batch INTEGER;
    v_total INTEGER := 0;
  BEGIN
    v_days := GREATEST(COALESCE(p_retention_days, 90), 30);
    v_cutoff := now() - (v_days || ' days')::interval;

    LOOP
      DELETE FROM public.platform_visitor_events e
      WHERE e.id IN (
        SELECT id
        FROM public.platform_visitor_events
        WHERE created_at < v_cutoff
        ORDER BY created_at ASC
        LIMIT 1000
      );

      GET DIAGNOSTICS v_batch = ROW_COUNT;
      v_total := v_total + v_batch;
      EXIT WHEN v_batch = 0;
    END LOOP;

    RETURN v_total;
  END;
  $fn$;

  REVOKE ALL ON FUNCTION public.cleanup_platform_visitor_events(INTEGER) FROM PUBLIC;
  GRANT EXECUTE ON FUNCTION public.cleanup_platform_visitor_events(INTEGER) TO service_role;

  COMMENT ON FUNCTION public.cleanup_platform_visitor_events(INTEGER) IS
    'LOT C: delete platform_visitor_events older than retention (min 30d, default 90d)';

  COMMENT ON TABLE public.platform_visitor_events IS
    'LOT C: historical / optional Postgres visitor events. New traffic → PostHog when configured (LOT B). AdminVisitors still reads this table.';

  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-platform-visitor-events') THEN
      PERFORM cron.unschedule('cleanup-platform-visitor-events');
    END IF;
    PERFORM cron.schedule(
      'cleanup-platform-visitor-events',
      '55 4 * * *',
      $cron$SELECT public.cleanup_platform_visitor_events(90);$cron$
    );
  ELSE
    RAISE NOTICE 'LOT C: pg_cron indisponible — planifier cleanup_platform_visitor_events manuellement';
  END IF;
END $$;

COMMIT;

NOTIFY pgrst, 'reload schema';
