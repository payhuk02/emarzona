-- Physical products: third checkout mode = guarantee deposit online, remainder on delivery.
-- Reuses orders.percentage_paid (amount due now) + remaining_amount.
-- After PSP success: payment_status = deposit_paid (not fully paid).

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
  v_subtotal NUMERIC(12, 2);
  v_platform_fee NUMERIC(12, 2) := 0;
  v_qty INTEGER;
  v_checkout_method TEXT;
  v_is_cod BOOLEAN;
  v_is_guarantee BOOLEAN;
  v_payment_type TEXT;
  v_percentage_rate INTEGER;
  v_percentage_paid NUMERIC(12, 2) := 0;
  v_remaining_amount NUMERIC(12, 2) := 0;
  v_guarantee_unit NUMERIC(12, 2) := 0;
  v_inventory_id TEXT;
  v_item_meta JSONB;
  v_variant_available BOOLEAN;
  v_currency TEXT;
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

  v_currency := COALESCE(v_product.currency, 'XOF');

  v_checkout_method := COALESCE(
    NULLIF(trim(p_checkout_method), ''),
    NULLIF(v_product.payment_options->>'checkout_method', ''),
    'online'
  );
  IF v_checkout_method NOT IN ('online', 'cash_on_delivery', 'guarantee') THEN
    v_checkout_method := 'online';
  END IF;
  v_is_cod := v_checkout_method = 'cash_on_delivery';
  v_is_guarantee := v_checkout_method = 'guarantee';

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

  v_subtotal := v_unit_price * v_qty;
  v_total_price := v_subtotal;
  v_platform_fee := 0;

  IF v_is_guarantee THEN
    v_guarantee_unit := COALESCE(NULLIF(v_product.payment_options->>'guarantee_amount', '')::NUMERIC, 0);
    IF v_guarantee_unit <= 0 OR v_guarantee_unit >= v_unit_price THEN
      RAISE EXCEPTION 'Montant de garantie invalide';
    END IF;
    -- CHECK orders.payment_type IN (full, percentage, delivery_secured)
    -- + webhook expected amount uses percentage_paid when payment_type = percentage
    v_payment_type := 'percentage';
    v_percentage_paid := ROUND(v_guarantee_unit * v_qty, 2);
    v_remaining_amount := v_total_price - v_percentage_paid;
  ELSIF v_payment_type = 'percentage' AND NOT v_is_cod THEN
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
      store_id, email, name, full_name, phone, address, city, country
    ) VALUES (
      p_store_id, v_email, trim(p_customer_name), trim(p_customer_name),
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
    store_id, customer_id, order_number, total_amount, currency,
    payment_status, status, delivery_status, payment_type,
    percentage_paid, remaining_amount, affiliate_tracking_cookie, metadata
  ) VALUES (
    p_store_id, v_customer_id, v_order_number, v_total_price, v_currency,
    CASE WHEN v_is_cod THEN 'cod_pending' ELSE 'pending' END,
    CASE WHEN v_is_cod THEN 'confirmed' ELSE 'pending' END,
    'pending', v_payment_type, v_percentage_paid, v_remaining_amount,
    p_affiliate_tracking_cookie,
    jsonb_build_object(
      'checkout_method', v_checkout_method,
      'guest_checkout', COALESCE(p_guest_checkout, true),
      'customer_email', v_email,
      'shipping_address', p_shipping_address,
      'subtotal', v_subtotal,
      'platform_fee', v_platform_fee,
      'guarantee_amount', v_guarantee_unit,
      'amount_due_now', CASE
        WHEN v_is_guarantee THEN v_percentage_paid
        WHEN v_is_cod THEN 0
        ELSE v_total_price
      END,
      'remaining_on_delivery', v_remaining_amount
    )
  )
  RETURNING id INTO v_order_id;

  v_item_meta := jsonb_build_object(
    'shipping_address', p_shipping_address,
    'guest_checkout', COALESCE(p_guest_checkout, true)
  );

  INSERT INTO public.order_items (
    order_id, product_id, product_type, physical_product_id, variant_id,
    product_name, quantity, unit_price, total_price, item_metadata
  ) VALUES (
    v_order_id, p_product_id, 'physical', v_physical_id, p_variant_id,
    v_product.name, v_qty, v_unit_price, v_subtotal, v_item_meta
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
    'guarantee', v_is_guarantee,
    'amount_due_now', CASE
      WHEN v_is_guarantee THEN v_percentage_paid
      WHEN v_is_cod THEN 0
      ELSE v_total_price
    END,
    'remaining_amount', v_remaining_amount,
    'total_amount', v_total_price,
    'subtotal', v_subtotal,
    'platform_fee', v_platform_fee,
    'currency', v_currency,
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
  'Checkout public produit physique — online / COD / garantie (acompte + solde livraison).';

GRANT EXECUTE ON FUNCTION public.create_public_physical_order(
  UUID, UUID, TEXT, TEXT, TEXT, INTEGER, UUID, TEXT, JSONB, TEXT, BOOLEAN
) TO anon, authenticated;

CREATE OR REPLACE FUNCTION process_moneroo_webhook_atomic(
    p_provider text,
    p_external_event_id text,
    p_event_type text,
    p_transaction_id uuid,
    p_payload jsonb,
    p_mapped_status text,
    p_provider_session_id text DEFAULT NULL,
    p_provider_payment_intent_id text DEFAULT NULL,
    p_connected_account_id text DEFAULT NULL,
    p_application_fee_amount numeric DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order_id uuid;
    v_transaction_status text;
    v_has_physical_product boolean;
    v_paid_order_status text;
    v_payment_status text;
    v_remaining numeric;
    v_checkout_method text;
BEGIN
    BEGIN
        INSERT INTO payment_webhook_events (
            provider,
            external_event_id,
            event_type,
            transaction_id,
            payload,
            processed_at
        ) VALUES (
            p_provider,
            p_external_event_id,
            p_event_type,
            p_transaction_id,
            p_payload,
            now()
        );
    EXCEPTION WHEN unique_violation THEN
        RETURN jsonb_build_object(
            'success', false,
            'reason', 'duplicate_webhook'
        );
    END;

    SELECT order_id, status
    INTO v_order_id, v_transaction_status
    FROM transactions
    WHERE id = p_transaction_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Transaction not found';
    END IF;

    IF v_transaction_status = 'completed' AND p_mapped_status = 'completed' THEN
        RETURN jsonb_build_object(
            'success', true,
            'already_completed', true,
            'order_id', v_order_id
        );
    END IF;

    UPDATE transactions SET
        status = p_mapped_status,
        completed_at = CASE WHEN p_mapped_status = 'completed' THEN now() ELSE completed_at END,
        updated_at = now(),
        webhook_processed_at = now(),
        last_webhook_payload = p_payload,
        provider_session_id = COALESCE(p_provider_session_id, provider_session_id),
        provider_payment_intent_id = COALESCE(p_provider_payment_intent_id, provider_payment_intent_id),
        connected_account_id = COALESCE(p_connected_account_id, connected_account_id),
        application_fee_amount = COALESCE(p_application_fee_amount, application_fee_amount),
        webhook_attempts = COALESCE(webhook_attempts, 0) + 1
    WHERE id = p_transaction_id;

    IF p_mapped_status = 'completed' AND v_order_id IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1 FROM order_items
            WHERE order_id = v_order_id AND product_type = 'physical'
        ) INTO v_has_physical_product;

        SELECT
            COALESCE(remaining_amount, 0),
            COALESCE(metadata->>'checkout_method', '')
        INTO v_remaining, v_checkout_method
        FROM orders
        WHERE id = v_order_id;

        IF v_has_physical_product THEN
            v_paid_order_status := 'confirmed';
        ELSE
            v_paid_order_status := 'completed';
        END IF;

        IF v_checkout_method = 'guarantee' AND COALESCE(v_remaining, 0) > 0 THEN
            v_payment_status := 'deposit_paid';
        ELSE
            v_payment_status := 'paid';
        END IF;

        UPDATE orders SET
            payment_status = v_payment_status,
            status = v_paid_order_status,
            updated_at = now()
        WHERE id = v_order_id;

        UPDATE payment_webhook_events
        SET order_id = v_order_id
        WHERE provider = p_provider AND external_event_id = p_external_event_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'already_completed', false,
        'order_id', v_order_id
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_notify_store_owner_new_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.payment_status IN ('paid', 'completed', 'cod_pending', 'deposit_paid') THEN
      PERFORM public.notify_store_owner_new_order(NEW.id);
    END IF;
  ELSIF TG_OP = 'UPDATE'
    AND NEW.payment_status IN ('paid', 'completed', 'cod_pending', 'deposit_paid')
    AND COALESCE(OLD.payment_status, '') IS DISTINCT FROM NEW.payment_status THEN
    PERFORM public.notify_store_owner_new_order(NEW.id);
  END IF;

  RETURN NEW;
END;
$$;

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

  IF v_order.payment_status NOT IN ('paid', 'completed', 'cod_pending', 'deposit_paid') THEN
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
    WHEN v_order.payment_status IN ('cod_pending', 'deposit_paid') THEN 'physical_product_order_placed'
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
  ELSIF v_order.payment_status = 'deposit_paid' THEN
    v_message := v_message
      || ' (garantie payée : '
      || COALESCE(v_order.percentage_paid::text, '0')
      || ' '
      || COALESCE(v_order.currency, 'XOF')
      || ' · reste à la livraison : '
      || COALESCE(v_order.remaining_amount::text, '0')
      || ' '
      || COALESCE(v_order.currency, 'XOF')
      || ')';
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
      'percentage_paid', v_order.percentage_paid,
      'remaining_amount', v_order.remaining_amount,
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
  IF NEW.payment_status NOT IN ('paid', 'completed', 'cod_pending', 'deposit_paid') THEN
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
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'enqueue_order_confirmation_emails failed for order %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- html_content / variables : JSONB dans le repo, TEXT en prod Payhuk.
DO $$
DECLARE
  v_html_type TEXT;
  v_var_type TEXT;
BEGIN
  SELECT c.data_type INTO v_html_type
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = 'email_templates'
    AND c.column_name = 'html_content';

  SELECT c.data_type INTO v_var_type
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = 'email_templates'
    AND c.column_name = 'variables';

  IF v_html_type IN ('jsonb', 'json') THEN
    UPDATE public.email_templates
    SET
      html_content = replace(
        html_content::text,
        '</table>',
        '{{payment_breakdown_html}}</table>'
      )::jsonb,
      updated_at = NOW()
    WHERE slug IN ('order-confirmation-physical', 'seller-order-notification')
      AND html_content::text NOT LIKE '%{{payment_breakdown_html}}%';
  ELSE
    UPDATE public.email_templates
    SET
      html_content = replace(
        html_content::text,
        '</table>',
        '{{payment_breakdown_html}}</table>'
      ),
      updated_at = NOW()
    WHERE slug IN ('order-confirmation-physical', 'seller-order-notification')
      AND html_content::text NOT LIKE '%{{payment_breakdown_html}}%';
  END IF;

  IF v_var_type IN ('jsonb', 'json') THEN
    UPDATE public.email_templates
    SET variables = COALESCE(variables::jsonb, '[]'::jsonb) || '[
      "{{amount_paid}}",
      "{{remaining_on_delivery}}",
      "{{order_total}}",
      "{{payment_status_label}}",
      "{{payment_breakdown_html}}"
    ]'::jsonb
    WHERE slug IN ('order-confirmation-physical', 'seller-order-notification')
      AND COALESCE(variables::text, '') NOT LIKE '%payment_breakdown_html%';
  END IF;
END;
$$;

COMMIT;

NOTIFY pgrst, 'reload schema';
