-- Fix: loyalty earn must not block order paid (guest / invalid customer_id)

BEGIN;

CREATE OR REPLACE FUNCTION public.trigger_earn_loyalty_points_on_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.payment_status = 'paid'
     AND (OLD.payment_status IS NULL OR OLD.payment_status IS DISTINCT FROM 'paid') THEN
    -- Guests / missing users must never abort payment completion
    IF NEW.customer_id IS NULL THEN
      RETURN NEW;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = NEW.customer_id) THEN
      RETURN NEW;
    END IF;

    BEGIN
      PERFORM public.calculate_loyalty_points(
        NEW.id,
        NEW.store_id,
        NEW.customer_id,
        NEW.total_amount
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'loyalty earn skipped for order %: %', NEW.id, SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.trigger_earn_loyalty_points_on_payment() IS
  'Award loyalty on paid; never blocks payment (skips guests / invalid users / soft-fails).';

COMMIT;
