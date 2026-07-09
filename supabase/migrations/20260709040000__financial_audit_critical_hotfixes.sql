-- Migration: Financial Audit Critical Hotfixes
-- 1. Fix race condition in `update_store_earnings` via pessimistic locking
-- 2. Add self-referral prevention to `calculate_affiliate_commission`
-- 3. Add affiliate commission clawback on refunds

BEGIN;

-- =====================================================
-- 1. FIX RACE CONDITION IN update_store_earnings
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_store_earnings(p_store_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_earnings RECORD;
  v_fee_rate NUMERIC;
BEGIN
  -- FIX: Verrouillage transactionnel pessimiste au niveau du store_id
  -- Cela empêche deux requêtes de webhooks simultanées pour le même magasin
  -- de lire des états de commandes obsolètes pendant l'agrégation SUM().
  PERFORM pg_advisory_xact_lock(hashtext(p_store_id::text));

  SELECT * INTO v_earnings FROM public.calculate_store_earnings(p_store_id);

  v_fee_rate := public.resolve_store_platform_fee_percent(p_store_id) / 100.0;

  INSERT INTO public.store_earnings (
    store_id,
    total_revenue,
    total_platform_commission,
    total_withdrawn,
    available_balance,
    platform_commission_rate,
    last_calculated_at,
    updated_at
  )
  VALUES (
    p_store_id,
    COALESCE(v_earnings.total_revenue, 0),
    COALESCE(v_earnings.total_platform_commission, 0),
    COALESCE(v_earnings.total_withdrawn, 0),
    COALESCE(v_earnings.available_balance, 0),
    v_fee_rate,
    now(),
    now()
  )
  ON CONFLICT (store_id) DO UPDATE SET
    total_revenue = EXCLUDED.total_revenue,
    total_platform_commission = EXCLUDED.total_platform_commission,
    total_withdrawn = EXCLUDED.total_withdrawn,
    available_balance = EXCLUDED.available_balance,
    platform_commission_rate = EXCLUDED.platform_commission_rate,
    last_calculated_at = now(),
    updated_at = now();
END;
$$;

-- =====================================================
-- 2. FIX SELF-REFERRAL PREVENTION IN AFFILIATES
-- =====================================================
CREATE OR REPLACE FUNCTION public.calculate_affiliate_commission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_affiliate_click affiliate_clicks%ROWTYPE;
  v_affiliate_link affiliate_links%ROWTYPE;
  v_product_settings product_affiliate_settings%ROWTYPE;
  v_product_id UUID;
  v_commission_base NUMERIC;
  v_commission_amount NUMERIC;
BEGIN
  -- Récupérer le produit de la commande (premier item)
  SELECT oi.product_id INTO v_product_id
  FROM order_items oi
  WHERE oi.order_id = NEW.id
  LIMIT 1;
  
  IF v_product_id IS NULL THEN RETURN NEW; END IF;
  
  SELECT ac.* INTO v_affiliate_click
  FROM affiliate_clicks ac
  WHERE ac.product_id = v_product_id
  AND ac.tracking_cookie IS NOT NULL
  AND ac.cookie_expires_at > now()
  AND ac.converted = false
  ORDER BY ac.clicked_at DESC
  LIMIT 1;
  
  IF v_affiliate_click IS NULL THEN RETURN NEW; END IF;
  
  SELECT * INTO v_affiliate_link
  FROM affiliate_links
  WHERE id = v_affiliate_click.affiliate_link_id
  AND status = 'active';
  
  IF v_affiliate_link IS NULL THEN RETURN NEW; END IF;
  
  SELECT * INTO v_product_settings
  FROM product_affiliate_settings
  WHERE product_id = v_product_id
  AND affiliate_enabled = true;
  
  IF v_product_settings IS NULL THEN RETURN NEW; END IF;

  -- FIX: ANTI AUTO-AFFILIATION (Self-referral prevention)
  IF v_product_settings.allow_self_referral = false THEN
    IF EXISTS (
      SELECT 1 FROM affiliates 
      WHERE id = v_affiliate_link.affiliate_id 
      AND user_id = NEW.customer_id
    ) THEN
      RETURN NEW; -- Annuler la commission car c'est un achat de soi-même
    END IF;
  END IF;
  
  IF NEW.total_amount < v_product_settings.min_order_amount THEN RETURN NEW; END IF;
  
  v_commission_base := NEW.total_amount * 0.90;
  
  IF v_product_settings.commission_type = 'percentage' THEN
    v_commission_amount := v_commission_base * (v_product_settings.commission_rate / 100);
  ELSE
    v_commission_amount := v_product_settings.fixed_commission_amount;
  END IF;
  
  IF v_product_settings.max_commission_per_sale IS NOT NULL THEN
    v_commission_amount := LEAST(v_commission_amount, v_product_settings.max_commission_per_sale);
  END IF;
  
  INSERT INTO affiliate_commissions (
    affiliate_id, affiliate_link_id, product_id, store_id, order_id,
    order_total, commission_base, commission_rate, commission_type,
    commission_amount, status
  ) VALUES (
    v_affiliate_link.affiliate_id, v_affiliate_link.id, v_product_id, v_affiliate_link.store_id, NEW.id,
    NEW.total_amount, v_commission_base, v_product_settings.commission_rate, v_product_settings.commission_type,
    v_commission_amount, 'pending'
  );
  
  UPDATE affiliate_clicks
  SET converted = true, order_id = NEW.id, converted_at = now()
  WHERE id = v_affiliate_click.id;
  
  UPDATE affiliate_links
  SET total_sales = total_sales + 1, total_revenue = total_revenue + NEW.total_amount, total_commission = total_commission + v_commission_amount, updated_at = now()
  WHERE id = v_affiliate_link.id;
  
  UPDATE affiliates
  SET total_sales = total_sales + 1, total_revenue = total_revenue + NEW.total_amount, total_commission_earned = total_commission_earned + v_commission_amount, pending_commission = pending_commission + v_commission_amount, updated_at = now()
  WHERE id = v_affiliate_link.affiliate_id;
  
  RETURN NEW;
END;
$$;

-- =====================================================
-- 3. FIX AFFILIATE CLAWBACK ON REFUNDS
-- =====================================================
CREATE OR REPLACE FUNCTION public.cancel_affiliate_commission_on_refund()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_commission RECORD;
BEGIN
  -- Trouver la commission associée à cette commande (si elle n'est pas déjà annulée ou rejetée)
  FOR v_commission IN 
    SELECT id, affiliate_id, affiliate_link_id, commission_amount, status 
    FROM public.affiliate_commissions 
    WHERE order_id = NEW.id AND status IN ('pending', 'approved')
  LOOP
    -- 1. Annuler la commission
    UPDATE public.affiliate_commissions 
    SET status = 'cancelled', 
        rejection_reason = 'Commande remboursée', 
        rejected_at = now(), 
        updated_at = now()
    WHERE id = v_commission.id;

    -- 2. Déduire des statistiques du lien d'affiliation
    UPDATE public.affiliate_links
    SET 
      total_sales = GREATEST(0, total_sales - 1), 
      total_revenue = GREATEST(0, total_revenue - NEW.total_amount), 
      total_commission = GREATEST(0, total_commission - v_commission.commission_amount), 
      updated_at = now()
    WHERE id = v_commission.affiliate_link_id;

    -- 3. Déduire des statistiques globales de l'affilié
    UPDATE public.affiliates
    SET 
      total_sales = GREATEST(0, total_sales - 1), 
      total_revenue = GREATEST(0, total_revenue - NEW.total_amount), 
      total_commission_earned = GREATEST(0, total_commission_earned - v_commission.commission_amount), 
      pending_commission = CASE 
        WHEN v_commission.status = 'pending' THEN GREATEST(0, pending_commission - v_commission.commission_amount)
        ELSE pending_commission
      END,
      updated_at = now()
    WHERE id = v_commission.affiliate_id;

  END LOOP;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS cancel_affiliate_commission_on_refund ON public.orders;
CREATE TRIGGER cancel_affiliate_commission_on_refund
  AFTER UPDATE OF payment_status, refunded_amount ON public.orders
  FOR EACH ROW
  WHEN (
    NEW.payment_status IN ('refunded', 'partially_refunded')
    AND (
      OLD.payment_status IS DISTINCT FROM NEW.payment_status
      OR COALESCE(OLD.refunded_amount, 0) IS DISTINCT FROM COALESCE(NEW.refunded_amount, 0)
    )
  )
  EXECUTE FUNCTION public.cancel_affiliate_commission_on_refund();

COMMIT;
