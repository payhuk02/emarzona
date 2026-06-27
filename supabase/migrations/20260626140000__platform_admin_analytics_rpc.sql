-- Phase 4 — Analytics plateforme admin (production truth, remplace mocks UI)

CREATE OR REPLACE FUNCTION public.get_platform_admin_analytics(
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
  v_prev_start TIMESTAMPTZ;
  v_prev_end TIMESTAMPTZ;
  v_active_since TIMESTAMPTZ;
  v_result JSONB;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT (
    COALESCE(public.has_role(auth.uid(), 'admin'::public.app_role), false)
    OR COALESCE(public.is_platform_admin(), false)
  ) THEN
    RAISE EXCEPTION 'Access denied for platform analytics';
  END IF;

  v_days := GREATEST(COALESCE(p_period_days, 30), 1);
  v_period_start := NOW() - (v_days || ' days')::INTERVAL;
  v_prev_end := v_period_start;
  v_prev_start := v_prev_end - (v_days || ' days')::INTERVAL;
  v_active_since := NOW() - INTERVAL '7 days';

  SELECT jsonb_build_object(
    'period_days', v_days,
    'total_revenue', COALESCE((
      SELECT SUM(o.total_amount)
      FROM public.orders o
      WHERE o.payment_status IN ('paid', 'completed')
        AND o.created_at >= v_period_start
    ), 0),
    'previous_revenue', COALESCE((
      SELECT SUM(o.total_amount)
      FROM public.orders o
      WHERE o.payment_status IN ('paid', 'completed')
        AND o.created_at >= v_prev_start
        AND o.created_at < v_prev_end
    ), 0),
    'total_orders', COALESCE((
      SELECT COUNT(*)::INT
      FROM public.orders o
      WHERE o.created_at >= v_period_start
    ), 0),
    'previous_orders', COALESCE((
      SELECT COUNT(*)::INT
      FROM public.orders o
      WHERE o.created_at >= v_prev_start
        AND o.created_at < v_prev_end
    ), 0),
    'paid_orders', COALESCE((
      SELECT COUNT(*)::INT
      FROM public.orders o
      WHERE o.payment_status IN ('paid', 'completed')
        AND o.created_at >= v_period_start
    ), 0),
    'total_users', COALESCE((SELECT COUNT(*)::INT FROM public.profiles), 0),
    'new_users_period', COALESCE((
      SELECT COUNT(*)::INT
      FROM public.profiles p
      WHERE p.created_at >= v_period_start
    ), 0),
    'total_stores', COALESCE((SELECT COUNT(*)::INT FROM public.stores), 0),
    'new_stores_period', COALESCE((
      SELECT COUNT(*)::INT
      FROM public.stores s
      WHERE s.created_at >= v_period_start
    ), 0),
    'total_products', COALESCE((SELECT COUNT(*)::INT FROM public.products), 0),
    'active_products', COALESCE((
      SELECT COUNT(*)::INT
      FROM public.products p
      WHERE p.is_active = true
    ), 0),
    'active_users_7d', COALESCE((
      SELECT COUNT(DISTINCT o.customer_id)::INT
      FROM public.orders o
      WHERE o.customer_id IS NOT NULL
        AND o.created_at >= v_active_since
    ), 0),
    'revenue_by_product_type', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'product_type', agg.product_type,
          'revenue', agg.revenue,
          'orders', agg.order_count
        )
        ORDER BY agg.revenue DESC
      )
      FROM (
        SELECT
          COALESCE(oi.product_type, 'unknown') AS product_type,
          COALESCE(SUM(oi.total_price), 0) AS revenue,
          COUNT(DISTINCT oi.order_id)::INT AS order_count
        FROM public.order_items oi
        INNER JOIN public.orders o ON o.id = oi.order_id
        WHERE o.payment_status IN ('paid', 'completed')
          AND o.created_at >= v_period_start
        GROUP BY COALESCE(oi.product_type, 'unknown')
      ) agg
    ), '[]'::JSONB),
    'monthly_revenue', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'month', to_char(m.month_start, 'YYYY-MM'),
          'revenue', m.revenue,
          'orders', m.order_count
        )
        ORDER BY m.month_start
      )
      FROM (
        SELECT
          date_trunc('month', o.created_at)::DATE AS month_start,
          COALESCE(SUM(o.total_amount), 0) AS revenue,
          COUNT(*)::INT AS order_count
        FROM public.orders o
        WHERE o.payment_status IN ('paid', 'completed')
          AND o.created_at >= (NOW() - INTERVAL '12 months')
        GROUP BY date_trunc('month', o.created_at)::DATE
      ) m
    ), '[]'::JSONB)
  )
  INTO v_result;

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.get_platform_admin_analytics(INTEGER) IS
  'Agrégats analytics plateforme (admin uniquement) — remplace les mocks AdminAnalytics.';

GRANT EXECUTE ON FUNCTION public.get_platform_admin_analytics(INTEGER) TO authenticated;
