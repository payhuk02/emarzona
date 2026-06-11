-- E28 Epic 2.3: Exactitude financière — remboursements partiels, affiliés multi-item,
-- gel wallet litiges, réconciliation Moneroo (infra SQL)

BEGIN;

-- =====================================================
-- 1. Colonnes remboursement partiel
-- =====================================================

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS refunded_amount NUMERIC(12, 2) NOT NULL DEFAULT 0;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS refunded_amount NUMERIC(12, 2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.transactions.refunded_amount IS
  'Montant cumulé remboursé (partiel ou total). Source of truth financière.';
COMMENT ON COLUMN public.orders.refunded_amount IS
  'Montant cumulé remboursé sur la commande.';

-- Backfill depuis moneroo_refund_amount si présent
UPDATE public.transactions t
SET refunded_amount = COALESCE(t.moneroo_refund_amount, t.refunded_amount, 0)
WHERE COALESCE(t.refunded_amount, 0) = 0
  AND COALESCE(t.moneroo_refund_amount, 0) > 0;

-- Statut partially_refunded sur transactions
DO $$
DECLARE
  c RECORD;
BEGIN
  FOR c IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.transactions'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS %I', c.conname);
  END LOOP;
END $$;

ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_status_check
  CHECK (status IN (
    'pending', 'processing', 'completed', 'failed', 'cancelled',
    'refunded', 'partially_refunded'
  ));

-- =====================================================
-- 2. Gel wallet litiges
-- =====================================================

ALTER TABLE public.store_earnings
  ADD COLUMN IF NOT EXISTS withdrawals_blocked BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS withdrawals_blocked_reason TEXT,
  ADD COLUMN IF NOT EXISTS withdrawals_blocked_at TIMESTAMPTZ;

COMMENT ON COLUMN public.store_earnings.withdrawals_blocked IS
  'True si un litige ouvert bloque les retraits vendeur (Epic 2.3.7).';

-- =====================================================
-- 3. Revenu net commande (post-remboursement partiel)
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_order_eligible_for_revenue(
  p_status TEXT,
  p_payment_status TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT p_status IN ('completed', 'confirmed')
    AND p_payment_status IN ('paid', 'partially_refunded');
$$;

CREATE OR REPLACE FUNCTION public.order_net_revenue_amount(p_order_id UUID)
RETURNS NUMERIC
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT GREATEST(
    COALESCE(o.total_amount, 0) - COALESCE(o.refunded_amount, 0),
    0
  )
  FROM public.orders o
  WHERE o.id = p_order_id;
$$;

-- =====================================================
-- 4. calculate_store_earnings + update_store_earnings (C1 + partiels + taux dynamique)
-- =====================================================

CREATE OR REPLACE FUNCTION public.calculate_store_earnings(p_store_id UUID)
RETURNS TABLE (
  total_revenue NUMERIC,
  total_platform_commission NUMERIC,
  total_withdrawn NUMERIC,
  available_balance NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_revenue NUMERIC := 0;
  v_fee_percent NUMERIC := 10;
  v_total_platform_commission NUMERIC := 0;
  v_total_withdrawn NUMERIC := 0;
  v_available_balance NUMERIC := 0;
BEGIN
  SELECT COALESCE(SUM(public.order_net_revenue_amount(o.id)), 0)
  INTO v_total_revenue
  FROM public.orders o
  WHERE o.store_id = p_store_id
    AND public.is_order_eligible_for_revenue(o.status, o.payment_status)
    AND NOT public.is_order_psp_direct_settlement(o.payment_provider_used);

  v_fee_percent := public.resolve_store_platform_fee_percent(p_store_id);

  SELECT COALESCE(SUM(
    ROUND(
      (public.order_commissionable_amount(o.id)
        * GREATEST(1 - (COALESCE(o.refunded_amount, 0) / NULLIF(o.total_amount, 0)), 0)
        * v_fee_percent / 100.0)::numeric,
      2
    )
  ), 0)
  INTO v_total_platform_commission
  FROM public.orders o
  WHERE o.store_id = p_store_id
    AND public.is_order_eligible_for_revenue(o.status, o.payment_status)
    AND NOT public.is_order_psp_direct_settlement(o.payment_provider_used);

  SELECT COALESCE(SUM(amount), 0)
  INTO v_total_withdrawn
  FROM public.store_withdrawals
  WHERE store_id = p_store_id
    AND status IN ('completed', 'processing');

  v_available_balance := v_total_revenue - v_total_platform_commission - v_total_withdrawn;

  IF v_available_balance < 0 THEN
    v_available_balance := 0;
  END IF;

  RETURN QUERY SELECT
    v_total_revenue,
    v_total_platform_commission,
    v_total_withdrawn,
    v_available_balance;
END;
$$;

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
  SELECT * INTO v_earnings FROM public.calculate_store_earnings(p_store_id);

  v_fee_rate := public.resolve_store_platform_fee_percent(p_store_id) / 100.0;

  INSERT INTO public.store_earnings (
    store_id,
    total_revenue,
    total_platform_commission,
    total_withdrawn,
    available_balance,
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
    v_fee_rate,
    now(),
    now()
  )
  ON CONFLICT (store_id) DO UPDATE SET
    total_revenue = EXCLUDED.total_revenue,
    total_platform_commission = EXCLUDED.total_platform_commission,
    total_withdrawn = EXCLUDED.total_withdrawn,
    available_balance = EXCLUDED.available_balance,
    platform_commission_rate = EXCLUDED.platform_commission_rate,
    last_calculated_at = now(),
    updated_at = now();
END;
$$;

-- Recalcul earnings sur remboursement partiel
CREATE OR REPLACE FUNCTION public.trigger_update_store_earnings_on_order_refunded()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.update_store_earnings(NEW.store_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_store_earnings_on_order_refunded ON public.orders;
CREATE TRIGGER update_store_earnings_on_order_refunded
  AFTER UPDATE OF payment_status, refunded_amount ON public.orders
  FOR EACH ROW
  WHEN (
    NEW.payment_status IN ('refunded', 'partially_refunded')
    AND (
      OLD.payment_status IS DISTINCT FROM NEW.payment_status
      OR COALESCE(OLD.refunded_amount, 0) IS DISTINCT FROM COALESCE(NEW.refunded_amount, 0)
    )
  )
  EXECUTE FUNCTION public.trigger_update_store_earnings_on_order_refunded();

-- =====================================================
-- 5. Révocation accès digital proportionnelle
-- =====================================================

CREATE OR REPLACE FUNCTION public.revoke_digital_access_for_order(
  p_order_id UUID,
  p_refund_ratio NUMERIC DEFAULT 1.0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF COALESCE(p_refund_ratio, 0) < 0.999 THEN
    UPDATE public.digital_licenses
    SET
      metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
        'partial_refund_ratio', p_refund_ratio,
        'partial_refund_at', now()
      ),
      updated_at = now()
    WHERE order_id = p_order_id
      AND status IN ('active', 'pending');
    RETURN;
  END IF;

  UPDATE public.digital_licenses
  SET status = 'revoked', updated_at = now()
  WHERE order_id = p_order_id
    AND status IN ('active', 'pending');

  UPDATE public.download_tokens dt
  SET expires_at = now()
  FROM public.order_items oi
  INNER JOIN public.digital_products dp ON dp.id = oi.digital_product_id
  WHERE oi.order_id = p_order_id
    AND dt.product_id = dp.product_id
    AND dt.expires_at > now();

  UPDATE public.customer_downloads
  SET expires_at = now()
  WHERE order_id = p_order_id
    AND (expires_at IS NULL OR expires_at > now());
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_revoke_digital_access_on_refund()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ratio NUMERIC;
BEGIN
  IF TG_OP = 'UPDATE'
    AND NEW.payment_status IN ('refunded', 'partially_refunded')
    AND OLD.payment_status IS DISTINCT FROM NEW.payment_status
       OR COALESCE(OLD.refunded_amount, 0) IS DISTINCT FROM COALESCE(NEW.refunded_amount, 0) THEN
    v_ratio := CASE
      WHEN COALESCE(NEW.total_amount, 0) <= 0 THEN 1.0
      ELSE LEAST(COALESCE(NEW.refunded_amount, 0) / NEW.total_amount, 1.0)
    END;
    PERFORM public.revoke_digital_access_for_order(NEW.id, v_ratio);
  END IF;
  RETURN NEW;
END;
$$;

-- =====================================================
-- 6. apply_transaction_refund — source of truth remboursements
-- =====================================================

CREATE OR REPLACE FUNCTION public.apply_transaction_refund(
  p_transaction_id UUID,
  p_refund_amount NUMERIC,
  p_refund_id TEXT DEFAULT NULL,
  p_provider TEXT DEFAULT 'unknown',
  p_reason TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tx public.transactions%ROWTYPE;
  v_prev_refunded NUMERIC;
  v_new_refunded NUMERIC;
  v_tx_amount NUMERIC;
  v_new_status TEXT;
  v_order_payment_status TEXT;
  v_refund_ratio NUMERIC;
  v_now TIMESTAMPTZ := now();
BEGIN
  IF p_refund_amount IS NULL OR p_refund_amount <= 0 THEN
    RAISE EXCEPTION 'INVALID_REFUND_AMOUNT';
  END IF;

  SELECT * INTO v_tx
  FROM public.transactions
  WHERE id = p_transaction_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'TRANSACTION_NOT_FOUND';
  END IF;

  IF v_tx.status NOT IN ('completed', 'partially_refunded') THEN
    RAISE EXCEPTION 'CANNOT_REFUND_STATUS_%', v_tx.status;
  END IF;

  v_tx_amount := COALESCE(v_tx.amount, 0);
  v_prev_refunded := COALESCE(v_tx.refunded_amount, v_tx.moneroo_refund_amount, 0);
  v_new_refunded := v_prev_refunded + p_refund_amount;

  IF v_new_refunded > v_tx_amount + 0.01 THEN
    RAISE EXCEPTION 'REFUND_EXCEEDS_TRANSACTION_AMOUNT';
  END IF;

  IF v_new_refunded >= v_tx_amount - 0.01 THEN
    v_new_status := 'refunded';
    v_order_payment_status := 'refunded';
    v_refund_ratio := 1.0;
  ELSE
    v_new_status := 'partially_refunded';
    v_order_payment_status := 'partially_refunded';
    v_refund_ratio := v_new_refunded / NULLIF(v_tx_amount, 0);
  END IF;

  UPDATE public.transactions
  SET
    status = v_new_status,
    refunded_amount = ROUND(v_new_refunded, 2),
    moneroo_refund_amount = ROUND(v_new_refunded, 2),
    moneroo_refund_id = COALESCE(p_refund_id, moneroo_refund_id),
    moneroo_refund_reason = COALESCE(p_reason, moneroo_refund_reason),
    refunded_at = COALESCE(refunded_at, v_now),
    updated_at = v_now,
    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
      'last_refund', jsonb_build_object(
        'refund_id', p_refund_id,
        'amount', p_refund_amount,
        'cumulative', v_new_refunded,
        'provider', p_provider,
        'reason', p_reason,
        'at', v_now
      )
    ) || COALESCE(p_metadata, '{}'::jsonb)
  WHERE id = p_transaction_id;

  IF v_tx.order_id IS NOT NULL THEN
    UPDATE public.orders
    SET
      payment_status = v_order_payment_status,
      refunded_amount = ROUND(v_new_refunded, 2),
      updated_at = v_now
    WHERE id = v_tx.order_id;

    PERFORM public.revoke_digital_access_for_order(v_tx.order_id, v_refund_ratio);
    PERFORM public.update_store_earnings(v_tx.store_id);
  END IF;

  INSERT INTO public.transaction_logs (
    transaction_id, event_type, status, response_data
  )
  VALUES (
    p_transaction_id,
    CASE WHEN v_new_status = 'refunded' THEN 'refund_completed' ELSE 'partial_refund_completed' END,
    'completed',
    jsonb_build_object(
      'refund_id', p_refund_id,
      'amount', p_refund_amount,
      'cumulative_refunded', v_new_refunded,
      'provider', p_provider,
      'status', v_new_status
    )
  );

  RETURN jsonb_build_object(
    'transaction_id', p_transaction_id,
    'order_id', v_tx.order_id,
    'status', v_new_status,
    'refunded_amount', v_new_refunded,
    'refund_ratio', v_refund_ratio
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_transaction_refund(UUID, NUMERIC, TEXT, TEXT, TEXT, JSONB)
  TO service_role;

-- =====================================================
-- 7. Affiliés multi-item (Epic 2.3.4)
-- =====================================================

CREATE OR REPLACE FUNCTION public._affiliate_commission_for_order_product(
  p_order public.orders,
  p_product_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_affiliate_click affiliate_clicks%ROWTYPE;
  v_affiliate_link affiliate_links%ROWTYPE;
  v_product_settings product_affiliate_settings%ROWTYPE;
  v_commission_base NUMERIC;
  v_commission_amount NUMERIC;
  v_platform_fee_rate NUMERIC := 0.10;
  v_item_total NUMERIC;
BEGIN
  IF p_product_id IS NULL THEN
    RETURN false;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.affiliate_commissions ac
    WHERE ac.order_id = p_order.id AND ac.product_id = p_product_id
  ) THEN
    RETURN false;
  END IF;

  IF p_order.affiliate_tracking_cookie IS NOT NULL THEN
    SELECT ac.* INTO v_affiliate_click
    FROM public.affiliate_clicks ac
    WHERE ac.tracking_cookie = p_order.affiliate_tracking_cookie
      AND ac.product_id = p_product_id
      AND ac.cookie_expires_at > now()
      AND ac.converted = false
    ORDER BY ac.clicked_at DESC
    LIMIT 1;
  END IF;

  IF v_affiliate_click IS NULL THEN
    SELECT ac.* INTO v_affiliate_click
    FROM public.affiliate_clicks ac
    WHERE ac.product_id = p_product_id
      AND ac.tracking_cookie IS NOT NULL
      AND ac.cookie_expires_at > now()
      AND ac.converted = false
    ORDER BY ac.clicked_at DESC
    LIMIT 1;
  END IF;

  IF v_affiliate_click IS NULL THEN
    RETURN false;
  END IF;

  SELECT * INTO v_affiliate_link
  FROM public.affiliate_links
  WHERE id = v_affiliate_click.affiliate_link_id AND status = 'active';

  IF v_affiliate_link IS NULL THEN
    RETURN false;
  END IF;

  SELECT * INTO v_product_settings
  FROM public.product_affiliate_settings
  WHERE product_id = p_product_id AND affiliate_enabled = true;

  IF v_product_settings IS NULL THEN
    RETURN false;
  END IF;

  SELECT COALESCE(
    NULLIF(oi.total_price, 0),
    COALESCE(oi.quantity, 1) * COALESCE(oi.unit_price, 0),
    0
  )
  INTO v_item_total
  FROM public.order_items oi
  WHERE oi.order_id = p_order.id AND oi.product_id = p_product_id
  LIMIT 1;

  IF v_item_total < v_product_settings.min_order_amount THEN
    RETURN false;
  END IF;

  v_platform_fee_rate := public.resolve_store_platform_fee_percent(p_order.store_id) / 100.0;
  v_commission_base := v_item_total * (1 - v_platform_fee_rate);

  IF v_product_settings.commission_type = 'percentage' THEN
    v_commission_amount := v_commission_base * (v_product_settings.commission_rate / 100);
  ELSE
    v_commission_amount := v_product_settings.fixed_commission_amount;
  END IF;

  IF v_product_settings.max_commission_per_sale IS NOT NULL THEN
    v_commission_amount := LEAST(v_commission_amount, v_product_settings.max_commission_per_sale);
  END IF;

  INSERT INTO public.affiliate_commissions (
    affiliate_id, affiliate_link_id, product_id, store_id, order_id,
    order_total, commission_base, commission_rate, commission_type,
    commission_amount, status
  )
  VALUES (
    v_affiliate_link.affiliate_id,
    v_affiliate_link.id,
    p_product_id,
    v_affiliate_link.store_id,
    p_order.id,
    v_item_total,
    v_commission_base,
    v_product_settings.commission_rate,
    v_product_settings.commission_type,
    v_commission_amount,
    'pending'
  );

  UPDATE public.affiliate_clicks
  SET converted = true, converted_at = now()
  WHERE id = v_affiliate_click.id;

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_affiliate_commission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT public.is_order_paid_for_revenue(NEW.status, NEW.payment_status) THEN
    RETURN NEW;
  END IF;

  FOR v_product_id IN
    SELECT DISTINCT oi.product_id
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id AND oi.product_id IS NOT NULL
  LOOP
    PERFORM public._affiliate_commission_for_order_product(NEW, v_product_id);
  END LOOP;

  RETURN NEW;
END;
$$;

-- =====================================================
-- 8. Litiges → gel wallet (Epic 2.3.7)
-- =====================================================

CREATE OR REPLACE FUNCTION public.sync_store_withdrawals_blocked_from_disputes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_store_id UUID;
  v_open_count INTEGER;
BEGIN
  SELECT o.store_id INTO v_store_id
  FROM public.orders o
  WHERE o.id = COALESCE(NEW.order_id, OLD.order_id);

  IF v_store_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT COUNT(*) INTO v_open_count
  FROM public.disputes d
  INNER JOIN public.orders o ON o.id = d.order_id
  WHERE o.store_id = v_store_id
    AND d.status IN ('open', 'investigating', 'waiting_customer', 'waiting_seller');

  UPDATE public.store_earnings
  SET
    withdrawals_blocked = v_open_count > 0,
    withdrawals_blocked_reason = CASE
      WHEN v_open_count > 0 THEN format('%s litige(s) ouvert(s)', v_open_count)
      ELSE NULL
    END,
    withdrawals_blocked_at = CASE
      WHEN v_open_count > 0 THEN COALESCE(withdrawals_blocked_at, now())
      ELSE NULL
    END,
    updated_at = now()
  WHERE store_id = v_store_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS sync_withdrawals_blocked_on_dispute ON public.disputes;
CREATE TRIGGER sync_withdrawals_blocked_on_dispute
  AFTER INSERT OR UPDATE OF status OR DELETE ON public.disputes
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_store_withdrawals_blocked_from_disputes();

-- =====================================================
-- 9. Réconciliation Moneroo — tables audit
-- =====================================================

CREATE TABLE IF NOT EXISTS public.moneroo_reconciliation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  total_checked INTEGER NOT NULL DEFAULT 0,
  matched INTEGER NOT NULL DEFAULT 0,
  mismatched INTEGER NOT NULL DEFAULT 0,
  errors INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.moneroo_reconciliation_mismatches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES public.moneroo_reconciliation_runs(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  moneroo_transaction_id TEXT,
  discrepancy_type TEXT NOT NULL,
  db_value JSONB,
  moneroo_value JSONB,
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_moneroo_recon_mismatches_unresolved
  ON public.moneroo_reconciliation_mismatches(resolved, created_at DESC)
  WHERE resolved = false;

ALTER TABLE public.moneroo_reconciliation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moneroo_reconciliation_mismatches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Platform admins view reconciliation runs" ON public.moneroo_reconciliation_runs;
CREATE POLICY "Platform admins view reconciliation runs"
  ON public.moneroo_reconciliation_runs FOR SELECT
  TO authenticated
  USING (public.is_platform_admin());

DROP POLICY IF EXISTS "Platform admins view reconciliation mismatches" ON public.moneroo_reconciliation_mismatches;
CREATE POLICY "Platform admins view reconciliation mismatches"
  ON public.moneroo_reconciliation_mismatches FOR SELECT
  TO authenticated
  USING (public.is_platform_admin());

CREATE OR REPLACE FUNCTION public.list_moneroo_transactions_for_reconciliation(
  p_hours_back INTEGER DEFAULT 48,
  p_limit INTEGER DEFAULT 200
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'transaction_id', t.id,
      'moneroo_transaction_id', t.moneroo_transaction_id,
      'status', t.status,
      'amount', t.amount,
      'currency', t.currency,
      'store_id', t.store_id
    ) ORDER BY t.created_at DESC)
    FROM (
      SELECT t.id, t.moneroo_transaction_id, t.status, t.amount, t.currency, t.store_id, t.created_at
      FROM public.transactions t
      WHERE t.moneroo_transaction_id IS NOT NULL
        AND t.payment_provider IN ('moneroo', 'moneroo_platform')
        AND t.created_at >= now() - (p_hours_back || ' hours')::interval
        AND t.status IN ('completed', 'partially_refunded', 'refunded', 'processing')
      ORDER BY t.created_at DESC
      LIMIT p_limit
    ) t
  ), '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.record_moneroo_reconciliation_result(
  p_run_id UUID,
  p_transaction_id UUID,
  p_moneroo_transaction_id TEXT,
  p_matched BOOLEAN,
  p_discrepancy_type TEXT DEFAULT NULL,
  p_db_value JSONB DEFAULT NULL,
  p_moneroo_value JSONB DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_matched THEN
    UPDATE public.moneroo_reconciliation_runs
    SET matched = matched + 1, total_checked = total_checked + 1
    WHERE id = p_run_id;
  ELSE
    UPDATE public.moneroo_reconciliation_runs
    SET mismatched = mismatched + 1, total_checked = total_checked + 1
    WHERE id = p_run_id;

    INSERT INTO public.moneroo_reconciliation_mismatches (
      run_id, transaction_id, moneroo_transaction_id,
      discrepancy_type, db_value, moneroo_value
    )
    VALUES (
      p_run_id, p_transaction_id, p_moneroo_transaction_id,
      COALESCE(p_discrepancy_type, 'unknown'), p_db_value, p_moneroo_value
    );
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.start_moneroo_reconciliation_run(
  p_hours_back INTEGER DEFAULT 48
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_run_id UUID;
BEGIN
  INSERT INTO public.moneroo_reconciliation_runs (period_start, period_end)
  VALUES (
    now() - (p_hours_back || ' hours')::interval,
    now()
  )
  RETURNING id INTO v_run_id;
  RETURN v_run_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.finish_moneroo_reconciliation_run(
  p_run_id UUID,
  p_errors INTEGER DEFAULT 0,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.moneroo_reconciliation_runs
  SET
    completed_at = now(),
    errors = p_errors,
    metadata = COALESCE(metadata, '{}'::jsonb) || COALESCE(p_metadata, '{}'::jsonb)
  WHERE id = p_run_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_moneroo_transactions_for_reconciliation(INTEGER, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_moneroo_reconciliation_result(UUID, UUID, TEXT, BOOLEAN, TEXT, JSONB, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.start_moneroo_reconciliation_run(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.finish_moneroo_reconciliation_run(UUID, INTEGER, JSONB) TO service_role;

-- Cron quotidien réconciliation Moneroo (07:00 UTC)
CREATE OR REPLACE FUNCTION public.setup_moneroo_reconciliation_cron_job(
  p_project_ref text,
  p_cron_secret text,
  p_anon_key text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, cron, net
AS $$
DECLARE
  v_anon text;
  v_base_url text;
  v_job_id bigint;
BEGIN
  IF p_project_ref IS NULL OR length(trim(p_project_ref)) = 0 THEN
    RAISE EXCEPTION 'p_project_ref is required';
  END IF;
  IF p_cron_secret IS NULL OR length(trim(p_cron_secret)) = 0 THEN
    RAISE EXCEPTION 'p_cron_secret is required';
  END IF;

  v_anon := COALESCE(NULLIF(trim(p_anon_key), ''), current_setting('app.settings.anon_key', true));
  IF v_anon IS NULL OR v_anon = '' THEN
    RAISE EXCEPTION 'p_anon_key is required';
  END IF;

  v_base_url := format('https://%s.supabase.co/functions/v1', trim(p_project_ref));

  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'moneroo-reconciliation-daily') THEN
    PERFORM cron.unschedule('moneroo-reconciliation-daily');
  END IF;

  SELECT cron.schedule(
    'moneroo-reconciliation-daily',
    '0 7 * * *',
    format(
      $cmd$
      SELECT net.http_post(
        url := %L,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || %L,
          'apikey', %L,
          'x-cron-secret', %L
        ),
        body := jsonb_build_object('hours_back', 48)
      ) AS request_id;
      $cmd$,
      v_base_url || '/moneroo-reconciliation-cron',
      v_anon,
      v_anon,
      p_cron_secret
    )
  ) INTO v_job_id;

  RETURN jsonb_build_object(
    'job_name', 'moneroo-reconciliation-daily',
    'job_id', v_job_id,
    'schedule', '0 7 * * *',
    'url', v_base_url || '/moneroo-reconciliation-cron'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.setup_moneroo_reconciliation_cron_job(text, text, text) TO service_role;

COMMIT;
