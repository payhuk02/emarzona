-- Migration: Trigger automatique pour créer les commissions d'affiliation
-- Date: 31 Janvier 2025
-- Description: Crée un trigger qui crée automatiquement les commissions d'affiliation lorsqu'une commande est complétée

-- Fonction pour créer les commissions d'affiliation après paiement réussi
CREATE OR REPLACE FUNCTION public.create_affiliate_commission_on_payment()
RETURNS TRIGGER AS $$
DECLARE
  v_order_id UUID;
  v_product_id UUID;
  v_store_id UUID;
  v_order_total NUMERIC;
  v_tracking_cookie TEXT;
  v_affiliate_link_id UUID;
  v_affiliate_id UUID;
  v_settings RECORD;
  v_commission_amount NUMERIC;
  v_commission_id UUID;
BEGIN
  -- Vérifier que le paiement est complété
  IF NEW.status != 'completed' OR OLD.status = 'completed' THEN
    RETURN NEW;
  END IF;

  -- Récupérer les infos de la commande
  SELECT 
    o.id,
    o.store_id,
    o.total_amount,
    t.metadata->>'tracking_cookie' as tracking_cookie,
    oi.product_id
  INTO 
    v_order_id,
    v_store_id,
    v_order_total,
    v_tracking_cookie,
    v_product_id
  FROM orders o
  LEFT JOIN order_items oi ON oi.order_id = o.id
  WHERE o.id = NEW.order_id
  LIMIT 1;

  -- Si pas de commande ou pas de produit, sortir
  IF v_order_id IS NULL OR v_product_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Si pas de tracking cookie, sortir
  IF v_tracking_cookie IS NULL OR v_tracking_cookie = '' THEN
    RETURN NEW;
  END IF;

  -- Récupérer les infos du clic d'affiliation
  SELECT 
    ac.affiliate_link_id,
    ac.affiliate_id,
    ac.id as click_id
  INTO 
    v_affiliate_link_id,
    v_affiliate_id
  FROM affiliate_clicks ac
  WHERE ac.tracking_cookie = v_tracking_cookie
    AND ac.product_id = v_product_id
    AND ac.converted = false
    AND ac.cookie_expires_at >= NOW()
  ORDER BY ac.clicked_at DESC
  LIMIT 1;

  -- Si pas de clic d'affiliation valide, sortir
  IF v_affiliate_link_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Récupérer les paramètres d'affiliation du produit
  SELECT 
    pas.commission_rate,
    pas.commission_type,
    pas.fixed_commission_amount,
    pas.min_order_amount
  INTO v_settings
  FROM product_affiliate_settings pas
  WHERE pas.product_id = v_product_id
    AND pas.affiliate_enabled = true
  LIMIT 1;

  -- Si pas de paramètres d'affiliation, sortir
  IF v_settings IS NULL THEN
    RETURN NEW;
  END IF;

  -- Vérifier le montant minimum
  IF v_settings.min_order_amount IS NOT NULL AND v_order_total < v_settings.min_order_amount THEN
    RETURN NEW;
  END IF;

  -- Calculer la commission
  IF v_settings.commission_type = 'percentage' THEN
    v_commission_amount := v_order_total * (v_settings.commission_rate / 100);
  ELSIF v_settings.commission_type = 'fixed' THEN
    v_commission_amount := COALESCE(v_settings.fixed_commission_amount, 0);
  ELSE
    v_commission_amount := 0;
  END IF;

  -- Si commission <= 0, sortir
  IF v_commission_amount <= 0 THEN
    RETURN NEW;
  END IF;

  -- Créer la commission
  INSERT INTO affiliate_commissions (
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
    NEW.id,
    v_order_total,
    v_order_total,
    v_settings.commission_rate,
    v_settings.commission_type,
    v_commission_amount,
    'pending'
  ) RETURNING id INTO v_commission_id;

  -- Marquer le clic comme converti
  UPDATE affiliate_clicks
  SET 
    converted = true,
    converted_at = NOW(),
    order_id = v_order_id
  WHERE id = (SELECT id FROM affiliate_clicks WHERE tracking_cookie = v_tracking_cookie AND product_id = v_product_id AND converted = false LIMIT 1);

  -- Mettre à jour les stats du lien d'affiliation
  UPDATE affiliate_links
  SET 
    total_sales = total_sales + 1,
    total_revenue = total_revenue + v_order_total,
    total_commission = total_commission + v_commission_amount
  WHERE id = v_affiliate_link_id;

  -- Mettre à jour les stats de l'affilié
  UPDATE affiliates
  SET 
    total_sales = total_sales + 1,
    total_revenue = total_revenue + v_order_total,
    total_commission_earned = total_commission_earned + v_commission_amount,
    pending_commission = pending_commission + v_commission_amount
  WHERE id = v_affiliate_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Créer le trigger sur la table payments
DROP TRIGGER IF EXISTS trigger_create_affiliate_commission_on_payment ON public.payments;
CREATE TRIGGER trigger_create_affiliate_commission_on_payment
  AFTER UPDATE ON public.payments
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
  EXECUTE FUNCTION public.create_affiliate_commission_on_payment();

-- Commentaire
COMMENT ON FUNCTION public.create_affiliate_commission_on_payment() IS 'Crée automatiquement une commission d''affiliation lorsqu''un paiement est complété et qu''un cookie d''affiliation est présent';







