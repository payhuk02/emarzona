-- E12 Epic 1.2: Secure course enrollments — no direct INSERT; RPC + paid/free checks only

BEGIN;

-- =====================================================
-- Helpers
-- =====================================================

CREATE OR REPLACE FUNCTION public.user_can_manage_course(
  p_user_id UUID,
  p_course_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.courses c
    INNER JOIN public.products p ON p.id = c.product_id
    INNER JOIN public.stores s ON s.id = p.store_id
    WHERE c.id = p_course_id
      AND s.user_id = p_user_id
  );
$$;

COMMENT ON FUNCTION public.user_can_manage_course IS
  'True if p_user_id owns the store that sells the course.';

CREATE OR REPLACE FUNCTION public.is_product_free_for_enrollment(p_product_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.products p
    WHERE p.id = p_product_id
      AND p.product_type = 'course'
      AND (
        p.pricing_model = 'free'
        OR COALESCE(p.price, 0) <= 0
        OR COALESCE(p.is_free_preview, false) = true
      )
  );
$$;

COMMENT ON FUNCTION public.is_product_free_for_enrollment IS
  'True when a course product can be enrolled without payment (free / preview).';

CREATE OR REPLACE FUNCTION public.user_has_paid_course_access(
  p_user_id UUID,
  p_course_id UUID,
  p_order_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.order_items oi
    INNER JOIN public.orders o ON o.id = oi.order_id
    INNER JOIN public.courses c ON c.id = p_course_id AND c.product_id = oi.product_id
    LEFT JOIN public.customers cust ON cust.id = o.customer_id
    WHERE o.payment_status = 'paid'
      AND public.is_order_paid_for_revenue(o.status, o.payment_status)
      AND (p_order_id IS NULL OR o.id = p_order_id)
      AND EXISTS (
        SELECT 1
        FROM auth.users u
        WHERE u.id = p_user_id
          AND cust.email IS NOT NULL
          AND lower(trim(u.email)) = lower(trim(cust.email))
      )
  );
$$;

COMMENT ON FUNCTION public.user_has_paid_course_access IS
  'True if p_user_id has a paid order for the course product.';

-- =====================================================
-- Canonical enrollment insert (internal)
-- =====================================================

CREATE OR REPLACE FUNCTION public._insert_course_enrollment_record(
  p_course_id UUID,
  p_product_id UUID,
  p_user_id UUID,
  p_order_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enrollment_id UUID;
  v_lessons_count INTEGER;
BEGIN
  SELECT ce.id
  INTO v_enrollment_id
  FROM public.course_enrollments ce
  WHERE ce.course_id = p_course_id
    AND ce.user_id = p_user_id
  LIMIT 1;

  IF v_enrollment_id IS NOT NULL THEN
    UPDATE public.course_enrollments
    SET
      status = 'active',
      order_id = COALESCE(p_order_id, order_id),
      updated_at = now()
    WHERE id = v_enrollment_id;

    RETURN v_enrollment_id;
  END IF;

  SELECT COUNT(*)::integer
  INTO v_lessons_count
  FROM public.course_lessons cl
  WHERE cl.course_id = p_course_id;

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
    p_course_id,
    p_product_id,
    p_user_id,
    p_order_id,
    'active',
    COALESCE(v_lessons_count, 0),
    0,
    now()
  )
  ON CONFLICT (course_id, user_id) DO UPDATE
  SET
    status = 'active',
    order_id = COALESCE(EXCLUDED.order_id, public.course_enrollments.order_id),
    updated_at = now()
  RETURNING id INTO v_enrollment_id;

  RETURN v_enrollment_id;
END;
$$;

-- =====================================================
-- Public RPC: enroll_user_in_course
-- =====================================================

CREATE OR REPLACE FUNCTION public.enroll_user_in_course(
  p_course_id UUID,
  p_order_id UUID DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller UUID;
  v_user_id UUID;
  v_product_id UUID;
  v_can_enroll BOOLEAN := false;
  v_enrollment_id UUID;
BEGIN
  v_caller := auth.uid();
  v_user_id := COALESCE(p_user_id, v_caller);

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED';
  END IF;

  IF v_caller IS NOT NULL AND v_user_id <> v_caller THEN
    IF NOT public.is_platform_admin()
       AND NOT public.user_can_manage_course(v_caller, p_course_id) THEN
      RAISE EXCEPTION 'ENROLLMENT_FORBIDDEN';
    END IF;
  END IF;

  SELECT c.product_id
  INTO v_product_id
  FROM public.courses c
  WHERE c.id = p_course_id
  LIMIT 1;

  IF v_product_id IS NULL THEN
    RAISE EXCEPTION 'COURSE_NOT_FOUND';
  END IF;

  IF public.is_platform_admin() THEN
    v_can_enroll := true;
  ELSIF v_caller IS NOT NULL AND public.user_can_manage_course(v_caller, p_course_id) THEN
    v_can_enroll := true;
  ELSIF public.is_product_free_for_enrollment(v_product_id)
        AND (v_caller IS NULL OR v_caller = v_user_id) THEN
    v_can_enroll := true;
  ELSIF public.user_has_paid_course_access(v_user_id, p_course_id, p_order_id) THEN
    v_can_enroll := true;
  END IF;

  IF NOT v_can_enroll THEN
    RAISE EXCEPTION 'ENROLLMENT_ACCESS_DENIED';
  END IF;

  v_enrollment_id := public._insert_course_enrollment_record(
    p_course_id,
    v_product_id,
    v_user_id,
    p_order_id
  );

  RETURN v_enrollment_id;
END;
$$;

COMMENT ON FUNCTION public.enroll_user_in_course IS
  'Secure course enrollment: paid order, free course, instructor, or admin only.';

GRANT EXECUTE ON FUNCTION public.enroll_user_in_course(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.enroll_user_in_course(UUID, UUID, UUID) TO service_role;

-- =====================================================
-- Auto-enroll trigger uses shared insert + access check
-- =====================================================

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
  IF FOUND AND v_customer.email IS NOT NULL THEN
    SELECT au.id
    INTO v_user_id
    FROM auth.users au
    WHERE lower(trim(au.email)) = lower(trim(v_customer.email))
    LIMIT 1;
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

-- =====================================================
-- RLS: remove all permissive INSERT policies
-- =====================================================

DROP POLICY IF EXISTS "Users can enroll" ON public.course_enrollments;
DROP POLICY IF EXISTS "course_enrollments_insert_policy" ON public.course_enrollments;
DROP POLICY IF EXISTS "System can create enrollments" ON public.course_enrollments;

COMMIT;
