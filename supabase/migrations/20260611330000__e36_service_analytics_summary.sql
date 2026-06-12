-- E36 Epic 3.3.3: Analytics prestataire service (RPC agrégée)
-- get_service_analytics_summary — réservations, revenus, tendances journalières

CREATE OR REPLACE FUNCTION public.get_service_analytics_summary(
  p_product_id UUID,
  p_start_date DATE DEFAULT (CURRENT_DATE - INTERVAL '30 days')::DATE,
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_store_id UUID;
  v_result JSONB;
  v_total INT;
  v_completed INT;
  v_cancelled INT;
  v_confirmed INT;
  v_pending INT;
  v_no_show INT;
  v_revenue NUMERIC;
  v_avg_rating NUMERIC;
  v_daily_bookings JSONB;
  v_daily_revenue JSONB;
BEGIN
  IF p_product_id IS NULL THEN
    RAISE EXCEPTION 'p_product_id is required';
  END IF;

  SELECT p.store_id INTO v_store_id
  FROM public.products p
  WHERE p.id = p_product_id AND p.product_type = 'service';

  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'Service product not found: %', p_product_id;
  END IF;

  IF auth.uid() IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id = v_store_id AND s.user_id = auth.uid()
  ) AND NOT COALESCE(public.has_role(auth.uid(), 'admin'::public.app_role), false) THEN
    RAISE EXCEPTION 'Access denied for service analytics';
  END IF;

  SELECT
    COUNT(*)::INT,
    COUNT(*) FILTER (WHERE sb.status = 'completed')::INT,
    COUNT(*) FILTER (WHERE sb.status = 'cancelled')::INT,
    COUNT(*) FILTER (WHERE sb.status = 'confirmed')::INT,
    COUNT(*) FILTER (WHERE sb.status = 'pending')::INT,
    COUNT(*) FILTER (WHERE sb.status = 'no_show')::INT
  INTO v_total, v_completed, v_cancelled, v_confirmed, v_pending, v_no_show
  FROM public.service_bookings sb
  WHERE sb.product_id = p_product_id
    AND sb.scheduled_date >= p_start_date
    AND sb.scheduled_date <= p_end_date;

  SELECT COALESCE(SUM(oi.total_price), 0)
  INTO v_revenue
  FROM public.service_bookings sb
  INNER JOIN public.order_items oi ON oi.booking_id = sb.id
  INNER JOIN public.orders o ON o.id = oi.order_id
  WHERE sb.product_id = p_product_id
    AND sb.status = 'completed'
    AND sb.scheduled_date >= p_start_date
    AND sb.scheduled_date <= p_end_date
    AND o.payment_status = 'paid';

  SELECT COALESCE(AVG(pr.rating), 0)
  INTO v_avg_rating
  FROM public.product_reviews pr
  WHERE pr.product_id = p_product_id;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'date', d.day,
        'total', d.cnt,
        'completed', d.completed_cnt
      )
      ORDER BY d.day
    ),
    '[]'::JSONB
  )
  INTO v_daily_bookings
  FROM (
    SELECT
      sb.scheduled_date AS day,
      COUNT(*)::INT AS cnt,
      COUNT(*) FILTER (WHERE sb.status = 'completed')::INT AS completed_cnt
    FROM public.service_bookings sb
    WHERE sb.product_id = p_product_id
      AND sb.scheduled_date >= p_start_date
      AND sb.scheduled_date <= p_end_date
    GROUP BY sb.scheduled_date
  ) d;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'date', r.day,
        'revenue', r.amount
      )
      ORDER BY r.day
    ),
    '[]'::JSONB
  )
  INTO v_daily_revenue
  FROM (
    SELECT
      sb.scheduled_date AS day,
      COALESCE(SUM(oi.total_price), 0)::NUMERIC AS amount
    FROM public.service_bookings sb
    INNER JOIN public.order_items oi ON oi.booking_id = sb.id
    INNER JOIN public.orders o ON o.id = oi.order_id
    WHERE sb.product_id = p_product_id
      AND sb.status = 'completed'
      AND sb.scheduled_date >= p_start_date
      AND sb.scheduled_date <= p_end_date
      AND o.payment_status = 'paid'
    GROUP BY sb.scheduled_date
  ) r;

  v_result := jsonb_build_object(
    'product_id', p_product_id,
    'start_date', p_start_date,
    'end_date', p_end_date,
    'total_bookings', v_total,
    'completed', v_completed,
    'cancelled', v_cancelled,
    'confirmed', v_confirmed,
    'pending', v_pending,
    'no_show', v_no_show,
    'revenue', COALESCE(v_revenue, 0),
    'average_booking_value',
      CASE WHEN v_completed > 0 THEN ROUND(COALESCE(v_revenue, 0) / v_completed, 2) ELSE 0 END,
    'cancellation_rate',
      CASE WHEN v_total > 0 THEN ROUND((v_cancelled::NUMERIC / v_total) * 100, 1) ELSE 0 END,
    'occupancy_rate',
      CASE WHEN v_total > 0 THEN ROUND((v_completed::NUMERIC / v_total) * 100, 1) ELSE 0 END,
    'average_rating', ROUND(COALESCE(v_avg_rating, 0), 2),
    'daily_bookings', v_daily_bookings,
    'daily_revenue', v_daily_revenue
  );

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.get_service_analytics_summary(UUID, DATE, DATE) IS
  'Epic 3.3.3 — agrégats réservations/revenus/tendances pour dashboard prestataire service.';

GRANT EXECUTE ON FUNCTION public.get_service_analytics_summary(UUID, DATE, DATE) TO authenticated, service_role;
