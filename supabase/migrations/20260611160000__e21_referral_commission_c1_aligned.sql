-- E21 Epic 2.3.3: Referral commissions on commissionable order base (C1-aligned)

BEGIN;

CREATE OR REPLACE FUNCTION public.calculate_referral_commission()
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

  IF NEW.order_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT s.user_id
  INTO v_store_user_id
  FROM public.stores s
  WHERE s.id = NEW.store_id
  LIMIT 1;

  IF v_store_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT p.referred_by
  INTO v_referrer_id
  FROM public.profiles p
  WHERE p.id = v_store_user_id
  LIMIT 1;

  IF v_referrer_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT id
  INTO v_referral_id
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
    WHERE rc.payment_id = NEW.id
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
    NEW.id,
    NEW.order_id,
    v_commissionable_amount,
    v_commission_rate,
    v_commission_amount,
    'completed'
  );

  UPDATE public.profiles
  SET total_referral_earnings = COALESCE(total_referral_earnings, 0) + v_commission_amount
  WHERE id = v_referrer_id;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.calculate_referral_commission IS
  'Referral payout on order_commissionable_amount (C1), not gross payment.amount. Idempotent per payment.';

COMMIT;
