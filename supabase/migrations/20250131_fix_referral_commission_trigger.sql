-- Migration: Correction du trigger de referral commission
-- Date: 31 Janvier 2025
-- Description: Déplace le trigger sur transactions pour la commission de referral

-- Supprimer l'ancien trigger sur payments
DROP TRIGGER IF EXISTS calculate_referral_commission_trigger ON public.payments;

-- Nouvelle fonction pour calculer la commission de referral après transaction complétée
CREATE OR REPLACE FUNCTION public.calculate_referral_commission_on_transaction()
RETURNS TRIGGER AS $$
DECLARE
  v_referrer_id UUID;
  v_referral_id UUID;
  v_commission_amount NUMERIC;
  v_commission_rate NUMERIC;
  v_store_user_id UUID;
BEGIN
  -- Vérifier que la transaction est complétée
  IF NEW.status != 'completed' OR OLD.status = 'completed' THEN
    RETURN NEW;
  END IF;

  -- Si pas de store_id ou order_id, sortir
  IF NEW.store_id IS NULL OR NEW.order_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Récupérer l'utilisateur propriétaire du store
  SELECT user_id INTO v_store_user_id
  FROM stores
  WHERE id = NEW.store_id;

  -- Si pas de store_user_id, sortir
  IF v_store_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Vérifier si le vendeur a été parrainé
  SELECT referred_by INTO v_referrer_id
  FROM profiles
  WHERE user_id = v_store_user_id;

  -- Si pas de parrain, sortir
  IF v_referrer_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Récupérer l'ID de la relation de parrainage
  SELECT id INTO v_referral_id
  FROM referrals
  WHERE referrer_id = v_referrer_id 
    AND referred_id = v_store_user_id
    AND status = 'active'
  LIMIT 1;

  -- Si pas de relation active, sortir
  IF v_referral_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Éviter les commissions dupliquées (vérifier si déjà créée)
  IF EXISTS (
    SELECT 1 FROM referral_commissions
    WHERE order_id = NEW.order_id
    AND referral_id = v_referral_id
  ) THEN
    RETURN NEW;
  END IF;

  -- Récupérer le taux de commission depuis platform_settings (défaut 2%)
  SELECT COALESCE(referral_commission_rate, 2.00) / 100.0 INTO v_commission_rate
  FROM platform_settings
  LIMIT 1;
  
  IF v_commission_rate IS NULL THEN
    v_commission_rate := 0.02;
  END IF;

  -- Calculer la commission
  v_commission_amount := NEW.amount * v_commission_rate;

  -- Si commission <= 0, sortir
  IF v_commission_amount <= 0 THEN
    RETURN NEW;
  END IF;

  -- Créer la commission de parrainage
  INSERT INTO referral_commissions (
    referral_id,
    referrer_id,
    referred_id,
    payment_id,
    order_id,
    total_amount,
    commission_rate,
    commission_amount,
    status
  ) VALUES (
    v_referral_id,
    v_referrer_id,
    v_store_user_id,
    NEW.payment_id,
    NEW.order_id,
    NEW.amount,
    v_commission_rate * 100.0,
    v_commission_amount,
    'pending'
  );

  -- Mettre à jour le total des gains du parrain
  UPDATE profiles
  SET total_referral_earnings = COALESCE(total_referral_earnings, 0) + v_commission_amount,
      updated_at = NOW()
  WHERE user_id = v_referrer_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Créer le trigger sur transactions
CREATE TRIGGER calculate_referral_commission_trigger_on_transaction
AFTER UPDATE ON public.transactions
FOR EACH ROW
WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
EXECUTE FUNCTION public.calculate_referral_commission_on_transaction();

-- Commentaires
COMMENT ON FUNCTION public.calculate_referral_commission_on_transaction() IS 'Calcule automatiquement la commission de parrainage lorsqu''une transaction est complétée. Récompense le parrain lorsqu''un acheteur achète le produit de son filleul (vendeur).';







