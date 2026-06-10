-- E26 Epic 2.1.5: change_physical_plan with proration + rename plans (Starter/Professional/Enterprise)

BEGIN;

-- =====================================================
-- 1. Rename plans (slugs inchangés)
-- =====================================================

UPDATE public.platform_vendor_plans
SET
  name = CASE slug
    WHEN 'physical_basic' THEN 'Physique — Starter'
    WHEN 'physical_standard' THEN 'Physique — Professional'
    WHEN 'physical_premium' THEN 'Physique — Enterprise'
    ELSE name
  END,
  description = CASE slug
    WHEN 'physical_basic' THEN 'Plan Starter — vente de produits physiques (7 500 XOF/mois).'
    WHEN 'physical_standard' THEN 'Plan Professional — logistique, fournisseurs, analytics (12 500 XOF/mois).'
    WHEN 'physical_premium' THEN 'Plan Enterprise — entrepôts, lots, expédition groupée (15 000 XOF/mois).'
    ELSE description
  END,
  features = CASE slug
    WHEN 'physical_basic' THEN '["Produits physiques", "Essai 30 jours", "Starter"]'::jsonb
    WHEN 'physical_standard' THEN '["Produits physiques", "Essai 30 jours", "Professional", "Logistique"]'::jsonb
    WHEN 'physical_premium' THEN '["Produits physiques", "Essai 30 jours", "Enterprise", "Entrepôts"]'::jsonb
    ELSE features
  END,
  updated_at = now()
WHERE slug IN ('physical_basic', 'physical_standard', 'physical_premium');

-- =====================================================
-- 2. Plan rank helper
-- =====================================================

CREATE OR REPLACE FUNCTION public.physical_plan_rank(p_slug TEXT)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE p_slug
    WHEN 'physical_basic' THEN 1
    WHEN 'physical_standard' THEN 2
    WHEN 'physical_premium' THEN 3
    ELSE 0
  END;
$$;

-- =====================================================
-- 3. Proration preview
-- =====================================================

CREATE OR REPLACE FUNCTION public.calculate_physical_plan_proration(
  p_store_id UUID,
  p_new_plan_slug TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub public.store_platform_subscriptions%ROWTYPE;
  v_old_plan public.platform_vendor_plans%ROWTYPE;
  v_new_plan public.platform_vendor_plans%ROWTYPE;
  v_old_rank INTEGER;
  v_new_rank INTEGER;
  v_change_type TEXT;
  v_days_remaining NUMERIC;
  v_days_in_period NUMERIC;
  v_prorated NUMERIC(12, 2);
  v_old_price NUMERIC(12, 2);
  v_new_price NUMERIC(12, 2);
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

  SELECT *
  INTO v_old_plan
  FROM public.platform_vendor_plans
  WHERE id = v_sub.plan_id
  LIMIT 1;

  SELECT *
  INTO v_new_plan
  FROM public.platform_vendor_plans
  WHERE slug = p_new_plan_slug
    AND applies_to_product_type = 'physical'
    AND is_active = true
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PLAN_NOT_FOUND';
  END IF;

  v_old_rank := public.physical_plan_rank(v_old_plan.slug);
  v_new_rank := public.physical_plan_rank(v_new_plan.slug);

  IF v_new_rank = v_old_rank THEN
    v_change_type := 'same';
  ELSIF v_new_rank > v_old_rank THEN
    v_change_type := 'upgrade';
  ELSE
    v_change_type := 'downgrade';
  END IF;

  v_old_price := v_old_plan.monthly_price;
  v_new_price := v_new_plan.monthly_price;

  IF v_sub.status = 'trialing' OR v_change_type = 'same' THEN
    RETURN jsonb_build_object(
      'change_type', v_change_type,
      'old_plan_slug', v_old_plan.slug,
      'new_plan_slug', v_new_plan.slug,
      'old_plan_name', v_old_plan.name,
      'new_plan_name', v_new_plan.name,
      'prorated_amount', 0,
      'currency', COALESCE(v_new_plan.currency, 'XOF'),
      'days_remaining', 0,
      'days_in_period', 0,
      'effective', CASE
        WHEN v_change_type = 'same' THEN 'none'
        WHEN v_change_type = 'downgrade' THEN 'period_end'
        ELSE 'immediate'
      END,
      'requires_payment', false
    );
  END IF;

  v_days_remaining := GREATEST(
    0,
    EXTRACT(EPOCH FROM (v_sub.current_period_end - now())) / 86400.0
  );
  v_days_in_period := GREATEST(
    1,
    EXTRACT(EPOCH FROM (v_sub.current_period_end - v_sub.current_period_start)) / 86400.0
  );

  IF v_change_type = 'upgrade' THEN
    v_prorated := ROUND(
      (v_new_price - v_old_price) * (v_days_remaining / v_days_in_period),
      0
    );
    v_prorated := GREATEST(v_prorated, 0);
  ELSE
    v_prorated := 0;
  END IF;

  RETURN jsonb_build_object(
    'change_type', v_change_type,
    'old_plan_slug', v_old_plan.slug,
    'new_plan_slug', v_new_plan.slug,
    'old_plan_name', v_old_plan.name,
    'new_plan_name', v_new_plan.name,
    'prorated_amount', v_prorated,
    'currency', COALESCE(v_new_plan.currency, 'XOF'),
    'days_remaining', floor(v_days_remaining),
    'days_in_period', floor(v_days_in_period),
    'effective', CASE
      WHEN v_change_type = 'upgrade' AND v_prorated > 0 THEN 'immediate'
      WHEN v_change_type = 'upgrade' THEN 'immediate'
      ELSE 'period_end'
    END,
    'requires_payment', v_change_type = 'upgrade' AND v_prorated > 0
  );
END;
$$;

-- =====================================================
-- 4. Apply plan change (internal)
-- =====================================================

CREATE OR REPLACE FUNCTION public.apply_physical_plan_change(
  p_subscription_id UUID,
  p_new_plan_id UUID,
  p_change_type TEXT,
  p_prorated_amount NUMERIC DEFAULT 0,
  p_source TEXT DEFAULT 'manual'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub public.store_platform_subscriptions%ROWTYPE;
  v_new_plan public.platform_vendor_plans%ROWTYPE;
  v_old_plan public.platform_vendor_plans%ROWTYPE;
BEGIN
  SELECT *
  INTO v_sub
  FROM public.store_platform_subscriptions
  WHERE id = p_subscription_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SUBSCRIPTION_NOT_FOUND';
  END IF;

  SELECT *
  INTO v_new_plan
  FROM public.platform_vendor_plans
  WHERE id = p_new_plan_id
  LIMIT 1;

  SELECT *
  INTO v_old_plan
  FROM public.platform_vendor_plans
  WHERE id = v_sub.plan_id
  LIMIT 1;

  UPDATE public.store_platform_subscriptions
  SET
    plan_id = p_new_plan_id,
    mrr_amount = v_new_plan.monthly_price,
    metadata = COALESCE(metadata, '{}'::jsonb)
      - 'pending_plan_slug'
      - 'pending_plan_id'
      - 'pending_plan_effective_at'
      - 'pending_plan_change_type'
      || jsonb_build_object(
        'last_plan_change_at', now(),
        'last_plan_change_type', p_change_type,
        'last_plan_change_source', p_source,
        'plan_history', COALESCE(metadata->'plan_history', '[]'::jsonb)
          || jsonb_build_array(jsonb_build_object(
            'at', now(),
            'from_slug', v_old_plan.slug,
            'to_slug', v_new_plan.slug,
            'change_type', p_change_type,
            'prorated_amount', COALESCE(p_prorated_amount, 0),
            'source', p_source
          ))
      ),
    updated_at = now()
  WHERE id = p_subscription_id;
END;
$$;

-- =====================================================
-- 5. change_physical_plan — entry point
-- =====================================================

CREATE OR REPLACE FUNCTION public.change_physical_plan(
  p_store_id UUID,
  p_new_plan_slug TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_preview jsonb;
  v_sub public.store_platform_subscriptions%ROWTYPE;
  v_new_plan public.platform_vendor_plans%ROWTYPE;
  v_invoice_id UUID;
  v_change_type TEXT;
  v_prorated NUMERIC(12, 2);
BEGIN
  v_preview := public.calculate_physical_plan_proration(p_store_id, p_new_plan_slug);
  v_change_type := v_preview->>'change_type';

  IF v_change_type = 'same' THEN
    RAISE EXCEPTION 'PLAN_UNCHANGED';
  END IF;

  SELECT *
  INTO v_sub
  FROM public.store_platform_subscriptions
  WHERE store_id = p_store_id
  LIMIT 1;

  SELECT *
  INTO v_new_plan
  FROM public.platform_vendor_plans
  WHERE slug = p_new_plan_slug
  LIMIT 1;

  IF v_sub.status NOT IN ('trialing', 'active', 'past_due') THEN
    RAISE EXCEPTION 'SUBSCRIPTION_NOT_CHANGEABLE';
  END IF;

  -- Essai ou upgrade sans prorata : application immédiate
  IF v_sub.status = 'trialing'
     OR (v_change_type = 'upgrade' AND (v_preview->>'prorated_amount')::numeric <= 0) THEN
    PERFORM public.apply_physical_plan_change(
      v_sub.id,
      v_new_plan.id,
      v_change_type,
      0,
      'immediate'
    );

    RETURN jsonb_build_object(
      'action', 'applied',
      'change_type', v_change_type,
      'prorated_amount', 0,
      'message', 'Plan mis à jour immédiatement.'
    );
  END IF;

  -- Downgrade : effectif en fin de période
  IF v_change_type = 'downgrade' THEN
    UPDATE public.store_platform_subscriptions
    SET
      metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
        'pending_plan_slug', v_new_plan.slug,
        'pending_plan_id', v_new_plan.id,
        'pending_plan_effective_at', v_sub.current_period_end,
        'pending_plan_change_type', 'downgrade'
      ),
      updated_at = now()
    WHERE id = v_sub.id;

    RETURN jsonb_build_object(
      'action', 'scheduled',
      'change_type', v_change_type,
      'prorated_amount', 0,
      'effective_at', v_sub.current_period_end,
      'message', 'Le changement sera appliqué à la fin de la période en cours.'
    );
  END IF;

  -- Upgrade avec prorata : facture pending + checkout
  v_prorated := (v_preview->>'prorated_amount')::numeric;

  SELECT id
  INTO v_invoice_id
  FROM public.subscription_invoices
  WHERE subscription_id = v_sub.id
    AND status = 'pending'
    AND COALESCE(metadata->>'plan_change', 'false') = 'true'
    AND metadata->>'to_plan_slug' = p_new_plan_slug
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_invoice_id IS NULL THEN
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
      v_prorated,
      COALESCE(v_new_plan.currency, 'XOF'),
      'pending',
      now(),
      v_sub.current_period_end,
      now(),
      jsonb_build_object(
        'plan_change', true,
        'change_type', 'upgrade',
        'from_plan_slug', v_preview->>'old_plan_slug',
        'to_plan_slug', p_new_plan_slug,
        'to_plan_id', v_new_plan.id,
        'prorated_amount', v_prorated,
        'days_remaining', v_preview->>'days_remaining'
      )
    )
    RETURNING id INTO v_invoice_id;
  END IF;

  RETURN jsonb_build_object(
    'action', 'checkout_required',
    'change_type', v_change_type,
    'prorated_amount', v_prorated,
    'invoice_id', v_invoice_id,
    'message', 'Paiement du prorata requis pour activer le nouveau plan.'
  );
END;
$$;

-- =====================================================
-- 6. Webhook: mark plan-change invoice paid + apply
-- =====================================================

CREATE OR REPLACE FUNCTION public.mark_subscription_plan_change_invoice_paid(
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
  v_to_plan_id UUID;
BEGIN
  SELECT *
  INTO v_invoice
  FROM public.subscription_invoices
  WHERE id = p_invoice_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'INVOICE_NOT_FOUND';
  END IF;

  IF COALESCE(v_invoice.metadata->>'plan_change', 'false') <> 'true' THEN
    RAISE EXCEPTION 'NOT_PLAN_CHANGE_INVOICE';
  END IF;

  IF v_invoice.status = 'paid' THEN
    RETURN v_invoice.subscription_id;
  END IF;

  v_to_plan_id := (v_invoice.metadata->>'to_plan_id')::uuid;
  IF v_to_plan_id IS NULL THEN
    SELECT id INTO v_to_plan_id
    FROM public.platform_vendor_plans
    WHERE slug = v_invoice.metadata->>'to_plan_slug'
    LIMIT 1;
  END IF;

  IF v_to_plan_id IS NULL THEN
    RAISE EXCEPTION 'TARGET_PLAN_NOT_FOUND';
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

  PERFORM public.apply_physical_plan_change(
    v_invoice.subscription_id,
    v_to_plan_id,
    COALESCE(v_invoice.metadata->>'change_type', 'upgrade'),
    v_invoice.amount,
    'moneroo_webhook'
  );

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
-- 7. Lifecycle: apply pending downgrades at period end
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
  v_pending_applied integer := 0;
  v_expired_store RECORD;
  v_pending RECORD;
BEGIN
  -- Appliquer downgrades planifiés à l'échéance
  FOR v_pending IN
    SELECT
      sps.id AS subscription_id,
      (sps.metadata->>'pending_plan_id')::uuid AS pending_plan_id,
      sps.metadata->>'pending_plan_change_type' AS change_type
    FROM public.store_platform_subscriptions sps
    WHERE sps.metadata->>'pending_plan_id' IS NOT NULL
      AND sps.metadata->>'pending_plan_slug' IS NOT NULL
      AND sps.current_period_end IS NOT NULL
      AND sps.current_period_end <= now()
  LOOP
    PERFORM public.apply_physical_plan_change(
      v_pending.subscription_id,
      v_pending.pending_plan_id,
      COALESCE(v_pending.change_type, 'downgrade'),
      0,
      'scheduled_period_end'
    );
    v_pending_applied := v_pending_applied + 1;
  END LOOP;

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
    'pending_plan_changes_applied', v_pending_applied,
    'marked_past_due', v_to_past_due,
    'marked_expired', v_to_expired,
    'products_suspended', v_suspended_products,
    'processed_at', now()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.calculate_physical_plan_proration(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.change_physical_plan(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_subscription_plan_change_invoice_paid(UUID, UUID, TEXT) TO service_role;

COMMIT;
