-- Epic 3.2 E34: précommande acheteur + estimation livraison
DO $$
BEGIN
  ASSERT EXISTS (
    SELECT 1 FROM pg_proc p
    WHERE p.proname = 'get_active_product_pre_order'
  );
  ASSERT EXISTS (
    SELECT 1 FROM pg_proc p
    WHERE p.proname = 'register_product_pre_order'
  );
  ASSERT EXISTS (
    SELECT 1 FROM pg_proc p
    WHERE p.proname = 'get_product_delivery_estimate'
  );
  RAISE NOTICE '✓ E34: preorder + delivery RPCs exist';
END $$;

DO $$
DECLARE
  v_estimate jsonb;
  v_product_id UUID;
BEGIN
  SELECT p.id INTO v_product_id
  FROM public.products p
  WHERE p.product_type = 'physical'
    AND p.is_active = true
  LIMIT 1;

  IF v_product_id IS NULL THEN
    RAISE NOTICE '⊘ E34 delivery estimate skipped: no active physical product';
    RETURN;
  END IF;

  v_estimate := public.get_product_delivery_estimate(v_product_id);
  ASSERT v_estimate ? 'estimated_days_min';
  ASSERT v_estimate ? 'estimated_days_max';
  ASSERT (v_estimate ->> 'estimated_days_min')::int >= 1;
  RAISE NOTICE '✓ E34: get_product_delivery_estimate returns min/max days';
END $$;

DO $$
DECLARE
  v_pre_order jsonb;
  v_product_id UUID;
BEGIN
  SELECT po.product_id INTO v_product_id
  FROM public.pre_orders po
  WHERE po.is_enabled = true
    AND po.status = 'active'
  LIMIT 1;

  IF v_product_id IS NULL THEN
    RAISE NOTICE '⊘ E34 active pre-order skipped: none in DB';
    RETURN;
  END IF;

  v_pre_order := public.get_active_product_pre_order(v_product_id);
  ASSERT v_pre_order IS NOT NULL;
  ASSERT v_pre_order ? 'id';
  ASSERT v_pre_order ? 'is_full';
  RAISE NOTICE '✓ E34: get_active_product_pre_order payload OK';
END $$;
