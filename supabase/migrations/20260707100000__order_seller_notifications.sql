-- Notifications vendeur + emails récap COD / commandes confirmées

BEGIN;

CREATE EXTENSION IF NOT EXISTS pg_net;

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
    'seller_notified_at', now()
  )
  WHERE id = p_order_id;
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
    PERFORM public.notify_store_owner_new_order(NEW.id);
  ELSIF TG_OP = 'UPDATE'
    AND NEW.payment_status IN ('paid', 'completed', 'cod_pending')
    AND COALESCE(OLD.payment_status, '') IS DISTINCT FROM NEW.payment_status THEN
    PERFORM public.notify_store_owner_new_order(NEW.id);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_store_owner_new_order_trigger ON public.orders;

CREATE TRIGGER notify_store_owner_new_order_trigger
  AFTER INSERT OR UPDATE OF payment_status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_notify_store_owner_new_order();

-- Backfill notification vendeur pour la commande COD test
SELECT public.notify_store_owner_new_order('38a9d052-b6a5-4466-9380-7b4f8ee7f737'::uuid);

COMMIT;
