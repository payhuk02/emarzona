-- C1 : commission 0 % sur ventes produits physiques (abonnement vendeur uniquement).
-- Commission 10 % (ou taux store) sur digital / service / course / artiste uniquement.

BEGIN;

-- =========================================================
-- Montant commissionnable d'une commande (hors physical)
-- =========================================================

CREATE OR REPLACE FUNCTION public.order_item_effective_product_type(
  p_product_type TEXT,
  p_product_id UUID
)
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    NULLIF(TRIM(p_product_type), ''),
    (SELECT pr.product_type FROM public.products pr WHERE pr.id = p_product_id)
  );
$$;

COMMENT ON FUNCTION public.order_item_effective_product_type IS
  'Type produit effectif pour le calcul de commission (order_items.product_type ou products.product_type).';

CREATE OR REPLACE FUNCTION public.order_commissionable_amount(p_order_id UUID)
RETURNS NUMERIC
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(
    CASE
      WHEN public.order_item_effective_product_type(oi.product_type, oi.product_id) IN (
        'digital', 'service', 'course', 'artist'
      ) THEN COALESCE(
        NULLIF(oi.total_price, 0),
        COALESCE(oi.quantity, 1) * COALESCE(oi.unit_price, 0),
        0
      )
      ELSE 0
    END
  ), 0)
  FROM public.order_items oi
  WHERE oi.order_id = p_order_id;
$$;

COMMENT ON FUNCTION public.order_commissionable_amount IS
  'Somme des lignes commissionnables (digital, service, course, artiste) — physical exclu (C1).';

CREATE OR REPLACE FUNCTION public.order_platform_fee_amount(
  p_order_id UUID,
  p_fee_percent NUMERIC DEFAULT 10
)
RETURNS NUMERIC
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ROUND(
    (public.order_commissionable_amount(p_order_id) * GREATEST(COALESCE(p_fee_percent, 10), 0) / 100.0)::numeric,
    2
  );
$$;

COMMENT ON FUNCTION public.order_platform_fee_amount IS
  'Commission plateforme pour une commande (base commissionnable × taux %).';

GRANT EXECUTE ON FUNCTION public.order_item_effective_product_type(TEXT, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.order_commissionable_amount(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.order_platform_fee_amount(UUID, NUMERIC) TO authenticated, service_role;

-- =========================================================
-- Wallet interne Moneroo : commission sur part commissionnable seulement
-- =========================================================

CREATE OR REPLACE FUNCTION public.resolve_store_platform_fee_percent(p_store_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fee_percent NUMERIC := 10;
BEGIN
  SELECT COALESCE(s.platform_fee_percent, v_fee_percent)
  INTO v_fee_percent
  FROM public.stores s
  WHERE s.id = p_store_id;

  IF v_fee_percent IS NULL THEN
    SELECT COALESCE(ps.platform_commission_rate, 10)
    INTO v_fee_percent
    FROM public.platform_settings ps
    WHERE ps.platform_commission_rate IS NOT NULL
    LIMIT 1;
  END IF;

  RETURN COALESCE(v_fee_percent, 10);
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_store_earnings(p_store_id UUID)
RETURNS TABLE (
  total_revenue NUMERIC,
  total_platform_commission NUMERIC,
  total_withdrawn NUMERIC,
  available_balance NUMERIC
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
  v_available_balance NUMERIC := 0;
BEGIN
  SELECT COALESCE(SUM(o.total_amount), 0)
  INTO v_total_revenue
  FROM public.orders o
  WHERE o.store_id = p_store_id
    AND public.is_order_paid_for_revenue(o.status, o.payment_status)
    AND NOT public.is_order_psp_direct_settlement(o.payment_provider_used);

  v_fee_percent := public.resolve_store_platform_fee_percent(p_store_id);

  SELECT COALESCE(SUM(public.order_platform_fee_amount(o.id, v_fee_percent)), 0)
  INTO v_total_platform_commission
  FROM public.orders o
  WHERE o.store_id = p_store_id
    AND public.is_order_paid_for_revenue(o.status, o.payment_status)
    AND NOT public.is_order_psp_direct_settlement(o.payment_provider_used);

  SELECT COALESCE(SUM(amount), 0)
  INTO v_total_withdrawn
  FROM public.store_withdrawals
  WHERE store_id = p_store_id
    AND status IN ('completed', 'processing');

  v_available_balance := v_total_revenue - v_total_platform_commission - v_total_withdrawn;

  IF v_available_balance < 0 THEN
    v_available_balance := 0;
  END IF;

  RETURN QUERY SELECT
    v_total_revenue,
    v_total_platform_commission,
    v_total_withdrawn,
    v_available_balance;
END;
$$;

COMMENT ON FUNCTION public.calculate_store_earnings IS
  'Wallet interne Moneroo : commission uniquement sur lignes digital/service/course/artist (C1, physical = 0 %).';

-- =========================================================
-- Legacy payments : commission sur base commissionnable si order_id présent
-- =========================================================

CREATE OR REPLACE FUNCTION public.calculate_commission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_commission_rate NUMERIC := 0.10;
  v_fee_percent NUMERIC := 10;
  v_commissionable_amount NUMERIC := 0;
  v_commission_amount NUMERIC;
  v_seller_amount NUMERIC;
  v_store_id UUID;
BEGIN
  v_store_id := NEW.store_id;
  v_fee_percent := public.resolve_store_platform_fee_percent(v_store_id);
  v_commission_rate := v_fee_percent / 100.0;

  IF NEW.order_id IS NOT NULL THEN
    v_commissionable_amount := public.order_commissionable_amount(NEW.order_id);
    v_commission_amount := ROUND((v_commissionable_amount * v_commission_rate)::numeric, 2);
  ELSE
    v_commission_amount := ROUND((NEW.amount * v_commission_rate)::numeric, 2);
  END IF;

  v_seller_amount := NEW.amount - v_commission_amount;

  NEW.commission_rate := v_commission_rate;
  NEW.commission_amount := v_commission_amount;
  NEW.seller_amount := v_seller_amount;

  IF NEW.status = 'completed' THEN
    INSERT INTO public.platform_commissions (
      payment_id,
      store_id,
      order_id,
      total_amount,
      commission_rate,
      commission_amount,
      seller_amount,
      status
    ) VALUES (
      NEW.id,
      v_store_id,
      NEW.order_id,
      NEW.amount,
      v_commission_rate,
      v_commission_amount,
      v_seller_amount,
      'completed'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- =========================================================
-- Affiliation : base après commission plateforme (physical = 0 % fee)
-- =========================================================

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
  v_fee_percent NUMERIC := 10;
  v_platform_fee_amount NUMERIC := 0;
BEGIN
  IF NOT public.is_order_paid_for_revenue(NEW.status, NEW.payment_status) THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.affiliate_commissions ac WHERE ac.order_id = NEW.id
  ) THEN
    RETURN NEW;
  END IF;

  SELECT oi.product_id INTO v_product_id
  FROM public.order_items oi
  WHERE oi.order_id = NEW.id
  LIMIT 1;

  IF v_product_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.affiliate_tracking_cookie IS NOT NULL THEN
    SELECT ac.* INTO v_affiliate_click
    FROM public.affiliate_clicks ac
    WHERE ac.tracking_cookie = NEW.affiliate_tracking_cookie
      AND ac.product_id = v_product_id
      AND ac.cookie_expires_at > now()
      AND ac.converted = false
    ORDER BY ac.clicked_at DESC
    LIMIT 1;
  END IF;

  IF v_affiliate_click IS NULL THEN
    SELECT ac.* INTO v_affiliate_click
    FROM public.affiliate_clicks ac
    WHERE ac.product_id = v_product_id
      AND ac.tracking_cookie IS NOT NULL
      AND ac.cookie_expires_at > now()
      AND ac.converted = false
    ORDER BY ac.clicked_at DESC
    LIMIT 1;
  END IF;

  IF v_affiliate_click IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_affiliate_link
  FROM public.affiliate_links
  WHERE id = v_affiliate_click.affiliate_link_id
    AND status = 'active';

  IF v_affiliate_link IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_product_settings
  FROM public.product_affiliate_settings
  WHERE product_id = v_product_id
    AND affiliate_enabled = true;

  IF v_product_settings IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.total_amount < v_product_settings.min_order_amount THEN
    RETURN NEW;
  END IF;

  v_fee_percent := public.resolve_store_platform_fee_percent(NEW.store_id);
  v_platform_fee_amount := public.order_platform_fee_amount(NEW.id, v_fee_percent);
  v_commission_base := GREATEST(NEW.total_amount - v_platform_fee_amount, 0);

  IF v_product_settings.commission_type = 'percentage' THEN
    v_commission_amount := v_commission_base * (v_product_settings.commission_rate / 100);
  ELSE
    v_commission_amount := v_product_settings.fixed_commission_amount;
  END IF;

  IF v_product_settings.max_commission_per_sale IS NOT NULL THEN
    v_commission_amount := LEAST(v_commission_amount, v_product_settings.max_commission_per_sale);
  END IF;

  INSERT INTO public.affiliate_commissions (
    affiliate_id,
    affiliate_link_id,
    product_id,
    store_id,
    order_id,
    order_total,
    commission_base,
    commission_rate,
    commission_type,
    commission_amount,
    status
  ) VALUES (
    v_affiliate_link.affiliate_id,
    v_affiliate_link.id,
    v_product_id,
    v_affiliate_link.store_id,
    NEW.id,
    NEW.total_amount,
    v_commission_base,
    v_product_settings.commission_rate,
    v_product_settings.commission_type,
    v_commission_amount,
    'pending'
  );

  UPDATE public.affiliate_clicks
  SET
    converted = true,
    order_id = NEW.id,
    converted_at = now()
  WHERE id = v_affiliate_click.id;

  UPDATE public.affiliate_links
  SET
    total_sales = total_sales + 1,
    total_revenue = total_revenue + NEW.total_amount,
    total_commission = total_commission + v_commission_amount,
    updated_at = now()
  WHERE id = v_affiliate_link.id;

  UPDATE public.affiliates
  SET
    total_sales = total_sales + 1,
    total_revenue = total_revenue + NEW.total_amount,
    total_commission_earned = total_commission_earned + v_commission_amount,
    pending_commission = pending_commission + v_commission_amount,
    updated_at = now()
  WHERE id = v_affiliate_link.affiliate_id;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_affiliate_commission_on_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id UUID;
  v_product_id UUID;
  v_store_id UUID;
  v_order_total NUMERIC;
  v_order_status TEXT;
  v_order_payment_status TEXT;
  v_tracking_cookie TEXT;
  v_affiliate_link_id UUID;
  v_affiliate_id UUID;
  v_settings RECORD;
  v_commission_amount NUMERIC;
  v_commission_base NUMERIC;
  v_fee_percent NUMERIC := 10;
  v_platform_fee_amount NUMERIC := 0;
  v_commission_id UUID;
BEGIN
  IF NEW.status != 'completed' OR OLD.status = 'completed' THEN
    RETURN NEW;
  END IF;

  IF NEW.order_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_tracking_cookie := NEW.metadata->>'tracking_cookie';
  IF v_tracking_cookie IS NULL OR v_tracking_cookie = '' THEN
    RETURN NEW;
  END IF;

  SELECT
    o.id,
    o.store_id,
    o.total_amount,
    o.status,
    o.payment_status,
    oi.product_id
  INTO
    v_order_id,
    v_store_id,
    v_order_total,
    v_order_status,
    v_order_payment_status,
    v_product_id
  FROM public.orders o
  LEFT JOIN public.order_items oi ON oi.order_id = o.id
  WHERE o.id = NEW.order_id
  LIMIT 1;

  IF v_order_id IS NULL
    OR v_product_id IS NULL
    OR NOT public.is_order_paid_for_revenue(v_order_status, v_order_payment_status) THEN
    RETURN NEW;
  END IF;

  SELECT
    ac.affiliate_link_id,
    ac.affiliate_id
  INTO
    v_affiliate_link_id,
    v_affiliate_id
  FROM public.affiliate_clicks ac
  WHERE ac.tracking_cookie = v_tracking_cookie
    AND ac.product_id = v_product_id
    AND ac.converted = false
    AND ac.cookie_expires_at >= NOW()
  ORDER BY ac.clicked_at DESC
  LIMIT 1;

  IF v_affiliate_link_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT
    pas.commission_rate,
    pas.commission_type,
    pas.fixed_commission_amount,
    pas.min_order_amount,
    pas.max_commission_per_sale
  INTO v_settings
  FROM public.product_affiliate_settings pas
  WHERE pas.product_id = v_product_id
    AND pas.affiliate_enabled = true
  LIMIT 1;

  IF v_settings IS NULL THEN
    RETURN NEW;
  END IF;

  IF v_settings.min_order_amount IS NOT NULL AND v_order_total < v_settings.min_order_amount THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.affiliate_commissions
    WHERE order_id = v_order_id
      AND affiliate_id = v_affiliate_id
      AND product_id = v_product_id
  ) THEN
    RETURN NEW;
  END IF;

  v_fee_percent := public.resolve_store_platform_fee_percent(v_store_id);
  v_platform_fee_amount := public.order_platform_fee_amount(v_order_id, v_fee_percent);
  v_commission_base := GREATEST(v_order_total - v_platform_fee_amount, 0);

  IF v_settings.commission_type = 'percentage' THEN
    v_commission_amount := v_commission_base * (v_settings.commission_rate / 100);
    IF v_settings.max_commission_per_sale IS NOT NULL THEN
      v_commission_amount := LEAST(v_commission_amount, v_settings.max_commission_per_sale);
    END IF;
  ELSIF v_settings.commission_type = 'fixed' THEN
    v_commission_amount := COALESCE(v_settings.fixed_commission_amount, 0);
  ELSE
    v_commission_amount := 0;
  END IF;

  IF v_commission_amount <= 0 THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.affiliate_commissions (
    affiliate_id,
    affiliate_link_id,
    product_id,
    store_id,
    order_id,
    payment_id,
    order_total,
    commission_base,
    commission_rate,
    commission_type,
    commission_amount,
    status
  ) VALUES (
    v_affiliate_id,
    v_affiliate_link_id,
    v_product_id,
    v_store_id,
    v_order_id,
    NEW.payment_id,
    v_order_total,
    v_commission_base,
    v_settings.commission_rate,
    v_settings.commission_type,
    v_commission_amount,
    'pending'
  ) RETURNING id INTO v_commission_id;

  UPDATE public.affiliate_clicks
  SET
    converted = true,
    converted_at = NOW(),
    order_id = v_order_id
  WHERE id = (
    SELECT id FROM public.affiliate_clicks
    WHERE tracking_cookie = v_tracking_cookie
      AND product_id = v_product_id
      AND converted = false
    ORDER BY clicked_at DESC
    LIMIT 1
  );

  UPDATE public.affiliate_links
  SET
    total_sales = COALESCE(total_sales, 0) + 1,
    total_revenue = COALESCE(total_revenue, 0) + v_order_total,
    total_commission = COALESCE(total_commission, 0) + v_commission_amount,
    updated_at = NOW()
  WHERE id = v_affiliate_link_id;

  UPDATE public.affiliates
  SET
    total_sales = COALESCE(total_sales, 0) + 1,
    total_revenue = COALESCE(total_revenue, 0) + v_order_total,
    total_commission_earned = COALESCE(total_commission_earned, 0) + v_commission_amount,
    pending_commission = COALESCE(pending_commission, 0) + v_commission_amount,
    updated_at = NOW()
  WHERE id = v_affiliate_id;

  RETURN NEW;
END;
$$;

-- Recalcul des wallets internes après changement de règle C1
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT DISTINCT store_id
    FROM public.orders
    WHERE public.is_order_paid_for_revenue(status, payment_status)
  LOOP
    PERFORM public.update_store_earnings(r.store_id);
  END LOOP;
END $$;

COMMIT;
