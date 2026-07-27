SELECT jsonb_build_object(
  'invoice_customer_fk', (
    SELECT jsonb_agg(jsonb_build_object('conname', c.conname, 'confrelid', c.confrelid::regclass::text, 'pg_get', pg_get_constraintdef(c.oid)))
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public' AND t.relname = 'invoices' AND c.contype = 'f'
      AND pg_get_constraintdef(c.oid) ILIKE '%customer_id%'
  ),
  'create_invoice_src_snippet', (
    SELECT left(pg_get_functiondef('public.create_invoice_from_order(uuid)'::regprocedure), 1200)
  ),
  'recent_mf_failed', (
    SELECT COALESCE(jsonb_agg(row_to_json(x)), '[]'::jsonb)
    FROM (
      SELECT id, amount, status, created_at,
        metadata->'moneyfusion_error' AS mf_error,
        metadata->'moneyfusion_response' AS mf_resp,
        left(COALESCE(metadata->>'moneyfusion_checkout_url',''), 40) AS url
      FROM transactions
      WHERE payment_provider = 'moneyfusion'
        AND created_at > now() - interval '2 hours'
      ORDER BY created_at DESC
      LIMIT 8
    ) x
  )
) AS audit;
