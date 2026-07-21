-- =============================================================================
-- Déploiement prod : objets web analytics manquants (constatés en 404 via PostgREST)
--   - Tables  : public.analytics_events, public.user_sessions
--   - RPCs    : public.get_store_web_metrics, public.get_store_dashboard_stats_aggregated
-- Sources    : migrations 20250122000001 (tables) et 20260717170000 (RPCs)
-- Idempotent : exécutable plusieurs fois sans effet de bord.
-- Usage      : Supabase Dashboard > SQL Editor (projet hbdnzajbyjakdhuavrvb) ou psql.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Tables analytics
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'view', 'click', 'conversion', 'purchase', 'session_start',
    'session_end', 'error', 'custom'
  )),
  event_data JSONB DEFAULT '{}',
  session_id TEXT,
  page_url TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_address INET,
  country TEXT,
  city TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  duration INTEGER,
  revenue NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL UNIQUE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration INTEGER DEFAULT 0,
  page_views INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  country TEXT,
  city TEXT,
  ip_address INET,
  user_agent TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Si une variante ancienne de user_sessions existe déjà (400 observé côté client),
-- s'assurer que les colonnes lues par le dashboard sont présentes.
ALTER TABLE public.user_sessions ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE;
ALTER TABLE public.user_sessions ADD COLUMN IF NOT EXISTS start_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.user_sessions ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 0;
ALTER TABLE public.user_sessions ADD COLUMN IF NOT EXISTS page_views INTEGER DEFAULT 0;
ALTER TABLE public.user_sessions ADD COLUMN IF NOT EXISTS clicks INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_analytics_events_product_id ON public.analytics_events(product_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON public.analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_store_id ON public.analytics_events(store_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_product_id ON public.user_sessions(product_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON public.user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_start_time ON public.user_sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_user_sessions_store_id ON public.user_sessions(store_id);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view events for their own products" ON public.analytics_events;
CREATE POLICY "Users can view events for their own products"
  ON public.analytics_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = analytics_events.store_id
        AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Anyone can insert analytics events" ON public.analytics_events;
CREATE POLICY "Anyone can insert analytics events"
  ON public.analytics_events FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view sessions for their own products" ON public.user_sessions;
CREATE POLICY "Users can view sessions for their own products"
  ON public.user_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = user_sessions.store_id
        AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "System can manage user sessions" ON public.user_sessions;
CREATE POLICY "System can manage user sessions"
  ON public.user_sessions FOR ALL
  WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 2. is_store_member (dépendance du RPC agrégé) — créé seulement s'il manque
-- -----------------------------------------------------------------------------

DO $do$
BEGIN
  IF to_regprocedure('public.is_store_member(uuid, uuid)') IS NULL THEN
    IF to_regclass('public.store_members') IS NOT NULL THEN
      EXECUTE $fn$
        CREATE FUNCTION public.is_store_member(_store_id UUID, _user_id UUID)
        RETURNS BOOLEAN
        LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
        AS $body$
          SELECT EXISTS (
            SELECT 1 FROM public.store_members
            WHERE store_id = _store_id AND user_id = _user_id AND status = 'active'
          )
          OR EXISTS (
            SELECT 1 FROM public.stores WHERE id = _store_id AND user_id = _user_id
          );
        $body$;
      $fn$;
    ELSE
      EXECUTE $fn$
        CREATE FUNCTION public.is_store_member(_store_id UUID, _user_id UUID)
        RETURNS BOOLEAN
        LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
        AS $body$
          SELECT EXISTS (
            SELECT 1 FROM public.stores WHERE id = _store_id AND user_id = _user_id
          );
        $body$;
      $fn$;
    END IF;
    GRANT EXECUTE ON FUNCTION public.is_store_member(UUID, UUID) TO authenticated;
  END IF;
END;
$do$;

-- -----------------------------------------------------------------------------
-- 3. RPC get_store_web_metrics (copie de 20260717170000)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_store_web_metrics(
  p_store_id UUID,
  p_period_start TIMESTAMPTZ,
  p_period_end TIMESTAMPTZ,
  p_compare_start TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_page_views INTEGER := 0;
  v_prev_page_views INTEGER := 0;
  v_bounce_rate NUMERIC := 0;
  v_session_duration NUMERIC := 0;
  v_session_count INTEGER := 0;
BEGIN
  SELECT COUNT(*)::INTEGER
  INTO v_page_views
  FROM public.analytics_events ae
  WHERE ae.store_id = p_store_id
    AND ae.event_type = 'view'
    AND ae.created_at >= p_period_start
    AND ae.created_at <= p_period_end;

  SELECT COUNT(*)::INTEGER
  INTO v_prev_page_views
  FROM public.analytics_events ae
  WHERE ae.store_id = p_store_id
    AND ae.event_type = 'view'
    AND ae.created_at >= p_compare_start
    AND ae.created_at < p_period_start;

  SELECT
    COUNT(*)::INTEGER,
    CASE
      WHEN COUNT(*) > 0 THEN ROUND(
        100.0 * COUNT(*) FILTER (
          WHERE COALESCE(us.page_views, 0) <= 1 AND COALESCE(us.clicks, 0) = 0
        )::NUMERIC / COUNT(*)::NUMERIC,
        2
      )
      ELSE 0
    END,
    COALESCE(AVG(NULLIF(us.duration, 0)), 0)
  INTO v_session_count, v_bounce_rate, v_session_duration
  FROM public.user_sessions us
  WHERE us.store_id = p_store_id
    AND us.start_time >= p_period_start
    AND us.start_time <= p_period_end;

  IF v_session_count = 0 AND v_page_views > 0 THEN
    WITH session_activity AS (
      SELECT
        ae.session_id,
        COUNT(*) FILTER (WHERE ae.event_type = 'view') AS views,
        COUNT(*) FILTER (WHERE ae.event_type IN ('click', 'conversion')) AS interactions,
        MAX(ae.duration) FILTER (WHERE ae.event_type = 'session_end') AS end_duration
      FROM public.analytics_events ae
      WHERE ae.store_id = p_store_id
        AND ae.created_at >= p_period_start
        AND ae.created_at <= p_period_end
        AND ae.session_id IS NOT NULL
      GROUP BY ae.session_id
    )
    SELECT
      COUNT(*)::INTEGER,
      CASE
        WHEN COUNT(*) > 0 THEN ROUND(
          100.0 * COUNT(*) FILTER (WHERE views <= 1 AND interactions = 0)::NUMERIC
            / COUNT(*)::NUMERIC,
          2
        )
        ELSE 0
      END,
      COALESCE(AVG(COALESCE(end_duration, 0)), 0)
    INTO v_session_count, v_bounce_rate, v_session_duration
    FROM session_activity;
  END IF;

  RETURN jsonb_build_object(
    'pageViews', COALESCE(v_page_views, 0),
    'previousPeriodPageViews', COALESCE(v_prev_page_views, 0),
    'bounceRate', COALESCE(v_bounce_rate, 0),
    'sessionDuration', COALESCE(ROUND(v_session_duration::NUMERIC, 0), 0)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_store_web_metrics(UUID, TIMESTAMPTZ, TIMESTAMPTZ, TIMESTAMPTZ)
  TO authenticated;

-- -----------------------------------------------------------------------------
-- 4. RPC get_store_dashboard_stats_aggregated (copie de 20260717170000)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_store_dashboard_stats_aggregated(
  p_store_id UUID,
  p_period_start TIMESTAMPTZ,
  p_period_end TIMESTAMPTZ,
  p_period_label TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_period_days INTEGER;
  v_compare_start TIMESTAMPTZ;
  v_base_stats JSONB;
  v_orders_stats JSONB;
  v_customers_stats JSONB;
  v_product_performance JSONB;
  v_top_products JSONB;
  v_recent_orders JSONB;
  v_operational JSONB;
  v_web_metrics JSONB;
  v_pending_orders INTEGER;
  v_processing_orders INTEGER;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  IF NOT public.is_store_member(p_store_id, v_uid) THEN
    RAISE EXCEPTION 'Access denied to store dashboard stats' USING ERRCODE = '42501';
  END IF;

  IF p_period_end < p_period_start THEN
    RAISE EXCEPTION 'Invalid period: end before start' USING ERRCODE = '22007';
  END IF;

  v_period_days := GREATEST(
    1,
    CEIL(EXTRACT(EPOCH FROM (p_period_end - p_period_start)) / 86400.0)::INTEGER
  );
  v_compare_start := p_period_start - (p_period_end - p_period_start);

  SELECT jsonb_build_object(
    'totalProducts', COUNT(*)::INTEGER,
    'activeProducts', COUNT(*) FILTER (
      WHERE is_active IS TRUE AND COALESCE(is_draft, FALSE) IS FALSE
    )::INTEGER,
    'digitalProducts', COUNT(*) FILTER (
      WHERE is_active IS TRUE
        AND COALESCE(is_draft, FALSE) IS FALSE
        AND product_type = 'digital'
    )::INTEGER,
    'physicalProducts', COUNT(*) FILTER (
      WHERE is_active IS TRUE
        AND COALESCE(is_draft, FALSE) IS FALSE
        AND product_type = 'physical'
    )::INTEGER,
    'serviceProducts', COUNT(*) FILTER (
      WHERE is_active IS TRUE
        AND COALESCE(is_draft, FALSE) IS FALSE
        AND product_type = 'service'
    )::INTEGER,
    'courseProducts', COUNT(*) FILTER (
      WHERE is_active IS TRUE
        AND COALESCE(is_draft, FALSE) IS FALSE
        AND product_type = 'course'
    )::INTEGER,
    'artistProducts', COUNT(*) FILTER (
      WHERE is_active IS TRUE
        AND COALESCE(is_draft, FALSE) IS FALSE
        AND product_type = 'artist'
    )::INTEGER,
    'avgProductPrice', COALESCE(AVG(price), 0)
  )
  INTO v_base_stats
  FROM public.products
  WHERE store_id = p_store_id;

  WITH scoped_orders AS (
    SELECT
      o.id,
      o.status,
      o.total_amount,
      o.created_at,
      o.customer_id
    FROM public.orders o
    WHERE o.store_id = p_store_id
      AND o.created_at >= v_compare_start
      AND o.created_at <= p_period_end
  ),
  current_period AS (
    SELECT * FROM scoped_orders
    WHERE created_at >= p_period_start AND created_at <= p_period_end
  ),
  previous_period AS (
    SELECT * FROM scoped_orders
    WHERE created_at >= v_compare_start AND created_at < p_period_start
  ),
  current_completed AS (
    SELECT * FROM current_period WHERE status = 'completed'
  ),
  previous_completed AS (
    SELECT * FROM previous_period WHERE status = 'completed'
  )
  SELECT jsonb_build_object(
    'totalOrders', (SELECT COUNT(*)::INTEGER FROM current_period),
    'completedOrders', (SELECT COUNT(*)::INTEGER FROM current_completed),
    'pendingOrders', (
      SELECT COUNT(*)::INTEGER FROM current_period WHERE status = 'pending'
    ),
    'cancelledOrders', (
      SELECT COUNT(*)::INTEGER FROM current_period WHERE status = 'cancelled'
    ),
    'totalRevenue', COALESCE(
      (SELECT SUM(total_amount) FROM current_completed),
      0
    ),
    'avgOrderValue', COALESCE(
      (SELECT AVG(total_amount) FROM current_completed),
      0
    ),
    'revenue30d', COALESCE((SELECT SUM(total_amount) FROM current_completed), 0),
    'orders30d', (SELECT COUNT(*)::INTEGER FROM current_period),
    'revenue7d', COALESCE((SELECT SUM(total_amount) FROM current_completed), 0),
    'orders7d', (SELECT COUNT(*)::INTEGER FROM current_period),
    'revenue90d', COALESCE((SELECT SUM(total_amount) FROM current_completed), 0),
    'orders90d', (SELECT COUNT(*)::INTEGER FROM current_period),
    'previousPeriodRevenue', COALESCE(
      (SELECT SUM(total_amount) FROM previous_completed),
      0
    ),
    'previousPeriodOrders', (SELECT COUNT(*)::INTEGER FROM previous_period),
    'previousPeriodCustomers', (
      SELECT COUNT(*)::INTEGER
      FROM public.customers c
      WHERE c.store_id = p_store_id
        AND c.created_at >= v_compare_start
        AND c.created_at < p_period_start
    )
  )
  INTO v_orders_stats;

  SELECT jsonb_build_object(
    'totalCustomers', COUNT(*)::INTEGER,
    'newCustomers30d', COUNT(*) FILTER (
      WHERE created_at >= p_period_start AND created_at <= p_period_end
    )::INTEGER,
    'newCustomers7d', COUNT(*) FILTER (
      WHERE created_at >= p_period_start AND created_at <= p_period_end
    )::INTEGER,
    'newCustomers90d', COUNT(*) FILTER (
      WHERE created_at >= p_period_start AND created_at <= p_period_end
    )::INTEGER,
    'customersWithOrders', (
      SELECT COUNT(DISTINCT cp.customer_id)::INTEGER
      FROM (
        SELECT customer_id
        FROM public.orders o
        WHERE o.store_id = p_store_id
          AND o.created_at >= p_period_start
          AND o.created_at <= p_period_end
          AND o.customer_id IS NOT NULL
      ) cp
    )
  )
  INTO v_customers_stats
  FROM public.customers
  WHERE store_id = p_store_id;

  WITH product_types AS (
    SELECT unnest(ARRAY['digital', 'physical', 'service', 'course', 'artist']) AS product_type
  ),
  perf_agg AS (
    SELECT
      COALESCE(oi.product_type, p.product_type) AS product_type,
      COUNT(DISTINCT o.id)::INTEGER AS orders,
      COALESCE(SUM(oi.total_price), 0) AS revenue,
      COALESCE(SUM(oi.quantity), 0)::INTEGER AS quantity,
      COUNT(DISTINCT oi.product_id)::INTEGER AS products_sold
    FROM public.orders o
    INNER JOIN public.order_items oi ON oi.order_id = o.id
    INNER JOIN public.products p ON p.id = oi.product_id
    WHERE o.store_id = p_store_id
      AND p.store_id = p_store_id
      AND o.status = 'completed'
      AND o.created_at >= p_period_start
      AND o.created_at <= p_period_end
    GROUP BY COALESCE(oi.product_type, p.product_type)
  )
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'type', pt.product_type,
        'orders', COALESCE(pa.orders, 0),
        'revenue', COALESCE(pa.revenue, 0),
        'quantity', COALESCE(pa.quantity, 0),
        'avgOrderValue', CASE
          WHEN COALESCE(pa.orders, 0) > 0 THEN COALESCE(pa.revenue, 0) / pa.orders
          ELSE 0
        END,
        'productsSold', COALESCE(pa.products_sold, 0),
        'orders30d', COALESCE(pa.orders, 0),
        'revenue30d', COALESCE(pa.revenue, 0)
      )
      ORDER BY pt.product_type
    ),
    '[]'::JSONB
  )
  INTO v_product_performance
  FROM product_types pt
  LEFT JOIN perf_agg pa ON pa.product_type = pt.product_type;

  SELECT COALESCE(
    jsonb_agg(row_data ORDER BY sort_revenue DESC),
    '[]'::JSONB
  )
  INTO v_top_products
  FROM (
    SELECT
      jsonb_build_object(
        'id', p.id,
        'name', p.name,
        'price', COALESCE(p.price, 0),
        'imageUrl', p.image_url,
        'productType', p.product_type,
        'revenue', COALESCE(SUM(oi.total_price), 0),
        'quantity', COALESCE(SUM(oi.quantity), 0)::INTEGER,
        'orderCount', COUNT(DISTINCT oi.order_id)::INTEGER
      ) AS row_data,
      COALESCE(SUM(oi.total_price), 0) AS sort_revenue
    FROM public.products p
    INNER JOIN public.order_items oi ON oi.product_id = p.id
    INNER JOIN public.orders o ON o.id = oi.order_id
    WHERE p.store_id = p_store_id
      AND o.store_id = p_store_id
      AND o.status = 'completed'
      AND o.created_at >= p_period_start
      AND o.created_at <= p_period_end
    GROUP BY p.id, p.name, p.price, p.image_url, p.product_type
    ORDER BY sort_revenue DESC
    LIMIT 5
  ) top_rows;

  SELECT COALESCE(
    jsonb_agg(row_data ORDER BY sort_created_at DESC),
    '[]'::JSONB
  )
  INTO v_recent_orders
  FROM (
    SELECT
      jsonb_build_object(
        'id', o.id,
        'orderNumber', COALESCE(o.order_number, ''),
        'totalAmount', COALESCE(o.total_amount, 0),
        'status', o.status,
        'createdAt', o.created_at,
        'customer', CASE
          WHEN c.id IS NOT NULL THEN jsonb_build_object(
            'id', c.id,
            'name', COALESCE(c.name, c.full_name, ''),
            'email', COALESCE(c.email, '')
          )
          ELSE NULL
        END,
        'productTypes', COALESCE(
          (
            SELECT jsonb_agg(DISTINCT pt_val)
            FROM (
              SELECT DISTINCT COALESCE(oi.product_type, pr.product_type) AS pt_val
              FROM public.order_items oi
              INNER JOIN public.products pr ON pr.id = oi.product_id
              WHERE oi.order_id = o.id
            ) pts
            WHERE pt_val IS NOT NULL
          ),
          '[]'::JSONB
        )
      ) AS row_data,
      o.created_at AS sort_created_at
    FROM public.orders o
    LEFT JOIN public.customers c ON c.id = o.customer_id
    WHERE o.store_id = p_store_id
      AND o.created_at >= p_period_start
      AND o.created_at <= p_period_end
    ORDER BY o.created_at DESC
    LIMIT 5
  ) recent_rows;

  SELECT COUNT(*)::INTEGER
  INTO v_pending_orders
  FROM public.orders
  WHERE store_id = p_store_id AND status = 'pending';

  SELECT COUNT(*)::INTEGER
  INTO v_processing_orders
  FROM public.orders
  WHERE store_id = p_store_id AND status IN ('processing', 'confirmed');

  SELECT jsonb_build_object(
    'pendingOrders', v_pending_orders,
    'processingOrders', v_processing_orders,
    'draftProducts', (
      SELECT COUNT(*)::INTEGER
      FROM public.products
      WHERE store_id = p_store_id AND is_draft IS TRUE
    ),
    'lowStockProducts', (
      SELECT COUNT(*)::INTEGER
      FROM public.products
      WHERE store_id = p_store_id
        AND product_type = 'physical'
        AND is_active IS TRUE
        AND COALESCE(stock, stock_quantity) IS NOT NULL
        AND COALESCE(stock, stock_quantity) <= 5
    ),
    'pendingReviews', (
      SELECT COUNT(*)::INTEGER
      FROM public.reviews r
      INNER JOIN public.products p ON p.id = r.product_id
      WHERE p.store_id = p_store_id
        AND COALESCE(r.is_approved, FALSE) IS FALSE
    ),
    'ordersToFulfill', v_pending_orders + v_processing_orders
  )
  INTO v_operational;

  v_web_metrics := public.get_store_web_metrics(
    p_store_id,
    p_period_start,
    p_period_end,
    v_compare_start
  );

  RETURN jsonb_build_object(
    'baseStats', COALESCE(v_base_stats, '{}'::JSONB),
    'ordersStats', COALESCE(v_orders_stats, '{}'::JSONB),
    'customersStats', COALESCE(v_customers_stats, '{}'::JSONB),
    'productPerformance', COALESCE(v_product_performance, '[]'::JSONB),
    'topProducts', COALESCE(v_top_products, '[]'::JSONB),
    'recentOrders', COALESCE(v_recent_orders, '[]'::JSONB),
    'operational', COALESCE(v_operational, '{}'::JSONB),
    'webMetrics', COALESCE(v_web_metrics, '{}'::JSONB),
    'generatedAt', to_jsonb(NOW()),
    'periodDays', v_period_days,
    'periodLabel', COALESCE(
      p_period_label,
      v_period_days::TEXT || ' derniers jours'
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_store_dashboard_stats_aggregated(UUID, TIMESTAMPTZ, TIMESTAMPTZ, TEXT)
  TO authenticated;

COMMIT;

-- Recharger le cache de schéma PostgREST pour exposer les nouveaux objets immédiatement.
NOTIFY pgrst, 'reload schema';

-- Vérification rapide (à exécuter après le COMMIT) :
--   SELECT to_regclass('public.analytics_events'),
--          to_regclass('public.user_sessions'),
--          to_regprocedure('public.get_store_web_metrics(uuid,timestamptz,timestamptz,timestamptz)'),
--          to_regprocedure('public.get_store_dashboard_stats_aggregated(uuid,timestamptz,timestamptz,text)');
