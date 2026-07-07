-- Align generate_order_number with check_order_number_format:
-- ^(ORD-[0-9]+|TEST-ORDER-[0-9]+)$  (no hyphen between date and suffix)

BEGIN;

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_date_prefix TEXT;
  v_counter INTEGER;
BEGIN
  v_date_prefix := to_char(now(), 'YYYYMMDD');

  SELECT COALESCE(
    MAX(
      CASE
        WHEN order_number ~ ('^ORD-' || v_date_prefix || '[0-9]{4}$')
        THEN substring(order_number from length('ORD-' || v_date_prefix) + 1)::integer
        ELSE NULL
      END
    ),
    0
  ) + 1
  INTO v_counter
  FROM public.orders
  WHERE order_number LIKE 'ORD-' || v_date_prefix || '%';

  RETURN 'ORD-' || v_date_prefix || lpad(v_counter::text, 4, '0');
END;
$$;

COMMENT ON FUNCTION public.generate_order_number() IS
  'Génère ORD-YYYYMMDD#### (chiffres uniquement après ORD-, conforme check_order_number_format).';

COMMIT;
