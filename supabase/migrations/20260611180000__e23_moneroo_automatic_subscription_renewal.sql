-- E23 Epic 2.1.2: Moneroo automatic subscription renewal (mandate profile + cron queue)

BEGIN;

-- =====================================================
-- 1. Billing mandate (Moneroo has no native recurring API —
--    we store reusable customer profile + last payment ref)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.subscription_billing_mandates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL UNIQUE REFERENCES public.store_platform_subscriptions(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  customer_country TEXT,
  moneroo_last_payment_id TEXT,
  auto_renew_enabled BOOLEAN NOT NULL DEFAULT true,
  last_successful_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscription_billing_mandates_store
  ON public.subscription_billing_mandates(store_id);

COMMENT ON TABLE public.subscription_billing_mandates IS
  'Profil de facturation réutilisable pour renouvellements Moneroo (pas de mandate natif).';

-- =====================================================
-- 2. Save / update mandate
-- =====================================================

CREATE OR REPLACE FUNCTION public.save_subscription_billing_mandate(
  p_subscription_id UUID,
  p_store_id UUID,
  p_customer_email TEXT,
  p_customer_name TEXT DEFAULT NULL,
  p_customer_phone TEXT DEFAULT NULL,
  p_customer_country TEXT DEFAULT NULL,
  p_moneroo_payment_id TEXT DEFAULT NULL,
  p_auto_renew_enabled BOOLEAN DEFAULT true
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mandate_id UUID;
BEGIN
  IF p_customer_email IS NULL OR trim(p_customer_email) = '' THEN
    RAISE EXCEPTION 'CUSTOMER_EMAIL_REQUIRED';
  END IF;

  INSERT INTO public.subscription_billing_mandates (
    subscription_id,
    store_id,
    customer_email,
    customer_name,
    customer_phone,
    customer_country,
    moneroo_last_payment_id,
    auto_renew_enabled,
    last_successful_at,
    updated_at
  )
  VALUES (
    p_subscription_id,
    p_store_id,
    lower(trim(p_customer_email)),
    NULLIF(trim(p_customer_name), ''),
    NULLIF(trim(p_customer_phone), ''),
    NULLIF(trim(p_customer_country), ''),
    p_moneroo_payment_id,
    COALESCE(p_auto_renew_enabled, true),
    CASE WHEN p_moneroo_payment_id IS NOT NULL THEN now() ELSE NULL END,
    now()
  )
  ON CONFLICT (subscription_id) DO UPDATE SET
    customer_email = EXCLUDED.customer_email,
    customer_name = COALESCE(EXCLUDED.customer_name, subscription_billing_mandates.customer_name),
    customer_phone = COALESCE(EXCLUDED.customer_phone, subscription_billing_mandates.customer_phone),
    customer_country = COALESCE(EXCLUDED.customer_country, subscription_billing_mandates.customer_country),
    moneroo_last_payment_id = COALESCE(EXCLUDED.moneroo_last_payment_id, subscription_billing_mandates.moneroo_last_payment_id),
    auto_renew_enabled = COALESCE(EXCLUDED.auto_renew_enabled, subscription_billing_mandates.auto_renew_enabled),
    last_successful_at = CASE
      WHEN EXCLUDED.moneroo_last_payment_id IS NOT NULL THEN now()
      ELSE subscription_billing_mandates.last_successful_at
    END,
    updated_at = now()
  RETURNING id INTO v_mandate_id;

  UPDATE public.store_platform_subscriptions
  SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
    'auto_renew_enabled', COALESCE(p_auto_renew_enabled, true),
    'billing_mandate_id', v_mandate_id
  ),
  updated_at = now()
  WHERE id = p_subscription_id;

  RETURN v_mandate_id;
END;
$$;

-- =====================================================
-- 3. Subscriptions eligible for automatic renewal charge
-- =====================================================

CREATE OR REPLACE FUNCTION public.list_subscriptions_for_auto_renewal()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT COALESCE(jsonb_agg(row_to_json(t)::jsonb ORDER BY t.current_period_end ASC), '[]'::jsonb)
  INTO v_result
  FROM (
    SELECT
      sps.id AS subscription_id,
      sps.store_id,
      sps.status,
      sps.billing_cycle,
      sps.current_period_end,
      sbm.id AS mandate_id,
      sbm.customer_email,
      sbm.customer_name,
      sbm.customer_phone,
      sbm.customer_country,
      pvp.slug AS plan_slug,
      pvp.monthly_price,
      pvp.yearly_price,
      COALESCE(pvp.currency, 'XOF') AS currency,
      s.user_id AS owner_user_id,
      si.id AS pending_invoice_id,
      si.amount AS pending_invoice_amount,
      (
        SELECT spa.metadata->>'checkout_url'
        FROM public.subscription_payment_attempts spa
        INNER JOIN public.subscription_invoices si2 ON si2.id = spa.invoice_id
        WHERE si2.subscription_id = sps.id
          AND si2.status = 'pending'
          AND spa.status IN ('pending', 'processing')
          AND spa.metadata->>'checkout_url' IS NOT NULL
        ORDER BY spa.attempted_at DESC
        LIMIT 1
      ) AS existing_checkout_url
    FROM public.store_platform_subscriptions sps
    INNER JOIN public.subscription_billing_mandates sbm ON sbm.subscription_id = sps.id
    INNER JOIN public.platform_vendor_plans pvp ON pvp.id = sps.plan_id
    INNER JOIN public.stores s ON s.id = sps.store_id
    LEFT JOIN public.subscription_invoices si
      ON si.subscription_id = sps.id AND si.status = 'pending'
    WHERE sbm.auto_renew_enabled = true
      AND sbm.customer_email IS NOT NULL
      AND sps.status IN ('active', 'past_due')
      AND sps.current_period_end IS NOT NULL
      AND (
        (sps.status = 'active' AND sps.current_period_end <= now() + interval '3 days')
        OR (sps.status = 'past_due')
      )
      AND NOT EXISTS (
        SELECT 1
        FROM public.subscription_payment_attempts spa
        INNER JOIN public.subscription_invoices si3 ON si3.id = spa.invoice_id
        WHERE si3.subscription_id = sps.id
          AND si3.status = 'pending'
          AND spa.attempted_at > now() - interval '24 hours'
          AND spa.status IN ('pending', 'processing')
          AND COALESCE(spa.metadata->>'checkout_url', '') <> ''
      )
  ) t;

  RETURN v_result;
END;
$$;

-- =====================================================
-- 4. Enrich mark_subscription_invoice_paid (reset dunning + mandate)
-- =====================================================

CREATE OR REPLACE FUNCTION public.mark_subscription_invoice_paid(
  p_invoice_id UUID,
  p_transaction_id UUID DEFAULT NULL,
  p_external_transaction_id TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invoice public.subscription_invoices%ROWTYPE;
BEGIN
  SELECT *
  INTO v_invoice
  FROM public.subscription_invoices
  WHERE id = p_invoice_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'INVOICE_NOT_FOUND';
  END IF;

  IF v_invoice.status = 'paid' THEN
    RETURN v_invoice.subscription_id;
  END IF;

  UPDATE public.subscription_invoices
  SET
    status = 'paid',
    paid_at = now(),
    transaction_id = COALESCE(p_transaction_id, transaction_id),
    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
      'paid_via', 'moneroo',
      'external_transaction_id', p_external_transaction_id
    ),
    updated_at = now()
  WHERE id = p_invoice_id;

  UPDATE public.store_platform_subscriptions sps
  SET
    status = 'active',
    current_period_start = v_invoice.period_start,
    current_period_end = v_invoice.period_end,
    mrr_amount = v_invoice.amount,
    trial_ends_at = NULL,
    payment_provider = 'moneroo_platform',
    external_subscription_id = COALESCE(p_external_transaction_id, external_subscription_id),
    metadata = COALESCE(sps.metadata, '{}'::jsonb) || jsonb_build_object(
      'last_invoice_id', p_invoice_id,
      'last_paid_at', now(),
      'dunning_j7', NULL,
      'dunning_past_due', NULL,
      'auto_renew_last_checkout_at', NULL
    ),
    updated_at = now()
  WHERE sps.id = v_invoice.subscription_id;

  UPDATE public.subscription_billing_mandates
  SET
    moneroo_last_payment_id = COALESCE(p_external_transaction_id, moneroo_last_payment_id),
    last_successful_at = now(),
    updated_at = now()
  WHERE subscription_id = v_invoice.subscription_id;

  INSERT INTO public.subscription_payment_attempts (
    invoice_id,
    status,
    provider,
    external_transaction_id
  )
  VALUES (
    p_invoice_id,
    'succeeded',
    'moneroo_platform',
    p_external_transaction_id
  );

  RETURN v_invoice.subscription_id;
END;
$$;

-- =====================================================
-- 5. RLS
-- =====================================================

ALTER TABLE public.subscription_billing_mandates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Store owners view billing mandates" ON public.subscription_billing_mandates;
CREATE POLICY "Store owners view billing mandates"
  ON public.subscription_billing_mandates FOR SELECT
  TO authenticated
  USING (
    public.is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = subscription_billing_mandates.store_id AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Platform admins manage billing mandates" ON public.subscription_billing_mandates;
CREATE POLICY "Platform admins manage billing mandates"
  ON public.subscription_billing_mandates FOR ALL
  TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

GRANT EXECUTE ON FUNCTION public.save_subscription_billing_mandate(UUID, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN) TO service_role;
GRANT EXECUTE ON FUNCTION public.list_subscriptions_for_auto_renewal() TO service_role;

COMMIT;
