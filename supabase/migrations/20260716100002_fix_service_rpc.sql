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
  v_service_product public.service_products%ROWTYPE;
  v_customer_id UUID;
  v_order_id UUID;
  v_order_item_id UUID;
  v_order_number TEXT;
  v_base_price NUMERIC(12, 2);
  v_promo_discount NUMERIC(12, 2) := 0;
  v_gift_card_discount NUMERIC(12, 2) := 0;
  v_final_amount NUMERIC(12, 2);
  v_promotion_id UUID;
  v_promo_validation RECORD;
  v_gift_card_validation RECORD;
  v_num_participants INTEGER;
  v_duration_minutes INTEGER;
BEGIN
  v_email := lower(trim(p_customer_email));
  IF v_email IS NULL OR v_email !~* '^[^@]+@[^@]+\.[^@]+$' THEN RAISE EXCEPTION 'Email client invalide'; END IF;

  SELECT * INTO v_product FROM public.products
  WHERE id = p_product_id AND store_id = p_store_id AND product_type = 'service'
    AND COALESCE(is_active, true) = true AND COALESCE(is_draft, false) = false;

  IF NOT FOUND THEN RAISE EXCEPTION 'Produit introuvable'; END IF;
  
  SELECT * INTO v_service_product FROM public.service_products WHERE product_id = p_product_id LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'Service introuvable'; END IF;

  v_base_price := COALESCE(NULLIF(v_product.promotional_price, 0), v_product.price, 0);
  
  -- Extract variables from metadata
  v_num_participants := COALESCE((p_service_metadata->>'number_of_participants')::INTEGER, 1);
  v_duration_minutes := COALESCE((p_service_metadata->>'duration_minutes')::INTEGER, v_service_product.duration_minutes);

  -- Adjust base price according to pricing type
  IF v_service_product.pricing_type = 'per_participant' THEN
    v_base_price := v_base_price * v_num_participants;
  ELSIF v_service_product.pricing_type = 'per_hour' THEN
    v_base_price := v_base_price * (v_duration_minutes::NUMERIC / 60.0);
  END IF;

  SELECT c.id INTO v_customer_id FROM public.customers c WHERE c.store_id = p_store_id AND lower(trim(c.email)) = v_email LIMIT 1;
  IF v_customer_id IS NULL THEN
    INSERT INTO public.customers (store_id, email, name, full_name, phone)
    VALUES (p_store_id, v_email, trim(p_customer_name), trim(p_customer_name), NULLIF(trim(p_customer_phone), '')) RETURNING id INTO v_customer_id;
  ELSE
    UPDATE public.customers SET name = COALESCE(NULLIF(trim(name), ''), trim(p_customer_name)), phone = COALESCE(NULLIF(trim(p_customer_phone), ''), phone), updated_at = now() WHERE id = v_customer_id;
  END IF;

  IF p_coupon_code IS NOT NULL AND trim(p_coupon_code) <> '' THEN
    SELECT * INTO v_promo_validation FROM public.validate_unified_promotion(trim(p_coupon_code), p_store_id, ARRAY[p_product_id], NULL, NULL, v_base_price, v_customer_id, false);
    IF v_promo_validation.valid THEN v_promo_discount := COALESCE(v_promo_validation.discount_amount, 0); v_promotion_id := v_promo_validation.promotion_id; END IF;
  END IF;
  IF p_gift_card_id IS NOT NULL AND COALESCE(p_gift_card_amount_requested, 0) > 0 THEN
    SELECT * INTO v_gift_card_validation FROM public.validate_gift_card(p_store_id, (SELECT code FROM public.gift_cards WHERE id = p_gift_card_id LIMIT 1));
    IF v_gift_card_validation.is_valid THEN v_gift_card_discount := LEAST(p_gift_card_amount_requested, v_gift_card_validation.current_balance); END IF;
  END IF;

  v_final_amount := GREATEST(0, v_base_price - v_promo_discount - v_gift_card_discount);
  SELECT public.generate_order_number() INTO v_order_number;
  IF v_order_number IS NULL OR trim(v_order_number) = '' THEN v_order_number := 'ORD-' || to_char(now(), 'YYYYMMDDHH24MISS'); END IF;

  INSERT INTO public.orders (store_id, customer_id, order_number, total_amount, currency, payment_status, status, affiliate_tracking_cookie, metadata)
  VALUES (p_store_id, v_customer_id, v_order_number, v_final_amount, COALESCE(v_product.currency, 'XOF'), 'pending', 'pending', p_affiliate_tracking_cookie, jsonb_build_object('customer_email', v_email, 'guest_checkout', COALESCE(p_guest_checkout, true))) RETURNING id INTO v_order_id;

  INSERT INTO public.order_items (order_id, product_id, product_type, service_product_id, product_name, quantity, unit_price, total_price, item_metadata)
  VALUES (v_order_id, p_product_id, 'service', v_service_product.id, v_product.name, 1, v_base_price, v_base_price, COALESCE(p_service_metadata, '{}'::jsonb)) RETURNING id INTO v_order_item_id;

  IF v_promotion_id IS NOT NULL THEN INSERT INTO public.promotion_usage (promotion_id, order_id, customer_id, discount_amount, order_total_before_discount, order_total_after_discount) VALUES (v_promotion_id, v_order_id, v_customer_id, v_promo_discount, v_base_price, v_final_amount); END IF;
  IF p_gift_card_id IS NOT NULL AND v_gift_card_discount > 0 THEN PERFORM public.redeem_gift_card(p_gift_card_id, v_order_id, v_gift_card_discount); END IF;

  RETURN jsonb_build_object('order_id', v_order_id, 'order_item_id', v_order_item_id, 'order_number', v_order_number, 'customer_id', v_customer_id, 'total_amount', v_final_amount);
END;
$$;
