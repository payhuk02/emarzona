-- Hotfix: physical_inventory_sellable(p_row physical_product_inventory) ne accepte pas RECORD

BEGIN;

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
  v_inv public.physical_product_inventory%ROWTYPE;
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
    SELECT pv.is_available
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

    SELECT ppi.*
    INTO v_inv
    FROM public.physical_product_inventory ppi
    WHERE ppi.variant_id = p_variant_id
      AND COALESCE(ppi.track_inventory, true) = true
    ORDER BY public.physical_inventory_sellable(ppi) DESC, ppi.created_at ASC
    LIMIT 1;

    IF FOUND THEN
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
    END IF;

    SELECT pv.quantity
    INTO v_avail
    FROM public.physical_product_variants pv
    WHERE pv.id = p_variant_id;

    IF COALESCE(v_avail, 0) = -1 THEN
      RETURN jsonb_build_object('available', true, 'reason', 'unlimited');
    END IF;

    IF COALESCE(v_avail, 0) < v_need THEN
      RETURN jsonb_build_object(
        'available', false,
        'reason', 'insufficient_stock',
        'available_quantity', GREATEST(COALESCE(v_avail, 0), 0)
      );
    END IF;

    RETURN jsonb_build_object(
      'available', true,
      'available_quantity', COALESCE(v_avail, 0)
    );
  END IF;

  SELECT ppi.*
  INTO v_inv
  FROM public.physical_product_inventory ppi
  WHERE ppi.physical_product_id = v_pp.id
    AND ppi.variant_id IS NULL
    AND COALESCE(ppi.track_inventory, true) = true
  ORDER BY public.physical_inventory_sellable(ppi) DESC, ppi.created_at ASC
  LIMIT 1;

  IF NOT FOUND THEN
    SELECT ppi.*
    INTO v_inv
    FROM public.physical_product_inventory ppi
    INNER JOIN public.physical_products pp ON pp.id = v_pp.id
    WHERE ppi.product_id = pp.product_id
      AND ppi.variant_id IS NULL
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

CREATE OR REPLACE FUNCTION public.reserve_physical_inventory_for_order(p_order_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item RECORD;
  inv public.physical_product_inventory%ROWTYPE;
  v_need INTEGER;
  v_avail INTEGER;
  v_meta JSONB;
BEGIN
  FOR item IN
    SELECT
      oi.id,
      oi.physical_product_id,
      oi.variant_id,
      oi.quantity,
      oi.item_metadata
    FROM public.order_items oi
    WHERE oi.order_id = p_order_id
      AND oi.product_type = 'physical'
  LOOP
    IF item.physical_product_id IS NULL THEN
      RAISE EXCEPTION 'physical_product_id manquant pour order_item %', item.id;
    END IF;

    IF COALESCE((item.item_metadata->>'inventory_reserved')::boolean, false) IS TRUE THEN
      CONTINUE;
    END IF;

    v_need := GREATEST(COALESCE(item.quantity, 1), 1);

    IF item.variant_id IS NOT NULL THEN
      SELECT ppi.*
      INTO inv
      FROM public.physical_product_inventory ppi
      WHERE ppi.variant_id = item.variant_id
        AND COALESCE(ppi.track_inventory, true) = true
      ORDER BY public.physical_inventory_sellable(ppi) DESC, ppi.created_at ASC
      LIMIT 1
      FOR UPDATE;
    ELSE
      SELECT ppi.*
      INTO inv
      FROM public.physical_product_inventory ppi
      WHERE ppi.physical_product_id = item.physical_product_id
        AND ppi.variant_id IS NULL
        AND COALESCE(ppi.track_inventory, true) = true
      ORDER BY public.physical_inventory_sellable(ppi) DESC, ppi.created_at ASC
      LIMIT 1
      FOR UPDATE;

      IF NOT FOUND THEN
        SELECT ppi.*
        INTO inv
        FROM public.physical_product_inventory ppi
        INNER JOIN public.physical_products pp ON pp.id = item.physical_product_id
        WHERE ppi.product_id = pp.product_id
          AND ppi.variant_id IS NULL
          AND COALESCE(ppi.track_inventory, true) = true
        ORDER BY public.physical_inventory_sellable(ppi) DESC, ppi.created_at ASC
        LIMIT 1
        FOR UPDATE;
      END IF;
    END IF;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Aucun inventaire suivi pour le produit physique % (variante %)',
        item.physical_product_id, item.variant_id;
    END IF;

    v_avail := public.physical_inventory_sellable(inv);

    IF v_avail < v_need THEN
      RAISE EXCEPTION 'Stock insuffisant (demandé: %, disponible: %)', v_need, v_avail;
    END IF;

    UPDATE public.physical_product_inventory
    SET
      reserved_quantity = COALESCE(reserved_quantity, 0) + v_need,
      quantity_reserved = COALESCE(quantity_reserved, reserved_quantity, 0) + v_need,
      updated_at = now()
    WHERE id = inv.id;

    v_meta := COALESCE(item.item_metadata, '{}'::jsonb)
      || jsonb_build_object(
        'inventory_id', inv.id,
        'inventory_reserved', true,
        'inventory_reservation_qty', v_need,
        'inventory_location', COALESCE(inv.location_name, inv.location),
        'variant_id', item.variant_id
      );

    UPDATE public.order_items
    SET item_metadata = v_meta
    WHERE id = item.id;
  END LOOP;
END;
$$;

COMMIT;
