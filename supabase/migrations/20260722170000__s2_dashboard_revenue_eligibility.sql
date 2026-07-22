-- S2: Aligner get_store_dashboard_stats_aggregated sur is_order_eligible_for_revenue
-- (completed|confirmed) + (paid|partially_refunded) + revenu net (order_net_revenue_amount).

BEGIN;

CREATE OR REPLACE FUNCTION public.is_order_paid_for_revenue(
  p_status TEXT,
  p_payment_status TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT public.is_order_eligible_for_revenue(p_status, p_payment_status);
$$;

COMMENT ON FUNCTION public.is_order_paid_for_revenue(TEXT, TEXT) IS
  'Alias de is_order_eligible_for_revenue (completed|confirmed + paid|partially_refunded).';

-- Patch aggregated RPC (S2 revenue eligibility).
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
      o.payment_status,
      o.total_amount,
      o.created_at,
      o.customer_id,
      public.order_net_revenue_amount(o.id) AS net_revenue
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
    SELECT * FROM current_period
    WHERE public.is_order_eligible_for_revenue(status, payment_status)
  ),
  previous_completed AS (
    SELECT * FROM previous_period
    WHERE public.is_order_eligible_for_revenue(status, payment_status)
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
      (SELECT SUM(net_revenue) FROM current_completed),
      0
    ),
    'avgOrderValue', COALESCE(
      (SELECT AVG(net_revenue) FROM current_completed),
      0
    ),
    'revenue30d', COALESCE((SELECT SUM(net_revenue) FROM current_completed), 0),
    'orders30d', (SELECT COUNT(*)::INTEGER FROM current_period),
    'revenue7d', COALESCE((SELECT SUM(net_revenue) FROM current_completed), 0),
    'orders7d', (SELECT COUNT(*)::INTEGER FROM current_period),
    'revenue90d', COALESCE((SELECT SUM(net_revenue) FROM current_completed), 0),
    'orders90d', (SELECT COUNT(*)::INTEGER FROM current_period),
    'previousPeriodRevenue', COALESCE(
      (SELECT SUM(net_revenue) FROM previous_completed),
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
      AND public.is_order_eligible_for_revenue(o.status, o.payment_status)
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
      AND public.is_order_eligible_for_revenue(o.status, o.payment_status)
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
