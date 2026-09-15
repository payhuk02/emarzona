-- Honor artist product payment_options (percentage deposit + delivery_secured) in create_public_artist_order.
-- Mirrors physical checkout: persist payment_type / percentage_paid / remaining_amount and return amount_due_now.

CREATE OR REPLACE FUNCTION public.create_public_artist_order(
  p_product_id UUID,
  p_store_id UUID,
  p_customer_email TEXT,
  p_customer_name TEXT,
  p_customer_phone TEXT DEFAULT NULL,
  p_gift_card_id UUID DEFAULT NULL,
  p_gift_card_amount_requested NUMERIC DEFAULT 0,
  p_coupon_code TEXT DEFAULT NULL,
  p_affiliate_tracking_cookie TEXT DEFAULT NULL,
  p_guest_checkout BOOLEAN DEFAULT TRUE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
  v_product public.products%ROWTYPE;
  v_artist_id UUID;
  v_customer_id UUID;
  v_order_id UUID;
  v_order_item_id UUID;
  v_order_number TEXT;
  v_base_price NUMERIC(12, 2);
  v_promo_discount NUMERIC(12, 2) := 0;
  v_gift_card_discount NUMERIC(12, 2) := 0;
  v_order_total NUMERIC(12, 2);
  v_amount_due_now NUMERIC(12, 2);
  v_payment_type TEXT := 'full';
  v_percentage_rate INTEGER := 30;
  v_percentage_paid NUMERIC(12, 2) := 0;
  v_remaining_amount NUMERIC(12, 2) := 0;
  v_promotion_id UUID;
  v_promo_validation RECORD;
  v_gift_card_validation RECORD;
BEGIN
  v_email := lower(trim(p_customer_email));
  IF v_email IS NULL OR v_email !~* '^[^@]+@[^@]+\.[^@]+$' THEN
    RAISE EXCEPTION 'Email client invalide';
  END IF;

  SELECT * INTO v_product FROM public.products
  WHERE id = p_product_id AND store_id = p_store_id AND product_type = 'artist'
    AND COALESCE(is_active, true) = true AND COALESCE(is_draft, false) = false;

  IF NOT FOUND THEN RAISE EXCEPTION 'Produit introuvable'; END IF;
  SELECT id INTO v_artist_id FROM public.artist_products WHERE product_id = p_product_id LIMIT 1;

  v_base_price := COALESCE(NULLIF(v_product.promotional_price, 0), v_product.price, 0);

  v_payment_type := COALESCE(NULLIF(v_product.payment_options->>'payment_type', ''), 'full');
  IF v_payment_type NOT IN ('full', 'percentage', 'delivery_secured') THEN
    v_payment_type := 'full';
  END IF;
  v_percentage_rate := COALESCE((v_product.payment_options->>'percentage_rate')::INTEGER, 30);
  IF v_percentage_rate < 1 OR v_percentage_rate > 100 THEN
    v_percentage_rate := 30;
  END IF;

  SELECT c.id INTO v_customer_id FROM public.customers c
  WHERE c.store_id = p_store_id AND lower(trim(c.email)) = v_email LIMIT 1;
  IF v_customer_id IS NULL THEN
    INSERT INTO public.customers (store_id, email, name, full_name, phone)
    VALUES (p_store_id, v_email, trim(p_customer_name), trim(p_customer_name), NULLIF(trim(p_customer_phone), ''))
    RETURNING id INTO v_customer_id;
  ELSE
    UPDATE public.customers
    SET name = COALESCE(NULLIF(trim(name), ''), trim(p_customer_name)),
        phone = COALESCE(NULLIF(trim(p_customer_phone), ''), phone),
        updated_at = now()
    WHERE id = v_customer_id;
  END IF;

  IF p_coupon_code IS NOT NULL AND trim(p_coupon_code) <> '' THEN
    BEGIN
      SELECT * INTO v_promo_validation FROM public.validate_unified_promotion(
        trim(p_coupon_code), p_store_id, ARRAY[p_product_id], NULL, NULL, v_base_price, v_customer_id, false
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
      SELECT * INTO v_gift_card_validation FROM public.validate_gift_card(
        p_store_id, (SELECT code FROM public.gift_cards WHERE id = p_gift_card_id LIMIT 1)
      );
      IF v_gift_card_validation.is_valid THEN
        v_gift_card_discount := LEAST(p_gift_card_amount_requested, v_gift_card_validation.current_balance);
      END IF;
    EXCEPTION WHEN OTHERS THEN
      v_gift_card_discount := 0;
    END;
  END IF;

  v_order_total := GREATEST(0, v_base_price - v_promo_discount - v_gift_card_discount);
  v_order_total := public.apply_checkout_platform_fee(v_order_total, COALESCE(v_product.currency, 'XOF'));

  IF v_payment_type = 'percentage' THEN
    v_percentage_paid := ROUND((v_order_total * v_percentage_rate) / 100.0, 2);
    v_remaining_amount := v_order_total - v_percentage_paid;
    v_amount_due_now := v_percentage_paid;
  ELSE
    -- full and delivery_secured: charge full amount now (escrow tracked client-side)
    v_percentage_paid := 0;
    v_remaining_amount := 0;
    v_amount_due_now := v_order_total;
  END IF;

  SELECT public.generate_order_number() INTO v_order_number;
  IF v_order_number IS NULL OR trim(v_order_number) = '' THEN
    v_order_number := 'ORD-' || to_char(now(), 'YYYYMMDDHH24MISS');
  END IF;

  INSERT INTO public.orders (
    store_id, customer_id, order_number, total_amount, currency,
    payment_status, status, payment_type, percentage_paid, remaining_amount,
    affiliate_tracking_cookie, metadata
  ) VALUES (
    p_store_id, v_customer_id, v_order_number, v_order_total, COALESCE(v_product.currency, 'XOF'),
    'pending', 'pending', v_payment_type, v_percentage_paid, v_remaining_amount,
    p_affiliate_tracking_cookie,
    jsonb_build_object(
      'customer_email', v_email,
      'guest_checkout', COALESCE(p_guest_checkout, true),
      'platform_fee_rule', '2pct_plus_100_xof',
      'payment_type', v_payment_type,
      'percentage_rate', v_percentage_rate
    )
  ) RETURNING id INTO v_order_id;

  INSERT INTO public.order_items (
    order_id, product_id, product_type, artist_product_id, product_name, quantity, unit_price, total_price
  ) VALUES (
    v_order_id, p_product_id, 'artist', v_artist_id, v_product.name, 1, v_base_price, v_base_price
  ) RETURNING id INTO v_order_item_id;

  IF v_promotion_id IS NOT NULL THEN
    INSERT INTO public.promotion_usage (
      promotion_id, order_id, customer_id, discount_amount,
      order_total_before_discount, order_total_after_discount
    ) VALUES (
      v_promotion_id, v_order_id, v_customer_id, v_promo_discount, v_base_price, v_order_total
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
    'total_amount', v_order_total,
    'amount_due_now', v_amount_due_now,
    'remaining_amount', v_remaining_amount,
    'payment_type', v_payment_type
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_public_artist_order(
  UUID, UUID, TEXT, TEXT, TEXT, UUID, NUMERIC, TEXT, TEXT, BOOLEAN
) TO anon, authenticated;

COMMENT ON FUNCTION public.create_public_artist_order IS
  'Public artist checkout: honors payment_options (full / percentage deposit / delivery_secured).';
