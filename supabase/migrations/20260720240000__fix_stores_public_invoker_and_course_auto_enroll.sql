-- Vertical paid E2E: stores_public must be readable by buyers (not evaluate stores RLS as invoker).
-- Course auto-enroll: avoid full auth.users email scan (statement timeout under CI load).

BEGIN;

ALTER VIEW public.stores_public SET (security_invoker = false);

CREATE OR REPLACE FUNCTION public.auto_enroll_course_on_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_course_id UUID;
  v_product_id UUID;
  v_user_id UUID;
  v_customer RECORD;
  v_was_paid BOOLEAN;
  v_is_paid BOOLEAN;
BEGIN
  v_was_paid := COALESCE(OLD.payment_status, '') IN ('paid', 'completed');
  v_is_paid := NEW.payment_status IN ('paid', 'completed');

  IF NOT (v_is_paid AND NOT v_was_paid) THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_customer FROM public.customers WHERE id = NEW.customer_id LIMIT 1;

  v_user_id := NULL;
  IF FOUND THEN
    -- Prefer customer.id when it is the auth user id (E2E + common seed pattern).
    IF EXISTS (SELECT 1 FROM auth.users au WHERE au.id = v_customer.id) THEN
      v_user_id := v_customer.id;
    ELSIF v_customer.metadata ? 'user_id'
          AND (v_customer.metadata->>'user_id') ~* '^[0-9a-f-]{36}$' THEN
      v_user_id := (v_customer.metadata->>'user_id')::uuid;
    ELSIF v_customer.email IS NOT NULL THEN
      SELECT au.id
      INTO v_user_id
      FROM auth.users au
      WHERE au.email = v_customer.email
      LIMIT 1;

      IF v_user_id IS NULL THEN
        SELECT au.id
        INTO v_user_id
        FROM auth.users au
        WHERE lower(trim(au.email)) = lower(trim(v_customer.email))
        LIMIT 1;
      END IF;
    END IF;
  END IF;

  FOR v_course_id, v_product_id IN
    SELECT c.id, c.product_id
    FROM public.order_items oi
    INNER JOIN public.courses c ON c.product_id = oi.product_id
    WHERE oi.order_id = NEW.id
  LOOP
    IF v_user_id IS NOT NULL THEN
      BEGIN
        PERFORM public.enroll_user_in_course(
          p_course_id := v_course_id,
          p_order_id := NEW.id,
          p_user_id := v_user_id
        );
      EXCEPTION
        WHEN OTHERS THEN
          RAISE WARNING 'auto_enroll_course_on_payment failed for order % course %: %',
            NEW.id, v_course_id, SQLERRM;
      END;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.auto_enroll_course_on_payment() IS
  'Auto-enroll on paid; resolve user via customers.id/metadata before auth.users email scan.';

NOTIFY pgrst, 'reload schema';

COMMIT;
