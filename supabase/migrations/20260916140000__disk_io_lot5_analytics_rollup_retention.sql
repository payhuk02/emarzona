-- =============================================================================
-- LOT 5 — Architecture + Scaling : rollup analytics + rétention raw events
-- Date: 2026-09-16
--
-- Objectif :
--   1) Table d'agrégats journaliers (lectures dashboard légères)
--   2) Fonction de rollup incrémental
--   3) Cleanup raw analytics_events (batches) — défaut rétention 90j
--   4) Cron pg_cron si disponible
--
-- Défensif : no-op si analytics_events absent.
-- Idempotent : IF NOT EXISTS / CREATE OR REPLACE.
-- =============================================================================

BEGIN;

DO $$
BEGIN
  IF to_regclass('public.analytics_events') IS NULL THEN
    RAISE NOTICE 'LOT5: public.analytics_events absent — skip rollup/rétention';
    RETURN;
  END IF;

  -- -------------------------------------------------------------------------
  -- 1) Summary table (OLAP light)
  -- -------------------------------------------------------------------------
  CREATE TABLE IF NOT EXISTS public.analytics_events_daily (
    day DATE NOT NULL,
    store_id UUID NOT NULL,
    event_type TEXT NOT NULL,
    event_count BIGINT NOT NULL DEFAULT 0,
    revenue_sum NUMERIC NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (day, store_id, event_type)
  );

  CREATE INDEX IF NOT EXISTS idx_analytics_events_daily_store_day
    ON public.analytics_events_daily (store_id, day DESC);

  COMMENT ON TABLE public.analytics_events_daily IS
    'LOT5: agrégats journaliers analytics_events (réduit I/O lecture dashboards)';

  -- -------------------------------------------------------------------------
  -- 2) Rollup for one day (UTC)
  -- -------------------------------------------------------------------------
  CREATE OR REPLACE FUNCTION public.rollup_analytics_events_daily(
    p_day DATE DEFAULT ((timezone('utc', now())::date) - 1)
  )
  RETURNS INTEGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $fn$
  DECLARE
    v_start TIMESTAMPTZ;
    v_end TIMESTAMPTZ;
    v_rows INTEGER := 0;
  BEGIN
    v_start := p_day::timestamptz;
    v_end := (p_day + 1)::timestamptz;

    INSERT INTO public.analytics_events_daily AS d
      (day, store_id, event_type, event_count, revenue_sum, updated_at)
    SELECT
      p_day,
      e.store_id,
      e.event_type,
      COUNT(*)::BIGINT,
      COALESCE(SUM(e.revenue), 0)::NUMERIC,
      now()
    FROM public.analytics_events e
    WHERE e.created_at >= v_start
      AND e.created_at < v_end
      AND e.store_id IS NOT NULL
    GROUP BY e.store_id, e.event_type
    ON CONFLICT (day, store_id, event_type) DO UPDATE
      SET event_count = EXCLUDED.event_count,
          revenue_sum = EXCLUDED.revenue_sum,
          updated_at = now();

    GET DIAGNOSTICS v_rows = ROW_COUNT;
    RETURN v_rows;
  END;
  $fn$;

  REVOKE ALL ON FUNCTION public.rollup_analytics_events_daily(DATE) FROM PUBLIC;
  GRANT EXECUTE ON FUNCTION public.rollup_analytics_events_daily(DATE) TO service_role;

  -- -------------------------------------------------------------------------
  -- 3) Cleanup raw events older than retention (batched)
  -- -------------------------------------------------------------------------
  CREATE OR REPLACE FUNCTION public.cleanup_analytics_events(
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
      DELETE FROM public.analytics_events e
      WHERE e.id IN (
        SELECT id
        FROM public.analytics_events
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

  REVOKE ALL ON FUNCTION public.cleanup_analytics_events(INTEGER) FROM PUBLIC;
  GRANT EXECUTE ON FUNCTION public.cleanup_analytics_events(INTEGER) TO service_role;

  COMMENT ON FUNCTION public.rollup_analytics_events_daily(DATE) IS
    'LOT5: rebuild daily rollup for one UTC day; returns upserted groups';
  COMMENT ON FUNCTION public.cleanup_analytics_events(INTEGER) IS
    'LOT5: delete raw analytics_events older than retention (min 30d, default 90d)';

  -- -------------------------------------------------------------------------
  -- 4) RLS summary : store members read own store rows
  -- -------------------------------------------------------------------------
  ALTER TABLE public.analytics_events_daily ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS analytics_events_daily_select_member ON public.analytics_events_daily;
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'is_store_member'
  ) THEN
    CREATE POLICY analytics_events_daily_select_member
      ON public.analytics_events_daily
      FOR SELECT
      TO authenticated
      USING (
        public.is_store_member(store_id, auth.uid())
        OR COALESCE(public.has_role(auth.uid(), 'admin'::public.app_role), false)
      );
  END IF;

  GRANT SELECT ON public.analytics_events_daily TO authenticated;
  GRANT ALL ON public.analytics_events_daily TO service_role;

  -- -------------------------------------------------------------------------
  -- 5) Cron : rollup hier 04:10 UTC ; cleanup 04:40 UTC
  -- -------------------------------------------------------------------------
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'rollup-analytics-events-daily') THEN
      PERFORM cron.unschedule('rollup-analytics-events-daily');
    END IF;
    PERFORM cron.schedule(
      'rollup-analytics-events-daily',
      '10 4 * * *',
      $cron$SELECT public.rollup_analytics_events_daily(((timezone('utc', now())::date) - 1));$cron$
    );

    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-analytics-events') THEN
      PERFORM cron.unschedule('cleanup-analytics-events');
    END IF;
    PERFORM cron.schedule(
      'cleanup-analytics-events',
      '40 4 * * *',
      $cron$SELECT public.cleanup_analytics_events(90);$cron$
    );
  ELSE
    RAISE NOTICE 'LOT5: pg_cron indisponible — planifier rollup/cleanup manuellement';
  END IF;
END $$;

COMMIT;

NOTIFY pgrst, 'reload schema';
