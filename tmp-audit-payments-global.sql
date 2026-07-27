SELECT jsonb_build_object(
  'orders_total', (SELECT count(*) FROM orders),
  'orders_by_payment_status', (
    SELECT COALESCE(jsonb_object_agg(COALESCE(payment_status,'null'), c), '{}'::jsonb)
    FROM (SELECT payment_status, count(*)::int c FROM orders GROUP BY 1) s
  ),
  'tx_total', (SELECT count(*) FROM transactions),
  'tx_by_status', (
    SELECT COALESCE(jsonb_object_agg(COALESCE(status,'null'), c), '{}'::jsonb)
    FROM (SELECT status, count(*)::int c FROM transactions GROUP BY 1) s
  ),
  'payments_total', (SELECT count(*) FROM payments),
  'payments_by_status', (
    SELECT COALESCE(jsonb_object_agg(COALESCE(status,'null'), c), '{}'::jsonb)
    FROM (SELECT status, count(*)::int c FROM payments GROUP BY 1) s
  ),
  'withdrawals_total', (SELECT count(*) FROM store_withdrawals),
  'earnings_stores', (SELECT count(*) FROM store_earnings),
  'invoices_total', (SELECT count(*) FROM invoices),
  'request_wd_pending_only', (
    SELECT pg_get_functiondef('public.request_store_withdrawal(uuid,numeric,text,jsonb,text)'::regprocedure)
      LIKE '%AND status = ''pending''%'
  ),
  'buyer_fee_fn_exists', (
    SELECT EXISTS (
      SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname='public' AND p.proname='order_checkout_buyer_fee_amount'
    )
  ),
  'net_uses_buyer_fee', (
    SELECT pg_get_functiondef('public.order_net_revenue_amount(uuid)'::regprocedure)
      LIKE '%order_checkout_buyer_fee_amount%'
  ),
  'sample_mismatches_all_time', (
    SELECT COALESCE(jsonb_build_object(
      'paid_no_tx', (
        SELECT count(*) FROM orders o
        WHERE o.payment_status IN ('paid','completed')
          AND NOT EXISTS (SELECT 1 FROM transactions t WHERE t.order_id=o.id AND t.status='completed')
      ),
      'paid_no_payment', (
        SELECT count(*) FROM orders o
        WHERE o.payment_status IN ('paid','completed')
          AND NOT EXISTS (SELECT 1 FROM payments p WHERE p.order_id=o.id AND p.status='completed')
      ),
      'tx_completed_no_payment', (
        SELECT count(*) FROM transactions t
        WHERE t.status='completed' AND t.order_id IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM payments p
            WHERE p.transaction_id=t.id::text OR p.order_id=t.order_id
          )
      ),
      'fulfillment_gap', (
        SELECT count(*) FROM orders o
        WHERE o.payment_status IN ('paid','completed')
          AND COALESCE(o.metadata->>'post_payment_fulfillment_at','')=''
      )
    ), '{}'::jsonb)
  ),
  'recent_paid_orders', (
    SELECT COALESCE(jsonb_agg(row_to_json(x)), '[]'::jsonb)
    FROM (
      SELECT order_number, payment_status, status, payment_provider_used, total_amount, created_at
      FROM orders
      WHERE payment_status IN ('paid','completed')
      ORDER BY created_at DESC NULLS LAST
      LIMIT 5
    ) x
  )
) AS audit;
