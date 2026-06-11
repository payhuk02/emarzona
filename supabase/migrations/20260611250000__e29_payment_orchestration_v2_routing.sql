-- E29 Epic 2.2: Matrice routage V2 — XOF/XAF → Moneroo, Flutterwave retiré du checkout RPC

BEGIN;

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
      AND c.provider <> 'flutterwave_connect'
    ORDER BY
      CASE c.provider
        WHEN 'stripe_connect' THEN 1
        WHEN 'paypal_commerce' THEN 2
        WHEN 'moneroo_platform' THEN 3
        ELSE 4
      END
  LOOP
    IF v_force_platform AND v_row.provider <> 'moneroo_platform' THEN
      CONTINUE;
    END IF;

    -- Stripe : cartes internationales uniquement (pas XOF/XAF)
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
    ELSIF v_row.provider = 'moneroo_platform' THEN
      v_options := v_options || jsonb_build_array(jsonb_build_object(
        'provider', 'moneroo_platform',
        'connection_id', v_row.connection_id,
        'label', 'Moneroo'
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

COMMENT ON FUNCTION public.get_store_payment_options(UUID, TEXT, TEXT) IS
  'PSP checkout : Stripe USD/EUR, PayPal hors XOF, Moneroo XOF/XAF. Flutterwave exclu (Epic 2.2.6).';

COMMIT;
