-- Réactive les frais checkout acheteur : 2 % + 100 XOF.
-- L’UI checkout n’affiche pas la ligne « Frais de service » ; le Total inclut déjà les frais.

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
  v_fixed NUMERIC;
  v_fee NUMERIC;
BEGIN
  IF v_base <= 0 THEN
    RETURN 0;
  END IF;

  IF v_code IN ('XOF', 'XAF') THEN
    v_fixed := 100;
  ELSIF v_code = 'EUR' THEN
    v_fixed := ROUND((100.0 / 655.957)::NUMERIC, 2);
  ELSIF v_code = 'USD' THEN
    v_fixed := ROUND((100.0 / 599.04)::NUMERIC, 2);
  ELSE
    v_fixed := ROUND((100.0 / 655.957)::NUMERIC, 2);
  END IF;

  v_fee := ROUND(v_base * 0.02) + v_fixed;
  IF v_code IN ('XOF', 'XAF', 'XPF', 'JPY', 'KRW', 'VND', 'CLP', 'UGX', 'RWF') THEN
    RETURN ROUND(v_base + v_fee);
  END IF;
  RETURN ROUND(v_base + v_fee, 2);
END;
$$;

COMMENT ON FUNCTION public.apply_checkout_platform_fee(NUMERIC, TEXT) IS
  'Checkout buyer fee: subtotal + 2% + 100 XOF (converted for other currencies).';

GRANT EXECUTE ON FUNCTION public.apply_checkout_platform_fee(NUMERIC, TEXT)
  TO anon, authenticated, service_role;

COMMIT;
