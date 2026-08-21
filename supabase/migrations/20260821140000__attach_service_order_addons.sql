-- Attach digital/physical addons to a pending service order and rebase total + platform fee.

CREATE OR REPLACE FUNCTION public.attach_service_order_addons(
  p_order_id UUID,
  p_service_product_id UUID,
  p_addon_product_ids UUID[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_service public.service_products%ROWTYPE;
  v_addon RECORD;
  v_addon_sum NUMERIC(12, 2) := 0;
  v_old_subtotal NUMERIC(12, 2) := 0;
  v_new_subtotal NUMERIC(12, 2) := 0;
  v_new_total NUMERIC(12, 2) := 0;
  v_platform_fee NUMERIC(12, 2) := 0;
  v_ids UUID[];
  v_count INTEGER := 0;
BEGIN
  IF p_addon_product_ids IS NULL OR cardinality(p_addon_product_ids) = 0 THEN
    RETURN jsonb_build_object('attached', 0, 'total_amount', NULL);
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Commande introuvable';
  END IF;
  IF COALESCE(v_order.payment_status, 'pending') NOT IN ('pending', 'unpaid') THEN
    RAISE EXCEPTION 'Commande déjà payée';
  END IF;

  SELECT * INTO v_service FROM public.service_products WHERE id = p_service_product_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Service introuvable';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.order_items oi
    WHERE oi.order_id = p_order_id
      AND oi.product_type = 'service'
      AND oi.service_product_id = p_service_product_id
  ) THEN
    RAISE EXCEPTION 'Commande service invalide';
  END IF;

  SELECT ARRAY(SELECT DISTINCT x FROM unnest(p_addon_product_ids) AS t(x) WHERE x IS NOT NULL)
  INTO v_ids;

  FOR v_addon IN
    SELECT
      spa.addon_product_id,
      spa.quantity,
      spa.is_required,
      p.name,
      p.product_type,
      COALESCE(NULLIF(p.promotional_price, 0), p.price, 0)::NUMERIC(12, 2) AS unit_price,
      p.is_active
    FROM public.service_product_addons spa
    JOIN public.products p ON p.id = spa.addon_product_id
    WHERE spa.service_product_id = p_service_product_id
      AND spa.addon_product_id = ANY (v_ids)
  LOOP
    IF v_addon.is_active IS NOT TRUE THEN
      RAISE EXCEPTION 'Produit complémentaire inactif';
    END IF;
    IF v_addon.product_type NOT IN ('digital', 'physical') THEN
      RAISE EXCEPTION 'Type de produit complémentaire invalide';
    END IF;

    INSERT INTO public.order_items (
      order_id, product_id, product_type, product_name, quantity, unit_price, total_price, item_metadata
    ) VALUES (
      p_order_id,
      v_addon.addon_product_id,
      v_addon.product_type,
      v_addon.name,
      GREATEST(1, COALESCE(v_addon.quantity, 1)),
      v_addon.unit_price,
      v_addon.unit_price * GREATEST(1, COALESCE(v_addon.quantity, 1)),
      jsonb_build_object(
        'is_service_addon', true,
        'linked_service_product_id', p_service_product_id
      )
    );

    v_addon_sum := v_addon_sum + (v_addon.unit_price * GREATEST(1, COALESCE(v_addon.quantity, 1)));
    v_count := v_count + 1;
  END LOOP;

  IF v_count IS DISTINCT FROM cardinality(v_ids) THEN
    RAISE EXCEPTION 'Un ou plusieurs produits complémentaires sont invalides';
  END IF;

  BEGIN
    v_old_subtotal := COALESCE((v_order.metadata->>'subtotal')::NUMERIC, v_order.total_amount, 0);
  EXCEPTION WHEN OTHERS THEN
    v_old_subtotal := COALESCE(v_order.total_amount, 0);
  END;

  v_new_subtotal := GREATEST(0, v_old_subtotal + v_addon_sum);
  v_new_total := public.apply_checkout_platform_fee(v_new_subtotal, COALESCE(v_order.currency, 'XOF'));
  v_platform_fee := GREATEST(0, v_new_total - v_new_subtotal);

  UPDATE public.orders
  SET
    total_amount = v_new_total,
    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
      'subtotal', v_new_subtotal,
      'platform_fee', v_platform_fee,
      'addon_subtotal', v_addon_sum
    ),
    updated_at = now()
  WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'attached', v_count,
    'addon_subtotal', v_addon_sum,
    'total_amount', v_new_total
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.attach_service_order_addons(UUID, UUID, UUID[])
  TO anon, authenticated, service_role;
