-- =========================================================
-- Migration : Améliorer le trigger calculate_affiliate_commission
-- Date : 24/11/2025
-- Description : Modifie le trigger pour utiliser affiliate_tracking_cookie
--               si disponible, sinon utilise la méthode de fallback
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
BEGIN
  -- Récupérer le produit de la commande (premier item)
  SELECT oi.product_id INTO v_product_id
  FROM order_items oi
  WHERE oi.order_id = NEW.id
  LIMIT 1;
  
  IF v_product_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Chercher un clic d'affiliation correspondant
  -- Priorité 1 : Si un cookie est fourni dans la commande, l'utiliser
  -- Priorité 2 : Sinon, utiliser le dernier clic non converti pour ce produit (fallback)
  IF NEW.affiliate_tracking_cookie IS NOT NULL THEN
    -- Chercher le clic avec le cookie spécifique
    SELECT ac.* INTO v_affiliate_click
    FROM affiliate_clicks ac
    WHERE ac.tracking_cookie = NEW.affiliate_tracking_cookie
    AND ac.product_id = v_product_id
    AND ac.cookie_expires_at > now()
    AND ac.converted = false
    ORDER BY ac.clicked_at DESC
    LIMIT 1;
  END IF;
  
  -- Si pas de clic trouvé avec le cookie, utiliser la méthode de fallback
  IF v_affiliate_click IS NULL THEN
    SELECT ac.* INTO v_affiliate_click
    FROM affiliate_clicks ac
    WHERE ac.product_id = v_product_id
    AND ac.tracking_cookie IS NOT NULL
    AND ac.cookie_expires_at > now()
    AND ac.converted = false
    ORDER BY ac.clicked_at DESC
    LIMIT 1;
  END IF;
  
  -- Si pas de clic affilié trouvé, rien à faire
  IF v_affiliate_click IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Récupérer le lien d'affiliation
  SELECT * INTO v_affiliate_link
  FROM affiliate_links
  WHERE id = v_affiliate_click.affiliate_link_id
  AND status = 'active';
  
  IF v_affiliate_link IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Récupérer les paramètres d'affiliation du produit
  SELECT * INTO v_product_settings
  FROM product_affiliate_settings
  WHERE product_id = v_product_id
  AND affiliate_enabled = true;
  
  IF v_product_settings IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Vérifier le montant minimum
  IF NEW.total_amount < v_product_settings.min_order_amount THEN
    RETURN NEW;
  END IF;
  
  -- Calculer la base de commission (montant vendeur après commission plateforme)
  -- Montant total - commission plateforme (10%)
  v_commission_base := NEW.total_amount * 0.90;
  
  -- Calculer la commission affilié
  IF v_product_settings.commission_type = 'percentage' THEN
    v_commission_amount := v_commission_base * (v_product_settings.commission_rate / 100);
  ELSE
    v_commission_amount := v_product_settings.fixed_commission_amount;
  END IF;
  
  -- Appliquer la commission max si définie
  IF v_product_settings.max_commission_per_sale IS NOT NULL THEN
    v_commission_amount := LEAST(v_commission_amount, v_product_settings.max_commission_per_sale);
  END IF;
  
  -- Créer la commission affilié
  INSERT INTO affiliate_commissions (
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
    'pending'  -- En attente validation
  );
  
  -- Marquer le clic comme converti
  UPDATE affiliate_clicks
  SET 
    converted = true,
    order_id = NEW.id,
    converted_at = now()
  WHERE id = v_affiliate_click.id;
  
  -- Mettre à jour les statistiques du lien
  UPDATE affiliate_links
  SET 
    total_sales = total_sales + 1,
    total_revenue = total_revenue + NEW.total_amount,
    total_commission = total_commission + v_commission_amount,
    updated_at = now()
  WHERE id = v_affiliate_link.id;
  
  -- Mettre à jour les statistiques de l'affilié
  UPDATE affiliates
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

COMMENT ON FUNCTION public.calculate_affiliate_commission IS 'Calcule automatiquement la commission d''affiliation lors d''une nouvelle commande. Utilise affiliate_tracking_cookie si disponible, sinon utilise le dernier clic non converti comme fallback';

