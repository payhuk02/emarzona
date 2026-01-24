-- Optimisation des requêtes Dashboard
-- Date: 18 Janvier 2026
-- Remplace les 10 requêtes séquentielles par une seule fonction RPC optimisée

-- Vue matérialisée pour les statistiques de base du dashboard
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_stats_optimized AS
WITH store_stats AS (
  SELECT
    store_id,
    COUNT(*) as total_products,
    COUNT(CASE WHEN is_active THEN 1 END) as active_products,
    COUNT(CASE WHEN is_active AND product_type = 'digital' THEN 1 END) as digital_products,
    COUNT(CASE WHEN is_active AND product_type = 'physical' THEN 1 END) as physical_products,
    COUNT(CASE WHEN is_active AND product_type = 'service' THEN 1 END) as service_products,
    COUNT(CASE WHEN is_active AND product_type = 'course' THEN 1 END) as course_products,
    COUNT(CASE WHEN is_active AND product_type = 'artist' THEN 1 END) as artist_products,
    AVG(CASE WHEN is_active THEN price END) as avg_product_price,
    SUM(CASE WHEN is_active THEN price END) as total_products_value
  FROM products
  GROUP BY store_id
),
order_stats AS (
  SELECT
    store_id,
    COUNT(*) as total_orders,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
    SUM(CASE WHEN status = 'completed' THEN total_amount END) as total_revenue,
    AVG(CASE WHEN status = 'completed' THEN total_amount END) as avg_order_value,
    COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as orders_30d,
    COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as orders_7d,
    COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '90 days' THEN 1 END) as orders_90d,
    SUM(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN total_amount END) as revenue_30d,
    SUM(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN total_amount END) as revenue_7d,
    SUM(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '90 days' THEN total_amount END) as revenue_90d
  FROM orders
  GROUP BY store_id
),
customer_stats AS (
  SELECT
    store_id,
    COUNT(*) as total_customers,
    COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as customers_30d,
    COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as customers_7d,
    COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '90 days' THEN 1 END) as customers_90d
  FROM customers
  GROUP BY store_id
)
SELECT
  s.store_id,
  -- Statistiques produits
  COALESCE(ss.total_products, 0) as total_products,
  COALESCE(ss.active_products, 0) as active_products,
  COALESCE(ss.digital_products, 0) as digital_products,
  COALESCE(ss.physical_products, 0) as physical_products,
  COALESCE(ss.service_products, 0) as service_products,
  COALESCE(ss.course_products, 0) as course_products,
  COALESCE(ss.artist_products, 0) as artist_products,
  COALESCE(ss.avg_product_price, 0) as avg_product_price,
  COALESCE(ss.total_products_value, 0) as total_products_value,
  -- Statistiques commandes
  COALESCE(os.total_orders, 0) as total_orders,
  COALESCE(os.completed_orders, 0) as completed_orders,
  COALESCE(os.pending_orders, 0) as pending_orders,
  COALESCE(os.cancelled_orders, 0) as cancelled_orders,
  COALESCE(os.total_revenue, 0) as total_revenue,
  COALESCE(os.avg_order_value, 0) as avg_order_value,
  COALESCE(os.orders_30d, 0) as orders_30d,
  COALESCE(os.orders_7d, 0) as orders_7d,
  COALESCE(os.orders_90d, 0) as orders_90d,
  COALESCE(os.revenue_30d, 0) as revenue_30d,
  COALESCE(os.revenue_7d, 0) as revenue_7d,
  COALESCE(os.revenue_90d, 0) as revenue_90d,
  -- Statistiques clients
  COALESCE(cs.total_customers, 0) as total_customers,
  COALESCE(cs.customers_30d, 0) as customers_30d,
  COALESCE(cs.customers_7d, 0) as customers_7d,
  COALESCE(cs.customers_90d, 0) as customers_90d
FROM stores s
LEFT JOIN store_stats ss ON s.id = ss.store_id
LEFT JOIN order_stats os ON s.id = os.store_id
LEFT JOIN customer_stats cs ON s.id = cs.store_id;

-- Créer les indexes pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_dashboard_stats_store_id ON dashboard_stats_optimized(store_id);

-- Fonction RPC optimisée pour récupérer toutes les statistiques du dashboard en une seule requête
CREATE OR REPLACE FUNCTION get_dashboard_stats(store_uuid UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
  period_start_30d TIMESTAMPTZ := CURRENT_DATE - INTERVAL '30 days';
  period_start_7d TIMESTAMPTZ := CURRENT_DATE - INTERVAL '7 days';
  period_start_90d TIMESTAMPTZ := CURRENT_DATE - INTERVAL '90 days';
BEGIN
  -- Récupérer les données de base depuis la vue matérialisée
  SELECT json_build_object(
    'totalProducts', COALESCE(dso.total_products, 0),
    'activeProducts', COALESCE(dso.active_products, 0),
    'digitalProducts', COALESCE(dso.digital_products, 0),
    'physicalProducts', COALESCE(dso.physical_products, 0),
    'serviceProducts', COALESCE(dso.service_products, 0),
    'courseProducts', COALESCE(dso.course_products, 0),
    'artistProducts', COALESCE(dso.artist_products, 0),
    'avgProductPrice', COALESCE(dso.avg_product_price, 0),
    'totalProductsValue', COALESCE(dso.total_products_value, 0),
    'totalOrders', COALESCE(dso.total_orders, 0),
    'completedOrders', COALESCE(dso.completed_orders, 0),
    'pendingOrders', COALESCE(dso.pending_orders, 0),
    'cancelledOrders', COALESCE(dso.cancelled_orders, 0),
    'totalRevenue', COALESCE(dso.total_revenue, 0),
    'avgOrderValue', COALESCE(dso.avg_order_value, 0),
    'orders30d', COALESCE(dso.orders_30d, 0),
    'orders7d', COALESCE(dso.orders_7d, 0),
    'orders90d', COALESCE(dso.orders_90d, 0),
    'revenue30d', COALESCE(dso.revenue_30d, 0),
    'revenue7d', COALESCE(dso.revenue_7d, 0),
    'revenue90d', COALESCE(dso.revenue_90d, 0),
    'totalCustomers', COALESCE(dso.total_customers, 0),
    'customers30d', COALESCE(dso.customers_30d, 0),
    'customers7d', COALESCE(dso.customers_7d, 0),
    'customers90d', COALESCE(dso.customers_90d, 0)
  ) INTO result
  FROM dashboard_stats_optimized dso
  WHERE dso.store_id = store_uuid;

  -- Retourner les données ou un objet vide si pas trouvé
  RETURN COALESCE(result, '{}'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les commandes récentes avec clients et types de produits
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

-- Fonction pour obtenir les produits les plus vendus
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

-- Fonction pour obtenir tous les produits actifs avec images
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

-- Fonction principale qui combine tout
CREATE OR REPLACE FUNCTION get_complete_dashboard_data(store_uuid UUID)
RETURNS JSON AS $$
DECLARE
  stats_result JSON;
  recent_orders_result JSON;
  top_products_result JSON;
  active_products_result JSON;
BEGIN
  -- Récupérer les statistiques de base
  SELECT get_dashboard_stats(store_uuid) INTO stats_result;

  -- Récupérer les commandes récentes
  SELECT json_agg(row_to_json(t)) INTO recent_orders_result
  FROM get_recent_orders_with_details(store_uuid, 5) t;

  -- Récupérer les produits les plus vendus
  SELECT json_agg(row_to_json(t)) INTO top_products_result
  FROM get_top_selling_products(store_uuid, 10) t;

  -- Récupérer tous les produits actifs
  SELECT json_agg(row_to_json(t)) INTO active_products_result
  FROM get_active_products_with_images(store_uuid) t;

  -- Retourner tout en JSON
  RETURN json_build_object(
    'stats', stats_result,
    'recentOrders', COALESCE(recent_orders_result, '[]'::json),
    'topProducts', COALESCE(top_products_result, '[]'::json),
    'activeProducts', COALESCE(active_products_result, '[]'::json),
    'generatedAt', CURRENT_TIMESTAMP,
    'storeId', store_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer une fonction de rafraîchissement pour la vue matérialisée
CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_stats_optimized;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Donner les permissions nécessaires
GRANT EXECUTE ON FUNCTION get_dashboard_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_orders_with_details(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_selling_products(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_products_with_images(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_complete_dashboard_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_dashboard_stats() TO authenticated;

-- Commentaire pour documenter
COMMENT ON MATERIALIZED VIEW dashboard_stats_optimized IS 'Vue matérialisée optimisée pour les statistiques du dashboard, remplaçant 10 requêtes séquentielles';
COMMENT ON FUNCTION get_dashboard_stats(UUID) IS 'Fonction RPC pour récupérer les statistiques de base du dashboard';
COMMENT ON FUNCTION get_recent_orders_with_details(UUID, INTEGER) IS 'Fonction pour récupérer les commandes récentes avec détails clients';
COMMENT ON FUNCTION get_top_selling_products(UUID, INTEGER) IS 'Fonction pour récupérer les produits les plus vendus';
COMMENT ON FUNCTION get_active_products_with_images(UUID) IS 'Fonction pour récupérer tous les produits actifs avec images';
COMMENT ON FUNCTION get_complete_dashboard_data(UUID) IS 'Fonction principale combinant toutes les données du dashboard';
COMMENT ON FUNCTION refresh_dashboard_stats() IS 'Fonction pour rafraîchir la vue matérialisée des statistiques';