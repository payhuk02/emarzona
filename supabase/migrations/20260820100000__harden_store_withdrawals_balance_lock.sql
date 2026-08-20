-- Harden store withdrawals for multi-tenant scale:
-- 1) Block seller direct INSERT (must use request_store_withdrawal RPC)
-- 2) Restore advisory lock on update_store_earnings
-- 3) Atomic admin approve for bank/card (balance check scoped to withdrawal.store_id)

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Drop seller INSERT policies (RLS OR would still allow bypass of RPC)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Store owners can create their own withdrawals" ON public.store_withdrawals;
DROP POLICY IF EXISTS "store_withdrawals_insert_policy" ON public.store_withdrawals;
DROP POLICY IF EXISTS "Store owners create withdrawals" ON public.store_withdrawals;

-- ---------------------------------------------------------------------------
-- 2. update_store_earnings: restore pessimistic lock (lost in affiliate fix)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_store_earnings(p_store_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_earnings RECORD;
  v_fee_rate NUMERIC;
BEGIN
  -- Dual-key advisory lock reduces 32-bit hashtext collision risk at scale
  PERFORM pg_advisory_xact_lock(
    hashtext('store_earnings'),
    hashtext(p_store_id::text)
  );

  SELECT * INTO v_earnings FROM public.calculate_store_earnings(p_store_id);

  v_fee_rate := public.resolve_store_platform_fee_percent(p_store_id) / 100.0;

  INSERT INTO public.store_earnings (
    store_id,
    total_revenue,
    total_platform_commission,
    total_withdrawn,
    available_balance,
    total_affiliate_commissions,
    platform_commission_rate,
    last_calculated_at,
    updated_at
  )
  VALUES (
    p_store_id,
    COALESCE(v_earnings.total_revenue, 0),
    COALESCE(v_earnings.total_platform_commission, 0),
    COALESCE(v_earnings.total_withdrawn, 0),
    COALESCE(v_earnings.available_balance, 0),
    COALESCE(v_earnings.total_affiliate_commissions, 0),
    v_fee_rate,
    now(),
    now()
  )
  ON CONFLICT (store_id) DO UPDATE SET
    total_revenue = EXCLUDED.total_revenue,
    total_platform_commission = EXCLUDED.total_platform_commission,
    total_withdrawn = EXCLUDED.total_withdrawn,
    available_balance = EXCLUDED.available_balance,
    total_affiliate_commissions = EXCLUDED.total_affiliate_commissions,
    platform_commission_rate = EXCLUDED.platform_commission_rate,
    last_calculated_at = now(),
    updated_at = now();
END;
$$;

-- ---------------------------------------------------------------------------
-- 3. Atomic admin approve (bank / card / manual path)
-- Always binds to store_withdrawals.store_id — never a client-supplied store.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.approve_store_withdrawal_manual(p_withdrawal_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_w public.store_withdrawals%ROWTYPE;
  v_earnings public.store_earnings%ROWTYPE;
  v_other_pending NUMERIC := 0;
  v_available_after NUMERIC := 0;
  v_admin UUID := auth.uid();
BEGIN
  IF v_admin IS NULL OR NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT * INTO v_w
  FROM public.store_withdrawals
  WHERE id = p_withdrawal_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Withdrawal not found';
  END IF;

  IF v_w.status IS DISTINCT FROM 'pending' THEN
    RAISE EXCEPTION 'Withdrawal is not pending (status=%)', v_w.status;
  END IF;

  IF v_w.payment_method = 'mobile_money' THEN
    RAISE EXCEPTION 'Mobile money withdrawals must be approved via MoneyFusion payout edge';
  END IF;

  -- Lock + refresh earnings for THIS store only
  PERFORM pg_advisory_xact_lock(
    hashtext('store_earnings'),
    hashtext(v_w.store_id::text)
  );
  PERFORM public.update_store_earnings(v_w.store_id);

  SELECT * INTO v_earnings
  FROM public.store_earnings
  WHERE store_id = v_w.store_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Portefeuille introuvable pour la boutique du retrait';
  END IF;

  IF COALESCE(v_earnings.withdrawals_blocked, false) THEN
    RAISE EXCEPTION 'Les retraits sont bloqués pour cette boutique: %',
      v_earnings.withdrawals_blocked_reason;
  END IF;

  SELECT COALESCE(SUM(amount), 0) INTO v_other_pending
  FROM public.store_withdrawals
  WHERE store_id = v_w.store_id
    AND status = 'pending'
    AND id <> v_w.id;

  -- available_balance already excludes processing/completed
  v_available_after := COALESCE(v_earnings.available_balance, 0) - v_other_pending;

  IF v_w.amount > v_available_after THEN
    RAISE EXCEPTION
      'Solde insuffisant pour la boutique %. Disponible après autres pending: % (demande: %)',
      v_w.store_id, v_available_after, v_w.amount;
  END IF;

  UPDATE public.store_withdrawals
  SET
    status = 'processing',
    approved_at = now(),
    approved_by = v_admin,
    updated_at = now()
  WHERE id = v_w.id
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Withdrawal claim failed (concurrent approval)';
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'withdrawal_id', v_w.id,
    'store_id', v_w.store_id,
    'amount', v_w.amount,
    'available_after_pending', v_available_after,
    'status', 'processing',
    'platform_withdrawal_fee', 0
  );
END;
$$;

COMMENT ON FUNCTION public.approve_store_withdrawal_manual(UUID) IS
  'Admin-only: approve bank/card withdrawal after locking store_earnings for withdrawal.store_id and re-checking available balance.';

GRANT EXECUTE ON FUNCTION public.approve_store_withdrawal_manual(UUID) TO authenticated;

COMMIT;
