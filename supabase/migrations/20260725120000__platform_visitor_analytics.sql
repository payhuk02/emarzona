-- Platform visitor analytics: page views, geo, devices, session duration (admin monitoring)

CREATE TABLE IF NOT EXISTS public.platform_visitor_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'page_view',
    'session_heartbeat',
    'session_end'
  )),
  page_path TEXT NOT NULL,
  page_url TEXT,
  referrer TEXT,
  country TEXT,
  region TEXT,
  city TEXT,
  timezone TEXT,
  language TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  user_agent TEXT,
  duration_ms INTEGER DEFAULT 0 CHECK (duration_ms >= 0),
  event_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_platform_visitor_events_created_at
  ON public.platform_visitor_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_visitor_events_session_id
  ON public.platform_visitor_events (session_id);
CREATE INDEX IF NOT EXISTS idx_platform_visitor_events_event_type
  ON public.platform_visitor_events (event_type);
CREATE INDEX IF NOT EXISTS idx_platform_visitor_events_country
  ON public.platform_visitor_events (country);
CREATE INDEX IF NOT EXISTS idx_platform_visitor_events_page_path
  ON public.platform_visitor_events (page_path);
CREATE INDEX IF NOT EXISTS idx_platform_visitor_events_device_type
  ON public.platform_visitor_events (device_type);

ALTER TABLE public.platform_visitor_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert platform visitor events" ON public.platform_visitor_events;
CREATE POLICY "Anyone can insert platform visitor events"
  ON public.platform_visitor_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can select platform visitor events" ON public.platform_visitor_events;
CREATE POLICY "Admins can select platform visitor events"
  ON public.platform_visitor_events
  FOR SELECT
  TO authenticated
  USING (
    COALESCE(public.has_role(auth.uid(), 'admin'::public.app_role), false)
    OR COALESCE(public.is_platform_admin(), false)
  );

GRANT SELECT, INSERT ON public.platform_visitor_events TO anon, authenticated;
GRANT ALL ON public.platform_visitor_events TO service_role;

CREATE OR REPLACE FUNCTION public.get_platform_visitor_analytics(
  p_period_days INTEGER DEFAULT 30
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_days INTEGER;
  v_period_start TIMESTAMPTZ;
  v_result JSONB;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT (
    COALESCE(public.has_role(auth.uid(), 'admin'::public.app_role), false)
    OR COALESCE(public.is_platform_admin(), false)
  ) THEN
    RAISE EXCEPTION 'Access denied for platform visitor analytics';
  END IF;

  v_days := GREATEST(COALESCE(p_period_days, 30), 1);
  v_period_start := NOW() - (v_days || ' days')::INTERVAL;

  SELECT jsonb_build_object(
    'period_days', v_days,
    'total_page_views', COALESCE((
      SELECT COUNT(*)::INT
      FROM public.platform_visitor_events e
      WHERE e.event_type = 'page_view'
        AND e.created_at >= v_period_start
    ), 0),
    'unique_sessions', COALESCE((
      SELECT COUNT(DISTINCT e.session_id)::INT
      FROM public.platform_visitor_events e
      WHERE e.created_at >= v_period_start
    ), 0),
    'unique_users', COALESCE((
      SELECT COUNT(DISTINCT e.user_id)::INT
      FROM public.platform_visitor_events e
      WHERE e.created_at >= v_period_start
        AND e.user_id IS NOT NULL
    ), 0),
    'avg_session_duration_ms', COALESCE((
      SELECT ROUND(AVG(sess.duration_ms))::BIGINT
      FROM (
        SELECT
          e.session_id,
          GREATEST(
            COALESCE(SUM(e.duration_ms) FILTER (
              WHERE e.event_type IN ('session_heartbeat', 'session_end')
            ), 0),
            EXTRACT(EPOCH FROM (MAX(e.created_at) - MIN(e.created_at))) * 1000
          )::BIGINT AS duration_ms
        FROM public.platform_visitor_events e
        WHERE e.created_at >= v_period_start
        GROUP BY e.session_id
      ) sess
      WHERE sess.duration_ms > 0
    ), 0),
    'bounce_rate', COALESCE((
      SELECT ROUND(
        100.0 * COUNT(*) FILTER (WHERE pv.page_count <= 1)::NUMERIC
        / NULLIF(COUNT(*)::NUMERIC, 0),
        1
      )
      FROM (
        SELECT e.session_id, COUNT(*) FILTER (WHERE e.event_type = 'page_view') AS page_count
        FROM public.platform_visitor_events e
        WHERE e.created_at >= v_period_start
        GROUP BY e.session_id
      ) pv
    ), 0),
    'by_country', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'country', agg.country,
          'region', agg.region,
          'sessions', agg.sessions,
          'page_views', agg.page_views
        )
        ORDER BY agg.sessions DESC
      )
      FROM (
        SELECT
          COALESCE(NULLIF(TRIM(e.country), ''), 'Inconnu') AS country,
          COALESCE(NULLIF(TRIM(e.region), ''), NULL) AS region,
          COUNT(DISTINCT e.session_id)::INT AS sessions,
          COUNT(*) FILTER (WHERE e.event_type = 'page_view')::INT AS page_views
        FROM public.platform_visitor_events e
        WHERE e.created_at >= v_period_start
        GROUP BY 1, 2
        ORDER BY sessions DESC
        LIMIT 25
      ) agg
    ), '[]'::JSONB),
    'by_device', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'device_type', agg.device_type,
          'sessions', agg.sessions,
          'page_views', agg.page_views
        )
        ORDER BY agg.sessions DESC
      )
      FROM (
        SELECT
          COALESCE(NULLIF(TRIM(e.device_type), ''), 'unknown') AS device_type,
          COUNT(DISTINCT e.session_id)::INT AS sessions,
          COUNT(*) FILTER (WHERE e.event_type = 'page_view')::INT AS page_views
        FROM public.platform_visitor_events e
        WHERE e.created_at >= v_period_start
        GROUP BY 1
        ORDER BY sessions DESC
      ) agg
    ), '[]'::JSONB),
    'by_browser', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'browser', agg.browser,
          'sessions', agg.sessions
        )
        ORDER BY agg.sessions DESC
      )
      FROM (
        SELECT
          COALESCE(NULLIF(TRIM(e.browser), ''), 'Unknown') AS browser,
          COUNT(DISTINCT e.session_id)::INT AS sessions
        FROM public.platform_visitor_events e
        WHERE e.created_at >= v_period_start
        GROUP BY 1
        ORDER BY sessions DESC
        LIMIT 10
      ) agg
    ), '[]'::JSONB),
    'by_os', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'os', agg.os,
          'sessions', agg.sessions
        )
        ORDER BY agg.sessions DESC
      )
      FROM (
        SELECT
          COALESCE(NULLIF(TRIM(e.os), ''), 'Unknown') AS os,
          COUNT(DISTINCT e.session_id)::INT AS sessions
        FROM public.platform_visitor_events e
        WHERE e.created_at >= v_period_start
        GROUP BY 1
        ORDER BY sessions DESC
        LIMIT 10
      ) agg
    ), '[]'::JSONB),
    'top_pages', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'page_path', agg.page_path,
          'views', agg.views,
          'sessions', agg.sessions,
          'avg_duration_ms', agg.avg_duration_ms
        )
        ORDER BY agg.views DESC
      )
      FROM (
        SELECT
          COALESCE(NULLIF(TRIM(e.page_path), ''), '/') AS page_path,
          COUNT(*) FILTER (WHERE e.event_type = 'page_view')::INT AS views,
          COUNT(DISTINCT e.session_id)::INT AS sessions,
          ROUND(AVG(NULLIF(e.duration_ms, 0)) FILTER (
            WHERE e.event_type IN ('session_heartbeat', 'session_end')
          ))::BIGINT AS avg_duration_ms
        FROM public.platform_visitor_events e
        WHERE e.created_at >= v_period_start
        GROUP BY 1
        HAVING COUNT(*) FILTER (WHERE e.event_type = 'page_view') > 0
        ORDER BY views DESC
        LIMIT 30
      ) agg
    ), '[]'::JSONB),
    'recent_sessions', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'session_id', rs.session_id,
          'user_id', rs.user_id,
          'country', rs.country,
          'region', rs.region,
          'device_type', rs.device_type,
          'browser', rs.browser,
          'os', rs.os,
          'page_views', rs.page_views,
          'duration_ms', rs.duration_ms,
          'landing_page', rs.landing_page,
          'last_page', rs.last_page,
          'started_at', rs.started_at,
          'last_seen_at', rs.last_seen_at
        )
        ORDER BY rs.last_seen_at DESC
      )
      FROM (
        SELECT
          e.session_id,
          (array_agg(e.user_id) FILTER (WHERE e.user_id IS NOT NULL))[1] AS user_id,
          MODE() WITHIN GROUP (ORDER BY COALESCE(NULLIF(TRIM(e.country), ''), 'Inconnu')) AS country,
          MODE() WITHIN GROUP (ORDER BY COALESCE(NULLIF(TRIM(e.region), ''), '')) AS region,
          MODE() WITHIN GROUP (ORDER BY COALESCE(NULLIF(TRIM(e.device_type), ''), 'unknown')) AS device_type,
          MODE() WITHIN GROUP (ORDER BY COALESCE(NULLIF(TRIM(e.browser), ''), 'Unknown')) AS browser,
          MODE() WITHIN GROUP (ORDER BY COALESCE(NULLIF(TRIM(e.os), ''), 'Unknown')) AS os,
          COUNT(*) FILTER (WHERE e.event_type = 'page_view')::INT AS page_views,
          GREATEST(
            COALESCE(SUM(e.duration_ms) FILTER (
              WHERE e.event_type IN ('session_heartbeat', 'session_end')
            ), 0),
            EXTRACT(EPOCH FROM (MAX(e.created_at) - MIN(e.created_at))) * 1000
          )::BIGINT AS duration_ms,
          (ARRAY_AGG(e.page_path ORDER BY e.created_at ASC)
            FILTER (WHERE e.event_type = 'page_view'))[1] AS landing_page,
          (ARRAY_AGG(e.page_path ORDER BY e.created_at DESC)
            FILTER (WHERE e.event_type = 'page_view'))[1] AS last_page,
          MIN(e.created_at) AS started_at,
          MAX(e.created_at) AS last_seen_at
        FROM public.platform_visitor_events e
        WHERE e.created_at >= v_period_start
        GROUP BY e.session_id
        ORDER BY MAX(e.created_at) DESC
        LIMIT 50
      ) rs
    ), '[]'::JSONB),
    'daily_trend', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'date', to_char(d.day, 'YYYY-MM-DD'),
          'sessions', d.sessions,
          'page_views', d.page_views
        )
        ORDER BY d.day ASC
      )
      FROM (
        SELECT
          date_trunc('day', e.created_at)::DATE AS day,
          COUNT(DISTINCT e.session_id)::INT AS sessions,
          COUNT(*) FILTER (WHERE e.event_type = 'page_view')::INT AS page_views
        FROM public.platform_visitor_events e
        WHERE e.created_at >= v_period_start
        GROUP BY 1
        ORDER BY 1 ASC
      ) d
    ), '[]'::JSONB)
  )
  INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_platform_visitor_analytics(INTEGER) TO authenticated;

COMMENT ON TABLE public.platform_visitor_events IS
  'Événements de visite plateforme (pages, appareils, geo, durée) pour monitoring admin';
COMMENT ON FUNCTION public.get_platform_visitor_analytics(INTEGER) IS
  'Agrégats visiteurs plateforme réservés aux admins';
