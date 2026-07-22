-- Désactive les frais checkout acheteur (2 % + 100 XOF).
-- apply_checkout_platform_fee renvoie désormais le montant inchangé.
-- Les RPC create_public_*_order qui appellent cette fonction restent valides.

BEGIN;

CREATE OR REPLACE FUNCTION public.apply_checkout_platform_fee(
  p_amount NUMERIC,
  p_currency TEXT DEFAULT 'XOF'
)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v_base NUMERIC := GREATEST(0, COALESCE(p_amount, 0));
  v_code TEXT := upper(COALESCE(NULLIF(trim(p_currency), ''), 'XOF'));
BEGIN
  IF v_base <= 0 THEN
    RETURN 0;
  END IF;

  IF v_code IN ('XOF', 'XAF', 'XPF', 'JPY', 'KRW', 'VND', 'CLP', 'UGX', 'RWF') THEN
    RETURN ROUND(v_base);
  END IF;
  RETURN ROUND(v_base, 2);
END;
$$;

COMMENT ON FUNCTION public.apply_checkout_platform_fee(NUMERIC, TEXT) IS
  'Checkout platform fee disabled — returns amount unchanged (no 2%+100 surcharge).';

GRANT EXECUTE ON FUNCTION public.apply_checkout_platform_fee(NUMERIC, TEXT)
  TO anon, authenticated, service_role;

COMMIT;
