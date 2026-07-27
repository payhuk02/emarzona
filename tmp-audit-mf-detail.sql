SELECT jsonb_build_object(
  'mf_processing_detail', (
    SELECT COALESCE(jsonb_agg(row_to_json(x)), '[]'::jsonb)
    FROM (
      SELECT t.id, t.amount, left(COALESCE(t.payment_id,''), 16) AS token_prefix,
        t.created_at, t.updated_at,
        o.order_number, o.payment_status AS order_payment_status, o.status AS order_status,
        o.total_amount AS order_total
      FROM transactions t
      LEFT JOIN orders o ON o.id = t.order_id
      WHERE t.status='processing' AND t.payment_provider='moneyfusion'
      ORDER BY t.created_at DESC
    ) x
  ),
  'geniuspay_processing_no_token', (
    SELECT count(*) FROM transactions
    WHERE status='processing' AND payment_provider='geniuspay'
      AND COALESCE(payment_id,'') = ''
  ),
  'geniuspay_processing_with_token', (
    SELECT count(*) FROM transactions
    WHERE status='processing' AND payment_provider='geniuspay'
      AND COALESCE(payment_id,'') <> ''
  ),
  'payment_webhook_events_total', (SELECT count(*) FROM payment_webhook_events),
  'payment_id_col_type', (
    SELECT data_type FROM information_schema.columns
    WHERE table_schema='public' AND table_name='transactions' AND column_name='payment_id'
  )
) AS audit;
