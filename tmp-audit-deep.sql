SELECT se.store_id, se.total_revenue, se.total_platform_commission, se.total_withdrawn, se.available_balance, se.updated_at
FROM store_earnings se WHERE se.store_id = '667f45e0-1402-47a8-976b-8114f517a967';
SELECT status, count(*)::int AS n, coalesce(sum(amount),0) AS sum_amount
FROM transactions
WHERE store_id = '667f45e0-1402-47a8-976b-8114f517a967' AND created_at > now() - interval '7 days'
GROUP BY 1 ORDER BY n DESC;
SELECT id, amount, status, payment_method, created_at FROM store_withdrawals
WHERE store_id = '667f45e0-1402-47a8-976b-8114f517a967' ORDER BY created_at DESC LIMIT 15;
SELECT o.id, o.order_number, o.payment_status, o.total_amount, o.metadata->>'platform_fee' AS fee, o.metadata->>'subtotal' AS subtotal
FROM orders o WHERE o.store_id = '667f45e0-1402-47a8-976b-8114f517a967' AND o.payment_status IN ('paid','completed') ORDER BY o.created_at DESC LIMIT 10;
