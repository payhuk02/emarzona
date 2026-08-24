SELECT json_build_object(
  'return_type', (
    SELECT pg_get_function_result(p.oid)
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'validate_unified_promotion'
    LIMIT 1
  ),
  'jsonb_impl_exists', EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'validate_unified_promotion_jsonb'
  ),
  'gf100_4500', (
    SELECT row_to_json(r)
    FROM public.validate_unified_promotion(
      'GF100',
      'be244e65-0190-4742-ba04-7fc8a2514ed2'::uuid,
      NULL,
      NULL,
      NULL,
      4500,
      NULL,
      FALSE
    ) r
  ),
  'select_into_valid', (
    SELECT v.valid
    FROM public.validate_unified_promotion(
      'GF100',
      'be244e65-0190-4742-ba04-7fc8a2514ed2'::uuid,
      NULL, NULL, NULL, 4500, NULL, FALSE
    ) v
  ),
  'select_into_discount', (
    SELECT v.discount_amount
    FROM public.validate_unified_promotion(
      'GF100',
      'be244e65-0190-4742-ba04-7fc8a2514ed2'::uuid,
      NULL, NULL, NULL, 4500, NULL, FALSE
    ) v
  ),
  'payable_with_fee', public.apply_checkout_platform_fee(
    GREATEST(
      0,
      4500 - COALESCE(
        (
          SELECT v.discount_amount
          FROM public.validate_unified_promotion(
            'GF100',
            'be244e65-0190-4742-ba04-7fc8a2514ed2'::uuid,
            NULL, NULL, NULL, 4500, NULL, FALSE
          ) v
        ),
        0
      )
    ),
    'XOF'
  ),
  'payable_without_coupon', public.apply_checkout_platform_fee(4500, 'XOF')
) AS verify;
