-- Seller notifications: enrich success (customer details) + notify on payment failed
-- Fix seller-order-notification template so digital/service/course/artist emails resolve

BEGIN;

-- 1) Seller success template: product_type NULL = all verticals
UPDATE public.email_templates
SET product_type = NULL,
    updated_at = now()
WHERE slug = 'seller-order-notification'
  AND product_type IS DISTINCT FROM NULL;

-- 2) Seller payment-failed template
INSERT INTO public.email_templates (
  slug,
  name,
  category,
  subject,
  html_content,
  text_content,
  from_email,
  from_name,
  product_type,
  is_active,
  variables
)
SELECT
  'seller-payment-failed',
  'Notification vendeur — paiement échoué',
  'transactional',
  jsonb_build_object(
    'fr', 'Paiement échoué #{{order_number}} — {{product_name}}',
    'en', 'Payment failed #{{order_number}} — {{product_name}}'
  ),
  jsonb_build_object(
    'fr',
    '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937;max-width:600px;margin:0 auto;padding:20px"><h1 style="color:#dc2626">Paiement échoué</h1><p>Bonjour {{seller_name}},</p><p>Un client a tenté d''acheter sur <strong>{{store_name}}</strong> mais le paiement n''a pas abouti.</p><table width="100%" cellpadding="10" cellspacing="0" style="border-collapse:collapse;background:#fef2f2;border:1px solid #fecaca;margin:16px 0"><tr><td style="color:#64748b">Commande</td><td style="font-weight:600;text-align:right">#{{order_number}}</td></tr><tr><td style="color:#64748b">Produit</td><td style="font-weight:600;text-align:right">{{product_name}}</td></tr><tr><td style="color:#64748b">Client</td><td style="font-weight:600;text-align:right">{{customer_name}}</td></tr><tr><td style="color:#64748b">Email</td><td style="font-weight:600;text-align:right">{{customer_email}}</td></tr><tr><td style="color:#64748b">Téléphone</td><td style="font-weight:600;text-align:right">{{customer_phone}}</td></tr><tr><td style="color:#64748b">Montant</td><td style="font-weight:600;text-align:right">{{total_amount}} {{currency}}</td></tr><tr><td style="color:#64748b">Statut</td><td style="font-weight:600;text-align:right">{{payment_status}}</td></tr></table><p style="text-align:center"><a href="{{dashboard_link}}" style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:700">Voir la commande</a>{{#if whatsapp_customer_link}} <a href="{{whatsapp_customer_link}}" style="display:inline-block;padding:12px 20px;background:#16a34a;color:#fff;text-decoration:none;border-radius:8px;font-weight:700">Contacter le client</a>{{/if}}</p><p>Cordialement,<br>L''équipe Emarzona</p></body></html>',
    'en',
    '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937;max-width:600px;margin:0 auto;padding:20px"><h1 style="color:#dc2626">Payment failed</h1><p>Hello {{seller_name}},</p><p>A customer tried to buy on <strong>{{store_name}}</strong> but payment did not complete.</p><table width="100%" cellpadding="10" cellspacing="0" style="border-collapse:collapse;background:#fef2f2;border:1px solid #fecaca;margin:16px 0"><tr><td style="color:#64748b">Order</td><td style="font-weight:600;text-align:right">#{{order_number}}</td></tr><tr><td style="color:#64748b">Product</td><td style="font-weight:600;text-align:right">{{product_name}}</td></tr><tr><td style="color:#64748b">Customer</td><td style="font-weight:600;text-align:right">{{customer_name}}</td></tr><tr><td style="color:#64748b">Email</td><td style="font-weight:600;text-align:right">{{customer_email}}</td></tr><tr><td style="color:#64748b">Phone</td><td style="font-weight:600;text-align:right">{{customer_phone}}</td></tr><tr><td style="color:#64748b">Amount</td><td style="font-weight:600;text-align:right">{{total_amount}} {{currency}}</td></tr><tr><td style="color:#64748b">Status</td><td style="font-weight:600;text-align:right">{{payment_status}}</td></tr></table><p style="text-align:center"><a href="{{dashboard_link}}" style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:700">View order</a></p><p>Best regards,<br>The Emarzona team</p></body></html>'
  ),
  NULL,
  'noreply@mail.emarzona.com',
  'Emarzona',
  NULL,
  true,
  '["{{seller_name}}","{{store_name}}","{{order_number}}","{{product_name}}","{{customer_name}}","{{customer_email}}","{{customer_phone}}","{{total_amount}}","{{currency}}","{{payment_status}}","{{dashboard_link}}","{{whatsapp_customer_link}}"]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.email_templates WHERE slug = 'seller-payment-failed'
);

-- 3) Enrich success in-app notification with customer contact details
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

  v_total := COALESCE(v_order.total_amount::text, '0') || ' ' || COALESCE(v_order.currency, 'XOF');

  v_notif_type := CASE
    WHEN v_order.payment_status = 'cod_pending' THEN 'physical_product_order_placed'
    ELSE 'order_payment_received'
  END;

  v_message := COALESCE(v_customer_name, 'Un client') || ' — ' || v_total;
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
      'customer_phone', NULLIF(v_customer_phone, '')
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

-- 4) In-app + push (via insert trigger) when payment fails
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

  v_total := COALESCE(v_order.total_amount::text, '0') || ' ' || COALESCE(v_order.currency, 'XOF');
  v_message := COALESCE(v_customer_name, 'Un client') || ' — paiement échoué · ' || v_total;
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
    'order_payment_failed',
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
      'customer_phone', NULLIF(v_customer_phone, '')
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

COMMENT ON FUNCTION public.notify_store_owner_payment_failed(UUID) IS
  'In-app/push seller alert on payment failed/cancelled — includes customer name/email/phone';

CREATE OR REPLACE FUNCTION public.trigger_notify_store_owner_payment_failed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.payment_status IN ('failed', 'cancelled')
     AND (TG_OP = 'INSERT' OR COALESCE(OLD.payment_status, '') IS DISTINCT FROM NEW.payment_status)
  THEN
    PERFORM public.notify_store_owner_payment_failed(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_store_owner_payment_failed_trigger ON public.orders;
CREATE TRIGGER notify_store_owner_payment_failed_trigger
  AFTER INSERT OR UPDATE OF payment_status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_notify_store_owner_payment_failed();

-- 5) Enqueue confirmation even without customer email (seller email still needed)
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

  SELECT COALESCE(c.email, NEW.customer_email, ''), COALESCE(c.full_name, c.name, 'Client')
  INTO v_customer_email, v_customer_name
  FROM public.customers c
  WHERE c.id = NEW.customer_id;

  IF v_customer_email IS NULL THEN
    v_customer_email := COALESCE(NEW.customer_email, '');
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

-- 6) Enqueue seller payment-failed email
CREATE OR REPLACE FUNCTION public.enqueue_seller_payment_failed_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_supabase_url TEXT;
  v_service_key TEXT;
  v_internal_secret TEXT;
BEGIN
  IF NEW.payment_status NOT IN ('failed', 'cancelled') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE'
    AND COALESCE(OLD.payment_status, '') IS NOT DISTINCT FROM NEW.payment_status THEN
    RETURN NEW;
  END IF;

  IF COALESCE((NEW.metadata->>'seller_failed_email_sent_at'), '') <> '' THEN
    RETURN NEW;
  END IF;

  SELECT c.supabase_url, c.service_role_key, c.edge_internal_secret
  INTO v_supabase_url, v_service_key, v_internal_secret
  FROM private.welcome_email_hook_config c
  WHERE c.id = 1;

  IF v_supabase_url IS NULL OR v_service_key IS NULL THEN
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
      'customer_email', COALESCE(NEW.customer_email, 'noreply@mail.emarzona.com'),
      'customer_name', 'Client',
      'notify_seller_payment_failed', true
    )
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'enqueue_seller_payment_failed_email failed for order %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enqueue_seller_payment_failed_email_trigger ON public.orders;
CREATE TRIGGER enqueue_seller_payment_failed_email_trigger
  AFTER INSERT OR UPDATE OF payment_status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.enqueue_seller_payment_failed_email();

COMMIT;
