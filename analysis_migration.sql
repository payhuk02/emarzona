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
  COALESCE(ARRAY_AGG(DISTINCT p.product_type) FILTER (WHERE p.product_type IS NOT NULL), ARRAY[]::text[]) as product_types
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