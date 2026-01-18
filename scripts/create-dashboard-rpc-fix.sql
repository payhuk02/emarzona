-- Fix for dashboard RPC function to bypass problematic materialized view
-- Applied: 18 January 2026

-- Function to get dashboard stats using direct queries (bypassing materialized views)
CREATE OR REPLACE FUNCTION get_dashboard_stats_fixed(
  store_id_param UUID,
  period_days INTEGER DEFAULT 30
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  base_stats JSON;
  orders_stats JSON;
  customers_stats JSON;
  product_performance JSON[];
  top_products JSON[];
  recent_orders JSON[];
BEGIN
  -- Récupérer les statistiques de base (direct query)
  SELECT json_build_object(
    'totalProducts', COUNT(*),
    'activeProducts', COUNT(CASE WHEN is_active THEN 1 END),
    'digitalProducts', COUNT(CASE WHEN is_active AND product_type = 'digital' THEN 1 END),
    'physicalProducts', COUNT(CASE WHEN is_active AND product_type = 'physical' THEN 1 END),
    'serviceProducts', COUNT(CASE WHEN is_active AND product_type = 'service' THEN 1 END),
    'courseProducts', COUNT(CASE WHEN is_active AND product_type = 'course' THEN 1 END),
    'artistProducts', COUNT(CASE WHEN is_active AND product_type = 'artist' THEN 1 END),
    'avgProductPrice', AVG(CASE WHEN is_active THEN price END)
  ) INTO base_stats
  FROM products
  WHERE store_id = store_id_param;

  -- Récupérer les statistiques de commandes (direct query)
  SELECT json_build_object(
    'totalOrders', COUNT(*),
    'completedOrders', COUNT(CASE WHEN status = 'completed' THEN 1 END),
    'pendingOrders', COUNT(CASE WHEN status = 'pending' THEN 1 END),
    'cancelledOrders', COUNT(CASE WHEN status = 'cancelled' THEN 1 END),
    'totalRevenue', COALESCE(SUM(total_amount), 0),
    'avgOrderValue', COALESCE(AVG(total_amount), 0),
    'revenue30d', COALESCE(SUM(CASE WHEN status = 'completed' AND created_at >= CURRENT_DATE - INTERVAL '30 days' THEN total_amount END), 0),
    'orders30d', COUNT(CASE WHEN status = 'completed' AND created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END),
    'revenue7d', COALESCE(SUM(CASE WHEN status = 'completed' AND created_at >= CURRENT_DATE - INTERVAL '7 days' THEN total_amount END), 0),
    'orders7d', COUNT(CASE WHEN status = 'completed' AND created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END),
    'revenue90d', COALESCE(SUM(CASE WHEN status = 'completed' AND created_at >= CURRENT_DATE - INTERVAL '90 days' THEN total_amount END), 0),
    'orders90d', COUNT(CASE WHEN status = 'completed' AND created_at >= CURRENT_DATE - INTERVAL '90 days' THEN 1 END)
  ) INTO orders_stats
  FROM orders
  WHERE store_id = store_id_param
    AND created_at >= CURRENT_DATE - INTERVAL '90 days';

  -- Récupérer les statistiques clients (direct query)
  SELECT json_build_object(
    'totalCustomers', COUNT(*),
    'newCustomers30d', COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END),
    'newCustomers7d', COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END),
    'newCustomers90d', COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '90 days' THEN 1 END),
    'customersWithOrders', COUNT(CASE WHEN id IN (
      SELECT DISTINCT customer_id FROM orders WHERE status = 'completed' AND store_id = store_id_param
    ) THEN 1 END)
  ) INTO customers_stats
  FROM customers
  WHERE store_id = store_id_param
    AND created_at >= CURRENT_DATE - INTERVAL '90 days';

  -- Récupérer les performances par type de produit (direct query)
  SELECT array_agg(
    json_build_object(
      'type', type,
      'orders', orders,
      'revenue', revenue,
      'quantity', quantity,
      'avgOrderValue', avg_order_value,
      'productsSold', products_sold,
      'orders_30d', orders_30d,
      'revenue_30d', revenue_30d
    )
  ) INTO product_performance
  FROM (
    SELECT
      product_type as type,
      COUNT(DISTINCT order_id) as orders,
      COALESCE(SUM(total_price), 0) as revenue,
      COALESCE(SUM(quantity), 0) as quantity,
      COALESCE(AVG(total_price), 0) as avg_order_value,
      COUNT(DISTINCT product_id) as products_sold,
      COUNT(DISTINCT CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN order_id END) as orders_30d,
      COALESCE(SUM(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN total_price END), 0) as revenue_30d
    FROM (
      SELECT
        oi.order_id,
        oi.product_id,
        oi.quantity,
        oi.total_price,
        p.product_type,
        o.created_at
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status = 'completed'
        AND o.store_id = store_id_param
        AND o.created_at >= CURRENT_DATE - INTERVAL '90 days'
    ) subquery
    GROUP BY product_type
  ) aggregated_data;

  -- Récupérer les top produits (direct query)
  SELECT array_agg(
    json_build_object(
      'id', sub.id,
      'name', sub.name,
      'price', sub.price,
      'imageUrl', sub.image_url,
      'productType', sub.product_type,
      'revenue', sub.total_revenue,
      'quantity', sub.total_quantity_sold,
      'orderCount', sub.order_count
    )
  ) INTO top_products
  FROM (
    SELECT
      p.id,
      p.name,
      p.price,
      p.image_url,
      p.product_type,
      COALESCE(SUM(oi.total_price), 0) as total_revenue,
      COALESCE(SUM(oi.quantity), 0) as total_quantity_sold,
      COUNT(DISTINCT oi.order_id) as order_count,
      ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(oi.total_price), 0) DESC) as rank
    FROM products p
    LEFT JOIN order_items oi ON p.id = oi.product_id
    LEFT JOIN orders o ON oi.order_id = o.id AND o.status = 'completed' AND o.store_id = store_id_param
    WHERE p.is_active = true AND p.store_id = store_id_param
    GROUP BY p.id, p.name, p.price, p.image_url, p.product_type
    HAVING COALESCE(SUM(oi.total_price), 0) > 0
    ORDER BY total_revenue DESC
    LIMIT 5
  ) sub;

  -- Récupérer les commandes récentes (direct query - version simplifiée)
  WITH OrderProductTypes AS (
    SELECT
      oi.order_id,
      COALESCE(ARRAY_AGG(DISTINCT p.product_type) FILTER (WHERE p.product_type IS NOT NULL), ARRAY[]::text[]) as product_types
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    GROUP BY oi.order_id
  )
  SELECT array_agg(
    json_build_object(
      'id', o.id,
      'orderNumber', o.order_number,
      'totalAmount', o.total_amount,
      'status', o.status,
      'createdAt', o.created_at,
      'customer', json_build_object(
        'id', c.id,
        'name', c.name,
        'email', c.email
      ),
      'productTypes', opt.product_types
    )
  ) INTO recent_orders
  FROM orders o
  LEFT JOIN customers c ON o.customer_id = c.id
  LEFT JOIN OrderProductTypes opt ON o.id = opt.order_id
  WHERE o.store_id = store_id_param
    AND o.created_at >= CURRENT_DATE - INTERVAL '90 days'
  GROUP BY o.id, o.order_number, o.total_amount, o.status, o.created_at, c.id, c.name, c.email, opt.product_types
  ORDER BY o.created_at DESC
  LIMIT 5;

  -- Construire le résultat final
  SELECT json_build_object(
    'baseStats', base_stats,
    'ordersStats', orders_stats,
    'customersStats', customers_stats,
    'productPerformance', product_performance,
    'topProducts', top_products,
    'recentOrders', recent_orders,
    'generatedAt', NOW(),
    'periodDays', period_days
  ) INTO result;

  RETURN result;
END;
$$;

-- Replace the broken RPC function with a wrapper that calls the fixed function
DROP FUNCTION IF EXISTS get_dashboard_stats_rpc(UUID, INTEGER);
CREATE OR REPLACE FUNCTION get_dashboard_stats_rpc(store_id_param UUID, period_days_param INTEGER DEFAULT 30)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN get_dashboard_stats_fixed(store_id_param, period_days_param);
END;
$$;

-- Test the function
DO $$
DECLARE
  test_store_id UUID;
  result JSON;
BEGIN
  -- Get a test store
  SELECT id INTO test_store_id FROM stores LIMIT 1;

  IF test_store_id IS NOT NULL THEN
    -- Test the fixed function via the RPC wrapper
    SELECT get_dashboard_stats_rpc(test_store_id, 30) INTO result;

    RAISE NOTICE '✅ Fixed dashboard RPC function tested successfully!';
    RAISE NOTICE '📊 Sample data keys: %', array_to_string(ARRAY(SELECT json_object_keys(result)), ', ');
  ELSE
    RAISE NOTICE '⚠️  No stores found for testing';
  END IF;
END $$;
