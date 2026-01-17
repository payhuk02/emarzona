-- Fix for dashboard_recent_orders GROUP BY error
-- Run this SQL directly in your Supabase SQL Editor

-- Drop the problematic view if it exists
DROP MATERIALIZED VIEW IF EXISTS dashboard_recent_orders;

-- Recreate with corrected GROUP BY and ARRAY_AGG logic
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

-- Recreate the index
CREATE INDEX IF NOT EXISTS idx_dashboard_recent_orders_store_created
ON dashboard_recent_orders(store_id, created_at DESC);

-- Refresh the view to populate it with correct data
REFRESH MATERIALIZED VIEW dashboard_recent_orders;

-- Grant permissions
GRANT SELECT ON dashboard_recent_orders TO authenticated;

-- Verify the fix
SELECT 'dashboard_recent_orders view fixed successfully!' as status;