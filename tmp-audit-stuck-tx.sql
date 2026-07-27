SELECT jsonb_build_object(
  'processing_by_provider', (
    SELECT COALESCE(jsonb_object_agg(COALESCE(payment_provider,'null'), c), '{}'::jsonb)
    FROM (
      SELECT payment_provider, count(*)::int c
      FROM transactions WHERE status='processing' GROUP BY 1
    ) s
  ),
  'pending_by_provider', (
    SELECT COALESCE(jsonb_object_agg(COALESCE(payment_provider,'null'), c), '{}'::jsonb)
    FROM (
      SELECT payment_provider, count(*)::int c
      FROM transactions WHERE status='pending' GROUP BY 1
    ) s
  ),
  'processing_age', (
    SELECT jsonb_build_object(
      'lt_1h', count(*) FILTER (WHERE created_at > now() - interval '1 hour'),
      '1h_24h', count(*) FILTER (WHERE created_at <= now() - interval '1 hour' AND created_at > now() - interval '24 hours'),
      '1d_7d', count(*) FILTER (WHERE created_at <= now() - interval '24 hours' AND created_at > now() - interval '7 days'),
      'gt_7d', count(*) FILTER (WHERE created_at <= now() - interval '7 days')
    )
    FROM transactions WHERE status='processing'
  ),
  'processing_with_payment_id', (
    SELECT count(*) FROM transactions
    WHERE status='processing' AND COALESCE(payment_id,'') <> ''
  ),
  'processing_sample', (
    SELECT COALESCE(jsonb_agg(row_to_json(x)), '[]'::jsonb)
    FROM (
      SELECT id, payment_provider, amount, currency, payment_id IS NOT NULL AS has_token,
        left(COALESCE(payment_id,''), 12) AS token_prefix,
        order_id IS NOT NULL AS has_order,
        created_at, updated_at,
        metadata->>'purpose' AS purpose
      FROM transactions
      WHERE status='processing'
      ORDER BY updated_at DESC NULLS LAST
      LIMIT 12
    ) x
  ),
  'webhook_events_recent', (
    SELECT COALESCE(jsonb_agg(row_to_json(x)), '[]'::jsonb)
    FROM (
      SELECT provider, event_type, processing_error, created_at, orphan
      FROM (
        SELECT provider, event_type, processing_error, created_at,
          COALESCE((payload->>'orphan')::boolean, false) AS orphan
        FROM payment_webhook_events
        ORDER BY created_at DESC
        LIMIT 20
      ) q
    ) x
  ),
  'orphan_events', (
    SELECT count(*) FROM payment_webhook_events
    WHERE COALESCE(processing_error,'') ILIKE '%orphan%'
       OR event_type ILIKE '%orphan%'
       OR COALESCE(payload->>'orphan','') = 'true'
  ),
  'earnings_sample', (
    SELECT COALESCE(jsonb_agg(row_to_json(x)), '[]'::jsonb)
    FROM (
      SELECT store_id, total_revenue, total_platform_commission, total_withdrawn, available_balance, last_calculated_at
      FROM store_earnings
      ORDER BY available_balance DESC NULLS LAST
      LIMIT 5
    ) x
  )
) AS audit;
