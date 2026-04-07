-- Migration: Configuration des taux de commission de parrainage
-- Date: 31 Janvier 2025
-- Description: Permet de configurer les taux de commission de parrainage via platform_settings

-- Ajouter la colonne referral_commission_rate à platform_settings si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'platform_settings' 
    AND column_name = 'referral_commission_rate'
  ) THEN
    ALTER TABLE public.platform_settings
    ADD COLUMN referral_commission_rate NUMERIC DEFAULT 2.00 CHECK (referral_commission_rate >= 0 AND referral_commission_rate <= 100);
    
    COMMENT ON COLUMN public.platform_settings.referral_commission_rate IS 'Taux de commission de parrainage en pourcentage (0-100)';
  END IF;
END $$;

-- Mettre à jour la fonction calculate_referral_commission pour utiliser le taux configurable
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
  v_store_user_id UUID;
  v_commission_rate NUMERIC;
BEGIN
  -- Récupérer l'utilisateur propriétaire du store
  SELECT user_id INTO v_store_user_id
  FROM stores
  WHERE id = NEW.store_id;

  -- Vérifier si le vendeur a été parrainé
  SELECT referred_by INTO v_referrer_id
  FROM profiles
  WHERE user_id = v_store_user_id;

  -- Si le vendeur a un parrain et que le paiement est complété
  IF v_referrer_id IS NOT NULL AND NEW.status = 'completed' THEN
    -- Récupérer l'ID de la relation de parrainage
    SELECT id INTO v_referral_id
    FROM referrals
    WHERE referrer_id = v_referrer_id 
      AND referred_id = v_store_user_id
      AND status = 'active'
    LIMIT 1;

    -- Récupérer le taux de commission depuis platform_settings
    SELECT COALESCE(referral_commission_rate, 2.00) INTO v_commission_rate
    FROM platform_settings
    LIMIT 1;

    -- Calculer la commission avec le taux configurable
    v_commission_amount := NEW.amount * (v_commission_rate / 100);

    -- Si une relation de parrainage existe, créer la commission
    IF v_referral_id IS NOT NULL THEN
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
        NEW.id,
        NEW.order_id,
        NEW.amount,
        v_commission_rate,
        v_commission_amount,
        'completed'
      );

      -- Mettre à jour le total des gains du parrain
      UPDATE profiles
      SET total_referral_earnings = COALESCE(total_referral_earnings, 0) + v_commission_amount
      WHERE user_id = v_referrer_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- S'assurer qu'il y a un enregistrement dans platform_settings avec le taux par défaut
INSERT INTO public.platform_settings (referral_commission_rate)
SELECT 2.00
WHERE NOT EXISTS (SELECT 1 FROM public.platform_settings);

-- Mettre à jour l'enregistrement existant si le taux n'est pas défini
UPDATE public.platform_settings
SET referral_commission_rate = 2.00
WHERE referral_commission_rate IS NULL;

-- Commentaire
COMMENT ON FUNCTION public.calculate_referral_commission() IS 'Calcule automatiquement la commission de parrainage en utilisant le taux configurable dans platform_settings';







