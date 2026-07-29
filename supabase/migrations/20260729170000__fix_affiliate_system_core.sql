-- Migration : Correction complète du système d'affiliation
-- Corrige les failles financières et logiques d'attribution

BEGIN;

-- 1. Ajouter la colonne pour suivre les commissions d'affiliation dans store_earnings
ALTER TABLE public.store_earnings 
  ADD COLUMN IF NOT EXISTS total_affiliate_commissions NUMERIC NOT NULL DEFAULT 0 CHECK (total_affiliate_commissions >= 0);

COMMENT ON COLUMN public.store_earnings.total_affiliate_commissions IS 'Total des commissions affiliés (en attente, approuvées, payées) déduites de la boutique';

-- 2. Corriger la faille de sécurité dans l'attribution de la commission
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

  -- Vérifier si une commission existe déjà
  IF EXISTS (
    SELECT 1 FROM public.affiliate_commissions ac
    WHERE ac.order_id = p_order.id AND ac.product_id = p_product_id
  ) THEN
    RETURN false;
  END IF;

  -- RECHERCHE STRICTE DU CLIC VIA LE COOKIE
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

  -- FINIE LA FAILLE ! Si pas de cookie ou clic invalide, on retourne FAUX (pas de logique de repli)
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

-- 3. Corriger le calcul des revenus de la boutique (déduire l'affiliation)
CREATE OR REPLACE FUNCTION public.calculate_store_earnings(p_store_id UUID)
RETURNS TABLE (
  total_revenue NUMERIC,
  total_platform_commission NUMERIC,
  total_withdrawn NUMERIC,
  available_balance NUMERIC,
  total_affiliate_commissions NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_revenue NUMERIC := 0;
  v_fee_percent NUMERIC := 10;
  v_total_platform_commission NUMERIC := 0;
  v_total_withdrawn NUMERIC := 0;
  v_total_affiliate NUMERIC := 0;
  v_available_balance NUMERIC := 0;
BEGIN
  -- 1. Total des revenus (commandes complétées ou confirmées et payées)
  SELECT COALESCE(SUM(public.order_net_revenue_amount(o.id)), 0)
  INTO v_total_revenue
  FROM public.orders o
  WHERE o.store_id = p_store_id
    AND public.is_order_eligible_for_revenue(o.status, o.payment_status)
    AND NOT public.is_order_psp_direct_settlement(o.payment_provider_used);

  -- 2. Total commission plateforme
  v_fee_percent := public.resolve_store_platform_fee_percent(p_store_id);
  SELECT COALESCE(SUM(
    ROUND(
      (public.order_commissionable_amount(o.id)
        * GREATEST(1 - (COALESCE(o.refunded_amount, 0) / NULLIF(o.total_amount, 0)), 0)
        * v_fee_percent / 100.0)::numeric,
      2
    )
  ), 0)
  INTO v_total_platform_commission
  FROM public.orders o
  WHERE o.store_id = p_store_id
    AND public.is_order_eligible_for_revenue(o.status, o.payment_status)
    AND NOT public.is_order_psp_direct_settlement(o.payment_provider_used);

  -- 3. Total retiré par la boutique
  SELECT COALESCE(SUM(amount), 0)
  INTO v_total_withdrawn
  FROM public.store_withdrawals
  WHERE store_id = p_store_id
    AND status IN ('completed', 'processing');

  -- 4. NOUVEAU: Total des commissions d'affiliation (payées par la boutique à l'affilié)
  -- On exclut les rejets et annulations
  SELECT COALESCE(SUM(commission_amount), 0)
  INTO v_total_affiliate
  FROM public.affiliate_commissions
  WHERE store_id = p_store_id
    AND status IN ('pending', 'approved', 'paid');

  -- 5. Solde disponible
  v_available_balance := v_total_revenue - v_total_platform_commission - v_total_affiliate - v_total_withdrawn;

  IF v_available_balance < 0 THEN
    v_available_balance := 0;
  END IF;

  RETURN QUERY SELECT
    v_total_revenue,
    v_total_platform_commission,
    v_total_withdrawn,
    v_available_balance,
    v_total_affiliate;
END;
$$;

-- 4. Corriger la fonction de mise à jour des revenus (insérer dans la table)
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
  SELECT * INTO v_earnings FROM public.calculate_store_earnings(p_store_id);

  v_fee_rate := public.resolve_store_platform_fee_percent(p_store_id) / 100.0;

  INSERT INTO public.store_earnings (
    store_id,
    total_revenue,
    total_platform_commission,
    total_withdrawn,
    available_balance,
    total_affiliate_commissions,
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
    COALESCE(v_earnings.total_affiliate_commissions, 0),
    v_fee_rate,
    now(),
    now()
  )
  ON CONFLICT (store_id) DO UPDATE SET
    total_revenue = EXCLUDED.total_revenue,
    total_platform_commission = EXCLUDED.total_platform_commission,
    total_withdrawn = EXCLUDED.total_withdrawn,
    available_balance = EXCLUDED.available_balance,
    total_affiliate_commissions = EXCLUDED.total_affiliate_commissions,
    platform_commission_rate = EXCLUDED.platform_commission_rate,
    last_calculated_at = now(),
    updated_at = now();
END;
$$;

-- 5. Ajouter un trigger pour actualiser les revenus du store quand une commission change
CREATE OR REPLACE FUNCTION public.trigger_update_store_earnings_on_affiliate_commission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Mettre à jour les revenus du store concerné
  IF TG_OP = 'DELETE' THEN
    PERFORM public.update_store_earnings(OLD.store_id);
  ELSE
    PERFORM public.update_store_earnings(NEW.store_id);
  END IF;
  
  RETURN NULL; -- AFTER trigger
END;
$$;

DROP TRIGGER IF EXISTS update_store_earnings_on_affiliate_commission ON public.affiliate_commissions;
CREATE TRIGGER update_store_earnings_on_affiliate_commission
  AFTER INSERT OR UPDATE OF status, commission_amount OR DELETE ON public.affiliate_commissions
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_store_earnings_on_affiliate_commission();

-- 6. Recréer le trigger de création de commission (problème d'atomicité)
DROP TRIGGER IF EXISTS track_affiliate_order ON public.orders;
CREATE CONSTRAINT TRIGGER track_affiliate_order
  AFTER INSERT OR UPDATE ON public.orders
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_affiliate_commission();

-- 7. S'assurer que le statut "paid" des commandes calcule la commission
CREATE OR REPLACE FUNCTION public.calculate_affiliate_commission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product_id UUID;
BEGIN
  -- Seulement si la commande vient de passer au statut "payé" ou éligible aux revenus
  IF NOT public.is_order_paid_for_revenue(NEW.status, NEW.payment_status) THEN
    RETURN NEW;
  END IF;

  -- Only fire on transition to paid (avoid double credit on unrelated updates)
  IF TG_OP = 'UPDATE'
     AND public.is_order_paid_for_revenue(OLD.status, OLD.payment_status) THEN
    RETURN NEW;
  END IF;

  -- Boucler sur les order_items
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

COMMIT;
