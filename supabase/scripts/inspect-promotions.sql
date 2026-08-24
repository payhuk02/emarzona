SELECT json_build_object(
  'promotions_count', (SELECT count(*) FROM public.promotions),
  'product_promotions_count', (SELECT count(*) FROM public.product_promotions),
  'promotions_cols', (
    SELECT json_agg(column_name ORDER BY ordinal_position)
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'promotions'
  ),
  'product_promotions_cols', (
    SELECT json_agg(column_name ORDER BY ordinal_position)
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'product_promotions'
  ),
  'rpc_exists', (
    SELECT count(*) FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'validate_unified_promotion'
  ),
  'rpc_grants', (
    SELECT json_agg(json_build_object('grantee', grantee, 'privilege', privilege_type))
    FROM information_schema.routine_privileges
    WHERE routine_schema = 'public' AND routine_name = 'validate_unified_promotion'
  ),
  'recent_promotions', (
    SELECT json_agg(row_to_json(t))
    FROM (
      SELECT id, store_id, code, discount_type, discount_value, is_active, start_date, end_date, created_at
      FROM public.promotions
      ORDER BY created_at DESC
      LIMIT 5
    ) t
  ),
  'recent_product_promotions', (
    SELECT json_agg(row_to_json(t))
    FROM (
      SELECT id, store_id, code, name, discount_type, discount_value, applies_to, is_active, starts_at, ends_at, created_at
      FROM public.product_promotions
      ORDER BY created_at DESC
      LIMIT 5
    ) t
  )
) AS inspect;
