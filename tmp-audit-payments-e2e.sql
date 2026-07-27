-- Deep E2E payment audit (prod)

-- 1) Recent 202-ish MoneyFusion txs (48h)
SELECT
  t.id AS tx_id,
  t.order_id,
  t.store_id,
  t.amount,
  t.currency,
  t.status AS tx_status,
  t.payment_provider,
  t.payment_id,
  t.completed_at,
  t.webhook_processed_at,
  t.created_at,
  t.metadata->>'moneyfusion_token' AS mf_token,
  t.metadata->>'moneyfusion_status' AS mf_status,
  t.metadata->>'moneyfusion_error' AS mf_error,
  t.metadata->>'status' AS meta_status
FROM public.transactions t
WHERE t.created_at > now() - interval '48 hours'
  AND t.amount BETWEEN 190 AND 220
ORDER BY t.created_at DESC
LIMIT 25;
