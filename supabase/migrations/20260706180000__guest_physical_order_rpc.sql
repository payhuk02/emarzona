-- Commande produit physique depuis marketplace / checkout invité (SECURITY DEFINER)

BEGIN;

CREATE OR REPLACE FUNCTION public.create_public_physical_order(
  p_product_id UUID,
  p_store_id UUID,
  p_customer_email TEXT,
  p_customer_name TEXT,
  p_customer_phone TEXT DEFAULT NULL,
  p_quantity INTEGER DEFAULT 1,
  p_variant_id UUID DEFAULT NULL,
  p_checkout_method TEXT DEFAULT NULL,
  p_shipping_address JSONB DEFAULT '{}'::jsonb,
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
  v_physical_id UUID;
  v_customer_id UUID;
  v_order_id UUID;
  v_order_item_id UUID;
  v_order_number TEXT;
  v_unit_price NUMERIC(12, 2);
  v_total_price NUMERIC(12, 2);
  v_qty INTEGER;
  v_checkout_method TEXT;
  v_is_cod BOOLEAN;
  v_payment_type TEXT;
  v_percentage_rate INTEGER;
  v_percentage_paid NUMERIC(12, 2) := 0;
  v_remaining_amount NUMERIC(12, 2) := 0;
  v_inventory_id TEXT;
  v_item_meta JSONB;
  v_variant_available BOOLEAN;
BEGIN
  v_email := lower(trim(p_customer_email));
  IF v_email IS NULL OR v_email !~* '^[^@]+@[^@]+\.[^@]+$' THEN
    RAISE EXCEPTION 'Email client invalide';
  END IF;

  IF p_customer_name IS NULL OR trim(p_customer_name) = '' THEN
    RAISE EXCEPTION 'Nom client requis';
  END IF;

  v_qty := GREATEST(COALESCE(p_quantity, 1), 1);

  SELECT * INTO v_product
  FROM public.products
  WHERE id = p_product_id
    AND store_id = p_store_id
    AND product_type = 'physical'
    AND COALESCE(is_active, true) = true
    AND COALESCE(is_draft, false) = false;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produit physique introuvable ou indisponible';
  END IF;

  SELECT pp.id INTO v_physical_id
  FROM public.physical_products pp
  WHERE pp.product_id = p_product_id
  LIMIT 1;

  IF v_physical_id IS NULL THEN
    RAISE EXCEPTION 'Produit physique introuvable';
  END IF;

  v_checkout_method := COALESCE(
    NULLIF(trim(p_checkout_method), ''),
    NULLIF(v_product.payment_options->>'checkout_method', ''),
    'online'
  );
  IF v_checkout_method <> 'cash_on_delivery' THEN
    v_checkout_method := 'online';
  END IF;
  v_is_cod := v_checkout_method = 'cash_on_delivery';

  v_payment_type := COALESCE(NULLIF(v_product.payment_options->>'payment_type', ''), 'full');
  IF v_is_cod THEN
    v_payment_type := 'full';
  END IF;

  v_percentage_rate := COALESCE((v_product.payment_options->>'percentage_rate')::INTEGER, 30);

  v_unit_price := COALESCE(NULLIF(v_product.promotional_price, 0), v_product.price, 0);

  IF p_variant_id IS NOT NULL THEN
    SELECT
      ppv.price,
      COALESCE(ppv.is_available, true)
    INTO v_unit_price, v_variant_available
    FROM public.physical_product_variants ppv
    WHERE ppv.id = p_variant_id
      AND ppv.physical_product_id = v_physical_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Variante introuvable';
    END IF;

    IF v_variant_available = false THEN
      RAISE EXCEPTION 'Variante non disponible';
    END IF;
  END IF;

  v_total_price := v_unit_price * v_qty;

  IF v_payment_type = 'percentage' AND NOT v_is_cod THEN
    v_percentage_paid := round((v_total_price * v_percentage_rate) / 100, 2);
    v_remaining_amount := v_total_price - v_percentage_paid;
  ELSIF v_payment_type = 'delivery_secured' AND NOT v_is_cod THEN
    v_percentage_paid := 0;
    v_remaining_amount := 0;
  END IF;

  SELECT c.id INTO v_customer_id
  FROM public.customers c
  WHERE c.store_id = p_store_id
    AND lower(trim(c.email)) = v_email
  LIMIT 1;

  IF v_customer_id IS NULL THEN
    INSERT INTO public.customers (
      store_id,
      email,
      name,
      full_name,
      phone,
      address,
      city,
      country
    )
    VALUES (
      p_store_id,
      v_email,
      trim(p_customer_name),
      trim(p_customer_name),
      NULLIF(trim(p_customer_phone), ''),
      COALESCE(p_shipping_address->>'street', NULL),
      COALESCE(p_shipping_address->>'city', NULL),
      COALESCE(p_shipping_address->>'country', NULL)
    )
    RETURNING id INTO v_customer_id;
  ELSE
    UPDATE public.customers
    SET
      name = COALESCE(NULLIF(trim(name), ''), trim(p_customer_name)),
      full_name = COALESCE(NULLIF(trim(full_name), ''), trim(p_customer_name)),
      phone = COALESCE(NULLIF(trim(p_customer_phone), ''), phone),
      address = COALESCE(p_shipping_address->>'street', address),
      city = COALESCE(p_shipping_address->>'city', city),
      country = COALESCE(p_shipping_address->>'country', country),
      updated_at = now()
    WHERE id = v_customer_id;
  END IF;

  SELECT public.generate_order_number() INTO v_order_number;
  IF v_order_number IS NULL OR trim(v_order_number) = '' THEN
    v_order_number := 'ORD-' || to_char(now(), 'YYYYMMDDHH24MISS');
  END IF;

  INSERT INTO public.orders (
    store_id,
    customer_id,
    order_number,
    total_amount,
    currency,
    payment_status,
    status,
    delivery_status,
    payment_type,
    percentage_paid,
    remaining_amount,
    affiliate_tracking_cookie,
    metadata
  )
  VALUES (
    p_store_id,
    v_customer_id,
    v_order_number,
    v_total_price,
    COALESCE(v_product.currency, 'XOF'),
    CASE WHEN v_is_cod THEN 'cod_pending' ELSE 'pending' END,
    CASE WHEN v_is_cod THEN 'confirmed' ELSE 'pending' END,
    'pending',
    v_payment_type,
    v_percentage_paid,
    v_remaining_amount,
    p_affiliate_tracking_cookie,
    jsonb_build_object(
      'checkout_method', v_checkout_method,
      'guest_checkout', COALESCE(p_guest_checkout, true),
      'customer_email', v_email,
      'shipping_address', p_shipping_address
    )
  )
  RETURNING id INTO v_order_id;

  v_item_meta := jsonb_build_object(
    'shipping_address', p_shipping_address,
    'guest_checkout', COALESCE(p_guest_checkout, true)
  );

  INSERT INTO public.order_items (
    order_id,
    product_id,
    product_type,
    physical_product_id,
    variant_id,
    product_name,
    quantity,
    unit_price,
    total_price,
    item_metadata
  )
  VALUES (
    v_order_id,
    p_product_id,
    'physical',
    v_physical_id,
    p_variant_id,
    v_product.name,
    v_qty,
    v_unit_price,
    v_total_price,
    v_item_meta
  )
  RETURNING id INTO v_order_item_id;

  PERFORM public.reserve_physical_inventory_for_order(v_order_id);

  SELECT oi.item_metadata->>'inventory_id'
  INTO v_inventory_id
  FROM public.order_items oi
  WHERE oi.id = v_order_item_id;

  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_order_number,
    'order_item_id', v_order_item_id,
    'inventory_id', v_inventory_id,
    'cash_on_delivery', v_is_cod,
    'total_amount', v_total_price,
    'currency', COALESCE(v_product.currency, 'XOF'),
    'customer_id', v_customer_id
  );
EXCEPTION
  WHEN OTHERS THEN
    IF v_order_id IS NOT NULL THEN
      BEGIN
        PERFORM public.release_physical_inventory_for_order(v_order_id);
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END;
    END IF;
    RAISE;
END;
$$;

COMMENT ON FUNCTION public.create_public_physical_order IS
  'Crée client + commande + ligne physical + réservation stock pour achat marketplace (invité ou connecté).';

GRANT EXECUTE ON FUNCTION public.create_public_physical_order(
  UUID, UUID, TEXT, TEXT, TEXT, INTEGER, UUID, TEXT, JSONB, TEXT, BOOLEAN
) TO anon, authenticated;

GRANT EXECUTE ON FUNCTION public.generate_order_number() TO anon, authenticated;

COMMIT;
