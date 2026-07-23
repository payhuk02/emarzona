-- Harden Web Push delivery for seller order alerts (screen + sound when app closed)
-- - Sticky OS notifications (requireInteraction) for high/urgent & order types
-- - Explicit url for deep-link on click
-- - Stable tag = notification id (dedupe push + realtime)

BEGIN;

CREATE OR REPLACE FUNCTION public.trigger_send_push_notification_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, net
AS $$
DECLARE
  v_url text;
  v_supabase_url text;
  v_internal_secret text;
  v_prefs_sound boolean := true;
  v_prefs_vibrate boolean := true;
  v_prefs_intensity text := 'medium';
  v_prefs_push boolean := true;
  v_prefs_pause timestamptz;
  v_is_order_alert boolean := false;
  v_require_interaction boolean := false;
  v_action_url text;
BEGIN
  BEGIN
    SELECT
      sound_notifications,
      vibration_notifications,
      vibration_intensity,
      push_notifications,
      pause_until
    INTO
      v_prefs_sound,
      v_prefs_vibrate,
      v_prefs_intensity,
      v_prefs_push,
      v_prefs_pause
    FROM public.notification_preferences
    WHERE user_id = NEW.user_id;
  EXCEPTION WHEN OTHERS THEN
    v_prefs_sound := true;
    v_prefs_vibrate := true;
    v_prefs_intensity := 'medium';
    v_prefs_push := true;
    v_prefs_pause := NULL;
  END;

  IF v_prefs_pause IS NOT NULL AND v_prefs_pause > now() THEN
    RETURN NEW;
  END IF;

  IF v_prefs_push = false THEN
    RETURN NEW;
  END IF;

  v_is_order_alert := NEW.type IN (
    'order_payment_received',
    'order_payment_failed',
    'physical_product_order_placed',
    'physical_order_paid',
    'physical_order_failed'
  );

  v_require_interaction :=
    v_is_order_alert
    OR COALESCE(NEW.priority, 'normal') IN ('high', 'urgent');

  v_action_url := COALESCE(NULLIF(trim(NEW.action_url), ''), '/dashboard');

  BEGIN
    SELECT
      c.supabase_url,
      c.edge_internal_secret
    INTO v_supabase_url, v_internal_secret
    FROM private.welcome_email_hook_config c
    WHERE c.id = 1;
  EXCEPTION WHEN OTHERS THEN
    v_supabase_url := NULL;
    v_internal_secret := NULL;
  END;

  IF v_supabase_url IS NULL OR v_internal_secret IS NULL THEN
    v_supabase_url := nullif(trim(current_setting('app.settings.supabase_url', true)), '');
    v_internal_secret := nullif(trim(current_setting('app.settings.edge_internal_secret', true)), '');
  END IF;

  IF v_supabase_url IS NULL OR v_internal_secret IS NULL THEN
    RAISE WARNING 'Push notification skipped: configure app.settings.supabase_url and app.settings.edge_internal_secret';
    RETURN NEW;
  END IF;

  v_url := rtrim(v_supabase_url, '/') || '/functions/v1/send-push-notification';

  PERFORM net.http_post(
    url := v_url,
    headers := jsonb_strip_nulls(
      jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_internal_secret,
        'x-internal-secret', v_internal_secret
      )
    ),
    body := jsonb_build_object(
      'user_id', NEW.user_id::text,
      'title', NEW.title,
      'body', NEW.message,
      'tag', NEW.id::text,
      'url', v_action_url,
      'requireInteraction', v_require_interaction,
      'vibrate', CASE
        WHEN COALESCE(v_prefs_vibrate, true) = false THEN '[]'::jsonb
        WHEN v_prefs_intensity = 'light' THEN '[100, 50, 100]'::jsonb
        WHEN v_prefs_intensity = 'heavy' THEN '[300, 150, 300]'::jsonb
        ELSE '[200, 100, 200]'::jsonb
      END,
      'soundEnabled', COALESCE(v_prefs_sound, true),
      'vibrationEnabled', COALESCE(v_prefs_vibrate, true),
      'vibrationIntensity', COALESCE(v_prefs_intensity, 'medium'),
      'silent', NOT COALESCE(v_prefs_sound, true),
      'priority', CASE
        WHEN v_is_order_alert THEN 'urgent'
        ELSE COALESCE(NEW.priority, 'normal')
      END,
      'data', jsonb_build_object(
        'notification_id', NEW.id,
        'type', NEW.type,
        'action_url', v_action_url,
        'url', v_action_url,
        'metadata', NEW.metadata,
        'soundEnabled', COALESCE(v_prefs_sound, true),
        'vibrationEnabled', COALESCE(v_prefs_vibrate, true),
        'vibrationIntensity', COALESCE(v_prefs_intensity, 'medium'),
        'playPlatformSound', true,
        'requireInteraction', v_require_interaction
      )
    )
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Push notification http_post failed: %', SQLERRM;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.trigger_send_push_notification_on_insert() IS
  'Web Push via pg_net: sticky order alerts, deep-link url, prefer OS sound when app closed';

-- Enrich seller order alerts with product names (incl. physical)
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
    COALESCE(c.email, v_order.customer_email, ''),
    COALESCE(c.phone, '')
  INTO v_customer_name, v_customer_email, v_customer_phone
  FROM public.customers c
  WHERE c.id = v_order.customer_id;

  IF v_customer_name IS NULL THEN
    v_customer_name := 'Client';
    v_customer_email := COALESCE(v_order.customer_email, '');
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
    COALESCE(c.email, v_order.customer_email, ''),
    COALESCE(c.phone, '')
  INTO v_customer_name, v_customer_email, v_customer_phone
  FROM public.customers c
  WHERE c.id = v_order.customer_id;

  IF v_customer_name IS NULL THEN
    v_customer_name := 'Client';
    v_customer_email := COALESCE(v_order.customer_email, '');
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

COMMIT;
