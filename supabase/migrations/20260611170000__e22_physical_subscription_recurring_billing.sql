-- E22 Epic 2.1: Recurring billing foundation for physical vendor subscriptions

BEGIN;

-- =====================================================
-- 1. Invoices & payment attempts
-- =====================================================

CREATE TABLE IF NOT EXISTS public.subscription_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.store_platform_subscriptions(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL UNIQUE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'XOF',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'void')),
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  due_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ,
  transaction_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscription_invoices_store_id
  ON public.subscription_invoices(store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscription_invoices_subscription_status
  ON public.subscription_invoices(subscription_id, status);

CREATE TABLE IF NOT EXISTS public.subscription_payment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.subscription_invoices(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed')),
  provider TEXT NOT NULL DEFAULT 'moneroo_platform',
  external_transaction_id TEXT,
  failure_reason TEXT,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_subscription_payment_attempts_invoice
  ON public.subscription_payment_attempts(invoice_id, attempted_at DESC);

-- =====================================================
-- 2. Helpers
-- =====================================================

CREATE OR REPLACE FUNCTION public.generate_subscription_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_seq BIGINT;
BEGIN
  SELECT COUNT(*) + 1 INTO v_seq FROM public.subscription_invoices;
  RETURN 'SUB-' || to_char(now(), 'YYYYMM') || '-' || lpad(v_seq::text, 6, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.suspend_store_physical_products(p_store_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.products
  SET
    is_active = false,
    updated_at = now(),
    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
      'suspended_reason', 'physical_subscription_expired',
      'suspended_at', now()
    )
  WHERE store_id = p_store_id
    AND product_type = 'physical'
    AND COALESCE(is_active, true) = true;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

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
      'last_paid_at', now()
    ),
    updated_at = now()
  WHERE sps.id = v_invoice.subscription_id;

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

CREATE OR REPLACE FUNCTION public.get_or_create_renewal_invoice(p_store_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub public.store_platform_subscriptions%ROWTYPE;
  v_plan public.platform_vendor_plans%ROWTYPE;
  v_invoice_id UUID;
  v_amount NUMERIC(12, 2);
  v_period_start TIMESTAMPTZ;
  v_period_end TIMESTAMPTZ;
BEGIN
  IF auth.uid() IS NOT NULL
     AND NOT public.is_platform_admin()
     AND NOT EXISTS (
       SELECT 1 FROM public.stores s
       WHERE s.id = p_store_id AND s.user_id = auth.uid()
     ) THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  SELECT *
  INTO v_sub
  FROM public.store_platform_subscriptions
  WHERE store_id = p_store_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SUBSCRIPTION_NOT_FOUND';
  END IF;

  IF v_sub.status NOT IN ('active', 'past_due', 'trialing') THEN
    RAISE EXCEPTION 'SUBSCRIPTION_NOT_RENEWABLE';
  END IF;

  SELECT id
  INTO v_invoice_id
  FROM public.subscription_invoices
  WHERE subscription_id = v_sub.id
    AND status = 'pending'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_invoice_id IS NOT NULL THEN
    RETURN v_invoice_id;
  END IF;

  SELECT *
  INTO v_plan
  FROM public.platform_vendor_plans
  WHERE id = v_sub.plan_id
  LIMIT 1;

  v_amount := CASE
    WHEN v_sub.billing_cycle = 'yearly' THEN COALESCE(v_plan.yearly_price, v_plan.monthly_price * 12)
    ELSE v_plan.monthly_price
  END;

  v_period_start := COALESCE(v_sub.current_period_end, now());
  v_period_end := v_period_start + CASE
    WHEN v_sub.billing_cycle = 'yearly' THEN interval '1 year'
    ELSE interval '1 month'
  END;

  INSERT INTO public.subscription_invoices (
    subscription_id,
    store_id,
    invoice_number,
    amount,
    currency,
    status,
    period_start,
    period_end,
    due_at,
    metadata
  )
  VALUES (
    v_sub.id,
    p_store_id,
    public.generate_subscription_invoice_number(),
    v_amount,
    COALESCE(v_plan.currency, 'XOF'),
    'pending',
    v_period_start,
    v_period_end,
    now(),
    jsonb_build_object('renewal', true, 'plan_slug', v_plan.slug)
  )
  RETURNING id INTO v_invoice_id;

  RETURN v_invoice_id;
END;
$$;

-- =====================================================
-- 3. Dunning notifications (in-app)
-- =====================================================

CREATE OR REPLACE FUNCTION public.process_subscription_dunning_notifications()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sent INTEGER := 0;
  v_row RECORD;
BEGIN
  FOR v_row IN
    SELECT sps.id, sps.store_id, s.user_id AS owner_id, sps.current_period_end, sps.status
    FROM public.store_platform_subscriptions sps
    INNER JOIN public.stores s ON s.id = sps.store_id
    WHERE sps.status IN ('active', 'trialing', 'past_due')
      AND sps.current_period_end IS NOT NULL
  LOOP
    IF v_row.status IN ('active', 'trialing')
       AND v_row.current_period_end <= now() + interval '7 days'
       AND v_row.current_period_end > now() + interval '6 days'
       AND NOT COALESCE((SELECT metadata->>'dunning_j7' FROM public.store_platform_subscriptions WHERE id = v_row.id), '') = 'sent' THEN
      INSERT INTO public.notifications (user_id, type, title, message, metadata)
      VALUES (
        v_row.owner_id,
        'system',
        'Renouvellement dans 7 jours',
        'Votre abonnement produits physiques arrive à échéance dans 7 jours.',
        jsonb_build_object('store_id', v_row.store_id, 'dunning', 'j-7', 'category', 'subscription_renewal_reminder')
      );
      UPDATE public.store_platform_subscriptions
      SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('dunning_j7', 'sent')
      WHERE id = v_row.id;
      v_sent := v_sent + 1;
    END IF;

    IF v_row.status = 'past_due'
       AND v_row.current_period_end < now() - interval '1 day'
       AND NOT COALESCE((SELECT metadata->>'dunning_past_due' FROM public.store_platform_subscriptions WHERE id = v_row.id), '') = 'sent' THEN
      INSERT INTO public.notifications (user_id, type, title, message, metadata)
      VALUES (
        v_row.owner_id,
        'system',
        'Paiement en retard',
        'Régularisez votre abonnement produits physiques pour éviter la suspension.',
        jsonb_build_object('store_id', v_row.store_id, 'dunning', 'past_due', 'category', 'subscription_past_due')
      );
      UPDATE public.store_platform_subscriptions
      SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('dunning_past_due', 'sent')
      WHERE id = v_row.id;
      v_sent := v_sent + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('notifications_sent', v_sent, 'processed_at', now());
END;
$$;

-- =====================================================
-- 4. Lifecycle: suspend products on expired
-- =====================================================

CREATE OR REPLACE FUNCTION public.process_store_platform_subscription_lifecycle()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_to_past_due integer := 0;
  v_to_expired integer := 0;
  v_suspended_products integer := 0;
  v_expired_store RECORD;
BEGIN
  UPDATE public.store_platform_subscriptions sps
  SET
    status = 'past_due',
    updated_at = now(),
    metadata = COALESCE(sps.metadata, '{}'::jsonb) || jsonb_build_object(
      'lifecycle', 'trial_or_period_ended',
      'marked_past_due_at', now()
    )
  WHERE sps.status IN ('active', 'trialing')
    AND sps.current_period_end IS NOT NULL
    AND sps.current_period_end < now()
    AND (
      sps.status <> 'trialing'
      OR sps.trial_ends_at IS NULL
      OR sps.trial_ends_at < now()
    );
  GET DIAGNOSTICS v_to_past_due = ROW_COUNT;

  UPDATE public.store_platform_subscriptions sps
  SET
    status = 'expired',
    updated_at = now(),
    metadata = COALESCE(sps.metadata, '{}'::jsonb) || jsonb_build_object(
      'lifecycle', 'grace_period_elapsed',
      'expired_at', now()
    )
  WHERE sps.status = 'past_due'
    AND sps.current_period_end IS NOT NULL
    AND sps.current_period_end < (now() - interval '7 days');
  GET DIAGNOSTICS v_to_expired = ROW_COUNT;

  FOR v_expired_store IN
    SELECT store_id
    FROM public.store_platform_subscriptions
    WHERE status = 'expired'
      AND updated_at >= now() - interval '1 minute'
  LOOP
    v_suspended_products := v_suspended_products + public.suspend_store_physical_products(v_expired_store.store_id);
  END LOOP;

  RETURN jsonb_build_object(
    'marked_past_due', v_to_past_due,
    'marked_expired', v_to_expired,
    'products_suspended', v_suspended_products,
    'processed_at', now()
  );
END;
$$;

-- =====================================================
-- 5. RLS
-- =====================================================

ALTER TABLE public.subscription_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_payment_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Store owners view subscription invoices" ON public.subscription_invoices;
CREATE POLICY "Store owners view subscription invoices"
  ON public.subscription_invoices FOR SELECT
  TO authenticated
  USING (
    public.is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = subscription_invoices.store_id AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Platform admins manage subscription invoices" ON public.subscription_invoices;
CREATE POLICY "Platform admins manage subscription invoices"
  ON public.subscription_invoices FOR ALL
  TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS "Store owners view payment attempts" ON public.subscription_payment_attempts;
CREATE POLICY "Store owners view payment attempts"
  ON public.subscription_payment_attempts FOR SELECT
  TO authenticated
  USING (
    public.is_platform_admin()
    OR EXISTS (
      SELECT 1
      FROM public.subscription_invoices si
      INNER JOIN public.stores s ON s.id = si.store_id
      WHERE si.id = subscription_payment_attempts.invoice_id
        AND s.user_id = auth.uid()
    )
  );

GRANT EXECUTE ON FUNCTION public.get_or_create_renewal_invoice(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_subscription_invoice_paid(UUID, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.process_subscription_dunning_notifications() TO service_role;

COMMIT;
