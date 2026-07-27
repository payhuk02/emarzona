SELECT o.order_number, o.payment_status, o.total_amount, o.metadata->>'platform_fee' AS fee, o.metadata->>'subtotal' AS subtotal,
  (SELECT coalesce(sum(oi.total_price),0) FROM order_items oi WHERE oi.order_id = o.id) AS items_sum
FROM orders o
WHERE o.store_id = '667f45e0-1402-47a8-976b-8114f517a967'
  AND o.payment_status IN ('paid','completed')
ORDER BY o.updated_at DESC
LIMIT 10;
