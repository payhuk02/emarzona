SELECT jsonb_build_object(
  'earnings', (
    SELECT COALESCE(jsonb_agg(to_jsonb(se)), '[]'::jsonb)
    FROM (
      SELECT store_id, total_revenue, total_withdrawn, available_balance,
             platform_commission_rate, total_platform_commission,
             last_calculated_at, updated_at
      FROM store_earnings
      WHERE store_id = '667f45e0-1402-47a8-976b-8114f517a967'
    ) se
  ),
  'paid_orders', (
    SELECT COALESCE(jsonb_agg(to_jsonb(o)), '[]'::jsonb)
    FROM (
      SELECT id, order_number, status, payment_status, total_amount, currency,
             metadata->>'platform_fee' AS platform_fee,
             metadata->>'platform_fee_rule' AS platform_fee_rule,
             created_at, updated_at
      FROM orders
      WHERE store_id = '667f45e0-1402-47a8-976b-8114f517a967'
        AND payment_status = 'paid'
      ORDER BY created_at DESC
      LIMIT 20
    ) o
  ),
  'order_items', (
    SELECT COALESCE(jsonb_agg(to_jsonb(oi)), '[]'::jsonb)
    FROM (
      SELECT oi.order_id, o.order_number, oi.product_type, oi.product_id,
             oi.quantity, oi.unit_price, oi.total_price, oi.product_name
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.store_id = '667f45e0-1402-47a8-976b-8114f517a967'
        AND o.payment_status = 'paid'
      ORDER BY o.created_at DESC
      LIMIT 40
    ) oi
  ),
  'stuck_tx', (
    SELECT COALESCE(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
    FROM (
      SELECT t.id, t.status, t.amount, t.order_id, o.order_number,
             o.payment_status AS order_pay, o.status AS order_status,
             t.payment_provider, t.payment_id, t.webhook_processed_at, t.created_at
      FROM transactions t
      LEFT JOIN orders o ON o.id = t.order_id
      WHERE t.payment_provider = 'moneyfusion'
        AND t.status IN ('processing','pending')
        AND t.created_at > now() - interval '3 days'
        AND (o.store_id = '667f45e0-1402-47a8-976b-8114f517a967'
             OR t.store_id = '667f45e0-1402-47a8-976b-8114f517a967')
      ORDER BY t.created_at DESC
      LIMIT 30
    ) t
  ),
  'recent_tx', (
    SELECT COALESCE(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
    FROM (
      SELECT t.id, t.status, t.amount, o.order_number, o.payment_status AS order_pay,
             o.status AS order_status, t.payment_id, t.webhook_processed_at,
             t.completed_at, t.created_at
      FROM transactions t
      LEFT JOIN orders o ON o.id = t.order_id
      WHERE t.payment_provider = 'moneyfusion'
        AND (o.store_id = '667f45e0-1402-47a8-976b-8114f517a967'
             OR t.store_id = '667f45e0-1402-47a8-976b-8114f517a967')
        AND t.created_at > now() - interval '3 days'
      ORDER BY t.created_at DESC
      LIMIT 25
    ) t
  ),
  'withdrawals', (
    SELECT COALESCE(jsonb_agg(to_jsonb(sw)), '[]'::jsonb)
    FROM (
      SELECT id, amount, status, payment_method, created_at
      FROM store_withdrawals
      WHERE store_id = '667f45e0-1402-47a8-976b-8114f517a967'
      ORDER BY created_at DESC
      LIMIT 10
    ) sw
  ),
  'fulfillment_check', (
    SELECT COALESCE(jsonb_agg(to_jsonb(f)), '[]'::jsonb)
    FROM (
      SELECT o.order_number, o.payment_status, o.status,
             (SELECT count(*) FROM digital_licenses dl WHERE dl.order_id = o.id) AS licenses,
             (SELECT count(*) FROM course_enrollments ce WHERE ce.order_id = o.id) AS enrollments,
             (SELECT count(*) FROM artist_fulfillment_events afe WHERE afe.order_id = o.id) AS artist_events,
             (SELECT count(*) FROM payments p WHERE p.order_id = o.id) AS payments
      FROM orders o
      WHERE o.store_id = '667f45e0-1402-47a8-976b-8114f517a967'
        AND o.payment_status = 'paid'
      ORDER BY o.created_at DESC
      LIMIT 15
    ) f
  )
) AS audit;
