-- E30 Epic 2.4 + 2.2.3: Transparence auto-payout vendeur + monitoring latence webhooks

BEGIN;

-- =====================================================
-- 1. Source des demandes de retrait (Epic 2.4.1)
-- =====================================================

ALTER TABLE public.store_withdrawals
  ADD COLUMN IF NOT EXISTS withdrawal_source TEXT NOT NULL DEFAULT 'manual';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'store_withdrawals_withdrawal_source_check'
  ) THEN
    ALTER TABLE public.store_withdrawals
      ADD CONSTRAINT store_withdrawals_withdrawal_source_check
      CHECK (withdrawal_source IN ('manual', 'auto_payout_suggested'));
  END IF;
END $$;

COMMENT ON COLUMN public.store_withdrawals.withdrawal_source IS
  'manual = demande vendeur ; auto_payout_suggested = créée par cron (validation admin requise, pas de virement Moneroo automatique).';

-- Backfill legacy cron rows (admin_notes pattern)
UPDATE public.store_withdrawals
SET withdrawal_source = 'auto_payout_suggested'
WHERE withdrawal_source = 'manual'
  AND (
    admin_notes ILIKE '%reversement automatique%'
    OR admin_notes ILIKE '%créé automatiquement%'
    OR notes ILIKE '%Reversement automatique%'
  );

-- =====================================================
-- 2. Politique auto-payout lisible par les vendeurs (Epic 2.4.3)
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_vendor_auto_payout_policy()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cfg jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('enabled', false, 'delay_days', 7, 'min_amount', 50000);
  END IF;

  SELECT ps.settings->'auto_payout_vendors'
  INTO v_cfg
  FROM public.platform_settings ps
  WHERE ps.key = 'admin'
  LIMIT 1;

  RETURN jsonb_build_object(
    'enabled', COALESCE((v_cfg->>'enabled')::boolean, false),
    'delay_days', COALESCE((v_cfg->>'delay_days')::int, 7),
    'min_amount', COALESCE((v_cfg->>'min_amount')::numeric, 50000),
    'requires_admin_approval', true,
    'transfer_mode', 'admin_approved_withdrawal'
  );
END;
$$;

COMMENT ON FUNCTION public.get_vendor_auto_payout_policy IS
  'Politique auto-payout pour vendeurs authentifiés — pas de virement PSP automatique, validation admin obligatoire.';

GRANT EXECUTE ON FUNCTION public.get_vendor_auto_payout_policy() TO authenticated;

-- =====================================================
-- 3. Admin: mise à jour config auto_payout_vendors
-- =====================================================

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

  IF p_min_amount < 10000 THEN
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

GRANT EXECUTE ON FUNCTION public.update_auto_payout_vendor_config(boolean, int, numeric) TO authenticated;

-- =====================================================
-- 4. Monitoring latence webhooks (Epic 2.2.3 Gate P1)
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_payment_webhook_health(
  p_hours int DEFAULT 24
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_since timestamptz := now() - make_interval(hours => GREATEST(1, LEAST(p_hours, 168)));
  v_total bigint;
  v_errors bigint;
  v_unprocessed bigint;
  v_p95_ms numeric;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED';
  END IF;

  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'ADMIN_REQUIRED';
  END IF;

  SELECT
    COUNT(*)::bigint,
    COUNT(*) FILTER (WHERE processing_error IS NOT NULL)::bigint,
    COUNT(*) FILTER (WHERE processed_at IS NULL AND processing_error IS NULL)::bigint,
    COALESCE(
      percentile_cont(0.95) WITHIN GROUP (
        ORDER BY EXTRACT(EPOCH FROM (processed_at - created_at)) * 1000
      ),
      0
    )
  INTO v_total, v_errors, v_unprocessed, v_p95_ms
  FROM public.payment_webhook_events
  WHERE created_at >= v_since;

  RETURN jsonb_build_object(
    'window_hours', p_hours,
    'total_events', v_total,
    'processing_errors', v_errors,
    'unprocessed', v_unprocessed,
    'p95_processing_latency_ms', ROUND(v_p95_ms::numeric, 2),
    'healthy', v_errors = 0 AND v_unprocessed = 0 AND v_p95_ms < 5000
  );
END;
$$;

COMMENT ON FUNCTION public.get_payment_webhook_health IS
  'KPI Gate P1 rollout V2 — erreurs webhook, backlog non traité, p95 latence traitement.';

GRANT EXECUTE ON FUNCTION public.get_payment_webhook_health(int) TO authenticated;

COMMIT;
