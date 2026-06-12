-- E34 hotfix: colonne shipping_zone_id (pas zone_id)
CREATE OR REPLACE FUNCTION public.get_product_delivery_estimate(p_product_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_store_id UUID;
  v_min_days INTEGER;
  v_max_days INTEGER;
BEGIN
  SELECT p.store_id INTO v_store_id
  FROM public.products p
  WHERE p.id = p_product_id
    AND p.is_active = true;

  IF v_store_id IS NULL THEN
    RETURN jsonb_build_object(
      'estimated_days_min', 3,
      'estimated_days_max', 7,
      'source', 'default'
    );
  END IF;

  SELECT
    MIN(sr.estimated_days_min),
    MAX(sr.estimated_days_max)
  INTO v_min_days, v_max_days
  FROM public.shipping_zones sz
  JOIN public.shipping_rates sr ON sr.shipping_zone_id = sz.id
  WHERE sz.store_id = v_store_id
    AND sz.is_active = true
    AND sr.is_active = true
    AND sr.estimated_days_min IS NOT NULL
    AND sr.estimated_days_max IS NOT NULL;

  IF v_min_days IS NULL OR v_max_days IS NULL THEN
    RETURN jsonb_build_object(
      'estimated_days_min', 3,
      'estimated_days_max', 7,
      'source', 'default'
    );
  END IF;

  RETURN jsonb_build_object(
    'estimated_days_min', v_min_days,
    'estimated_days_max', v_max_days,
    'source', 'store_rates'
  );
END;
$$;
