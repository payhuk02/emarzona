-- P0: Notifier le vendeur uniquement à commande confirmée (paid / completed / cod_pending)
-- Corrige la notification prématurée à l'INSERT pending qui bloquait l'alerte au paiement.

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
  v_total TEXT;
  v_notif_type TEXT;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Uniquement commandes confirmées (pas pending / failed / cancelled)
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

  SELECT COALESCE(c.full_name, c.name, 'Client')
  INTO v_customer_name
  FROM public.customers c
  WHERE c.id = v_order.customer_id;

  v_total := COALESCE(v_order.total_amount::text, '0') || ' ' || COALESCE(v_order.currency, 'XOF');

  v_notif_type := CASE
    WHEN v_order.payment_status = 'cod_pending' THEN 'physical_product_order_placed'
    ELSE 'order_payment_received'
  END;

  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    metadata,
    priority,
    is_read,
    action_url,
    action_label
  )
  VALUES (
    v_store_owner_id,
    v_notif_type,
    '🛒 Nouvelle commande ' || COALESCE(v_order.order_number, ''),
    COALESCE(v_customer_name, 'Un client') || ' — ' || v_total
      || CASE
        WHEN v_order.payment_status = 'cod_pending' THEN ' (paiement à la livraison)'
        ELSE ''
      END,
    jsonb_build_object(
      'order_id', v_order.id,
      'order_number', v_order.order_number,
      'store_id', v_order.store_id,
      'store_name', v_store_name,
      'payment_status', v_order.payment_status,
      'total_amount', v_order.total_amount,
      'currency', v_order.currency
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

COMMENT ON FUNCTION public.notify_store_owner_new_order(UUID) IS
  'Notification in-app/push vendeur — uniquement paid, completed ou cod_pending (idempotent via seller_notified_at)';

CREATE OR REPLACE FUNCTION public.trigger_notify_store_owner_new_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.payment_status IN ('paid', 'completed', 'cod_pending') THEN
      PERFORM public.notify_store_owner_new_order(NEW.id);
    END IF;
  ELSIF TG_OP = 'UPDATE'
    AND NEW.payment_status IN ('paid', 'completed', 'cod_pending')
    AND COALESCE(OLD.payment_status, '') IS DISTINCT FROM NEW.payment_status THEN
    PERFORM public.notify_store_owner_new_order(NEW.id);
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.trigger_notify_store_owner_new_order() IS
  'Déclenche notify_store_owner_new_order à la confirmation (pas à la création pending)';

COMMIT;
