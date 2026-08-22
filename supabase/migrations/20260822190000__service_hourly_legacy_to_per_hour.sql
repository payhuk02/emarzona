-- Legacy UI stored pricing_type = 'hourly'; checkout RPC only multiplied duration
-- for 'per_hour'. Backfill rows and treat both tokens as hourly in the RPC.

BEGIN;

UPDATE public.service_products
SET pricing_type = 'per_hour',
    updated_at = now()
WHERE pricing_type IS NOT DISTINCT FROM 'hourly';

CREATE OR REPLACE FUNCTION public.create_public_service_order(
  p_product_id UUID,
  p_store_id UUID,
  p_customer_email TEXT,
  p_customer_name TEXT,
  p_customer_phone TEXT DEFAULT NULL,
  p_service_metadata JSONB DEFAULT '{}'::jsonb,
  p_gift_card_id UUID DEFAULT NULL,
  p_gift_card_amount_requested NUMERIC DEFAULT 0,
  p_coupon_code TEXT DEFAULT NULL,
  p_affiliate_tracking_cookie TEXT DEFAULT NULL,
  p_guest_checkout BOOLEAN DEFAULT TRUE,
  p_booking_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
  v_product public.products%ROWTYPE;
  v_service_product public.service_products%ROWTYPE;
  v_customer_id UUID;
  v_order_id UUID;
  v_order_item_id UUID;
  v_order_number TEXT;
  v_base_price NUMERIC(12, 2);
  v_promo_discount NUMERIC(12, 2) := 0;
  v_gift_card_discount NUMERIC(12, 2) := 0;
  v_subtotal NUMERIC(12, 2);
  v_final_amount NUMERIC(12, 2);
  v_platform_fee NUMERIC(12, 2) := 0;
  v_promotion_id UUID;
  v_promo_validation RECORD;
  v_gift_card_validation RECORD;
  v_num_participants INTEGER;
  v_duration_minutes INTEGER;
  v_currency TEXT;
  v_booking_id UUID;
  v_meta JSONB;
  v_notes_json JSONB;
  v_is_project BOOLEAN := false;
  v_package_id UUID;
  v_package RECORD;
  v_extras_total NUMERIC(12, 2) := 0;
  v_extra_ids UUID[] := ARRAY[]::UUID[];
  v_extra_count INTEGER := 0;
  v_fulfillment_mode TEXT;
  v_client_quoted NUMERIC(12, 2);
  v_item_metadata JSONB;
  v_product_name TEXT;
BEGIN
  v_email := lower(trim(p_customer_email));
  IF v_email IS NULL OR v_email !~* '^[^@]+@[^@]+\.[^@]+$' THEN
    RAISE EXCEPTION 'Email client invalide';
  END IF;

  SELECT * INTO v_product FROM public.products
  WHERE id = p_product_id AND store_id = p_store_id AND product_type = 'service'
    AND COALESCE(is_active, true) = true AND COALESCE(is_draft, false) = false;
  IF NOT FOUND THEN RAISE EXCEPTION 'Produit introuvable'; END IF;

  SELECT * INTO v_service_product FROM public.service_products WHERE product_id = p_product_id LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'Service introuvable'; END IF;

  v_meta := COALESCE(p_service_metadata, '{}'::jsonb);

  -- Merge project fields embedded as JSON string in notes (checkout path)
  IF v_meta ? 'notes' AND jsonb_typeof(v_meta->'notes') = 'string' THEN
    BEGIN
      v_notes_json := (v_meta->>'notes')::jsonb;
      IF COALESCE(v_notes_json->>'fulfillment_mode', '') = 'project' THEN
        v_meta := v_meta || v_notes_json;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;

  v_booking_id := p_booking_id;
  IF v_booking_id IS NULL AND v_meta ? 'booking_id' THEN
    BEGIN
      v_booking_id := (v_meta->>'booking_id')::uuid;
    EXCEPTION WHEN OTHERS THEN
      v_booking_id := NULL;
    END;
  END IF;

  v_currency := COALESCE(v_product.currency, 'XOF');
  v_num_participants := COALESCE((v_meta->>'number_of_participants')::INTEGER, 1);
  v_duration_minutes := COALESCE(
    (v_meta->>'duration_minutes')::INTEGER,
    v_service_product.duration_minutes
  );

  v_fulfillment_mode := COALESCE(
    v_meta->>'fulfillment_mode',
    v_service_product.fulfillment_mode,
    'appointment'
  );
  v_is_project := (
    v_fulfillment_mode = 'project'
    OR (
      v_fulfillment_mode = 'both'
      AND NULLIF(trim(COALESCE(v_meta->>'delivery_package_id', '')), '') IS NOT NULL
    )
  );

  IF v_is_project THEN
    IF COALESCE(v_service_product.fulfillment_mode, 'appointment') NOT IN ('project', 'both') THEN
      RAISE EXCEPTION 'Ce service n''accepte pas les commandes projet';
    END IF;

    BEGIN
      v_package_id := NULLIF(trim(v_meta->>'delivery_package_id'), '')::uuid;
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'Package projet invalide';
    END;

    IF v_package_id IS NULL THEN
      RAISE EXCEPTION 'Package projet requis';
    END IF;

    SELECT
      sp.id,
      sp.service_product_id,
      sp.package_kind,
      COALESCE(sp.is_active, true) AS is_active,
      COALESCE(NULLIF(sp.price, 0), NULLIF(sp.package_price, 0), 0)::NUMERIC(12, 2) AS unit_price,
      COALESCE(sp.name, sp.package_name) AS display_name,
      sp.delivery_days,
      sp.tier
    INTO v_package
    FROM public.service_packages sp
    WHERE sp.id = v_package_id
    LIMIT 1;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Package projet introuvable';
    END IF;

    IF v_package.service_product_id IS DISTINCT FROM v_service_product.id THEN
      RAISE EXCEPTION 'Package projet non associé à ce service';
    END IF;

    IF v_package.package_kind IS DISTINCT FROM 'delivery_tier' THEN
      RAISE EXCEPTION 'Package projet invalide (delivery_tier requis)';
    END IF;

    IF v_package.is_active IS NOT TRUE THEN
      RAISE EXCEPTION 'Package projet inactif';
    END IF;

    -- Parse extra_ids (array or JSON array)
    BEGIN
      IF v_meta ? 'extra_ids' AND jsonb_typeof(v_meta->'extra_ids') = 'array' THEN
        SELECT COALESCE(array_agg(DISTINCT x::uuid), ARRAY[]::uuid[])
        INTO v_extra_ids
        FROM jsonb_array_elements_text(v_meta->'extra_ids') AS t(x)
        WHERE NULLIF(trim(x), '') IS NOT NULL;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'Extras projet invalides';
    END;

    IF cardinality(v_extra_ids) > 0 THEN
      SELECT
        COALESCE(SUM(e.price), 0)::NUMERIC(12, 2),
        COUNT(*)::INTEGER
      INTO v_extras_total, v_extra_count
      FROM public.service_gig_extras e
      WHERE e.id = ANY (v_extra_ids)
        AND e.service_product_id = v_service_product.id
        AND COALESCE(e.is_active, true) = true;

      IF v_extra_count IS DISTINCT FROM cardinality(v_extra_ids) THEN
        RAISE EXCEPTION 'Un ou plusieurs extras projet sont invalides ou inactifs';
      END IF;
    END IF;

    v_base_price := ROUND(COALESCE(v_package.unit_price, 0) + COALESCE(v_extras_total, 0), 2);

    BEGIN
      v_client_quoted := NULLIF(v_meta->>'quoted_total', '')::NUMERIC;
    EXCEPTION WHEN OTHERS THEN
      v_client_quoted := NULL;
    END;

    -- Audit only: never trust client amount
    v_meta := v_meta || jsonb_build_object(
      'fulfillment_mode', 'project',
      'delivery_package_id', v_package_id,
      'package_name', v_package.display_name,
      'package_tier', v_package.tier,
      'delivery_days', v_package.delivery_days,
      'extras_total', v_extras_total,
      'server_quoted_total', v_base_price,
      'client_quoted_total', v_client_quoted,
      'price_source', 'delivery_package'
    );
  ELSE
    v_base_price := COALESCE(NULLIF(v_product.promotional_price, 0), v_product.price, 0);

    IF v_service_product.pricing_type = 'per_participant' THEN
      v_base_price := v_base_price * v_num_participants;
    ELSIF v_service_product.pricing_type IN ('per_hour', 'hourly') THEN
      v_base_price := v_base_price * (v_duration_minutes::NUMERIC / 60.0);
    END IF;
  END IF;

  SELECT c.id INTO v_customer_id
  FROM public.customers c
  WHERE c.store_id = p_store_id AND lower(trim(c.email)) = v_email
  LIMIT 1;

  IF v_customer_id IS NULL THEN
    INSERT INTO public.customers (store_id, email, name, full_name, phone)
    VALUES (
      p_store_id, v_email, trim(p_customer_name), trim(p_customer_name),
      NULLIF(trim(p_customer_phone), '')
    )
    RETURNING id INTO v_customer_id;
  ELSE
    UPDATE public.customers
    SET
      name = COALESCE(NULLIF(trim(name), ''), trim(p_customer_name)),
      phone = COALESCE(NULLIF(trim(p_customer_phone), ''), phone),
      updated_at = now()
    WHERE id = v_customer_id;
  END IF;

  IF p_coupon_code IS NOT NULL AND trim(p_coupon_code) <> '' THEN
    BEGIN
      SELECT * INTO v_promo_validation
      FROM public.validate_unified_promotion(
        trim(p_coupon_code), p_store_id, ARRAY[p_product_id], NULL, NULL,
        v_base_price, v_customer_id, false
      );
      IF v_promo_validation.valid THEN
        v_promo_discount := COALESCE(v_promo_validation.discount_amount, 0);
        v_promotion_id := v_promo_validation.promotion_id;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      v_promo_discount := 0;
    END;
  END IF;

  IF p_gift_card_id IS NOT NULL AND COALESCE(p_gift_card_amount_requested, 0) > 0 THEN
    BEGIN
      SELECT * INTO v_gift_card_validation
      FROM public.validate_gift_card(
        p_store_id,
        (SELECT code FROM public.gift_cards WHERE id = p_gift_card_id LIMIT 1)
      );
      IF v_gift_card_validation.is_valid THEN
        v_gift_card_discount := LEAST(
          p_gift_card_amount_requested,
          v_gift_card_validation.current_balance
        );
      END IF;
    EXCEPTION WHEN OTHERS THEN
      v_gift_card_discount := 0;
    END;
  END IF;

  v_subtotal := GREATEST(0, v_base_price - v_promo_discount - v_gift_card_discount);
  v_final_amount := public.apply_checkout_platform_fee(v_subtotal, v_currency);
  v_platform_fee := GREATEST(0, v_final_amount - v_subtotal);

  SELECT public.generate_order_number() INTO v_order_number;
  IF v_order_number IS NULL OR trim(v_order_number) = '' THEN
    v_order_number := 'ORD-' || to_char(now(), 'YYYYMMDDHH24MISS');
  END IF;

  INSERT INTO public.orders (
    store_id, customer_id, order_number, total_amount, currency,
    payment_status, status, affiliate_tracking_cookie, metadata
  ) VALUES (
    p_store_id, v_customer_id, v_order_number, v_final_amount, v_currency,
    'pending', 'pending', p_affiliate_tracking_cookie,
    jsonb_build_object(
      'customer_email', v_email,
      'guest_checkout', COALESCE(p_guest_checkout, true),
      'subtotal', v_subtotal,
      'platform_fee', v_platform_fee,
      'platform_fee_rule', '2pct_plus_100_xof',
      'booking_id', v_booking_id,
      'fulfillment_mode', CASE WHEN v_is_project THEN 'project' ELSE 'appointment' END,
      'server_quoted_total', CASE WHEN v_is_project THEN v_base_price ELSE NULL END
    )
  )
  RETURNING id INTO v_order_id;

  v_item_metadata := COALESCE(v_meta, '{}'::jsonb);
  v_product_name := v_product.name;
  IF v_is_project AND COALESCE(v_package.display_name, '') <> '' THEN
    v_product_name := v_product.name || ' — ' || v_package.display_name;
  END IF;

  INSERT INTO public.order_items (
    order_id, product_id, product_type, service_product_id,
    product_name, quantity, unit_price, total_price, item_metadata, booking_id
  ) VALUES (
    v_order_id, p_product_id, 'service', v_service_product.id,
    v_product_name,
    1, v_base_price, v_base_price,
    v_item_metadata,
    v_booking_id
  )
  RETURNING id INTO v_order_item_id;

  IF v_promotion_id IS NOT NULL THEN
    INSERT INTO public.promotion_usage (
      promotion_id, order_id, customer_id, discount_amount,
      order_total_before_discount, order_total_after_discount
    ) VALUES (
      v_promotion_id, v_order_id, v_customer_id, v_promo_discount,
      v_base_price, v_final_amount
    );
  END IF;

  IF p_gift_card_id IS NOT NULL AND v_gift_card_discount > 0 THEN
    BEGIN
      PERFORM public.redeem_gift_card(p_gift_card_id, v_order_id, v_gift_card_discount);
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;

  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'order_item_id', v_order_item_id,
    'order_number', v_order_number,
    'customer_id', v_customer_id,
    'total_amount', v_final_amount,
    'subtotal', v_subtotal,
    'platform_fee', v_platform_fee,
    'booking_id', v_booking_id,
    'base_price', v_base_price,
    'fulfillment_mode', CASE WHEN v_is_project THEN 'project' ELSE 'appointment' END,
    'checkout_token', (
      SELECT o.metadata->>'checkout_token' FROM public.orders o WHERE o.id = v_order_id
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_public_service_order(
  UUID, UUID, TEXT, TEXT, TEXT, JSONB, UUID, NUMERIC, TEXT, TEXT, BOOLEAN, UUID
) TO anon, authenticated, service_role;

COMMENT ON FUNCTION public.create_public_service_order(
  UUID, UUID, TEXT, TEXT, TEXT, JSONB, UUID, NUMERIC, TEXT, TEXT, BOOLEAN, UUID
) IS
  'Create service order. Appointment: catalog price (hourly and per_hour × duration). Project: server sum of delivery_tier package + active gig extras.';

COMMIT;
