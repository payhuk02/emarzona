-- Sprint S1: service booking link + platform fee, guest digital licenses, checkout fee reporting

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Licences digitales : user_id nullable pour invités (accès via email / magic link)
-- ---------------------------------------------------------------------------
ALTER TABLE public.digital_licenses
  ALTER COLUMN user_id DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.fulfill_digital_order_items_on_paid()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item RECORD;
  dp RECORD;
  v_user_id UUID;
  v_customer_email TEXT;
  v_customer_name TEXT;
  v_license_id UUID;
  v_auto_generate BOOLEAN;
  v_license_type TEXT;
  v_max_activations INTEGER;
BEGIN
  IF COALESCE(OLD.payment_status, '') IN ('paid', 'completed') THEN
    RETURN NEW;
  END IF;

  IF NEW.payment_status NOT IN ('paid', 'completed') THEN
    RETURN NEW;
  END IF;

  SELECT
    c.user_id,
    c.email,
    COALESCE(NULLIF(TRIM(c.name), ''), 'Client')
  INTO v_user_id, v_customer_email, v_customer_name
  FROM public.customers c
  WHERE c.id = NEW.customer_id;

  IF v_user_id IS NULL AND NEW.metadata IS NOT NULL AND (NEW.metadata ? 'checkout_user_id') THEN
    BEGIN
      v_user_id := (NEW.metadata->>'checkout_user_id')::uuid;
    EXCEPTION
      WHEN OTHERS THEN
        v_user_id := NULL;
    END;
  END IF;

  FOR item IN
    SELECT
      oi.id,
      oi.digital_product_id,
      oi.license_id,
      oi.item_metadata
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id
      AND oi.product_type = 'digital'
  LOOP
    IF item.license_id IS NOT NULL THEN
      UPDATE public.digital_licenses
      SET
        status = 'active',
        activated_at = COALESCE(activated_at, now()),
        order_id = COALESCE(order_id, NEW.id),
        user_id = COALESCE(user_id, v_user_id),
        updated_at = now()
      WHERE id = item.license_id
        AND status IN ('pending', 'active');

      CONTINUE;
    END IF;

    -- Invité OK si email client présent (user_id peut être null)
    IF item.digital_product_id IS NULL THEN
      CONTINUE;
    END IF;
    IF v_user_id IS NULL AND (v_customer_email IS NULL OR trim(v_customer_email) = '') THEN
      CONTINUE;
    END IF;

    v_auto_generate := COALESCE(
      NULLIF(item.item_metadata->>'auto_generate_license', '')::boolean,
      true
    );

    IF NOT v_auto_generate THEN
      CONTINUE;
    END IF;

    SELECT
      dp.id,
      dp.license_type,
      dp.max_activations,
      dp.auto_generate_keys
    INTO dp
    FROM public.digital_products dp
    WHERE dp.id = item.digital_product_id;

    IF NOT FOUND OR COALESCE(dp.auto_generate_keys, true) IS NOT TRUE THEN
      CONTINUE;
    END IF;

    v_license_type := COALESCE(dp.license_type, 'single');
    v_max_activations := CASE
      WHEN v_license_type = 'unlimited' THEN -1
      ELSE COALESCE(dp.max_activations, 1)
    END;

    INSERT INTO public.digital_licenses (
      digital_product_id,
      user_id,
      license_key,
      license_type,
      status,
      max_activations,
      current_activations,
      activated_at,
      order_id,
      customer_email,
      customer_name
    )
    VALUES (
      item.digital_product_id,
      v_user_id,
      public.generate_license_key(),
      v_license_type,
      'active',
      v_max_activations,
      0,
      now(),
      NEW.id,
      v_customer_email,
      v_customer_name
    )
    RETURNING id INTO v_license_id;

    UPDATE public.order_items
    SET license_id = v_license_id
    WHERE id = item.id;
  END LOOP;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.fulfill_digital_order_items_on_paid() IS
  'Active/crée licences digitales au paiement ; invités autorisés via customer_email (user_id nullable).';

-- ---------------------------------------------------------------------------
-- 2. Service RPC : booking_id + frais checkout 2%+100
-- ---------------------------------------------------------------------------
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

  v_booking_id := p_booking_id;
  IF v_booking_id IS NULL AND p_service_metadata ? 'booking_id' THEN
    BEGIN
      v_booking_id := (p_service_metadata->>'booking_id')::uuid;
    EXCEPTION WHEN OTHERS THEN
      v_booking_id := NULL;
    END;
  END IF;

  v_base_price := COALESCE(NULLIF(v_product.promotional_price, 0), v_product.price, 0);
  v_currency := COALESCE(v_product.currency, 'XOF');
  v_num_participants := COALESCE((p_service_metadata->>'number_of_participants')::INTEGER, 1);
  v_duration_minutes := COALESCE(
    (p_service_metadata->>'duration_minutes')::INTEGER,
    v_service_product.duration_minutes
  );

  IF v_service_product.pricing_type = 'per_participant' THEN
    v_base_price := v_base_price * v_num_participants;
  ELSIF v_service_product.pricing_type = 'per_hour' THEN
    v_base_price := v_base_price * (v_duration_minutes::NUMERIC / 60.0);
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
      'booking_id', v_booking_id
    )
  )
  RETURNING id INTO v_order_id;

  INSERT INTO public.order_items (
    order_id, product_id, product_type, service_product_id,
    product_name, quantity, unit_price, total_price, item_metadata, booking_id
  ) VALUES (
    v_order_id, p_product_id, 'service', v_service_product.id,
    v_product.name, 1, v_base_price, v_base_price,
    COALESCE(p_service_metadata, '{}'::jsonb),
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
    'checkout_token', (
      SELECT o.metadata->>'checkout_token' FROM public.orders o WHERE o.id = v_order_id
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_public_service_order(
  UUID, UUID, TEXT, TEXT, TEXT, JSONB, UUID, NUMERIC, TEXT, TEXT, BOOLEAN, UUID
) TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3. Vue admin : frais checkout acheteur (2% + 100) séparés de la commission 10%
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.admin_checkout_platform_fees AS
SELECT
  o.id AS order_id,
  o.order_number,
  o.store_id,
  s.name AS store_name,
  o.customer_id,
  o.currency,
  o.payment_status,
  o.status,
  o.total_amount,
  COALESCE((o.metadata->>'subtotal')::numeric, o.total_amount) AS subtotal,
  COALESCE((o.metadata->>'platform_fee')::numeric, 0) AS checkout_fee_amount,
  COALESCE(o.metadata->>'platform_fee_rule', '2pct_plus_100_xof') AS fee_rule,
  o.created_at,
  o.updated_at
FROM public.orders o
LEFT JOIN public.stores s ON s.id = o.store_id
WHERE COALESCE((o.metadata->>'platform_fee')::numeric, 0) > 0
  AND o.payment_status IN ('paid', 'completed', 'partially_refunded');

COMMENT ON VIEW public.admin_checkout_platform_fees IS
  'Frais checkout acheteur (2%+100 FCFA) encaissés — distincts de la commission vendeur 10%.';

GRANT SELECT ON public.admin_checkout_platform_fees TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.admin_checkout_fees_summary(
  p_from TIMESTAMPTZ DEFAULT NULL,
  p_to TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin BOOLEAN := false;
  v_from TIMESTAMPTZ := COALESCE(p_from, now() - interval '90 days');
  v_to TIMESTAMPTZ := COALESCE(p_to, now());
  v_total NUMERIC := 0;
  v_count BIGINT := 0;
  v_breakdown JSONB := '[]'::jsonb;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND (
        COALESCE(p.is_super_admin, false) = true
        OR p.role IN ('admin', 'super_admin', 'staff', 'manager')
      )
  ) INTO v_is_admin;

  IF NOT v_is_admin AND auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Accès admin requis';
  END IF;

  SELECT
    COALESCE(SUM(checkout_fee_amount), 0),
    COUNT(*)
  INTO v_total, v_count
  FROM public.admin_checkout_platform_fees f
  WHERE f.created_at >= v_from AND f.created_at <= v_to;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'currency', currency,
        'fees', fees,
        'orders', orders
      )
      ORDER BY fees DESC
    ),
    '[]'::jsonb
  )
  INTO v_breakdown
  FROM (
    SELECT
      currency,
      COALESCE(SUM(checkout_fee_amount), 0) AS fees,
      COUNT(*) AS orders
    FROM public.admin_checkout_platform_fees
    WHERE created_at >= v_from AND created_at <= v_to
    GROUP BY currency
  ) t;

  RETURN jsonb_build_object(
    'total_fees', v_total,
    'order_count', v_count,
    'currency_breakdown', v_breakdown,
    'from', v_from,
    'to', v_to
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_checkout_fees_summary(TIMESTAMPTZ, TIMESTAMPTZ)
  TO authenticated, service_role;

COMMIT;
