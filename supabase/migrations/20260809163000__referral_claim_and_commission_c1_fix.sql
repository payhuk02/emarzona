-- Parrainage : claim RPC (filleul authentifié) + commission C1 sur transactions

BEGIN;

-- referral_code doit être unique sur profiles, pas sur chaque ligne referrals
ALTER TABLE public.referrals
  DROP CONSTRAINT IF EXISTS referrals_referral_code_key;

CREATE INDEX IF NOT EXISTS idx_referrals_referral_code ON public.referrals (referral_code);

-- Filleul authentifié peut créer sa propre relation (fallback si RPC indisponible)
DROP POLICY IF EXISTS "Referred users can claim referral" ON public.referrals;
CREATE POLICY "Referred users can claim referral"
ON public.referrals FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = referred_id);

CREATE OR REPLACE FUNCTION public.claim_referral(p_referral_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_referrer_id uuid;
  v_code text := upper(trim(p_referral_code));
  v_existing uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  IF v_code IS NULL OR v_code = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_code');
  END IF;

  SELECT referred_by INTO v_existing
  FROM public.profiles
  WHERE user_id = v_user_id
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'already_linked', true,
      'referrer_id', v_existing
    );
  END IF;

  SELECT user_id INTO v_referrer_id
  FROM public.profiles
  WHERE upper(referral_code) = v_code
  LIMIT 1;

  IF v_referrer_id IS NULL OR v_referrer_id = v_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_code');
  END IF;

  INSERT INTO public.referrals (referrer_id, referred_id, referral_code, status)
  VALUES (v_referrer_id, v_user_id, v_code, 'active')
  ON CONFLICT (referrer_id, referred_id) DO NOTHING;

  UPDATE public.profiles
  SET referred_by = v_referrer_id,
      updated_at = now()
  WHERE user_id = v_user_id
    AND referred_by IS NULL;

  RETURN jsonb_build_object('success', true, 'referrer_id', v_referrer_id);
END;
$$;

COMMENT ON FUNCTION public.claim_referral(text) IS
  'Lie le compte authentifié (filleul) au parrain via son code. Idempotent si déjà parrainé.';

GRANT EXECUTE ON FUNCTION public.claim_referral(text) TO authenticated;

-- Commission parrainage : base commissionnable C1, trigger actif sur transactions
CREATE OR REPLACE FUNCTION public.calculate_referral_commission_on_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id UUID;
  v_referral_id UUID;
  v_commission_amount NUMERIC;
  v_commissionable_amount NUMERIC;
  v_commission_rate NUMERIC;
  v_store_user_id UUID;
BEGIN
  IF NEW.status IS DISTINCT FROM 'completed' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status = 'completed' THEN
    RETURN NEW;
  END IF;

  IF NEW.store_id IS NULL OR NEW.order_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT user_id INTO v_store_user_id
  FROM public.stores
  WHERE id = NEW.store_id
  LIMIT 1;

  IF v_store_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT referred_by INTO v_referrer_id
  FROM public.profiles
  WHERE user_id = v_store_user_id
  LIMIT 1;

  IF v_referrer_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT id INTO v_referral_id
  FROM public.referrals
  WHERE referrer_id = v_referrer_id
    AND referred_id = v_store_user_id
    AND status = 'active'
  LIMIT 1;

  IF v_referral_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.referral_commissions rc
    WHERE rc.order_id = NEW.order_id
      AND rc.referral_id = v_referral_id
  ) THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(ps.referral_commission_rate, 2.00) / 100.0
  INTO v_commission_rate
  FROM public.platform_settings ps
  LIMIT 1;

  v_commission_rate := COALESCE(v_commission_rate, 0.02);

  v_commissionable_amount := public.order_commissionable_amount(NEW.order_id);
  IF v_commissionable_amount IS NULL OR v_commissionable_amount <= 0 THEN
    RETURN NEW;
  END IF;

  v_commission_amount := ROUND((v_commissionable_amount * v_commission_rate)::numeric, 2);
  IF v_commission_amount <= 0 THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.referral_commissions (
    referral_id,
    referrer_id,
    referred_id,
    payment_id,
    order_id,
    total_amount,
    commission_rate,
    commission_amount,
    status
  )
  VALUES (
    v_referral_id,
    v_referrer_id,
    v_store_user_id,
    NEW.payment_id,
    NEW.order_id,
    v_commissionable_amount,
    v_commission_rate * 100.0,
    v_commission_amount,
    'pending'
  );

  UPDATE public.profiles
  SET total_referral_earnings = COALESCE(total_referral_earnings, 0) + v_commission_amount,
      updated_at = NOW()
  WHERE user_id = v_referrer_id;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.calculate_referral_commission_on_transaction() IS
  'Commission parrainage 2% sur order_commissionable_amount (C1) quand une transaction vendeur est complétée.';

DROP TRIGGER IF EXISTS calculate_referral_commission_trigger_on_transaction ON public.transactions;
CREATE TRIGGER calculate_referral_commission_trigger_on_transaction
AFTER UPDATE ON public.transactions
FOR EACH ROW
WHEN (NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed')
EXECUTE FUNCTION public.calculate_referral_commission_on_transaction();

COMMIT;

NOTIFY pgrst, 'reload schema';
