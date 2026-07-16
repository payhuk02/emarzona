-- ============================================================================
-- SECURE ORDER CREATION RPCs
-- Date: 2026-07-16
-- Description: Déplace la logique de création de commandes au niveau de la DB
-- pour empêcher la falsification des montants par le client.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. DIGITAL ORDER
-- ============================================================================
CREATE OR REPLACE FUNCTION public.create_public_digital_order(
  p_product_id UUID,
  p_store_id UUID,
  p_customer_email TEXT,
  p_customer_name TEXT,
  p_customer_phone TEXT DEFAULT NULL,
  p_generate_license BOOLEAN DEFAULT TRUE,
  p_license_type TEXT DEFAULT 'single',
  p_max_activations INTEGER DEFAULT 1,
  p_license_expiry_days INTEGER DEFAULT NULL,
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
  v_digital_id UUID;
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
  v_item_meta JSONB;
BEGIN
  v_email := lower(trim(p_customer_email));
  IF v_email IS NULL OR v_email !~* '^[^@]+@[^@]+\.[^@]+$' THEN
    RAISE EXCEPTION 'Email client invalide';
  END IF;

  -- 1. Récupérer le produit
  SELECT * INTO v_product
  FROM public.products
  WHERE id = p_product_id
    AND store_id = p_store_id
    AND product_type = 'digital'
    AND COALESCE(is_active, true) = true
    AND COALESCE(is_draft, false) = false;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produit digital introuvable ou indisponible';
  END IF;

  SELECT dp.id INTO v_digital_id
  FROM public.digital_products dp
  WHERE dp.product_id = p_product_id
  LIMIT 1;

  IF v_digital_id IS NULL THEN
    RAISE EXCEPTION 'Configuration du produit digital introuvable';
  END IF;

  v_base_price := COALESCE(NULLIF(v_product.promotional_price, 0), v_product.price, 0);

  -- 2. Créer ou récupérer le client
  SELECT c.id INTO v_customer_id
  FROM public.customers c
  WHERE c.store_id = p_store_id
    AND lower(trim(c.email)) = v_email
  LIMIT 1;

  IF v_customer_id IS NULL THEN
    INSERT INTO public.customers (
      store_id, email, name, full_name, phone
    ) VALUES (
      p_store_id, v_email, trim(p_customer_name), trim(p_customer_name), NULLIF(trim(p_customer_phone), '')
    ) RETURNING id INTO v_customer_id;
  ELSE
    UPDATE public.customers
    SET
      name = COALESCE(NULLIF(trim(name), ''), trim(p_customer_name)),
      full_name = COALESCE(NULLIF(trim(full_name), ''), trim(p_customer_name)),
      phone = COALESCE(NULLIF(trim(p_customer_phone), ''), phone),
      updated_at = now()
    WHERE id = v_customer_id;
  END IF;

  -- 3. Validation de la promotion
  IF p_coupon_code IS NOT NULL AND trim(p_coupon_code) <> '' THEN
    SELECT * INTO v_promo_validation FROM public.validate_unified_promotion(
      p_code := trim(p_coupon_code),
      p_store_id := p_store_id,
      p_product_ids := ARRAY[p_product_id],
      p_category_ids := NULL,
      p_collection_ids := NULL,
      p_order_amount := v_base_price,
      p_customer_id := v_customer_id,
      p_is_first_order := false
    );
    
    IF v_promo_validation.valid THEN
      v_promo_discount := COALESCE(v_promo_validation.discount_amount, 0);
      v_promotion_id := v_promo_validation.promotion_id;
    END IF;
  END IF;

  -- 4. Application de la carte cadeau
  IF p_gift_card_id IS NOT NULL AND COALESCE(p_gift_card_amount_requested, 0) > 0 THEN
    SELECT * INTO v_gift_card_validation FROM public.validate_gift_card(p_store_id, (SELECT code FROM public.gift_cards WHERE id = p_gift_card_id LIMIT 1));
    IF v_gift_card_validation.is_valid THEN
      -- On ne déduit pas encore, on calcule juste le max utilisable
      v_gift_card_discount := LEAST(p_gift_card_amount_requested, v_gift_card_validation.current_balance);
    END IF;
  END IF;

  -- 5. Calcul final
  v_final_amount := GREATEST(0, v_base_price - v_promo_discount - v_gift_card_discount);

  -- 6. Générer numéro de commande
  SELECT public.generate_order_number() INTO v_order_number;
  IF v_order_number IS NULL OR trim(v_order_number) = '' THEN
    v_order_number := 'ORD-' || to_char(now(), 'YYYYMMDDHH24MISS');
  END IF;

  -- 7. Insérer l'order
  INSERT INTO public.orders (
    store_id, customer_id, order_number, total_amount, currency,
    payment_status, status, affiliate_tracking_cookie, metadata
  ) VALUES (
    p_store_id, v_customer_id, v_order_number, v_final_amount, COALESCE(v_product.currency, 'XOF'),
    'pending', 'pending', p_affiliate_tracking_cookie,
    jsonb_build_object(
      'customer_email', v_email,
      'guest_checkout', COALESCE(p_guest_checkout, true)
    )
  ) RETURNING id INTO v_order_id;

  -- 8. Insérer l'order_item
  v_item_meta := jsonb_build_object(
    'license_generated', p_generate_license,
    'license_type', p_license_type
  );

  INSERT INTO public.order_items (
    order_id, product_id, product_type, digital_product_id,
    product_name, quantity, unit_price, total_price, item_metadata
  ) VALUES (
    v_order_id, p_product_id, 'digital', v_digital_id,
    v_product.name, 1, v_base_price, v_base_price, v_item_meta
  ) RETURNING id INTO v_order_item_id;

  -- 9. Enregistrer l'utilisation de promotion
  IF v_promotion_id IS NOT NULL THEN
    INSERT INTO public.promotion_usage (
      promotion_id, order_id, customer_id, discount_amount,
      order_total_before_discount, order_total_after_discount
    ) VALUES (
      v_promotion_id, v_order_id, v_customer_id, v_promo_discount,
      v_base_price, v_final_amount
    );
  END IF;

  -- 10. Rédimer la carte cadeau (maintenant qu'on a un order_id)
  IF p_gift_card_id IS NOT NULL AND v_gift_card_discount > 0 THEN
    PERFORM public.redeem_gift_card(p_gift_card_id, v_order_id, v_gift_card_discount);
  END IF;

  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'order_item_id', v_order_item_id,
    'order_number', v_order_number,
    'customer_id', v_customer_id,
    'digital_product_id', v_digital_id,
    'total_amount', v_final_amount
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_public_digital_order TO anon, authenticated;

-- ============================================================================
-- 2. COURSE ORDER
-- ============================================================================
CREATE OR REPLACE FUNCTION public.create_public_course_order(
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
  v_course_id UUID;
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
BEGIN
  v_email := lower(trim(p_customer_email));
  IF v_email IS NULL OR v_email !~* '^[^@]+@[^@]+\.[^@]+$' THEN
    RAISE EXCEPTION 'Email client invalide';
  END IF;

  SELECT * INTO v_product FROM public.products
  WHERE id = p_product_id AND store_id = p_store_id AND product_type = 'course'
    AND COALESCE(is_active, true) = true AND COALESCE(is_draft, false) = false;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produit introuvable';
  END IF;

  SELECT id INTO v_course_id FROM public.courses WHERE product_id = p_product_id LIMIT 1;

  v_base_price := COALESCE(NULLIF(v_product.promotional_price, 0), v_product.price, 0);

  SELECT c.id INTO v_customer_id FROM public.customers c
  WHERE c.store_id = p_store_id AND lower(trim(c.email)) = v_email LIMIT 1;

  IF v_customer_id IS NULL THEN
    INSERT INTO public.customers (store_id, email, name, full_name, phone)
    VALUES (p_store_id, v_email, trim(p_customer_name), trim(p_customer_name), NULLIF(trim(p_customer_phone), ''))
    RETURNING id INTO v_customer_id;
  ELSE
    UPDATE public.customers SET name = COALESCE(NULLIF(trim(name), ''), trim(p_customer_name)),
      phone = COALESCE(NULLIF(trim(p_customer_phone), ''), phone), updated_at = now()
    WHERE id = v_customer_id;
  END IF;

  IF p_coupon_code IS NOT NULL AND trim(p_coupon_code) <> '' THEN
    SELECT * INTO v_promo_validation FROM public.validate_unified_promotion(
      trim(p_coupon_code), p_store_id, ARRAY[p_product_id], NULL, NULL, v_base_price, v_customer_id, false
    );
    IF v_promo_validation.valid THEN
      v_promo_discount := COALESCE(v_promo_validation.discount_amount, 0);
      v_promotion_id := v_promo_validation.promotion_id;
    END IF;
  END IF;

  IF p_gift_card_id IS NOT NULL AND COALESCE(p_gift_card_amount_requested, 0) > 0 THEN
    SELECT * INTO v_gift_card_validation FROM public.validate_gift_card(p_store_id, (SELECT code FROM public.gift_cards WHERE id = p_gift_card_id LIMIT 1));
    IF v_gift_card_validation.is_valid THEN
      v_gift_card_discount := LEAST(p_gift_card_amount_requested, v_gift_card_validation.current_balance);
    END IF;
  END IF;

  v_final_amount := GREATEST(0, v_base_price - v_promo_discount - v_gift_card_discount);

  SELECT public.generate_order_number() INTO v_order_number;
  IF v_order_number IS NULL OR trim(v_order_number) = '' THEN
    v_order_number := 'ORD-' || to_char(now(), 'YYYYMMDDHH24MISS');
  END IF;

  INSERT INTO public.orders (
    store_id, customer_id, order_number, total_amount, currency,
    payment_status, status, affiliate_tracking_cookie, metadata
  ) VALUES (
    p_store_id, v_customer_id, v_order_number, v_final_amount, COALESCE(v_product.currency, 'XOF'),
    'pending', 'pending', p_affiliate_tracking_cookie,
    jsonb_build_object('customer_email', v_email, 'guest_checkout', COALESCE(p_guest_checkout, true))
  ) RETURNING id INTO v_order_id;

  INSERT INTO public.order_items (
    order_id, product_id, product_type, course_id,
    product_name, quantity, unit_price, total_price
  ) VALUES (
    v_order_id, p_product_id, 'course', v_course_id,
    v_product.name, 1, v_base_price, v_base_price
  ) RETURNING id INTO v_order_item_id;

  IF v_promotion_id IS NOT NULL THEN
    INSERT INTO public.promotion_usage (promotion_id, order_id, customer_id, discount_amount, order_total_before_discount, order_total_after_discount)
    VALUES (v_promotion_id, v_order_id, v_customer_id, v_promo_discount, v_base_price, v_final_amount);
  END IF;

  IF p_gift_card_id IS NOT NULL AND v_gift_card_discount > 0 THEN
    PERFORM public.redeem_gift_card(p_gift_card_id, v_order_id, v_gift_card_discount);
  END IF;

  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'order_item_id', v_order_item_id,
    'order_number', v_order_number,
    'customer_id', v_customer_id,
    'course_id', v_course_id,
    'total_amount', v_final_amount
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.create_public_course_order TO anon, authenticated;

-- ============================================================================
-- 3. ARTIST ORDER
-- ============================================================================
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
  v_final_amount NUMERIC(12, 2);
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
  SELECT c.id INTO v_customer_id FROM public.customers c WHERE c.store_id = p_store_id AND lower(trim(c.email)) = v_email LIMIT 1;
  IF v_customer_id IS NULL THEN
    INSERT INTO public.customers (store_id, email, name, full_name, phone)
    VALUES (p_store_id, v_email, trim(p_customer_name), trim(p_customer_name), NULLIF(trim(p_customer_phone), ''))
    RETURNING id INTO v_customer_id;
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

  INSERT INTO public.order_items (order_id, product_id, product_type, artist_product_id, product_name, quantity, unit_price, total_price)
  VALUES (v_order_id, p_product_id, 'artist', v_artist_id, v_product.name, 1, v_base_price, v_base_price) RETURNING id INTO v_order_item_id;

  IF v_promotion_id IS NOT NULL THEN INSERT INTO public.promotion_usage (promotion_id, order_id, customer_id, discount_amount, order_total_before_discount, order_total_after_discount) VALUES (v_promotion_id, v_order_id, v_customer_id, v_promo_discount, v_base_price, v_final_amount); END IF;
  IF p_gift_card_id IS NOT NULL AND v_gift_card_discount > 0 THEN PERFORM public.redeem_gift_card(p_gift_card_id, v_order_id, v_gift_card_discount); END IF;

  RETURN jsonb_build_object('order_id', v_order_id, 'order_item_id', v_order_item_id, 'order_number', v_order_number, 'customer_id', v_customer_id, 'total_amount', v_final_amount);
END;
$$;
GRANT EXECUTE ON FUNCTION public.create_public_artist_order TO anon, authenticated;

-- ============================================================================
-- 4. SERVICE ORDER
-- ============================================================================
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
  v_service_id UUID;
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
BEGIN
  v_email := lower(trim(p_customer_email));
  IF v_email IS NULL OR v_email !~* '^[^@]+@[^@]+\.[^@]+$' THEN RAISE EXCEPTION 'Email client invalide'; END IF;

  SELECT * INTO v_product FROM public.products
  WHERE id = p_product_id AND store_id = p_store_id AND product_type = 'service'
    AND COALESCE(is_active, true) = true AND COALESCE(is_draft, false) = false;

  IF NOT FOUND THEN RAISE EXCEPTION 'Produit introuvable'; END IF;
  SELECT id INTO v_service_id FROM public.service_products WHERE product_id = p_product_id LIMIT 1;

  v_base_price := COALESCE(NULLIF(v_product.promotional_price, 0), v_product.price, 0);
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
  VALUES (v_order_id, p_product_id, 'service', v_service_id, v_product.name, 1, v_base_price, v_base_price, COALESCE(p_service_metadata, '{}'::jsonb)) RETURNING id INTO v_order_item_id;

  IF v_promotion_id IS NOT NULL THEN INSERT INTO public.promotion_usage (promotion_id, order_id, customer_id, discount_amount, order_total_before_discount, order_total_after_discount) VALUES (v_promotion_id, v_order_id, v_customer_id, v_promo_discount, v_base_price, v_final_amount); END IF;
  IF p_gift_card_id IS NOT NULL AND v_gift_card_discount > 0 THEN PERFORM public.redeem_gift_card(p_gift_card_id, v_order_id, v_gift_card_discount); END IF;

  RETURN jsonb_build_object('order_id', v_order_id, 'order_item_id', v_order_item_id, 'order_number', v_order_number, 'customer_id', v_customer_id, 'total_amount', v_final_amount);
END;
$$;
GRANT EXECUTE ON FUNCTION public.create_public_service_order TO anon, authenticated;

-- ============================================================================
-- 5. SUPPRESSION DES POLITIQUES VULNÉRABLES (DROP RLS)
-- ============================================================================

-- Commandes: On supprime les droits d'insertion pour tous les utilisateurs non-admins
DROP POLICY IF EXISTS "orders_insert_policy" ON public.orders;
DROP POLICY IF EXISTS "Store owners can create orders" ON public.orders;

-- On autorise uniquement les store_owners à créer des commandes dans le backoffice
CREATE POLICY "Store owners can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Order Items: On supprime les droits d'insertion
DROP POLICY IF EXISTS "order_items_insert_policy" ON public.order_items;
DROP POLICY IF EXISTS "Store owners can insert order_items" ON public.order_items;

CREATE POLICY "Store owners can insert order_items"
  ON public.order_items FOR INSERT
  WITH CHECK (
    order_id IN (
      SELECT id FROM orders WHERE store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

COMMIT;
