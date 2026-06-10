-- E24 Epic 2.1.3: Subscription dunning emails (templates + queue RPC)

BEGIN;

-- =====================================================
-- 1. Email templates
-- =====================================================

INSERT INTO public.notification_templates (
  slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at
)
VALUES
  (
    'subscription_renewal_reminder',
    'Rappel renouvellement abonnement physique',
    'email',
    'fr',
    '⏰ Votre abonnement Emarzona expire dans 7 jours',
    'Bonjour {{user_name}},\n\nVotre abonnement produits physiques ({{plan_name}}) arrive à échéance le {{period_end}}.\n\nMontant du renouvellement : {{amount}} {{currency}}.\n\n{{message}}\n\n{{action_url}}',
    '<div style="font-family:sans-serif;max-width:560px;margin:0 auto;"><h2>⏰ Renouvellement dans 7 jours</h2><p>Bonjour {{user_name}},</p><p>Votre abonnement <strong>produits physiques</strong> ({{plan_name}}) expire le <strong>{{period_end}}</strong>.</p><p>Montant : <strong>{{amount}} {{currency}}</strong></p><p>{{message}}</p><p style="margin:24px 0;"><a href="{{action_url}}" style="background:#667eea;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;">Gérer la facturation</a></p></div>',
    ARRAY['user_name', 'plan_name', 'period_end', 'amount', 'currency', 'message', 'action_url'],
    true,
    now(),
    now()
  ),
  (
    'subscription_renewal_j1',
    'Rappel J-1 abonnement physique',
    'email',
    'fr',
    '⚠️ Votre abonnement Emarzona expire demain',
    'Bonjour {{user_name}},\n\nVotre abonnement produits physiques expire demain ({{period_end}}).\n\nRégularisez dès maintenant pour éviter toute interruption.\n\n{{action_url}}',
    '<div style="font-family:sans-serif;max-width:560px;margin:0 auto;"><h2>⚠️ Expiration demain</h2><p>Bonjour {{user_name}},</p><p>Votre abonnement produits physiques expire <strong>demain</strong> ({{period_end}}).</p><p>Régularisez dès maintenant pour éviter la suspension de vos produits.</p><p style="margin:24px 0;"><a href="{{action_url}}" style="background:#e11d48;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;">Renouveler maintenant</a></p></div>',
    ARRAY['user_name', 'period_end', 'action_url'],
    true,
    now(),
    now()
  ),
  (
    'subscription_past_due',
    'Paiement abonnement en retard',
    'email',
    'fr',
    '🚨 Paiement en retard — abonnement produits physiques',
    'Bonjour {{user_name}},\n\nVotre abonnement produits physiques est en retard de paiement depuis le {{period_end}}.\n\nSans régularisation sous 7 jours, vos produits physiques seront suspendus.\n\n{{action_url}}',
    '<div style="font-family:sans-serif;max-width:560px;margin:0 auto;"><h2>🚨 Paiement en retard</h2><p>Bonjour {{user_name}},</p><p>Votre abonnement produits physiques est <strong>en retard</strong> depuis le {{period_end}}.</p><p>Sans régularisation sous <strong>7 jours</strong>, vos produits seront suspendus.</p><p style="margin:24px 0;"><a href="{{action_url}}" style="background:#e11d48;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;">Régulariser le paiement</a></p></div>',
    ARRAY['user_name', 'period_end', 'action_url'],
    true,
    now(),
    now()
  ),
  (
    'subscription_auto_renew_checkout',
    'Checkout auto-renouvellement prêt',
    'email',
    'fr',
    '💳 Confirmez le renouvellement de votre abonnement Emarzona',
    'Bonjour {{user_name}},\n\nVotre renouvellement automatique est prêt. Confirmez le paiement Moneroo ({{amount}} {{currency}}) pour prolonger votre abonnement.\n\n{{action_url}}',
    '<div style="font-family:sans-serif;max-width:560px;margin:0 auto;"><h2>💳 Confirmez votre renouvellement</h2><p>Bonjour {{user_name}},</p><p>Un paiement Moneroo de <strong>{{amount}} {{currency}}</strong> est en attente de confirmation pour prolonger votre abonnement produits physiques.</p><p style="margin:24px 0;"><a href="{{action_url}}" style="background:#667eea;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;">Confirmer sur Moneroo</a></p></div>',
    ARRAY['user_name', 'amount', 'currency', 'action_url'],
    true,
    now(),
    now()
  )
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

-- =====================================================
-- 2. List email targets
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
    WHERE sps.status IN ('active', 'trialing', 'past_due')
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

    -- Past due
    IF v_row.status = 'past_due'
       AND v_row.current_period_end < now() - interval '1 day'
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

    -- Auto-renew checkout ready (from E23 cron)
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
-- 3. Mark email sent
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
-- 4. Reset dunning email flags on successful payment
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

GRANT EXECUTE ON FUNCTION public.list_subscription_dunning_email_targets() TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_subscription_dunning_email_sent(UUID, TEXT) TO service_role;

COMMIT;
