-- Tokens for MF processing txs (read-only)
SELECT id, payment_id, amount, order_id, status, created_at
FROM transactions
WHERE payment_provider = 'moneyfusion' AND status = 'processing'
ORDER BY created_at DESC;
