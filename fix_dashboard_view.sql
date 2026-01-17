-- Script direct pour corriger la vue matérialisée dashboard_recent_orders
-- À exécuter directement dans Supabase SQL Editor

-- 1. Supprimer l'ancienne vue défaillante
DROP MATERIALIZED VIEW IF EXISTS dashboard_recent_orders;

-- 2. Recréer avec la logique corrigée
CREATE MATERIALIZED VIEW dashboard_recent_orders AS
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

-- 3. Recréer l'index
DROP INDEX IF EXISTS idx_dashboard_recent_orders_store_created;
CREATE INDEX idx_dashboard_recent_orders_store_created
ON dashboard_recent_orders(store_id, created_at DESC);

-- 4. Actualiser la vue
REFRESH MATERIALIZED VIEW dashboard_recent_orders;

-- 5. Donner les permissions
GRANT SELECT ON dashboard_recent_orders TO authenticated;

-- 6. Vérifier que ça fonctionne
SELECT COUNT(*) as total_orders FROM dashboard_recent_orders LIMIT 1;