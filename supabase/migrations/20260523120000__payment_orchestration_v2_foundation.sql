-- =========================================================
-- Payment Orchestration V2 — Fondations (Phase 0/1)
-- Tables connexions vendeur, idempotence webhooks, colonnes stores/orders
-- =========================================================

-- ---------------------------------------------------------------------------
-- 1. Connexions paiement par boutique
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.store_payment_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN (
    'moneroo_platform',
    'stripe_connect',
    'paypal_commerce',
    'flutterwave_connect'
  )),
  connection_mode TEXT NOT NULL DEFAULT 'oauth_connected' CHECK (connection_mode IN (
    'platform_default',
    'oauth_connected'
  )),
  external_account_id TEXT,
  external_account_status TEXT NOT NULL DEFAULT 'pending' CHECK (external_account_status IN (
    'pending',
    'active',
    'restricted',
    'disabled',
    'revoked'
  )),
  capabilities JSONB NOT NULL DEFAULT '{}'::jsonb,
  default_currency TEXT,
  livemode BOOLEAN NOT NULL DEFAULT false,
  onboarding_completed_at TIMESTAMPTZ,
  last_synced_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (store_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_store_payment_connections_store_id
  ON public.store_payment_connections(store_id);

CREATE INDEX IF NOT EXISTS idx_store_payment_connections_provider_status
  ON public.store_payment_connections(provider, external_account_status)
  WHERE external_account_status = 'active';

COMMENT ON TABLE public.store_payment_connections IS
  'Connexions PSP par boutique (Stripe Connect, PayPal Commerce, etc.). Pas de secrets en clair.';

-- ---------------------------------------------------------------------------
-- 2. Idempotence webhooks multi-PSP
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payment_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  external_event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  processed_at TIMESTAMPTZ,
  processing_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, external_event_id)
);

CREATE INDEX IF NOT EXISTS idx_payment_webhook_events_order_id
  ON public.payment_webhook_events(order_id)
  WHERE order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payment_webhook_events_unprocessed
  ON public.payment_webhook_events(created_at)
  WHERE processed_at IS NULL;

-- ---------------------------------------------------------------------------
-- 3. Colonnes stores / orders / transactions
-- ---------------------------------------------------------------------------
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS platform_fee_percent NUMERIC(5, 2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS force_platform_payments BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.stores.platform_fee_percent IS
  'Commission plateforme %% sur rails connectés (NULL = défaut platform_settings)';
COMMENT ON COLUMN public.stores.force_platform_payments IS
  'Si true, ignore Stripe/PayPal vendeur et utilise Moneroo plateforme uniquement';

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_provider_used TEXT,
  ADD COLUMN IF NOT EXISTS payment_connection_id UUID REFERENCES public.store_payment_connections(id) ON DELETE SET NULL;

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS provider_checkout_url TEXT,
  ADD COLUMN IF NOT EXISTS provider_session_id TEXT,
  ADD COLUMN IF NOT EXISTS provider_payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS connected_account_id TEXT,
  ADD COLUMN IF NOT EXISTS application_fee_amount NUMERIC;

-- ---------------------------------------------------------------------------
-- 4. Feature flag plateforme
-- ---------------------------------------------------------------------------
INSERT INTO public.platform_settings(key, settings)
VALUES (
  'payment_orchestration_v2',
  jsonb_build_object('enabled', false, 'stripe_enabled', false, 'paypal_enabled', false)
)
ON CONFLICT (key) DO UPDATE SET
  settings = COALESCE(public.platform_settings.settings, '{}'::jsonb)
    || jsonb_build_object(
      'enabled', COALESCE((public.platform_settings.settings->>'enabled')::boolean, false)
    ),
  updated_at = now();

-- ---------------------------------------------------------------------------
-- 5. Connexion Moneroo plateforme par défaut pour boutiques existantes
-- ---------------------------------------------------------------------------
INSERT INTO public.store_payment_connections (
  store_id,
  provider,
  connection_mode,
  external_account_status,
  capabilities,
  metadata
)
SELECT
  s.id,
  'moneroo_platform',
  'platform_default',
  'active',
  '{"mobile_money": true}'::jsonb,
  jsonb_build_object('auto_created', true, 'migration', '20260523120000')
FROM public.stores s
WHERE NOT EXISTS (
  SELECT 1
  FROM public.store_payment_connections c
  WHERE c.store_id = s.id AND c.provider = 'moneroo_platform'
);

-- ---------------------------------------------------------------------------
-- 6. RLS store_payment_connections
-- ---------------------------------------------------------------------------
ALTER TABLE public.store_payment_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "store_payment_connections_select_owner" ON public.store_payment_connections;
CREATE POLICY "store_payment_connections_select_owner"
  ON public.store_payment_connections FOR SELECT
  TO authenticated
  USING (
    store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "store_payment_connections_insert_owner" ON public.store_payment_connections;
CREATE POLICY "store_payment_connections_insert_owner"
  ON public.store_payment_connections FOR INSERT
  TO authenticated
  WITH CHECK (
    store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "store_payment_connections_update_owner" ON public.store_payment_connections;
CREATE POLICY "store_payment_connections_update_owner"
  ON public.store_payment_connections FOR UPDATE
  TO authenticated
  USING (
    store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())
  )
  WITH CHECK (
    store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "store_payment_connections_delete_owner" ON public.store_payment_connections;
CREATE POLICY "store_payment_connections_delete_owner"
  ON public.store_payment_connections FOR DELETE
  TO authenticated
  USING (
    store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())
    AND provider <> 'moneroo_platform'
  );

-- payment_webhook_events : service role / Edge only (pas d'accès client)
ALTER TABLE public.payment_webhook_events ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 7. RPC : options de paiement disponibles pour le checkout
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_store_payment_options(
  p_store_id UUID,
  p_currency TEXT DEFAULT 'XOF',
  p_buyer_country TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_force_platform BOOLEAN;
  v_options JSONB := '[]'::jsonb;
  v_row RECORD;
  v_currency_upper TEXT := upper(coalesce(nullif(trim(p_currency), ''), 'XOF'));
BEGIN
  IF p_store_id IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;

  SELECT coalesce(s.force_platform_payments, false)
  INTO v_force_platform
  FROM public.stores s
  WHERE s.id = p_store_id;

  IF NOT FOUND THEN
    RETURN '[]'::jsonb;
  END IF;

  FOR v_row IN
    SELECT
      c.id AS connection_id,
      c.provider,
      c.external_account_status,
      c.capabilities,
      c.default_currency
    FROM public.store_payment_connections c
    WHERE c.store_id = p_store_id
      AND c.external_account_status = 'active'
    ORDER BY
      CASE c.provider
        WHEN 'stripe_connect' THEN 1
        WHEN 'paypal_commerce' THEN 2
        WHEN 'flutterwave_connect' THEN 3
        WHEN 'moneroo_platform' THEN 4
        ELSE 5
      END
  LOOP
    IF v_force_platform AND v_row.provider <> 'moneroo_platform' THEN
      CONTINUE;
    END IF;

    IF v_row.provider = 'stripe_connect' AND v_currency_upper IN (
      'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'CHF', 'JPY', 'XOF', 'XAF'
    ) THEN
      v_options := v_options || jsonb_build_array(jsonb_build_object(
        'provider', 'stripe_connect',
        'connection_id', v_row.connection_id,
        'label', 'Carte (Stripe)'
      ));
    ELSIF v_row.provider = 'paypal_commerce' AND v_currency_upper IN (
      'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'CHF', 'JPY'
    ) THEN
      v_options := v_options || jsonb_build_array(jsonb_build_object(
        'provider', 'paypal_commerce',
        'connection_id', v_row.connection_id,
        'label', 'PayPal'
      ));
    ELSIF v_row.provider = 'moneroo_platform' THEN
      v_options := v_options || jsonb_build_array(jsonb_build_object(
        'provider', 'moneroo_platform',
        'connection_id', v_row.connection_id,
        'label', 'Moneroo'
      ));
    ELSIF v_row.provider = 'flutterwave_connect' AND v_currency_upper IN (
      'NGN', 'GHS', 'KES', 'ZAR', 'USD', 'EUR', 'GBP', 'XOF', 'XAF'
    ) THEN
      v_options := v_options || jsonb_build_array(jsonb_build_object(
        'provider', 'flutterwave_connect',
        'connection_id', v_row.connection_id,
        'label', 'Flutterwave'
      ));
    END IF;
  END LOOP;

  IF jsonb_array_length(v_options) = 0 THEN
    v_options := jsonb_build_array(jsonb_build_object(
      'provider', 'moneroo_platform',
      'connection_id', NULL,
      'label', 'Moneroo'
    ));
  END IF;

  RETURN v_options;
END;
$$;

REVOKE ALL ON FUNCTION public.get_store_payment_options(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_store_payment_options(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_store_payment_options(UUID, TEXT, TEXT) TO anon;

COMMENT ON FUNCTION public.get_store_payment_options(UUID, TEXT, TEXT) IS
  'Liste les PSP disponibles pour une boutique (checkout). Respecte force_platform_payments.';
