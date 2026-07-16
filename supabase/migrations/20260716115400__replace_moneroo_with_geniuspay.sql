-- Replace Moneroo with GeniusPay as default platform payment

BEGIN;

-- 1. Update stores.enabled_payment_providers
UPDATE public.stores
SET enabled_payment_providers = array_replace(enabled_payment_providers, 'moneroo', 'geniuspay')
WHERE 'moneroo' = ANY(enabled_payment_providers);

UPDATE public.stores
SET enabled_payment_providers = array_replace(enabled_payment_providers, 'moneroo_platform', 'geniuspay_platform')
WHERE 'moneroo_platform' = ANY(enabled_payment_providers);

-- 2. Update store_payment_connections constraint and values
ALTER TABLE public.store_payment_connections DROP CONSTRAINT IF EXISTS store_payment_connections_provider_check;
ALTER TABLE public.store_payment_connections ADD CONSTRAINT store_payment_connections_provider_check CHECK (provider IN (
  'geniuspay_platform',
  'moneroo_platform',
  'stripe_connect',
  'paypal_commerce',
  'flutterwave_connect'
));

UPDATE public.store_payment_connections
SET provider = 'geniuspay_platform'
WHERE provider = 'moneroo_platform';

-- 3. Replace columns in transactions
ALTER TABLE public.transactions
  DROP COLUMN IF EXISTS moneroo_transaction_id,
  DROP COLUMN IF EXISTS moneroo_checkout_url,
  DROP COLUMN IF EXISTS moneroo_payment_method,
  DROP COLUMN IF EXISTS moneroo_response,
  DROP COLUMN IF EXISTS moneroo_refund_id,
  DROP COLUMN IF EXISTS moneroo_refund_amount,
  DROP COLUMN IF EXISTS moneroo_refund_reason;

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS geniuspay_transaction_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS geniuspay_checkout_url TEXT,
  ADD COLUMN IF NOT EXISTS geniuspay_payment_method TEXT,
  ADD COLUMN IF NOT EXISTS geniuspay_response JSONB,
  ADD COLUMN IF NOT EXISTS geniuspay_refund_id TEXT,
  ADD COLUMN IF NOT EXISTS geniuspay_refund_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS geniuspay_refund_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_transactions_geniuspay_id ON public.transactions(geniuspay_transaction_id);
CREATE INDEX IF NOT EXISTS idx_transactions_geniuspay_refund_id ON public.transactions(geniuspay_refund_id) WHERE geniuspay_refund_id IS NOT NULL;

-- 4. Replace columns in subscription_billing_mandates (if they exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'subscription_billing_mandates' AND column_name = 'moneroo_last_payment_id') THEN
    ALTER TABLE public.subscription_billing_mandates DROP COLUMN moneroo_last_payment_id;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'subscription_billing_mandates' AND column_name = 'geniuspay_last_payment_id') THEN
    ALTER TABLE public.subscription_billing_mandates ADD COLUMN geniuspay_last_payment_id TEXT;
  END IF;
END $$;

-- 5. Update public.get_store_payment_options function
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
AS $func$
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
      AND c.provider <> 'flutterwave_connect'
    ORDER BY
      CASE c.provider
        WHEN 'stripe_connect' THEN 1
        WHEN 'paypal_commerce' THEN 2
        WHEN 'geniuspay_platform' THEN 3
        ELSE 4
      END
  LOOP
    IF v_force_platform AND v_row.provider <> 'geniuspay_platform' THEN
      CONTINUE;
    END IF;

    IF v_row.provider = 'stripe_connect' AND v_currency_upper IN (
      'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'CHF', 'JPY', 'MAD', 'NGN'
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
    ELSIF v_row.provider = 'geniuspay_platform' THEN
      v_options := v_options || jsonb_build_array(jsonb_build_object(
        'provider', 'geniuspay_platform',
        'connection_id', v_row.connection_id,
        'label', 'GeniusPay'
      ));
    END IF;
  END LOOP;

  IF jsonb_array_length(v_options) = 0 THEN
    v_options := jsonb_build_array(jsonb_build_object(
      'provider', 'geniuspay_platform',
      'connection_id', NULL,
      'label', 'GeniusPay'
    ));
  END IF;

  RETURN v_options;
END;
$func$;

COMMENT ON FUNCTION public.get_store_payment_options(UUID, TEXT, TEXT) IS
  'PSP checkout : Stripe USD/EUR, PayPal hors XOF, GeniusPay XOF/XAF. Flutterwave exclu (Epic 2.2.6).';

COMMIT;
