-- =====================================================
-- Fix: auto-enrollment cours lorsque payment_status = paid (Moneroo)
-- + résolution course_id via item_metadata OU courses.product_id
-- + résolution user_id via customers.user_id puis auth.users email
-- Date: 13 Mai 2026
-- =====================================================

CREATE OR REPLACE FUNCTION public.auto_enroll_course_on_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_item RECORD;
  v_course_id UUID;
  v_product_id UUID;
  v_user_id UUID;
  v_customer RECORD;
  v_lessons_count INTEGER;
  v_was_paid BOOLEAN;
  v_is_paid BOOLEAN;
BEGIN
  -- Trigger sur AFTER UPDATE OF payment_status — entrée dans l'état payé
  v_was_paid := COALESCE(OLD.payment_status, '') IN ('paid', 'completed');
  v_is_paid := NEW.payment_status IN ('paid', 'completed');

  IF NOT (v_is_paid AND NOT v_was_paid) THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_customer FROM public.customers WHERE id = NEW.customer_id LIMIT 1;

  v_user_id := NULL;
  IF FOUND THEN
    IF v_customer.user_id IS NOT NULL THEN
      v_user_id := v_customer.user_id;
    ELSIF v_customer.email IS NOT NULL THEN
      SELECT au.id
      INTO v_user_id
      FROM auth.users au
      WHERE au.email = v_customer.email
      LIMIT 1;
    END IF;
  END IF;

  FOR v_order_item IN
    SELECT *
    FROM public.order_items
    WHERE order_id = NEW.id
      AND product_type = 'course'
  LOOP
    v_course_id := NULL;
    v_product_id := v_order_item.product_id;

    IF v_order_item.item_metadata IS NOT NULL THEN
      BEGIN
        v_course_id := (v_order_item.item_metadata->>'course_id')::uuid;
      EXCEPTION
        WHEN invalid_text_representation THEN
          v_course_id := NULL;
      END;
    END IF;

    IF v_course_id IS NULL AND v_product_id IS NOT NULL THEN
      SELECT c.id
      INTO v_course_id
      FROM public.courses c
      WHERE c.product_id = v_product_id
      LIMIT 1;
    END IF;

    IF v_user_id IS NOT NULL AND v_course_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1
        FROM public.course_enrollments ce
        WHERE ce.course_id = v_course_id
          AND ce.user_id = v_user_id
      ) THEN
        SELECT COUNT(*)::integer
        INTO v_lessons_count
        FROM public.course_lessons cl
        WHERE cl.course_id = v_course_id;

        INSERT INTO public.course_enrollments (
          course_id,
          product_id,
          user_id,
          order_id,
          status,
          total_lessons,
          progress_percentage,
          enrollment_date
        )
        VALUES (
          v_course_id,
          v_product_id,
          v_user_id,
          NEW.id,
          'active',
          COALESCE(v_lessons_count, 0),
          0,
          NOW()
        )
        ON CONFLICT (course_id, user_id) DO NOTHING;
      END IF;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.auto_enroll_course_on_payment() IS
  'Crée course_enrollments quand orders.payment_status passe à paid/completed (ex. webhook Moneroo). Utilise item_metadata.course_id ou courses.product_id.';

DROP TRIGGER IF EXISTS trigger_auto_enroll_course_on_payment ON public.orders;
CREATE TRIGGER trigger_auto_enroll_course_on_payment
  AFTER UPDATE OF payment_status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_enroll_course_on_payment();
