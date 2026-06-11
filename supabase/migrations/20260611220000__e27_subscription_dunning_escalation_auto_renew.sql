-- E27 Epic 2.1.3: Dunning escalation J+3/J+7/expired + auto-renew toggle RPC

BEGIN;

-- =====================================================
-- 1. Additional email templates
-- =====================================================

INSERT INTO public.notification_templates (
  slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at
)
VALUES
  (
    'subscription_grace_j3',
    'Rappel J+3 grace abonnement physique',
    'email',
    'fr',
    '⚠️ 3 jours sans paiement — abonnement Emarzona',
    'Bonjour {{user_name}},\n\nVotre abonnement produits physiques est en retard depuis 3 jours (échéance {{period_end}}).\n\nRégularisez avant la fin de la période de grâce pour éviter la suspension de vos produits.\n\n{{action_url}}',
    '<div style="font-family:sans-serif;max-width:560px;margin:0 auto;"><h2>⚠️ 3 jours sans paiement</h2><p>Bonjour {{user_name}},</p><p>Votre abonnement produits physiques est <strong>en retard depuis 3 jours</strong> (échéance {{period_end}}).</p><p>Régularisez avant la fin de la période de grâce pour éviter la suspension.</p><p style="margin:24px 0;"><a href="{{action_url}}" style="background:#e11d48;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;">Régulariser maintenant</a></p></div>',
    ARRAY['user_name', 'period_end', 'action_url'],
    true,
    now(),
    now()
  ),
  (
    'subscription_grace_j7',
    'Dernier rappel J+7 grace abonnement physique',
    'email',
    'fr',
    '🚨 Dernier jour de grâce — abonnement Emarzona',
    'Bonjour {{user_name}},\n\nC''est le dernier jour de grâce pour votre abonnement produits physiques (échéance {{period_end}}).\n\nSans paiement aujourd''hui, vos produits seront suspendus demain.\n\n{{action_url}}',
    '<div style="font-family:sans-serif;max-width:560px;margin:0 auto;"><h2>🚨 Dernier jour de grâce</h2><p>Bonjour {{user_name}},</p><p>Sans paiement <strong>aujourd''hui</strong>, vos produits physiques seront suspendus demain.</p><p style="margin:24px 0;"><a href="{{action_url}}" style="background:#e11d48;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;">Payer maintenant</a></p></div>',
    ARRAY['user_name', 'period_end', 'action_url'],
    true,
    now(),
    now()
  ),
  (
    'subscription_expired',
    'Abonnement expiré — produits suspendus',
    'email',
    'fr',
    '❌ Abonnement expiré — vos produits physiques sont suspendus',
    'Bonjour {{user_name}},\n\nVotre abonnement produits physiques a expiré. Vos produits physiques sont désormais invisibles sur la marketplace.\n\nRéactivez votre abonnement pour reprendre les ventes.\n\n{{action_url}}',
    '<div style="font-family:sans-serif;max-width:560px;margin:0 auto;"><h2>❌ Abonnement expiré</h2><p>Bonjour {{user_name}},</p><p>Vos produits physiques sont <strong>suspendus</strong>. Réactivez votre abonnement pour reprendre les ventes.</p><p style="margin:24px 0;"><a href="{{action_url}}" style="background:#667eea;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;">Réactiver mon abonnement</a></p></div>',
    ARRAY['user_name', 'action_url'],
    true,
    now(),
    now()
  )
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

-- =====================================================
-- 2. Extend dunning targets (J+3, J+7, expired)
-- =====================================================

CREATE OR REPLACE FUNCTION public.list_subscription_dunning_email_targets()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb := '[]'::jsonb;
  v_row RECORD;
  v_meta jsonb;
  v_amount NUMERIC(12, 2);
  v_checkout_url TEXT;
BEGIN
  FOR v_row IN
    SELECT
      sps.id AS subscription_id,
      sps.store_id,
      sps.status,
      sps.current_period_end,
      sps.metadata,
      s.user_id AS owner_user_id,
      pvp.name AS plan_name,
      pvp.slug AS plan_slug,
      pvp.monthly_price,
      pvp.yearly_price,
      COALESCE(pvp.currency, 'XOF') AS currency,
      sps.billing_cycle
    FROM public.store_platform_subscriptions sps
    INNER JOIN public.stores s ON s.id = sps.store_id
    INNER JOIN public.platform_vendor_plans pvp ON pvp.id = sps.plan_id
    WHERE sps.status IN ('active', 'trialing', 'past_due', 'expired')
      AND sps.current_period_end IS NOT NULL
  LOOP
    v_meta := COALESCE(v_row.metadata, '{}'::jsonb);
    v_amount := CASE
      WHEN v_row.billing_cycle = 'yearly' THEN COALESCE(v_row.yearly_price, v_row.monthly_price * 12)
      ELSE v_row.monthly_price
    END;

    -- J-7 reminder
    IF v_row.status IN ('active', 'trialing')
       AND v_row.current_period_end <= now() + interval '7 days'
       AND v_row.current_period_end > now() + interval '6 days'
       AND COALESCE(v_meta->>'dunning_j7_email', '') <> 'sent' THEN
      v_result := v_result || jsonb_build_array(jsonb_build_object(
        'subscription_id', v_row.subscription_id,
        'store_id', v_row.store_id,
        'owner_user_id', v_row.owner_user_id,
        'dunning_type', 'j-7',
        'email_type', 'subscription_renewal_reminder',
        'plan_name', v_row.plan_name,
        'current_period_end', v_row.current_period_end,
        'amount', v_amount,
        'currency', v_row.currency
      ));
    END IF;

    -- J-1 reminder
    IF v_row.status IN ('active', 'trialing')
       AND v_row.current_period_end <= now() + interval '1 day'
       AND v_row.current_period_end > now()
       AND COALESCE(v_meta->>'dunning_j1_email', '') <> 'sent' THEN
      v_result := v_result || jsonb_build_array(jsonb_build_object(
        'subscription_id', v_row.subscription_id,
        'store_id', v_row.store_id,
        'owner_user_id', v_row.owner_user_id,
        'dunning_type', 'j-1',
        'email_type', 'subscription_renewal_j1',
        'plan_name', v_row.plan_name,
        'current_period_end', v_row.current_period_end,
        'amount', v_amount,
        'currency', v_row.currency
      ));
    END IF;

    -- Past due (J+1 grace)
    IF v_row.status = 'past_due'
       AND v_row.current_period_end < now() - interval '1 day'
       AND v_row.current_period_end >= now() - interval '2 days'
       AND COALESCE(v_meta->>'dunning_past_due_email', '') <> 'sent' THEN
      v_result := v_result || jsonb_build_array(jsonb_build_object(
        'subscription_id', v_row.subscription_id,
        'store_id', v_row.store_id,
        'owner_user_id', v_row.owner_user_id,
        'dunning_type', 'past_due',
        'email_type', 'subscription_past_due',
        'plan_name', v_row.plan_name,
        'current_period_end', v_row.current_period_end,
        'amount', v_amount,
        'currency', v_row.currency
      ));
    END IF;

    -- J+3 grace escalation
    IF v_row.status = 'past_due'
       AND v_row.current_period_end <= now() - interval '3 days'
       AND v_row.current_period_end > now() - interval '4 days'
       AND COALESCE(v_meta->>'dunning_jplus3_email', '') <> 'sent' THEN
      v_result := v_result || jsonb_build_array(jsonb_build_object(
        'subscription_id', v_row.subscription_id,
        'store_id', v_row.store_id,
        'owner_user_id', v_row.owner_user_id,
        'dunning_type', 'j+3',
        'email_type', 'subscription_grace_j3',
        'plan_name', v_row.plan_name,
        'current_period_end', v_row.current_period_end,
        'amount', v_amount,
        'currency', v_row.currency
      ));
    END IF;

    -- J+7 last grace day
    IF v_row.status = 'past_due'
       AND v_row.current_period_end <= now() - interval '6 days'
       AND v_row.current_period_end > now() - interval '7 days'
       AND COALESCE(v_meta->>'dunning_jplus7_email', '') <> 'sent' THEN
      v_result := v_result || jsonb_build_array(jsonb_build_object(
        'subscription_id', v_row.subscription_id,
        'store_id', v_row.store_id,
        'owner_user_id', v_row.owner_user_id,
        'dunning_type', 'j+7',
        'email_type', 'subscription_grace_j7',
        'plan_name', v_row.plan_name,
        'current_period_end', v_row.current_period_end,
        'amount', v_amount,
        'currency', v_row.currency
      ));
    END IF;

    -- Expired — products suspended
    IF v_row.status = 'expired'
       AND v_row.current_period_end <= now() - interval '7 days'
       AND v_row.current_period_end > now() - interval '8 days'
       AND COALESCE(v_meta->>'dunning_expired_email', '') <> 'sent' THEN
      v_result := v_result || jsonb_build_array(jsonb_build_object(
        'subscription_id', v_row.subscription_id,
        'store_id', v_row.store_id,
        'owner_user_id', v_row.owner_user_id,
        'dunning_type', 'expired',
        'email_type', 'subscription_expired',
        'plan_name', v_row.plan_name,
        'current_period_end', v_row.current_period_end,
        'amount', v_amount,
        'currency', v_row.currency
      ));
    END IF;

    -- Auto-renew checkout ready
    v_checkout_url := NULLIF(trim(COALESCE(v_meta->>'auto_renew_last_checkout_url', '')), '');
    IF v_checkout_url IS NOT NULL
       AND COALESCE(v_meta->>'dunning_auto_renew_email', '') <> 'sent'
       AND (v_meta->>'auto_renew_last_checkout_at') IS NOT NULL
       AND (v_meta->>'auto_renew_last_checkout_at')::timestamptz > now() - interval '7 days' THEN
      v_result := v_result || jsonb_build_array(jsonb_build_object(
        'subscription_id', v_row.subscription_id,
        'store_id', v_row.store_id,
        'owner_user_id', v_row.owner_user_id,
        'dunning_type', 'auto_renew',
        'email_type', 'subscription_auto_renew_checkout',
        'plan_name', v_row.plan_name,
        'current_period_end', v_row.current_period_end,
        'amount', v_amount,
        'currency', v_row.currency,
        'checkout_url', v_checkout_url
      ));
    END IF;
  END LOOP;

  RETURN v_result;
END;
$$;

-- =====================================================
-- 3. Mark email sent — extended keys
-- =====================================================

CREATE OR REPLACE FUNCTION public.mark_subscription_dunning_email_sent(
  p_subscription_id UUID,
  p_dunning_type TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_key TEXT;
BEGIN
  v_key := CASE p_dunning_type
    WHEN 'j-7' THEN 'dunning_j7_email'
    WHEN 'j-1' THEN 'dunning_j1_email'
    WHEN 'past_due' THEN 'dunning_past_due_email'
    WHEN 'j+3' THEN 'dunning_jplus3_email'
    WHEN 'j+7' THEN 'dunning_jplus7_email'
    WHEN 'expired' THEN 'dunning_expired_email'
    WHEN 'auto_renew' THEN 'dunning_auto_renew_email'
    ELSE NULL
  END;

  IF v_key IS NULL THEN
    RAISE EXCEPTION 'INVALID_DUNNING_TYPE';
  END IF;

  UPDATE public.store_platform_subscriptions
  SET
    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(v_key, 'sent'),
    updated_at = now()
  WHERE id = p_subscription_id;
END;
$$;

-- =====================================================
-- 4. Reset new dunning flags on payment
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
      'dunning_j1', NULL,
      'dunning_past_due', NULL,
      'dunning_j7_email', NULL,
      'dunning_j1_email', NULL,
      'dunning_past_due_email', NULL,
      'dunning_jplus3_email', NULL,
      'dunning_jplus7_email', NULL,
      'dunning_expired_email', NULL,
      'dunning_auto_renew_email', NULL,
      'auto_renew_last_checkout_at', NULL,
      'auto_renew_last_checkout_url', NULL
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
-- 5. Auto-renew toggle (store owner)
-- =====================================================

CREATE OR REPLACE FUNCTION public.set_subscription_auto_renew(
  p_store_id UUID,
  p_enabled BOOLEAN
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub_id UUID;
BEGIN
  IF auth.uid() IS NOT NULL
     AND NOT public.is_platform_admin()
     AND NOT EXISTS (
       SELECT 1 FROM public.stores s
       WHERE s.id = p_store_id AND s.user_id = auth.uid()
     ) THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  SELECT id INTO v_sub_id
  FROM public.store_platform_subscriptions
  WHERE store_id = p_store_id;

  IF v_sub_id IS NULL THEN
    RAISE EXCEPTION 'SUBSCRIPTION_NOT_FOUND';
  END IF;

  UPDATE public.subscription_billing_mandates
  SET
    auto_renew_enabled = p_enabled,
    updated_at = now()
  WHERE store_id = p_store_id;

  UPDATE public.store_platform_subscriptions
  SET
    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
      'auto_renew_enabled', p_enabled
    ),
    updated_at = now()
  WHERE id = v_sub_id;

  RETURN jsonb_build_object(
    'store_id', p_store_id,
    'auto_renew_enabled', p_enabled
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_subscription_auto_renew(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_subscription_auto_renew(UUID, BOOLEAN) TO service_role;

COMMIT;
