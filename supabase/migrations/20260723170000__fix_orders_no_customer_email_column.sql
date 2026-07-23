-- Hotfix: orders has no customer_email column (email on customers / metadata)
-- Blocks create_public_physical_order: record 'v_order' has no field 'customer_email'

BEGIN;

CREATE OR REPLACE FUNCTION public.notify_store_owner_new_order(p_order_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_store_owner_id UUID;
  v_store_name TEXT;
  v_customer_name TEXT;
  v_customer_email TEXT;
  v_customer_phone TEXT;
  v_total TEXT;
  v_notif_type TEXT;
  v_message TEXT;
  v_product_name TEXT;
  v_product_type TEXT;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF v_order.payment_status NOT IN ('paid', 'completed', 'cod_pending') THEN
    RETURN;
  END IF;

  IF COALESCE((v_order.metadata->>'seller_notified_at'), '') <> '' THEN
    RETURN;
  END IF;

  SELECT s.user_id, s.name
  INTO v_store_owner_id, v_store_name
  FROM public.stores s
  WHERE s.id = v_order.store_id;

  IF v_store_owner_id IS NULL THEN
    RETURN;
  END IF;

  SELECT
    COALESCE(c.full_name, c.name, 'Client'),
    COALESCE(
      NULLIF(trim(c.email), ''),
      NULLIF(trim(v_order.metadata->>'customer_email'), ''),
      ''
    ),
    COALESCE(c.phone, '')
  INTO v_customer_name, v_customer_email, v_customer_phone
  FROM public.customers c
  WHERE c.id = v_order.customer_id;

  IF v_customer_name IS NULL THEN
    v_customer_name := 'Client';
    v_customer_email := COALESCE(NULLIF(trim(v_order.metadata->>'customer_email'), ''), '');
    v_customer_phone := '';
  END IF;

  SELECT
    COALESCE(oi.product_name, p.name, 'Produit'),
    COALESCE(oi.product_type, p.product_type, 'unknown')
  INTO v_product_name, v_product_type
  FROM public.order_items oi
  LEFT JOIN public.products p ON p.id = oi.product_id
  WHERE oi.order_id = v_order.id
  ORDER BY oi.id ASC
  LIMIT 1;

  v_total := COALESCE(v_order.total_amount::text, '0') || ' ' || COALESCE(v_order.currency, 'XOF');

  v_notif_type := CASE
    WHEN v_order.payment_status = 'cod_pending' THEN 'physical_product_order_placed'
    WHEN COALESCE(v_product_type, '') = 'physical' THEN 'physical_order_paid'
    ELSE 'order_payment_received'
  END;

  v_message := COALESCE(v_customer_name, 'Un client') || ' — ' || v_total;
  IF COALESCE(v_product_name, '') <> '' THEN
    v_message := v_message || ' · ' || v_product_name;
  END IF;
  IF v_customer_email <> '' THEN
    v_message := v_message || ' · ' || v_customer_email;
  END IF;
  IF v_customer_phone <> '' THEN
    v_message := v_message || ' · ' || v_customer_phone;
  END IF;
  IF v_order.payment_status = 'cod_pending' THEN
    v_message := v_message || ' (paiement à la livraison)';
  END IF;

  INSERT INTO public.notifications (
    user_id, type, title, message, metadata, priority, is_read, action_url, action_label
  )
  VALUES (
    v_store_owner_id,
    v_notif_type,
    '🛒 Nouvelle commande ' || COALESCE(v_order.order_number, ''),
    v_message,
    jsonb_build_object(
      'order_id', v_order.id,
      'order_number', v_order.order_number,
      'store_id', v_order.store_id,
      'store_name', v_store_name,
      'payment_status', v_order.payment_status,
      'total_amount', v_order.total_amount,
      'currency', v_order.currency,
      'customer_name', v_customer_name,
      'customer_email', NULLIF(v_customer_email, ''),
      'customer_phone', NULLIF(v_customer_phone, ''),
      'product_name', NULLIF(COALESCE(v_product_name, ''), ''),
      'product_type', NULLIF(COALESCE(v_product_type, ''), '')
    ),
    'high',
    false,
    '/dashboard/orders?order=' || v_order.id::text,
    'Voir la commande'
  );

  UPDATE public.orders
  SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
    'seller_notified_at', now(),
    'seller_notified_payment_status', v_order.payment_status
  )
  WHERE id = p_order_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_store_owner_payment_failed(p_order_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_store_owner_id UUID;
  v_store_name TEXT;
  v_customer_name TEXT;
  v_customer_email TEXT;
  v_customer_phone TEXT;
  v_total TEXT;
  v_message TEXT;
  v_product_name TEXT;
  v_product_type TEXT;
  v_notif_type TEXT;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF v_order.payment_status NOT IN ('failed', 'cancelled') THEN
    RETURN;
  END IF;

  IF COALESCE((v_order.metadata->>'seller_failed_notified_at'), '') <> '' THEN
    RETURN;
  END IF;

  SELECT s.user_id, s.name
  INTO v_store_owner_id, v_store_name
  FROM public.stores s
  WHERE s.id = v_order.store_id;

  IF v_store_owner_id IS NULL THEN
    RETURN;
  END IF;

  SELECT
    COALESCE(c.full_name, c.name, 'Client'),
    COALESCE(
      NULLIF(trim(c.email), ''),
      NULLIF(trim(v_order.metadata->>'customer_email'), ''),
      ''
    ),
    COALESCE(c.phone, '')
  INTO v_customer_name, v_customer_email, v_customer_phone
  FROM public.customers c
  WHERE c.id = v_order.customer_id;

  IF v_customer_name IS NULL THEN
    v_customer_name := 'Client';
    v_customer_email := COALESCE(NULLIF(trim(v_order.metadata->>'customer_email'), ''), '');
    v_customer_phone := '';
  END IF;

  SELECT
    COALESCE(oi.product_name, p.name, 'Produit'),
    COALESCE(oi.product_type, p.product_type, 'unknown')
  INTO v_product_name, v_product_type
  FROM public.order_items oi
  LEFT JOIN public.products p ON p.id = oi.product_id
  WHERE oi.order_id = v_order.id
  ORDER BY oi.id ASC
  LIMIT 1;

  v_total := COALESCE(v_order.total_amount::text, '0') || ' ' || COALESCE(v_order.currency, 'XOF');
  v_notif_type := CASE
    WHEN COALESCE(v_product_type, '') = 'physical' THEN 'physical_order_failed'
    ELSE 'order_payment_failed'
  END;

  v_message := COALESCE(v_customer_name, 'Un client') || ' — paiement échoué · ' || v_total;
  IF COALESCE(v_product_name, '') <> '' THEN
    v_message := v_message || ' · ' || v_product_name;
  END IF;
  IF v_customer_email <> '' THEN
    v_message := v_message || ' · ' || v_customer_email;
  END IF;
  IF v_customer_phone <> '' THEN
    v_message := v_message || ' · ' || v_customer_phone;
  END IF;

  INSERT INTO public.notifications (
    user_id, type, title, message, metadata, priority, is_read, action_url, action_label
  )
  VALUES (
    v_store_owner_id,
    v_notif_type,
    '❌ Paiement échoué ' || COALESCE(v_order.order_number, ''),
    v_message,
    jsonb_build_object(
      'order_id', v_order.id,
      'order_number', v_order.order_number,
      'store_id', v_order.store_id,
      'store_name', v_store_name,
      'payment_status', v_order.payment_status,
      'total_amount', v_order.total_amount,
      'currency', v_order.currency,
      'customer_name', v_customer_name,
      'customer_email', NULLIF(v_customer_email, ''),
      'customer_phone', NULLIF(v_customer_phone, ''),
      'product_name', NULLIF(COALESCE(v_product_name, ''), ''),
      'product_type', NULLIF(COALESCE(v_product_type, ''), '')
    ),
    'high',
    false,
    '/dashboard/orders?order=' || v_order.id::text,
    'Voir la commande'
  );

  UPDATE public.orders
  SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
    'seller_failed_notified_at', now(),
    'seller_failed_notified_payment_status', v_order.payment_status
  )
  WHERE id = p_order_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.enqueue_order_confirmation_emails()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_supabase_url TEXT;
  v_service_key TEXT;
  v_internal_secret TEXT;
  v_customer_email TEXT;
  v_customer_name TEXT;
  v_metadata JSONB;
BEGIN
  IF NEW.payment_status NOT IN ('paid', 'completed', 'cod_pending') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE'
    AND COALESCE(OLD.payment_status, '') IS NOT DISTINCT FROM NEW.payment_status THEN
    RETURN NEW;
  END IF;

  v_metadata := COALESCE(NEW.metadata, '{}'::jsonb);

  IF COALESCE(v_metadata->>'confirmation_email_sent_at', '') <> ''
     AND COALESCE(v_metadata->>'seller_order_email_sent_at', '') <> '' THEN
    RETURN NEW;
  END IF;

  SELECT
    COALESCE(
      NULLIF(trim(c.email), ''),
      NULLIF(trim(v_metadata->>'customer_email'), ''),
      ''
    ),
    COALESCE(c.full_name, c.name, 'Client')
  INTO v_customer_email, v_customer_name
  FROM public.customers c
  WHERE c.id = NEW.customer_id;

  IF v_customer_email IS NULL THEN
    v_customer_email := COALESCE(NULLIF(trim(v_metadata->>'customer_email'), ''), '');
    v_customer_name := 'Client';
  END IF;

  SELECT c.supabase_url, c.service_role_key, c.edge_internal_secret
  INTO v_supabase_url, v_service_key, v_internal_secret
  FROM private.welcome_email_hook_config c
  WHERE c.id = 1;

  IF v_supabase_url IS NULL OR v_service_key IS NULL THEN
    RAISE WARNING 'enqueue_order_confirmation_emails: welcome_email_hook_config missing for order %', NEW.id;
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := rtrim(v_supabase_url, '/') || '/functions/v1/send-order-confirmation-email',
    headers := jsonb_strip_nulls(
      jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_service_key,
        'x-internal-secret', v_internal_secret
      )
    ),
    body := jsonb_build_object(
      'order_id', NEW.id,
      'customer_email', COALESCE(NULLIF(v_customer_email, ''), 'noreply@mail.emarzona.com'),
      'customer_name', COALESCE(v_customer_name, 'Client'),
      'customer_id', NEW.customer_id,
      'seller_only', (v_customer_email IS NULL OR v_customer_email = '')
    )
  );

  RETURN NEW;
END;
$$;

-- Only change: NEW.customer_email → metadata (keep rest identical to 20260723051000)
CREATE OR REPLACE FUNCTION public.fulfill_digital_order_items_on_paid()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
    c.email,
    COALESCE(NULLIF(TRIM(c.name), ''), 'Client')
  INTO v_customer_email, v_customer_name
  FROM public.customers c
  WHERE c.id = NEW.customer_id;

  v_user_id := NULL;
  IF NEW.metadata IS NOT NULL AND (NEW.metadata ? 'checkout_user_id') THEN
    BEGIN
      v_user_id := (NEW.metadata->>'checkout_user_id')::uuid;
    EXCEPTION WHEN OTHERS THEN
      v_user_id := NULL;
    END;
  END IF;

  IF v_user_id IS NULL AND NEW.customer_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM auth.users u WHERE u.id = NEW.customer_id) THEN
      v_user_id := NEW.customer_id;
    END IF;
  END IF;

  IF v_customer_email IS NULL OR trim(v_customer_email) = '' THEN
    v_customer_email := NULLIF(trim(COALESCE(NEW.metadata->>'customer_email', '')), '');
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
      id,
      license_type,
      max_activations,
      auto_generate_keys
    INTO dp
    FROM public.digital_products
    WHERE id = item.digital_product_id;

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
$function$;

COMMIT;
