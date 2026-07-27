SELECT jsonb_build_object(
  'orders_paid_7d', (SELECT count(*) FROM orders WHERE payment_status IN ('paid','completed') AND updated_at > now() - interval '7 days'),
  'tx_completed_7d', (SELECT count(*) FROM transactions WHERE status = 'completed' AND updated_at > now() - interval '7 days'),
  'tx_completed_30d', (SELECT count(*) FROM transactions WHERE status = 'completed' AND updated_at > now() - interval '30 days'),
  'payments_completed_30d', (SELECT count(*) FROM payments WHERE status = 'completed' AND updated_at > now() - interval '30 days'),
  'edge_fulfillment_missing_paid_7d', (
    SELECT count(*) FROM orders
    WHERE payment_status IN ('paid','completed')
      AND updated_at > now() - interval '7 days'
      AND COALESCE(metadata->>'post_payment_fulfillment_at','') = ''
  ),
  's4_failed_open', (
    SELECT count(*) FROM orders
    WHERE COALESCE(metadata->>'s4_accounting_sync_failed_at','') <> ''
      AND COALESCE(metadata->>'post_payment_fulfillment_at','') = ''
  ),
  'tx_without_payment_30d', (
    SELECT count(*) FROM transactions t
    WHERE t.status = 'completed'
      AND t.updated_at > now() - interval '30 days'
      AND t.order_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM payments p
        WHERE p.transaction_id = t.id::text OR p.order_id = t.order_id
      )
  ),
  'paid_order_without_payment_30d', (
    SELECT count(*) FROM orders o
    WHERE o.payment_status IN ('paid','completed')
      AND o.updated_at > now() - interval '30 days'
      AND NOT EXISTS (SELECT 1 FROM payments p WHERE p.order_id = o.id AND p.status = 'completed')
  ),
  'paid_order_without_tx_30d', (
    SELECT count(*) FROM orders o
    WHERE o.payment_status IN ('paid','completed')
      AND o.updated_at > now() - interval '30 days'
      AND NOT EXISTS (SELECT 1 FROM transactions t WHERE t.order_id = o.id AND t.status = 'completed')
  ),
  'withdrawals', (
    SELECT COALESCE(jsonb_object_agg(status, c), '{}'::jsonb)
    FROM (SELECT status, count(*)::int AS c FROM store_withdrawals GROUP BY status) s
  ),
  'mf_withdrawals_stuck_24h', (
    SELECT count(*) FROM store_withdrawals
    WHERE status = 'processing'
      AND payment_method = 'mobile_money'
      AND COALESCE(approved_at, updated_at, created_at) < now() - interval '24 hours'
  ),
  'secured_payments', (
    SELECT COALESCE(jsonb_object_agg(status, c), '{}'::jsonb)
    FROM (SELECT status, count(*)::int AS c FROM secured_payments GROUP BY status) s
  ),
  'provider_mix_30d', (
    SELECT COALESCE(jsonb_object_agg(COALESCE(payment_provider,'null'), c), '{}'::jsonb)
    FROM (
      SELECT payment_provider, count(*)::int AS c
      FROM transactions
      WHERE status = 'completed' AND updated_at > now() - interval '30 days'
      GROUP BY payment_provider
    ) s
  ),
  'fee_spotcheck', (
    SELECT COALESCE(jsonb_agg(row_to_json(x)), '[]'::jsonb)
    FROM (
      SELECT
        o.order_number,
        o.total_amount,
        public.order_checkout_buyer_fee_amount(o.id) AS buyer_fee,
        public.order_net_revenue_amount(o.id) AS net_revenue,
        (o.total_amount - public.order_checkout_buyer_fee_amount(o.id) - COALESCE(o.refunded_amount,0)) AS expected_net,
        (public.order_net_revenue_amount(o.id) = (o.total_amount - public.order_checkout_buyer_fee_amount(o.id) - COALESCE(o.refunded_amount,0))) AS net_ok
      FROM orders o
      WHERE o.payment_status IN ('paid','completed')
        AND o.updated_at > now() - interval '30 days'
        AND public.order_checkout_buyer_fee_amount(o.id) > 0
      ORDER BY o.updated_at DESC
      LIMIT 10
    ) x
  ),
  'fn_request_withdrawal_src', (
    SELECT left(pg_get_functiondef('public.request_store_withdrawal(uuid,numeric,text,jsonb,text)'::regprocedure), 800)
  )
) AS audit;
