-- Migration pour corriger le calcul de commission de parrainage
-- Modifie le trigger pour calculer la commission basée sur l'ACHETEUR parrainé,
-- plutôt que sur le vendeur parrainé (logique plus courante)
-- Date: 2025-01-26

-- Supprimer l'ancien trigger
DROP TRIGGER IF EXISTS calculate_referral_commission_trigger ON public.payments;

-- Fonction pour calculer la commission de parrainage (2%)
-- BASÉE SUR L'ACHETEUR (customer) PARRAINÉ
CREATE OR REPLACE FUNCTION public.calculate_referral_commission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id UUID;
  v_referred_id UUID;
  v_referral_id UUID;
  v_commission_amount NUMERIC;
  v_customer_email TEXT;
  v_customer_user_id UUID;
BEGIN
  -- Ne traiter que si le paiement est complété
  IF NEW.status != 'completed' THEN
    RETURN NEW;
  END IF;

  -- Si pas d'order_id, on ne peut pas identifier l'acheteur
  IF NEW.order_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Récupérer l'email du customer depuis la commande
  SELECT c.email INTO v_customer_email
  FROM orders o
  INNER JOIN customers c ON o.customer_id = c.id
  WHERE o.id = NEW.order_id
  LIMIT 1;

  -- Si pas d'email, on ne peut pas continuer
  IF v_customer_email IS NULL THEN
    RETURN NEW;
  END IF;

  -- Trouver l'user_id correspondant à cet email
  -- Comme cette fonction est SECURITY DEFINER, on peut accéder directement à auth.users
  SELECT id INTO v_customer_user_id
  FROM auth.users
  WHERE email = v_customer_email
  LIMIT 1;

  -- Si pas d'user_id trouvé, on ne peut pas continuer
  IF v_customer_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Vérifier si l'acheteur a été parrainé (referred_by dans profiles)
  SELECT referred_by INTO v_referrer_id
  FROM profiles
  WHERE user_id = v_customer_user_id;

  -- Si l'acheteur n'a pas de parrain, pas de commission
  IF v_referrer_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Vérifier que la relation de parrainage existe et est active
  SELECT id INTO v_referral_id
  FROM referrals
  WHERE referrer_id = v_referrer_id 
    AND referred_id = v_customer_user_id
    AND status = 'active'
  LIMIT 1;

  -- Si pas de relation active, pas de commission
  IF v_referral_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Éviter les commissions dupliquées (vérifier si déjà créée)
  IF EXISTS (
    SELECT 1 FROM referral_commissions
    WHERE payment_id = NEW.id
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
    v_customer_user_id,
    NEW.id,
    NEW.order_id,
    NEW.amount,
    v_commission_rate * 100.0,  -- Stocker en pourcentage (ex: 2.00 pour 2%)
    v_commission_amount,
    'pending'  -- En attente de validation/paiment
  );

  -- Mettre à jour le total des gains du parrain
  UPDATE profiles
  SET total_referral_earnings = COALESCE(total_referral_earnings, 0) + v_commission_amount
  WHERE user_id = v_referrer_id;

  RETURN NEW;
END;
$$;

-- Recréer le trigger
CREATE TRIGGER calculate_referral_commission_trigger
AFTER INSERT OR UPDATE ON public.payments
FOR EACH ROW
WHEN (NEW.status = 'completed')
EXECUTE FUNCTION public.calculate_referral_commission();

-- Commentaires
COMMENT ON FUNCTION public.calculate_referral_commission() IS 'Calcule la commission de parrainage (2%) basée sur l''acheteur parrainé qui effectue un achat. La commission est créée quand un client parrainé fait un achat et que le paiement est complété.';

