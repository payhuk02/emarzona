-- Aligne le montant PSP avec les jalons projet (invité + addons + prix fixe).

BEGIN;

CREATE OR REPLACE FUNCTION public.apply_service_project_milestones_on_order(
  p_order_id UUID,
  p_total_amount NUMERIC,
  p_payment_options JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_opts JSONB;
  v_product_opts JSONB;
  v_product_id UUID;
  v_milestones JSONB;
  v_row JSONB;
  v_idx INTEGER;
  v_count INTEGER;
  v_total NUMERIC;
  v_allocated NUMERIC := 0;
  v_pct NUMERIC;
  v_amount NUMERIC;
  v_trigger TEXT;
  v_label TEXT;
  v_due_now NUMERIC := 0;
  v_inserted INTEGER := 0;
  v_milestones_enabled BOOLEAN := false;
BEGIN
  IF p_order_id IS NULL THEN
    RETURN jsonb_build_object('applied', false, 'reason', 'missing_order_id');
  END IF;

  v_opts := COALESCE(p_payment_options, '{}'::jsonb);

  v_milestones_enabled := COALESCE(
    (v_opts->>'use_project_milestones')::boolean,
    (v_opts->'use_project_milestones')::text = 'true',
    false
  );

  IF COALESCE(v_opts->>'payment_type', '') IS DISTINCT FROM 'delivery_secured'
     OR v_milestones_enabled IS NOT TRUE
  THEN
    SELECT oi.product_id
    INTO v_product_id
    FROM public.order_items oi
    WHERE oi.order_id = p_order_id AND oi.product_type = 'service'
    LIMIT 1;

    IF v_product_id IS NOT NULL THEN
      SELECT p.payment_options INTO v_product_opts
      FROM public.products p
      WHERE p.id = v_product_id;

      IF v_product_opts IS NOT NULL THEN
        v_milestones_enabled := COALESCE(
          (v_product_opts->>'use_project_milestones')::boolean,
          (v_product_opts->'use_project_milestones')::text = 'true',
          false
        );
        IF COALESCE(v_product_opts->>'payment_type', '') = 'delivery_secured'
          AND v_milestones_enabled IS TRUE
        THEN
          v_opts := v_product_opts;
        END IF;
      END IF;
    END IF;
  END IF;

  IF COALESCE(v_opts->>'payment_type', '') IS DISTINCT FROM 'delivery_secured' THEN
    RETURN jsonb_build_object('applied', false, 'reason', 'not_delivery_secured');
  END IF;

  v_milestones_enabled := COALESCE(
    (v_opts->>'use_project_milestones')::boolean,
    (v_opts->'use_project_milestones')::text = 'true',
    false
  );

  IF v_milestones_enabled IS NOT TRUE THEN
    RETURN jsonb_build_object('applied', false, 'reason', 'milestones_disabled');
  END IF;

  v_milestones := v_opts->'project_milestones';
  IF v_milestones IS NULL OR jsonb_typeof(v_milestones) <> 'array' OR jsonb_array_length(v_milestones) < 2 THEN
    v_milestones := '[
      {"label":"Démarrage","percentage":50,"trigger":"order_placed"},
      {"label":"Livraison","percentage":50,"trigger":"delivery_approved"}
    ]'::jsonb;
  END IF;

  DELETE FROM public.service_order_milestones WHERE order_id = p_order_id;

  v_total := GREATEST(0, ROUND(COALESCE(p_total_amount, 0), 2));
  v_count := jsonb_array_length(v_milestones);

  FOR v_idx IN 0..(v_count - 1) LOOP
    v_row := v_milestones->v_idx;
    v_pct := COALESCE((v_row->>'percentage')::NUMERIC, 0);
    v_label := COALESCE(NULLIF(trim(v_row->>'label'), ''), 'Jalon ' || (v_idx + 1)::text);
    v_trigger := COALESCE(NULLIF(v_row->>'trigger', ''), 'order_placed');
    IF v_trigger NOT IN ('order_placed', 'delivery_approved', 'manual') THEN
      v_trigger := 'order_placed';
    END IF;

    IF v_idx = v_count - 1 THEN
      v_amount := GREATEST(0, v_total - v_allocated);
    ELSE
      v_amount := ROUND((v_total * v_pct) / 100.0, 2);
      v_allocated := v_allocated + v_amount;
    END IF;

    IF v_trigger = 'order_placed' THEN
      v_due_now := v_due_now + v_amount;
    END IF;

    INSERT INTO public.service_order_milestones (
      order_id, sort_order, label, percentage, amount, trigger_type, status
    ) VALUES (
      p_order_id,
      v_idx,
      v_label,
      v_pct,
      v_amount,
      v_trigger,
      CASE WHEN v_trigger = 'order_placed' THEN 'awaiting_payment' ELSE 'pending' END
    );

    v_inserted := v_inserted + 1;
  END LOOP;

  UPDATE public.orders
  SET
    payment_type = 'delivery_secured',
    percentage_paid = v_due_now,
    remaining_amount = GREATEST(0, v_total - v_due_now),
    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
      'project_milestones_enabled', true,
      'project_milestone_count', v_inserted
    ),
    updated_at = now()
  WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'applied', true,
    'inserted', v_inserted,
    'due_now', v_due_now,
    'remaining', GREATEST(0, v_total - v_due_now)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_service_order_milestone_payment(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_product_id UUID;
  v_payment_options JSONB;
BEGIN
  IF p_order_id IS NULL THEN
    RETURN jsonb_build_object('applied', false, 'reason', 'missing_order_id');
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('applied', false, 'reason', 'order_not_found');
  END IF;

  SELECT oi.product_id
  INTO v_product_id
  FROM public.order_items oi
  WHERE oi.order_id = p_order_id AND oi.product_type = 'service'
  LIMIT 1;

  IF v_product_id IS NULL THEN
    RETURN jsonb_build_object('applied', false, 'reason', 'not_service_order');
  END IF;

  SELECT p.payment_options INTO v_payment_options
  FROM public.products p
  WHERE p.id = v_product_id;

  RETURN public.apply_service_project_milestones_on_order(
    p_order_id,
    v_order.total_amount,
    v_payment_options
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_service_project_milestones_on_order(UUID, NUMERIC, JSONB)
  TO anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.sync_service_order_milestone_payment(UUID)
  TO anon, authenticated, service_role;

-- Re-synchronise les jalons après ajout d'extras (total commande modifié).
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
  v_product_id UUID;
  v_payment_options JSONB;
  v_milestone_result JSONB;
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

  SELECT oi.product_id
  INTO v_product_id
  FROM public.order_items oi
  WHERE oi.order_id = p_order_id
    AND oi.product_type = 'service'
  LIMIT 1;

  IF v_product_id IS NOT NULL THEN
    SELECT p.payment_options
    INTO v_payment_options
    FROM public.products p
    WHERE p.id = v_product_id;

    IF COALESCE(v_payment_options->>'payment_type', '') = 'delivery_secured'
      AND COALESCE((v_payment_options->>'use_project_milestones')::boolean, false) IS TRUE
    THEN
      v_milestone_result := public.apply_service_project_milestones_on_order(
        p_order_id,
        v_new_total,
        v_payment_options
      );
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'attached', v_count,
    'addon_subtotal', v_addon_sum,
    'total_amount', v_new_total,
    'project_milestones', v_milestone_result
  );
END;
$$;

COMMIT;
