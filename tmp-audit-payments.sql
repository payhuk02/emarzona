-- Deep payments audit snapshot (read-only aggregates)

SELECT 'kpi' AS section, jsonb_build_object(
  'orders_paid_7d', (SELECT count(*) FROM orders WHERE payment_status IN ('paid','completed') AND updated_at > now() - interval '7 days'),
  'tx_completed_7d', (SELECT count(*) FROM transactions WHERE status = 'completed' AND updated_at > now() - interval '7 days'),
  'tx_completed_30d', (SELECT count(*) FROM transactions WHERE status = 'completed' AND updated_at > now() - interval '30 days'),
  'payments_completed_30d', (SELECT count(*) FROM payments WHERE status = 'completed' AND updated_at > now() - interval '30 days'),
  's4_failed_meta_open', (
    SELECT count(*) FROM orders
    WHERE metadata ? 's4_accounting_sync_failed_at'
      AND COALESCE(metadata->>'s4_accounting_sync_failed_at','') <> ''
      AND COALESCE(metadata->>'post_payment_fulfillment_at','') = ''
  ),
  'edge_fulfillment_missing_paid_7d', (
    SELECT count(*) FROM orders
    WHERE payment_status IN ('paid','completed')
      AND updated_at > now() - interval '7 days'
      AND COALESCE(metadata->>'post_payment_fulfillment_at','') = ''
  )
) AS payload;

-- Completed TX without payments row (30d)
SELECT 'tx_without_payment' AS section, jsonb_build_object(
  'count', count(*),
  'amount_sum', COALESCE(sum(amount),0)
) AS payload
FROM transactions t
WHERE t.status = 'completed'
  AND t.updated_at > now() - interval '30 days'
  AND t.order_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.transaction_id = t.id::text
       OR p.order_id = t.order_id
  );

-- Paid orders without completed payment row (30d)
SELECT 'paid_order_without_payment' AS section, jsonb_build_object(
  'count', count(*)
) AS payload
FROM orders o
WHERE o.payment_status IN ('paid','completed')
  AND o.updated_at > now() - interval '30 days'
  AND NOT EXISTS (
    SELECT 1 FROM payments p WHERE p.order_id = o.id AND p.status = 'completed'
  );

-- Paid orders without completed transaction (30d)
SELECT 'paid_order_without_tx' AS section, jsonb_build_object(
  'count', count(*)
) AS payload
FROM orders o
WHERE o.payment_status IN ('paid','completed')
  AND o.updated_at > now() - interval '30 days'
  AND NOT EXISTS (
    SELECT 1 FROM transactions t WHERE t.order_id = o.id AND t.status = 'completed'
  );

-- Invoice sync gaps
SELECT 'paid_without_invoice_paid' AS section, jsonb_build_object(
  'count', count(*)
) AS payload
FROM orders o
WHERE o.payment_status IN ('paid','completed')
  AND o.updated_at > now() - interval '30 days'
  AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='invoices')
  AND EXISTS (
    SELECT 1 FROM invoices i WHERE i.order_id = o.id AND COALESCE(i.status,'') NOT IN ('paid','completed')
  );

-- Withdrawals by status
SELECT 'withdrawals' AS section, jsonb_object_agg(status, c) AS payload
FROM (
  SELECT status, count(*)::int AS c FROM store_withdrawals GROUP BY status
) s;

-- Processing MF withdrawals stuck > 24h
SELECT 'mf_withdrawals_stuck_24h' AS section, jsonb_build_object(
  'count', count(*),
  'amount_sum', COALESCE(sum(amount),0)
) AS payload
FROM store_withdrawals
WHERE status = 'processing'
  AND payment_method = 'mobile_money'
  AND COALESCE(approved_at, updated_at, created_at) < now() - interval '24 hours';

-- Sample fee leakage check: orders with buyer fee still fully in net? (spot via helper)
SELECT 'fee_spotcheck' AS section, jsonb_agg(row_to_json(x)) AS payload
FROM (
  SELECT
    o.id,
    o.order_number,
    o.total_amount,
    public.order_checkout_buyer_fee_amount(o.id) AS buyer_fee,
    public.order_net_revenue_amount(o.id) AS net_revenue,
    (o.total_amount - public.order_checkout_buyer_fee_amount(o.id) - COALESCE(o.refunded_amount,0)) AS expected_net
  FROM orders o
  WHERE o.payment_status IN ('paid','completed')
    AND o.updated_at > now() - interval '14 days'
    AND public.order_checkout_buyer_fee_amount(o.id) > 0
  ORDER BY o.updated_at DESC
  LIMIT 8
) x;

-- Provider mix 30d
SELECT 'provider_mix_30d' AS section, jsonb_object_agg(COALESCE(payment_provider,'null'), c) AS payload
FROM (
  SELECT payment_provider, count(*)::int AS c
  FROM transactions
  WHERE status = 'completed' AND updated_at > now() - interval '30 days'
  GROUP BY payment_provider
) s;

-- Escrow held rows
SELECT 'secured_payments' AS section, jsonb_object_agg(status, c) AS payload
FROM (
  SELECT status, count(*)::int AS c FROM secured_payments GROUP BY status
) s;
