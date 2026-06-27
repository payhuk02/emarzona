-- Phase 0: validation stock panier (lecture seule, sans réservation)

CREATE OR REPLACE FUNCTION public.check_physical_stock_availability(
  p_product_id UUID,
  p_variant_id UUID DEFAULT NULL,
  p_quantity INTEGER DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pp RECORD;
  v_need INTEGER;
  v_avail INTEGER;
  v_inv RECORD;
  v_variant RECORD;
BEGIN
  v_need := GREATEST(COALESCE(p_quantity, 1), 1);

  SELECT
    pp.id,
    pp.track_inventory,
    pp.inventory_policy,
    pp.continue_selling_when_out_of_stock
  INTO v_pp
  FROM public.physical_products pp
  WHERE pp.product_id = p_product_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('available', true, 'reason', 'not_physical');
  END IF;

  IF COALESCE(v_pp.track_inventory, true) = false THEN
    RETURN jsonb_build_object('available', true, 'reason', 'not_tracked');
  END IF;

  IF COALESCE(v_pp.inventory_policy, 'deny') = 'continue'
     OR COALESCE(v_pp.continue_selling_when_out_of_stock, false) = true THEN
    RETURN jsonb_build_object('available', true, 'reason', 'continue_selling');
  END IF;

  IF p_variant_id IS NOT NULL THEN
    SELECT pv.quantity, pv.is_available
    INTO v_variant
    FROM public.physical_product_variants pv
    WHERE pv.id = p_variant_id;

    IF NOT FOUND THEN
      RETURN jsonb_build_object(
        'available', false,
        'reason', 'variant_not_found',
        'available_quantity', 0
      );
    END IF;

    IF COALESCE(v_variant.is_available, true) = false THEN
      RETURN jsonb_build_object(
        'available', false,
        'reason', 'variant_unavailable',
        'available_quantity', 0
      );
    END IF;

    v_avail := COALESCE(v_variant.quantity, 0);

    IF v_avail = -1 THEN
      RETURN jsonb_build_object('available', true, 'reason', 'unlimited');
    END IF;

    IF v_avail < v_need THEN
      RETURN jsonb_build_object(
        'available', false,
        'reason', 'insufficient_stock',
        'available_quantity', GREATEST(v_avail, 0)
      );
    END IF;

    RETURN jsonb_build_object(
      'available', true,
      'available_quantity', v_avail
    );
  END IF;

  SELECT ppi.*
  INTO v_inv
  FROM public.physical_product_inventory ppi
  WHERE ppi.physical_product_id = v_pp.id
    AND COALESCE(ppi.track_inventory, true) = true
  ORDER BY public.physical_inventory_sellable(ppi) DESC, ppi.created_at ASC
  LIMIT 1;

  IF NOT FOUND THEN
    SELECT ppi.*
    INTO v_inv
    FROM public.physical_product_inventory ppi
    INNER JOIN public.physical_products pp ON pp.id = v_pp.id
    WHERE ppi.product_id = pp.product_id
      AND COALESCE(ppi.track_inventory, true) = true
    ORDER BY public.physical_inventory_sellable(ppi) DESC, ppi.created_at ASC
    LIMIT 1;
  END IF;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'available', false,
      'reason', 'no_inventory_row',
      'available_quantity', 0
    );
  END IF;

  v_avail := public.physical_inventory_sellable(v_inv);

  IF v_avail < v_need THEN
    RETURN jsonb_build_object(
      'available', false,
      'reason', 'insufficient_stock',
      'available_quantity', GREATEST(v_avail, 0)
    );
  END IF;

  RETURN jsonb_build_object(
    'available', true,
    'available_quantity', v_avail
  );
END;
$$;

REVOKE ALL ON FUNCTION public.check_physical_stock_availability(UUID, UUID, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_physical_stock_availability(UUID, UUID, INTEGER)
  TO authenticated, anon, service_role;

COMMENT ON FUNCTION public.check_physical_stock_availability(UUID, UUID, INTEGER) IS
  'Vérifie la disponibilité stock (sans réserver) pour ajout panier produits physiques.';
