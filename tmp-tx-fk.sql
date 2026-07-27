SELECT jsonb_build_object(
  'order_id_col', (
    SELECT jsonb_build_object('data_type', data_type, 'is_nullable', is_nullable)
    FROM information_schema.columns
    WHERE table_schema='public' AND table_name='transactions' AND column_name='order_id'
  ),
  'orphan_orders', (
    SELECT count(*) FROM transactions t
    WHERE t.order_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM orders o WHERE o.id = t.order_id)
  ),
  'with_order', (
    SELECT count(*) FROM transactions WHERE order_id IS NOT NULL
  )
) AS info;
