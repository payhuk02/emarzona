-- Migration: Correction du trigger d'affiliation
-- Date: 31 Janvier 2025
-- Description: Déplace le trigger sur transactions et corrige la lecture du tracking cookie

-- Supprimer l'ancien trigger sur payments
DROP TRIGGER IF EXISTS trigger_create_affiliate_commission_on_payment ON public.payments;

-- Nouvelle fonction pour créer les commissions d'affiliation après transaction complétée
CREATE OR REPLACE FUNCTION public.create_affiliate_commission_on_transaction()
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
  -- Vérifier que la transaction est complétée
  IF NEW.status != 'completed' OR OLD.status = 'completed' THEN
    RETURN NEW;
  END IF;

  -- Si pas d'order_id, sortir
  IF NEW.order_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Lire le tracking cookie directement depuis NEW.metadata
  v_tracking_cookie := NEW.metadata->>'tracking_cookie';

  -- Si pas de tracking cookie, sortir
  IF v_tracking_cookie IS NULL OR v_tracking_cookie = '' THEN
    RETURN NEW;
  END IF;

  -- Récupérer les infos de la commande
  SELECT 
    o.id,
    o.store_id,
    o.total_amount,
    oi.product_id
  INTO 
    v_order_id,
    v_store_id,
    v_order_total,
    v_product_id
  FROM orders o
  LEFT JOIN order_items oi ON oi.order_id = o.id
  WHERE o.id = NEW.order_id
  LIMIT 1;

  -- Si pas de commande ou pas de produit, sortir
  IF v_order_id IS NULL OR v_product_id IS NULL THEN
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

  -- Vérifier si la commission existe déjà (éviter les doublons)
  IF EXISTS (
    SELECT 1 FROM affiliate_commissions
    WHERE order_id = v_order_id
      AND affiliate_id = v_affiliate_id
      AND product_id = v_product_id
  ) THEN
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
    NEW.payment_id,
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
  WHERE id = (SELECT id FROM affiliate_clicks WHERE tracking_cookie = v_tracking_cookie AND product_id = v_product_id AND converted = false ORDER BY clicked_at DESC LIMIT 1);

  -- Mettre à jour les stats du lien d'affiliation
  UPDATE affiliate_links
  SET 
    total_sales = COALESCE(total_sales, 0) + 1,
    total_revenue = COALESCE(total_revenue, 0) + v_order_total,
    total_commission = COALESCE(total_commission, 0) + v_commission_amount,
    updated_at = NOW()
  WHERE id = v_affiliate_link_id;

  -- Mettre à jour les stats de l'affilié
  UPDATE affiliates
  SET 
    total_sales = COALESCE(total_sales, 0) + 1,
    total_revenue = COALESCE(total_revenue, 0) + v_order_total,
    total_commission_earned = COALESCE(total_commission_earned, 0) + v_commission_amount,
    pending_commission = COALESCE(pending_commission, 0) + v_commission_amount,
    updated_at = NOW()
  WHERE id = v_affiliate_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Créer le trigger sur transactions
CREATE TRIGGER trigger_create_affiliate_commission_on_transaction
  AFTER UPDATE ON public.transactions
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
  EXECUTE FUNCTION public.create_affiliate_commission_on_transaction();

-- Commentaire
COMMENT ON FUNCTION public.create_affiliate_commission_on_transaction() IS 'Crée automatiquement une commission d''affiliation lorsqu''une transaction est complétée et qu''un cookie d''affiliation est présent dans les métadonnées';







