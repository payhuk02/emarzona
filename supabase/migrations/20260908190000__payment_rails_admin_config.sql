-- Seed payment_rails config + public read RPC for checkout (incl. guests)
-- Codes Paiement Pro : https://dashboard.paiementpro.net/code-provider

BEGIN;

INSERT INTO public.platform_settings (key, settings)
VALUES (
  'payment_rails',
  jsonb_build_object(
    'moneyfusion', jsonb_build_object(
      'enabled', true,
      'operators', jsonb_build_object(
        'orange', true,
        'mtn', true,
        'moov', true,
        'wave', true,
        'crypto', true
      )
    ),
    'paiement_pro', jsonb_build_object(
      'enabled', true,
      'operators', jsonb_build_object(
        'OMCIV2', true,
        'MOMOCI', true,
        'FLOOZ', true,
        'WAVECI', true,
        'OMBF', true,
        'OMML', true,
        'MOMOBJ', true,
        'FLOOZBJ', true,
        'AIRTELNG', true,
        'OMSN', true,
        'WAVESN', true,
        'OMGN', true,
        'OMCM', true,
        'MOMOCM', true,
        'MOOVTG', true,
        'TOGOCEL', true,
        'MOMOGNF', true,
        'CARD', true,
        'PAYPAL', false,
        'CRYPTO', false,
        'TBANK', false
      )
    ),
    'stripe_connect', jsonb_build_object(
      'enabled', true,
      'operators', jsonb_build_object('card', true)
    ),
    'paypal_commerce', jsonb_build_object(
      'enabled', true,
      'operators', jsonb_build_object('paypal', true)
    )
  )
)
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.get_payment_rails_config()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT settings INTO result
  FROM public.platform_settings
  WHERE key = 'payment_rails';

  RETURN COALESCE(result, '{}'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.get_payment_rails_config() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_payment_rails_config() TO anon, authenticated;

COMMENT ON FUNCTION public.get_payment_rails_config() IS
  'Public read of payment_rails toggles (aggregators + operators) for checkout';

COMMIT;
