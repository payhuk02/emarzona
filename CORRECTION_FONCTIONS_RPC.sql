-- ======================================================================================
-- CORRECTION RAPIDE : Résoudre l'erreur "function get_dashboard_stats(uuid) is not unique"
-- ======================================================================================

-- Étape 1 : Supprimer les anciennes fonctions conflictuelles
DROP FUNCTION IF EXISTS get_dashboard_stats(uuid);
DROP FUNCTION IF EXISTS get_complete_dashboard_data(uuid);

-- Étape 2 : Créer les nouvelles fonctions avec noms uniques
CREATE OR REPLACE FUNCTION get_dashboard_stats_optimized(store_uuid UUID)
RETURNS JSON AS $$
BEGIN
  RETURN json_build_object(
    'totalProducts', (SELECT COALESCE(total_products, 0) FROM dashboard_stats_optimized WHERE store_id = store_uuid),
    'activeProducts', (SELECT COALESCE(active_products, 0) FROM dashboard_stats_optimized WHERE store_id = store_uuid),
    'digitalProducts', (SELECT COALESCE(digital_products, 0) FROM dashboard_stats_optimized WHERE store_id = store_uuid),
    'physicalProducts', (SELECT COALESCE(physical_products, 0) FROM dashboard_stats_optimized WHERE store_id = store_uuid),
    'serviceProducts', (SELECT COALESCE(service_products, 0) FROM dashboard_stats_optimized WHERE store_id = store_uuid),
    'courseProducts', (SELECT COALESCE(course_products, 0) FROM dashboard_stats_optimized WHERE store_id = store_uuid),
    'artistProducts', (SELECT COALESCE(artist_products, 0) FROM dashboard_stats_optimized WHERE store_id = store_uuid),
    'avgProductPrice', (SELECT COALESCE(avg_product_price, 0) FROM dashboard_stats_optimized WHERE store_id = store_uuid),
    'totalProductsValue', (SELECT COALESCE(total_products_value, 0) FROM dashboard_stats_optimized WHERE store_id = store_uuid),
    'totalOrders', (SELECT COALESCE(total_orders, 0) FROM dashboard_stats_optimized WHERE store_id = store_uuid),
    'completedOrders', (SELECT COALESCE(completed_orders, 0) FROM dashboard_stats_optimized WHERE store_id = store_uuid),
    'pendingOrders', (SELECT COALESCE(pending_orders, 0) FROM dashboard_stats_optimized WHERE store_id = store_uuid),
    'cancelledOrders', (SELECT COALESCE(cancelled_orders, 0) FROM dashboard_stats_optimized WHERE store_id = store_uuid),
    'totalRevenue', (SELECT COALESCE(total_revenue, 0) FROM dashboard_stats_optimized WHERE store_id = store_uuid),
    'avgOrderValue', (SELECT COALESCE(avg_order_value, 0) FROM dashboard_stats_optimized WHERE store_id = store_uuid),
    'orders30d', (SELECT COALESCE(orders_30d, 0) FROM dashboard_stats_optimized WHERE store_id = store_uuid),
    'orders7d', (SELECT COALESCE(orders_7d, 0) FROM dashboard_stats_optimized WHERE store_id = store_uuid),
    'orders90d', (SELECT COALESCE(orders_90d, 0) FROM dashboard_stats_optimized WHERE store_id = store_uuid),
    'revenue30d', (SELECT COALESCE(revenue_30d, 0) FROM dashboard_stats_optimized WHERE store_id = store_uuid),
    'revenue7d', (SELECT COALESCE(revenue_7d, 0) FROM dashboard_stats_optimized WHERE store_id = store_uuid),
    'revenue90d', (SELECT COALESCE(revenue_90d, 0) FROM dashboard_stats_optimized WHERE store_id = store_uuid),
    'totalCustomers', (SELECT COALESCE(total_customers, 0) FROM dashboard_stats_optimized WHERE store_id = store_uuid),
    'customers30d', (SELECT COALESCE(customers_30d, 0) FROM dashboard_stats_optimized WHERE store_id = store_uuid),
    'customers7d', (SELECT COALESCE(customers_7d, 0) FROM dashboard_stats_optimized WHERE store_id = store_uuid),
    'customers90d', (SELECT COALESCE(customers_90d, 0) FROM dashboard_stats_optimized WHERE store_id = store_uuid)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonctions auxiliaires dashboard
CREATE OR REPLACE FUNCTION get_recent_orders_with_details(store_uuid UUID, limit_count INTEGER DEFAULT 5)
RETURNS TABLE (
  id UUID,
  order_number TEXT,
  total_amount DECIMAL,
  status TEXT,
  created_at TIMESTAMPTZ,
  customer_name TEXT,
  customer_email TEXT,
  product_types TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.id,
    o.order_number,
    o.total_amount,
    o.status,
    o.created_at,
    c.name as customer_name,
    c.email as customer_email,
    ARRAY_AGG(DISTINCT p.product_type) FILTER (WHERE p.product_type IS NOT NULL) as product_types
  FROM orders o
  LEFT JOIN customers c ON o.customer_id = c.id
  LEFT JOIN order_items oi ON o.id = oi.order_id
  LEFT JOIN products p ON oi.product_id = p.id
  WHERE o.store_id = store_uuid
  GROUP BY o.id, o.order_number, o.total_amount, o.status, o.created_at, c.name, c.email
  ORDER BY o.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_top_selling_products(store_uuid UUID, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  name TEXT,
  price DECIMAL,
  image_url TEXT,
  product_type TEXT,
  revenue DECIMAL,
  quantity INTEGER,
  order_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.price,
    p.image_url,
    p.product_type,
    SUM(oi.total_price) as revenue,
    SUM(oi.quantity) as quantity,
    COUNT(DISTINCT oi.order_id) as order_count
  FROM products p
  JOIN order_items oi ON p.id = oi.product_id
  JOIN orders o ON oi.order_id = o.id
  WHERE p.store_id = store_uuid
    AND o.status = 'completed'
    AND o.created_at >= CURRENT_DATE - INTERVAL '90 days'
  GROUP BY p.id, p.name, p.price, p.image_url, p.product_type
  ORDER BY revenue DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_active_products_with_images(store_uuid UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  price DECIMAL,
  image_url TEXT,
  product_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.price,
    p.image_url,
    p.product_type
  FROM products p
  WHERE p.store_id = store_uuid
    AND p.is_active = true
    AND p.is_draft = false
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction principale dashboard
CREATE OR REPLACE FUNCTION get_complete_dashboard_data_optimized(store_uuid UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'stats', get_dashboard_stats_optimized(store_uuid),
    'recentOrders', (SELECT json_agg(row_to_json(t)) FROM get_recent_orders_with_details(store_uuid, 5) t),
    'topProducts', (SELECT json_agg(row_to_json(t)) FROM get_top_selling_products(store_uuid, 10) t),
    'activeProducts', (SELECT json_agg(row_to_json(t)) FROM get_active_products_with_images(store_uuid) t),
    'generatedAt', CURRENT_TIMESTAMP,
    'storeId', store_uuid
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissions
GRANT EXECUTE ON FUNCTION get_complete_dashboard_data_optimized(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_stats_optimized(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_orders_with_details(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_selling_products(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_products_with_images(UUID) TO authenticated;

-- ================================================================================
-- TESTEZ LA CORRECTION
-- ================================================================================

-- Test de la fonction corrigée :
-- SELECT get_complete_dashboard_data_optimized('votre-store-id');

-- Si ça fonctionne, vous pouvez supprimer ce fichier de correction.