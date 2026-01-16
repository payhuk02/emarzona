-- Migration: Vues matérialisées pour optimiser le dashboard
-- Date: 21 janvier 2026
-- Description: Création de vues matérialisées pour réduire les 10 requêtes
--              séquentielles du useDashboardStats à 2-3 requêtes optimisées

-- Vue matérialisée pour les statistiques de base des produits
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_base_stats AS
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
  MIN(CASE WHEN is_active THEN price END) as min_product_price,
  MAX(CASE WHEN is_active THEN price END) as max_product_price
FROM products
GROUP BY store_id;

-- Index pour optimiser les requêtes sur store_id
CREATE INDEX IF NOT EXISTS idx_dashboard_base_stats_store_id ON dashboard_base_stats(store_id);

-- Vue matérialisée pour les statistiques de commandes
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_orders_stats AS
SELECT
  store_id,
  COUNT(*) as total_orders,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
  COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
  SUM(total_amount) as total_revenue,
  AVG(total_amount) as avg_order_value,
  MIN(total_amount) as min_order_value,
  MAX(total_amount) as max_order_value,
  -- Statistiques temporelles (derniers 30 jours)
  COUNT(CASE WHEN status = 'completed' AND created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as completed_orders_30d,
  SUM(CASE WHEN status = 'completed' AND created_at >= CURRENT_DATE - INTERVAL '30 days' THEN total_amount END) as revenue_30d,
  -- Statistiques temporelles (derniers 7 jours)
  COUNT(CASE WHEN status = 'completed' AND created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as completed_orders_7d,
  SUM(CASE WHEN status = 'completed' AND created_at >= CURRENT_DATE - INTERVAL '7 days' THEN total_amount END) as revenue_7d,
  -- Statistiques temporelles (derniers 90 jours)
  COUNT(CASE WHEN status = 'completed' AND created_at >= CURRENT_DATE - INTERVAL '90 days' THEN 1 END) as completed_orders_90d,
  SUM(CASE WHEN status = 'completed' AND created_at >= CURRENT_DATE - INTERVAL '90 days' THEN total_amount END) as revenue_90d
FROM orders
WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY store_id;

-- Index pour optimiser les requêtes sur store_id
CREATE INDEX IF NOT EXISTS idx_dashboard_orders_stats_store_id ON dashboard_orders_stats(store_id);

-- Vue matérialisée pour les statistiques clients
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_customers_stats AS
SELECT
  store_id,
  COUNT(*) as total_customers,
  -- Statistiques temporelles (derniers 30 jours)
  COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as new_customers_30d,
  -- Statistiques temporelles (derniers 7 jours)
  COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as new_customers_7d,
  -- Statistiques temporelles (derniers 90 jours)
  COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '90 days' THEN 1 END) as new_customers_90d,
  -- Clients avec commandes (rétention)
  COUNT(CASE WHEN id IN (
    SELECT DISTINCT customer_id FROM orders WHERE status = 'completed'
  ) THEN 1 END) as customers_with_orders
FROM customers
WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY store_id;

-- Index pour optimiser les requêtes sur store_id
CREATE INDEX IF NOT EXISTS idx_dashboard_customers_stats_store_id ON dashboard_customers_stats(store_id);

-- Vue matérialisée pour les statistiques de performance par type de produit
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_product_performance AS
WITH order_items_agg AS (
  SELECT
    oi.order_id,
    oi.product_id,
    oi.quantity,
    oi.unit_price,
    oi.total_price,
    p.product_type,
    p.store_id,
    o.created_at,
    o.status
  FROM order_items oi
  JOIN products p ON oi.product_id = p.id
  JOIN orders o ON oi.order_id = o.id
  WHERE o.status = 'completed'
    AND o.created_at >= CURRENT_DATE - INTERVAL '90 days'
)
SELECT
  store_id,
  product_type,
  COUNT(DISTINCT order_id) as total_orders,
  SUM(total_price) as total_revenue,
  SUM(quantity) as total_quantity_sold,
  AVG(total_price) as avg_order_value,
  COUNT(DISTINCT product_id) as products_sold,
  -- Statistiques par période
  COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN order_id END) as orders_30d,
  SUM(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN total_price END) as revenue_30d
FROM order_items_agg
GROUP BY store_id, product_type;

-- Index composite pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_dashboard_product_performance_store_type
ON dashboard_product_performance(store_id, product_type);

-- Vue matérialisée pour les produits les plus vendus
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_top_products AS
WITH product_sales AS (
  SELECT
    p.id,
    p.name,
    p.price,
    p.image_url,
    p.product_type,
    p.store_id,
    COALESCE(SUM(oi.total_price), 0) as total_revenue,
    COALESCE(SUM(oi.quantity), 0) as total_quantity_sold,
    COUNT(DISTINCT oi.order_id) as order_count
  FROM products p
  LEFT JOIN order_items oi ON p.id = oi.product_id
  LEFT JOIN orders o ON oi.order_id = o.id AND o.status = 'completed'
  WHERE p.is_active = true
  GROUP BY p.id, p.name, p.price, p.image_url, p.product_type, p.store_id
)
SELECT
  id,
  name,
  price,
  image_url,
  product_type,
  store_id,
  total_revenue,
  total_quantity_sold,
  order_count,
  ROW_NUMBER() OVER (PARTITION BY store_id ORDER BY total_revenue DESC) as rank
FROM product_sales
WHERE total_revenue > 0;

-- Index pour optimiser le classement par store
CREATE INDEX IF NOT EXISTS idx_dashboard_top_products_store_rank
ON dashboard_top_products(store_id, rank);

-- Vue matérialisée pour les commandes récentes avec détails clients
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_recent_orders AS
SELECT
  o.id,
  o.order_number,
  o.total_amount,
  o.status,
  o.created_at,
  o.store_id,
  JSON_BUILD_OBJECT(
    'id', c.id,
    'name', c.name,
    'email', c.email
  ) as customer,
  (
    SELECT ARRAY_AGG(JSON_BUILD_OBJECT('type', pt.product_type))
    FROM (
      SELECT DISTINCT p2.product_type
      FROM order_items oi2
      JOIN products p2 ON oi2.product_id = p2.id
      WHERE oi2.order_id = o.id AND p2.product_type IS NOT NULL
    ) pt
  ) as product_types
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.id
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN products p ON oi.product_id = p.id
WHERE o.created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY o.id, o.order_number, o.total_amount, o.status, o.created_at, o.store_id, c.id, c.name, c.email
ORDER BY o.created_at DESC;

-- Index pour optimiser les requêtes récentes
CREATE INDEX IF NOT EXISTS idx_dashboard_recent_orders_store_created
ON dashboard_recent_orders(store_id, created_at DESC);

-- Fonction pour rafraîchir toutes les vues matérialisées du dashboard
CREATE OR REPLACE FUNCTION refresh_dashboard_materialized_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Rafraîchir toutes les vues matérialisées de manière concurrente
  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_base_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_orders_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_customers_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_product_performance;
  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_top_products;
  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_recent_orders;

  RAISE NOTICE 'Toutes les vues matérialisées du dashboard ont été rafraîchies';
END;
$$;

-- Fonction pour obtenir les statistiques complètes du dashboard (remplace les 10 requêtes)
CREATE OR REPLACE FUNCTION get_dashboard_stats(store_id_param UUID, period_days INTEGER DEFAULT 30)
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
  -- Récupérer les statistiques de base
  SELECT json_build_object(
    'totalProducts', total_products,
    'activeProducts', active_products,
    'digitalProducts', digital_products,
    'physicalProducts', physical_products,
    'serviceProducts', service_products,
    'courseProducts', course_products,
    'artistProducts', artist_products,
    'avgProductPrice', avg_product_price
  ) INTO base_stats
  FROM dashboard_base_stats
  WHERE store_id = store_id_param;

  -- Récupérer les statistiques de commandes
  SELECT json_build_object(
    'totalOrders', total_orders,
    'completedOrders', completed_orders,
    'pendingOrders', pending_orders,
    'cancelledOrders', cancelled_orders,
    'totalRevenue', total_revenue,
    'avgOrderValue', avg_order_value,
    'revenue30d', revenue_30d,
    'orders30d', completed_orders_30d,
    'revenue7d', revenue_7d,
    'orders7d', completed_orders_7d,
    'revenue90d', revenue_90d,
    'orders90d', completed_orders_90d
  ) INTO orders_stats
  FROM dashboard_orders_stats
  WHERE store_id = store_id_param;

  -- Récupérer les statistiques clients
  SELECT json_build_object(
    'totalCustomers', total_customers,
    'newCustomers30d', new_customers_30d,
    'newCustomers7d', new_customers_7d,
    'newCustomers90d', new_customers_90d,
    'customersWithOrders', customers_with_orders
  ) INTO customers_stats
  FROM dashboard_customers_stats
  WHERE store_id = store_id_param;

  -- Récupérer les performances par type de produit
  SELECT array_agg(
    json_build_object(
      'type', product_type,
      'orders', total_orders,
      'revenue', total_revenue,
      'quantity', total_quantity_sold,
      'avgOrderValue', avg_order_value,
      'productsSold', products_sold,
      'orders30d', orders_30d,
      'revenue30d', revenue_30d
    )
  ) INTO product_performance
  FROM dashboard_product_performance
  WHERE store_id = store_id_param;

  -- Récupérer les top produits (limité à 5)
  SELECT array_agg(
    json_build_object(
      'id', id,
      'name', name,
      'price', price,
      'imageUrl', image_url,
      'productType', product_type,
      'revenue', total_revenue,
      'quantity', total_quantity_sold,
      'orderCount', order_count
    )
  ) INTO top_products
  FROM dashboard_top_products
  WHERE store_id = store_id_param AND rank <= 5
  ORDER BY rank;

  -- Récupérer les commandes récentes (limité à 5)
  SELECT array_agg(
    json_build_object(
      'id', id,
      'orderNumber', order_number,
      'totalAmount', total_amount,
      'status', status,
      'createdAt', created_at,
      'customer', customer,
      'productTypes', product_types
    )
  ) INTO recent_orders
  FROM dashboard_recent_orders
  WHERE store_id = store_id_param
  ORDER BY created_at DESC
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

-- Donner les permissions nécessaires
GRANT SELECT ON dashboard_base_stats TO authenticated;
GRANT SELECT ON dashboard_orders_stats TO authenticated;
GRANT SELECT ON dashboard_customers_stats TO authenticated;
GRANT SELECT ON dashboard_product_performance TO authenticated;
GRANT SELECT ON dashboard_top_products TO authenticated;
GRANT SELECT ON dashboard_recent_orders TO authenticated;

-- Créer une fonction RPC pour exposer get_dashboard_stats
CREATE OR REPLACE FUNCTION get_dashboard_stats_rpc(store_id UUID, period_days INTEGER DEFAULT 30)
RETURNS JSON
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT get_dashboard_stats(store_id, period_days);
$$;

-- Commentaires pour documenter
COMMENT ON MATERIALIZED VIEW dashboard_base_stats IS 'Statistiques de base des produits par boutique - rafraîchie automatiquement';
COMMENT ON MATERIALIZED VIEW dashboard_orders_stats IS 'Statistiques des commandes par boutique - rafraîchie automatiquement';
COMMENT ON MATERIALIZED VIEW dashboard_customers_stats IS 'Statistiques clients par boutique - rafraîchie automatiquement';
COMMENT ON MATERIALIZED VIEW dashboard_product_performance IS 'Performance par type de produit - rafraîchie automatiquement';
COMMENT ON MATERIALIZED VIEW dashboard_top_products IS 'Top produits les plus vendus - rafraîchie automatiquement';
COMMENT ON MATERIALIZED VIEW dashboard_recent_orders IS 'Commandes récentes avec détails - rafraîchie automatiquement';
COMMENT ON FUNCTION refresh_dashboard_materialized_views() IS 'Rafraîchit toutes les vues matérialisées du dashboard';
COMMENT ON FUNCTION get_dashboard_stats(UUID, INTEGER) IS 'Récupère toutes les statistiques du dashboard en une seule requête';
COMMENT ON FUNCTION get_dashboard_stats_rpc(UUID, INTEGER) IS 'RPC wrapper pour get_dashboard_stats';

-- Créer un job cron pour rafraîchir automatiquement les vues (toutes les heures)
-- Note: Cette partie nécessite l'extension pg_cron si disponible
-- INSERT INTO cron.job (schedule, command, nodename, nodeport, database, username)
-- VALUES ('0 * * * *', 'SELECT refresh_dashboard_materialized_views();', 'localhost', 5432, 'postgres', 'postgres');

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE 'Migration des vues matérialisées du dashboard terminée avec succès!';
  RAISE NOTICE 'Vues créées: dashboard_base_stats, dashboard_orders_stats, dashboard_customers_stats, dashboard_product_performance, dashboard_top_products, dashboard_recent_orders';
  RAISE NOTICE 'Fonctions créées: refresh_dashboard_materialized_views(), get_dashboard_stats(), get_dashboard_stats_rpc()';
  RAISE NOTICE 'N''oubliez pas de rafraîchir les vues régulièrement avec: SELECT refresh_dashboard_materialized_views();';
END $$;