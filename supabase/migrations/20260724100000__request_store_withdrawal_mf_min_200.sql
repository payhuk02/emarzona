-- MoneyFusion payout minimum is 200; block creating mobile_money pending below that.
-- Also surface clearer available-after-pending messaging (unchanged formula).

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
  v_mf_min NUMERIC := 200;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stores WHERE id = p_store_id AND user_id = auth.uid()
  ) AND NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Accès non autorisé au portefeuille de cette boutique.';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Le montant de retrait doit être supérieur à 0 XOF';
  END IF;

  IF p_payment_method IS NULL OR p_payment_method NOT IN ('mobile_money', 'bank_card', 'bank_transfer') THEN
    RAISE EXCEPTION 'Méthode de paiement invalide.';
  END IF;

  IF p_payment_method = 'mobile_money' AND p_amount < v_mf_min THEN
    RAISE EXCEPTION 'Montant minimum Mobile Money (MoneyFusion) : % XOF', v_mf_min;
  END IF;

  PERFORM public.update_store_earnings(p_store_id);

  SELECT * INTO v_earnings
  FROM public.store_earnings
  WHERE store_id = p_store_id
  FOR UPDATE;

  IF v_earnings IS NULL THEN
    RAISE EXCEPTION 'Portefeuille introuvable pour ce store.';
  END IF;

  IF COALESCE(v_earnings.withdrawals_blocked, false) THEN
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
    amount,
    currency,
    payment_method,
    payment_details,
    notes,
    status,
    withdrawal_source
  ) VALUES (
    p_store_id,
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
  'Seller withdrawal request; mobile_money min 200 XOF (MoneyFusion). Caps at available_balance minus other pending.';

GRANT EXECUTE ON FUNCTION public.request_store_withdrawal(UUID, NUMERIC, TEXT, JSONB, TEXT) TO authenticated;
