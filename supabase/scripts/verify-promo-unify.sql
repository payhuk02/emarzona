SELECT json_build_object(
  'copied', (
    SELECT json_agg(json_build_object(
      'code', code,
      'store_id', store_id,
      'discount_type', discount_type,
      'discount_value', discount_value,
      'applies_to', applies_to,
      'is_active', is_active,
      'starts_at', starts_at,
      'ends_at', ends_at
    ))
    FROM public.product_promotions
    WHERE code IN ('GF100', 'GF1000')
  ),
  'rpc_gf100', public.validate_unified_promotion(
    'GF100',
    'be244e65-0190-4742-ba04-7fc8a2514ed2'::uuid,
    NULL,
    NULL,
    NULL,
    10000,
    NULL,
    FALSE
  )
) AS verify;
