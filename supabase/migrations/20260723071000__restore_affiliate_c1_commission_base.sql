-- Restore C1 multi-item affiliate commissions + self-referral guard.
-- Replaces regression in 20260709040000 that used total_amount * 0.90
-- (which included buyer checkout fee 2%+100).

BEGIN;

CREATE OR REPLACE FUNCTION public._affiliate_commission_for_order_product(
  p_order public.orders,
  p_product_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_affiliate_click affiliate_clicks%ROWTYPE;
  v_affiliate_link affiliate_links%ROWTYPE;
  v_product_settings product_affiliate_settings%ROWTYPE;
  v_commission_base NUMERIC;
  v_commission_amount NUMERIC;
  v_platform_fee_rate NUMERIC := 0.10;
  v_item_total NUMERIC;
BEGIN
  IF p_product_id IS NULL THEN
    RETURN false;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.affiliate_commissions ac
    WHERE ac.order_id = p_order.id AND ac.product_id = p_product_id
  ) THEN
    RETURN false;
  END IF;

  IF p_order.affiliate_tracking_cookie IS NOT NULL THEN
    SELECT ac.* INTO v_affiliate_click
    FROM public.affiliate_clicks ac
    WHERE ac.tracking_cookie = p_order.affiliate_tracking_cookie
      AND ac.product_id = p_product_id
      AND ac.cookie_expires_at > now()
      AND ac.converted = false
    ORDER BY ac.clicked_at DESC
    LIMIT 1;
  END IF;

  IF v_affiliate_click IS NULL THEN
    SELECT ac.* INTO v_affiliate_click
    FROM public.affiliate_clicks ac
    WHERE ac.product_id = p_product_id
      AND ac.tracking_cookie IS NOT NULL
      AND ac.cookie_expires_at > now()
      AND ac.converted = false
    ORDER BY ac.clicked_at DESC
    LIMIT 1;
  END IF;

  IF v_affiliate_click IS NULL THEN
    RETURN false;
  END IF;

  SELECT * INTO v_affiliate_link
  FROM public.affiliate_links
  WHERE id = v_affiliate_click.affiliate_link_id AND status = 'active';

  IF v_affiliate_link IS NULL THEN
    RETURN false;
  END IF;

  SELECT * INTO v_product_settings
  FROM public.product_affiliate_settings
  WHERE product_id = p_product_id AND affiliate_enabled = true;

  IF v_product_settings IS NULL THEN
    RETURN false;
  END IF;

  -- Anti auto-affiliation (customer_id may be customers.id or auth user id)
  IF COALESCE(v_product_settings.allow_self_referral, false) = false THEN
    IF EXISTS (
      SELECT 1 FROM public.affiliates a
      WHERE a.id = v_affiliate_link.affiliate_id
        AND a.user_id IS NOT NULL
        AND (
          a.user_id = p_order.customer_id
          OR a.user_id IN (
            SELECT c.user_id FROM public.customers c
            WHERE c.id = p_order.customer_id AND c.user_id IS NOT NULL
          )
        )
    ) THEN
      RETURN false;
    END IF;
  END IF;

  SELECT COALESCE(
    NULLIF(oi.total_price, 0),
    COALESCE(oi.quantity, 1) * COALESCE(oi.unit_price, 0),
    0
  )
  INTO v_item_total
  FROM public.order_items oi
  WHERE oi.order_id = p_order.id AND oi.product_id = p_product_id
  LIMIT 1;

  IF v_item_total < COALESCE(v_product_settings.min_order_amount, 0) THEN
    RETURN false;
  END IF;

  -- Seller commission rate (NOT buyer checkout fee). Base excludes platform cut.
  v_platform_fee_rate := public.resolve_store_platform_fee_percent(p_order.store_id) / 100.0;
  v_commission_base := v_item_total * (1 - v_platform_fee_rate);

  IF v_product_settings.commission_type = 'percentage' THEN
    v_commission_amount := v_commission_base * (v_product_settings.commission_rate / 100);
  ELSE
    v_commission_amount := v_product_settings.fixed_commission_amount;
  END IF;

  IF v_product_settings.max_commission_per_sale IS NOT NULL THEN
    v_commission_amount := LEAST(v_commission_amount, v_product_settings.max_commission_per_sale);
  END IF;

  IF v_commission_amount IS NULL OR v_commission_amount <= 0 THEN
    RETURN false;
  END IF;

  INSERT INTO public.affiliate_commissions (
    affiliate_id, affiliate_link_id, product_id, store_id, order_id,
    order_total, commission_base, commission_rate, commission_type,
    commission_amount, status
  )
  VALUES (
    v_affiliate_link.affiliate_id,
    v_affiliate_link.id,
    p_product_id,
    v_affiliate_link.store_id,
    p_order.id,
    v_item_total,
    v_commission_base,
    v_product_settings.commission_rate,
    v_product_settings.commission_type,
    v_commission_amount,
    'pending'
  );

  UPDATE public.affiliate_clicks
  SET converted = true, converted_at = now(), order_id = p_order.id
  WHERE id = v_affiliate_click.id;

  UPDATE public.affiliate_links
  SET
    total_sales = COALESCE(total_sales, 0) + 1,
    total_revenue = COALESCE(total_revenue, 0) + v_item_total,
    total_commission = COALESCE(total_commission, 0) + v_commission_amount,
    updated_at = now()
  WHERE id = v_affiliate_link.id;

  UPDATE public.affiliates
  SET
    total_sales = COALESCE(total_sales, 0) + 1,
    total_revenue = COALESCE(total_revenue, 0) + v_item_total,
    total_commission_earned = COALESCE(total_commission_earned, 0) + v_commission_amount,
    pending_commission = COALESCE(pending_commission, 0) + v_commission_amount,
    updated_at = now()
  WHERE id = v_affiliate_link.affiliate_id;

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_affiliate_commission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT public.is_order_paid_for_revenue(NEW.status, NEW.payment_status) THEN
    RETURN NEW;
  END IF;

  -- Only fire on transition to paid (avoid double credit on unrelated updates)
  IF TG_OP = 'UPDATE'
     AND public.is_order_paid_for_revenue(OLD.status, OLD.payment_status) THEN
    RETURN NEW;
  END IF;

  FOR v_product_id IN
    SELECT DISTINCT oi.product_id
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id AND oi.product_id IS NOT NULL
  LOOP
    PERFORM public._affiliate_commission_for_order_product(NEW, v_product_id);
  END LOOP;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.calculate_affiliate_commission() IS
  'C1 multi-item affiliate: base = item_total * (1 - seller_platform_fee%). Excludes buyer checkout fee.';

COMMIT;
