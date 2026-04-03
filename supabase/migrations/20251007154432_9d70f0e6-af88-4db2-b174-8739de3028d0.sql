-- Table pour les relations de parrainage
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'active',
  UNIQUE(referrer_id, referred_id)
);

-- Table pour les commissions de parrainage
CREATE TABLE public.referral_commissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_id UUID NOT NULL REFERENCES public.referrals(id) ON DELETE CASCADE,
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  commission_rate NUMERIC NOT NULL DEFAULT 0.02,
  commission_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  paid_at TIMESTAMP WITH TIME ZONE
);

-- Ajouter une colonne referral_code unique pour chaque utilisateur dans profiles
ALTER TABLE public.profiles 
ADD COLUMN referral_code TEXT UNIQUE,
ADD COLUMN referred_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN total_referral_earnings NUMERIC DEFAULT 0;

-- Fonction pour générer un code de parrainage unique
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    code := upper(substring(md5(random()::text) from 1 for 8));
    SELECT EXISTS(SELECT 1 FROM profiles WHERE referral_code = code) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN code;
END;
$$;

-- Trigger pour générer automatiquement un code de parrainage lors de la création du profil
CREATE OR REPLACE FUNCTION public.set_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_referral_code_trigger
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_referral_code();

-- Mettre à jour les profils existants avec des codes de parrainage
UPDATE public.profiles
SET referral_code = generate_referral_code()
WHERE referral_code IS NULL;

-- Fonction pour calculer la commission de parrainage (2%)
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

    -- Calculer la commission (2%)
    v_commission_amount := NEW.amount * 0.02;

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
        0.02,
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

-- Trigger pour calculer automatiquement la commission de parrainage
CREATE TRIGGER calculate_referral_commission_trigger
AFTER INSERT OR UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.calculate_referral_commission();

-- Trigger pour mettre à jour updated_at sur referral_commissions
CREATE TRIGGER update_referral_commissions_updated_at
BEFORE UPDATE ON public.referral_commissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- RLS policies pour referrals
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own referrals"
ON public.referrals FOR SELECT
USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "Users can create referrals"
ON public.referrals FOR INSERT
WITH CHECK (auth.uid() = referrer_id);

CREATE POLICY "Admins can view all referrals"
ON public.referrals FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage referrals"
ON public.referrals FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- RLS policies pour referral_commissions
ALTER TABLE public.referral_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their referral commissions"
ON public.referral_commissions FOR SELECT
USING (auth.uid() = referrer_id);

CREATE POLICY "Admins can view all referral commissions"
ON public.referral_commissions FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage referral commissions"
ON public.referral_commissions FOR ALL
USING (has_role(auth.uid(), 'admin'));