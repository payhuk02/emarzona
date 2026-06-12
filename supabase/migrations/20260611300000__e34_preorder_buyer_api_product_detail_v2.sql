-- Epic 3.2.4 / 3.2.5 (E34): API acheteur précommandes + estimation livraison publique
-- Date: 2026-06-11

-- ---------------------------------------------------------------------------
-- 1) Précommande active sur fiche produit (lecture publique)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_active_product_pre_order(
  p_product_id UUID,
  p_variant_id UUID DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_po RECORD;
  v_product_active BOOLEAN;
BEGIN
  SELECT p.is_active INTO v_product_active
  FROM public.products p
  WHERE p.id = p_product_id;

  IF NOT COALESCE(v_product_active, false) THEN
    RETURN NULL;
  END IF;

  SELECT po.* INTO v_po
  FROM public.pre_orders po
  WHERE po.product_id = p_product_id
    AND po.is_enabled = true
    AND po.status = 'active'
    AND (
      p_variant_id IS NULL
      OR po.variant_id IS NULL
      OR po.variant_id = p_variant_id
    )
  ORDER BY
    CASE WHEN po.variant_id IS NOT DISTINCT FROM p_variant_id THEN 0 ELSE 1 END,
    po.created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  RETURN jsonb_build_object(
    'id', v_po.id,
    'product_id', v_po.product_id,
    'variant_id', v_po.variant_id,
    'status', v_po.status,
    'expected_availability_date', v_po.expected_availability_date,
    'pre_order_limit', v_po.pre_order_limit,
    'current_pre_orders', COALESCE(v_po.current_pre_orders, 0),
    'reserved_quantity', COALESCE(v_po.reserved_quantity, 0),
    'deposit_required', COALESCE(v_po.deposit_required, false),
    'deposit_amount', v_po.deposit_amount,
    'deposit_percentage', v_po.deposit_percentage,
    'spots_remaining',
      CASE
        WHEN v_po.pre_order_limit IS NULL THEN NULL
        ELSE GREATEST(0, v_po.pre_order_limit - COALESCE(v_po.current_pre_orders, 0))
      END,
    'is_full',
      CASE
        WHEN v_po.pre_order_limit IS NULL THEN false
        ELSE COALESCE(v_po.current_pre_orders, 0) >= v_po.pre_order_limit
      END
  );
END;
$$;

COMMENT ON FUNCTION public.get_active_product_pre_order(UUID, UUID) IS
  'Retourne la précommande active d''un produit (fiche acheteur).';

GRANT EXECUTE ON FUNCTION public.get_active_product_pre_order(UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_active_product_pre_order(UUID, UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- 2) Inscription acheteur à une précommande
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.register_product_pre_order(
  p_pre_order_id UUID,
  p_quantity INTEGER DEFAULT 1
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID;
  v_po RECORD;
  v_user_email TEXT;
  v_user_name TEXT;
  v_customer_id UUID;
  v_existing UUID;
  v_registration_id UUID;
  v_qty INTEGER;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentification requise pour précommander';
  END IF;

  v_qty := GREATEST(1, COALESCE(p_quantity, 1));

  SELECT po.* INTO v_po
  FROM public.pre_orders po
  JOIN public.products p ON p.id = po.product_id
  WHERE po.id = p_pre_order_id
    AND po.is_enabled = true
    AND po.status = 'active'
    AND p.is_active = true
  FOR UPDATE OF po;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Précommande indisponible';
  END IF;

  IF v_po.pre_order_limit IS NOT NULL
     AND COALESCE(v_po.current_pre_orders, 0) + v_qty > v_po.pre_order_limit THEN
    RAISE EXCEPTION 'Limite de précommandes atteinte';
  END IF;

  SELECT au.email,
         COALESCE(
           au.raw_user_meta_data->>'full_name',
           au.raw_user_meta_data->>'name',
           split_part(au.email, '@', 1)
         )
  INTO v_user_email, v_user_name
  FROM auth.users au
  WHERE au.id = v_uid;

  IF v_user_email IS NULL THEN
    RAISE EXCEPTION 'Email utilisateur introuvable';
  END IF;

  SELECT c.id INTO v_customer_id
  FROM public.customers c
  WHERE c.store_id = v_po.store_id
    AND (c.email = v_user_email OR c.user_id = v_uid)
  LIMIT 1;

  IF v_customer_id IS NULL THEN
    INSERT INTO public.customers (store_id, email, name, full_name, user_id)
    VALUES (v_po.store_id, v_user_email, v_user_name, v_user_name, v_uid)
    RETURNING id INTO v_customer_id;
  ELSE
    UPDATE public.customers
    SET user_id = COALESCE(user_id, v_uid),
        full_name = COALESCE(NULLIF(TRIM(full_name), ''), v_user_name),
        name = COALESCE(NULLIF(TRIM(name), ''), v_user_name)
    WHERE id = v_customer_id;
  END IF;

  SELECT poc.id INTO v_existing
  FROM public.pre_order_customers poc
  WHERE poc.pre_order_id = p_pre_order_id
    AND poc.customer_id = v_customer_id
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'already_registered', true,
      'registration_id', v_existing,
      'pre_order_id', p_pre_order_id,
      'quantity', v_qty
    );
  END IF;

  INSERT INTO public.pre_order_customers (pre_order_id, customer_id, quantity)
  VALUES (p_pre_order_id, v_customer_id, v_qty)
  RETURNING id INTO v_registration_id;

  UPDATE public.pre_orders
  SET current_pre_orders = COALESCE(current_pre_orders, 0) + v_qty,
      reserved_quantity = COALESCE(reserved_quantity, 0) + v_qty,
      updated_at = NOW()
  WHERE id = p_pre_order_id;

  RETURN jsonb_build_object(
    'success', true,
    'already_registered', false,
    'registration_id', v_registration_id,
    'pre_order_id', p_pre_order_id,
    'quantity', v_qty
  );
END;
$$;

COMMENT ON FUNCTION public.register_product_pre_order(UUID, INTEGER) IS
  'Inscrit l''utilisateur connecté à une précommande produit.';

GRANT EXECUTE ON FUNCTION public.register_product_pre_order(UUID, INTEGER) TO authenticated;

-- ---------------------------------------------------------------------------
-- 3) Estimation livraison (tarifs actifs du store)
-- ---------------------------------------------------------------------------
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

COMMENT ON FUNCTION public.get_product_delivery_estimate(UUID) IS
  'Délai de livraison estimé depuis shipping_rates actifs du vendeur.';

GRANT EXECUTE ON FUNCTION public.get_product_delivery_estimate(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_product_delivery_estimate(UUID) TO authenticated;
