-- Checkout validates product_promotions via validate_unified_promotion.
-- Seller UI at /dashboard/promotions still wrote to public.promotions (GF100, GF1000).
-- Copy those rows into product_promotions and make the RPC read both tables,
-- match the store, and accept discount_type/applies_to aliases.

INSERT INTO public.product_promotions (
  store_id,
  name,
  description,
  code,
  discount_type,
  discount_value,
  applies_to,
  product_ids,
  min_purchase_amount,
  max_uses,
  max_uses_per_customer,
  current_uses,
  starts_at,
  ends_at,
  is_active,
  is_automatic,
  original_promotion_id,
  migration_source,
  migration_note,
  is_platform_wide,
  customer_eligibility,
  created_at,
  updated_at
)
SELECT
  p.store_id,
  COALESCE(NULLIF(TRIM(p.description), ''), 'Promo ' || p.code),
  p.description,
  UPPER(TRIM(p.code)),
  CASE
    WHEN p.discount_type IN ('fixed', 'fixed_amount', 'flat') THEN 'fixed_amount'
    ELSE 'percentage'
  END,
  p.discount_value,
  CASE
    WHEN p.applicable_to_product_ids IS NOT NULL
      AND cardinality(p.applicable_to_product_ids) > 0
    THEN 'specific_products'
    ELSE 'all_products'
  END,
  p.applicable_to_product_ids,
  COALESCE(p.min_purchase_amount, 0),
  p.max_uses,
  p.max_uses_per_user,
  COALESCE(p.used_count, 0),
  COALESCE(p.start_date, p.created_at, NOW()),
  p.end_date,
  COALESCE(p.is_active, TRUE),
  FALSE,
  p.id,
  'promotions',
  'Sync checkout ' || NOW()::TEXT,
  COALESCE(p.is_platform_wide, FALSE),
  p.customer_eligibility,
  p.created_at,
  p.updated_at
FROM public.promotions p
WHERE NOT EXISTS (
  SELECT 1
  FROM public.product_promotions pp
  WHERE pp.original_promotion_id = p.id
     OR (pp.store_id = p.store_id AND UPPER(TRIM(pp.code)) = UPPER(TRIM(p.code)))
);

CREATE OR REPLACE FUNCTION public.validate_unified_promotion(
  p_code TEXT,
  p_store_id UUID DEFAULT NULL,
  p_product_ids UUID[] DEFAULT NULL,
  p_category_ids UUID[] DEFAULT NULL,
  p_collection_ids UUID[] DEFAULT NULL,
  p_order_amount NUMERIC DEFAULT 0,
  p_customer_id UUID DEFAULT NULL,
  p_is_first_order BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_promotion RECORD;
  v_discount_amount NUMERIC := 0;
  v_now TIMESTAMPTZ := NOW();
  v_applies BOOLEAN := FALSE;
  v_discount_type TEXT;
  v_applies_to TEXT;
  v_usage_count INTEGER;
BEGIN
  IF p_code IS NULL OR TRIM(p_code) = '' THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Code promo requis', 'error_message', 'Code promo requis');
  END IF;

  SELECT *
  INTO v_promotion
  FROM public.product_promotions
  WHERE code = UPPER(TRIM(p_code))
    AND COALESCE(is_active, FALSE) = TRUE
    AND (p_store_id IS NULL OR store_id = p_store_id OR COALESCE(is_platform_wide, FALSE))
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    SELECT
      p.id,
      p.store_id,
      COALESCE(NULLIF(TRIM(p.description), ''), 'Promo ' || p.code) AS name,
      p.description,
      p.code,
      CASE
        WHEN p.discount_type IN ('fixed', 'fixed_amount', 'flat') THEN 'fixed_amount'
        ELSE 'percentage'
      END AS discount_type,
      p.discount_value,
      CASE
        WHEN p.applicable_to_product_ids IS NOT NULL
          AND cardinality(p.applicable_to_product_ids) > 0
        THEN 'specific_products'
        ELSE 'all_products'
      END AS applies_to,
      p.applicable_to_product_ids AS product_ids,
      NULL::UUID[] AS category_ids,
      NULL::UUID[] AS collection_ids,
      COALESCE(p.min_purchase_amount, 0) AS min_purchase_amount,
      p.max_uses,
      p.max_uses_per_user AS max_uses_per_customer,
      COALESCE(p.used_count, 0) AS current_uses,
      COALESCE(p.start_date, p.created_at) AS starts_at,
      p.end_date AS ends_at,
      p.is_active,
      FALSE AS is_automatic,
      NULL::NUMERIC AS max_discount_amount,
      COALESCE(p.is_platform_wide, FALSE) AS is_platform_wide,
      p.customer_eligibility,
      COALESCE(p.customer_eligibility = 'new_customers', FALSE) AS first_time_buyers_only
    INTO v_promotion
    FROM public.promotions p
    WHERE p.code = UPPER(TRIM(p_code))
      AND COALESCE(p.is_active, FALSE) = TRUE
      AND (p_store_id IS NULL OR p.store_id = p_store_id OR COALESCE(p.is_platform_wide, FALSE))
    ORDER BY p.created_at DESC
    LIMIT 1;
  END IF;

  IF NOT FOUND OR v_promotion.id IS NULL THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Code promo invalide ou expiré',
      'error_message', 'Code promo invalide ou expiré'
    );
  END IF;

  IF v_promotion.starts_at IS NOT NULL AND v_now < v_promotion.starts_at THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Ce code promo n''est pas encore actif',
      'error_message', 'Ce code promo n''est pas encore actif'
    );
  END IF;

  IF v_promotion.ends_at IS NOT NULL AND v_now > v_promotion.ends_at THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Ce code promo a expiré',
      'error_message', 'Ce code promo a expiré'
    );
  END IF;

  IF v_promotion.max_uses IS NOT NULL AND COALESCE(v_promotion.current_uses, 0) >= v_promotion.max_uses THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Ce code promo a atteint sa limite d''utilisation',
      'error_message', 'Ce code promo a atteint sa limite d''utilisation'
    );
  END IF;

  IF p_customer_id IS NOT NULL AND v_promotion.max_uses_per_customer IS NOT NULL THEN
    SELECT COUNT(*) INTO v_usage_count
    FROM public.promotion_usage
    WHERE promotion_id = v_promotion.id
      AND customer_id = p_customer_id;

    IF v_usage_count >= v_promotion.max_uses_per_customer THEN
      RETURN jsonb_build_object(
        'valid', false,
        'error', 'Vous avez déjà utilisé ce code promo le maximum de fois autorisé',
        'error_message', 'Vous avez déjà utilisé ce code promo le maximum de fois autorisé'
      );
    END IF;
  END IF;

  IF COALESCE(p_order_amount, 0) < COALESCE(v_promotion.min_purchase_amount, 0) THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', format('Montant minimum requis: %s XOF', v_promotion.min_purchase_amount),
      'error_message', format('Montant minimum requis: %s XOF', v_promotion.min_purchase_amount),
      'min_amount', v_promotion.min_purchase_amount
    );
  END IF;

  IF COALESCE(v_promotion.first_time_buyers_only, FALSE) AND NOT COALESCE(p_is_first_order, FALSE) THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Ce code promo est réservé aux premiers achats',
      'error_message', 'Ce code promo est réservé aux premiers achats'
    );
  END IF;

  IF v_promotion.customer_eligibility IN ('new_customers', 'new') AND NOT COALESCE(p_is_first_order, FALSE) THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Ce code promo est réservé aux nouveaux clients',
      'error_message', 'Ce code promo est réservé aux nouveaux clients'
    );
  END IF;

  v_applies_to := COALESCE(v_promotion.applies_to, 'all_products');
  IF p_product_ids IS NOT NULL AND cardinality(p_product_ids) > 0 THEN
    IF v_applies_to IN ('all_products', 'all', 'entire_store') THEN
      v_applies := TRUE;
    ELSIF v_applies_to IN ('specific_products', 'products') AND v_promotion.product_ids IS NOT NULL THEN
      v_applies := (p_product_ids && v_promotion.product_ids);
    ELSIF v_applies_to IN ('categories', 'category') AND v_promotion.category_ids IS NOT NULL THEN
      IF p_category_ids IS NOT NULL AND cardinality(p_category_ids) > 0 THEN
        v_applies := (p_category_ids && v_promotion.category_ids);
      ELSE
        SELECT EXISTS (
          SELECT 1 FROM public.products prod
          WHERE prod.id = ANY (p_product_ids)
            AND prod.category_id = ANY (v_promotion.category_ids)
        ) INTO v_applies;
      END IF;
    ELSIF v_applies_to IN ('collections', 'collection') AND v_promotion.collection_ids IS NOT NULL THEN
      IF p_collection_ids IS NOT NULL AND cardinality(p_collection_ids) > 0 THEN
        v_applies := (p_collection_ids && v_promotion.collection_ids);
      ELSE
        v_applies := FALSE;
      END IF;
    ELSE
      v_applies := FALSE;
    END IF;

    IF NOT v_applies THEN
      RETURN jsonb_build_object(
        'valid', false,
        'error', 'Ce code promo ne s''applique pas aux produits de votre panier',
        'error_message', 'Ce code promo ne s''applique pas aux produits de votre panier'
      );
    END IF;
  END IF;

  v_discount_type := COALESCE(v_promotion.discount_type, 'percentage');
  IF v_discount_type IN ('percentage', 'percent', '%') THEN
    v_discount_amount := (COALESCE(p_order_amount, 0) * v_promotion.discount_value) / 100;
    IF v_promotion.max_discount_amount IS NOT NULL AND v_discount_amount > v_promotion.max_discount_amount THEN
      v_discount_amount := v_promotion.max_discount_amount;
    END IF;
  ELSIF v_discount_type IN ('fixed_amount', 'fixed', 'flat') THEN
    v_discount_amount := v_promotion.discount_value;
  ELSE
    v_discount_amount := 0;
  END IF;

  IF v_discount_amount > COALESCE(p_order_amount, 0) THEN
    v_discount_amount := COALESCE(p_order_amount, 0);
  END IF;

  IF v_discount_amount <= 0 THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Ce code promo n''offre aucune réduction sur cette commande',
      'error_message', 'Ce code promo n''offre aucune réduction sur cette commande'
    );
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'promotion_id', v_promotion.id,
    'code', v_promotion.code,
    'name', v_promotion.name,
    'discount_type', v_discount_type,
    'discount_value', v_promotion.discount_value,
    'discount_amount', v_discount_amount,
    'order_total_before', p_order_amount,
    'order_total_after', COALESCE(p_order_amount, 0) - v_discount_amount
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_unified_promotion(TEXT, UUID, UUID[], UUID[], UUID[], NUMERIC, UUID, BOOLEAN)
  TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
