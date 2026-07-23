-- Remove hardcoded 10 000 XOF minimum for store withdrawals.
-- Any positive amount is allowed (still capped by available_balance − pending).

BEGIN;

CREATE OR REPLACE FUNCTION public.request_store_withdrawal(
  p_store_id UUID,
  p_amount NUMERIC,
  p_payment_method TEXT,
  p_payment_details JSONB,
  p_notes TEXT DEFAULT NULL
)
RETURNS public.store_withdrawals
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_earnings RECORD;
  v_pending_amount NUMERIC := 0;
  v_available_after_pending NUMERIC := 0;
  v_withdrawal public.store_withdrawals;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stores WHERE id = p_store_id AND user_id = auth.uid()
  ) AND NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Accès non autorisé au portefeuille de cette boutique.';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Le montant de retrait doit être supérieur à 0 XOF';
  END IF;

  PERFORM public.update_store_earnings(p_store_id);

  SELECT * INTO v_earnings
  FROM public.store_earnings
  WHERE store_id = p_store_id
  FOR UPDATE;

  IF v_earnings IS NULL THEN
    RAISE EXCEPTION 'Portefeuille introuvable pour ce store.';
  END IF;

  IF v_earnings.withdrawals_blocked THEN
    RAISE EXCEPTION 'Les retraits sont bloqués pour cette boutique: %', v_earnings.withdrawals_blocked_reason;
  END IF;

  -- Only pending: processing is already deducted inside calculate_store_earnings.
  SELECT COALESCE(SUM(amount), 0) INTO v_pending_amount
  FROM public.store_withdrawals
  WHERE store_id = p_store_id
    AND status = 'pending';

  v_available_after_pending := v_earnings.available_balance - v_pending_amount;

  IF p_amount > v_available_after_pending THEN
    RAISE EXCEPTION 'Solde insuffisant. Disponible après retraits en attente : % XOF', v_available_after_pending;
  END IF;

  INSERT INTO public.store_withdrawals (
    store_id,
    user_id,
    amount,
    currency,
    payment_method,
    payment_details,
    notes,
    status,
    withdrawal_source
  ) VALUES (
    p_store_id,
    auth.uid(),
    p_amount,
    'XOF',
    p_payment_method,
    COALESCE(p_payment_details, '{}'::jsonb),
    p_notes,
    'pending',
    'manual'
  ) RETURNING * INTO v_withdrawal;

  RETURN v_withdrawal;
END;
$$;

COMMENT ON FUNCTION public.request_store_withdrawal(UUID, NUMERIC, TEXT, JSONB, TEXT) IS
  'Seller withdrawal request; any positive amount up to available_balance minus other pending.';

UPDATE public.platform_settings
SET min_withdrawal_amount = 1
WHERE min_withdrawal_amount IS NULL OR min_withdrawal_amount > 1;

-- Drop mistaken helper if created by a previous apply attempt
DROP FUNCTION IF EXISTS public.update_vendor_auto_payout_config(boolean, integer, numeric);

-- Auto-payout admin config: allow any positive threshold (was hard-min 10000)
CREATE OR REPLACE FUNCTION public.update_auto_payout_vendor_config(
  p_enabled boolean,
  p_delay_days int DEFAULT 7,
  p_min_amount numeric DEFAULT 50000
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cfg jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'ADMIN_REQUIRED';
  END IF;

  IF p_delay_days < 1 OR p_delay_days > 90 THEN
    RAISE EXCEPTION 'INVALID_DELAY_DAYS';
  END IF;

  IF p_min_amount < 1 THEN
    RAISE EXCEPTION 'INVALID_MIN_AMOUNT';
  END IF;

  v_cfg := jsonb_build_object(
    'enabled', COALESCE(p_enabled, false),
    'delay_days', p_delay_days,
    'min_amount', p_min_amount
  );

  INSERT INTO public.platform_settings (key, settings)
  VALUES ('admin', jsonb_build_object('auto_payout_vendors', v_cfg))
  ON CONFLICT (key) DO UPDATE
  SET settings = COALESCE(public.platform_settings.settings, '{}'::jsonb)
    || jsonb_build_object('auto_payout_vendors', v_cfg),
      updated_at = now();

  RETURN v_cfg;
END;
$$;

COMMIT;
