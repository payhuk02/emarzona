-- E14 Epic 1.4: Checkout session hardening + course lesson SELECT + checkout rate limit endpoint

BEGIN;

-- =====================================================
-- 1. One-time checkout token on order insert
-- =====================================================

CREATE OR REPLACE FUNCTION public.set_order_checkout_token()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.metadata := COALESCE(NEW.metadata, '{}'::jsonb);
  IF NEW.metadata->>'checkout_token' IS NULL THEN
    NEW.metadata := NEW.metadata || jsonb_build_object(
      'checkout_token', encode(gen_random_bytes(24), 'hex')
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_order_checkout_token_trigger ON public.orders;

CREATE TRIGGER set_order_checkout_token_trigger
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_order_checkout_token();

CREATE OR REPLACE FUNCTION public.clear_order_checkout_token_on_paid()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.payment_status IN ('paid', 'completed')
     AND COALESCE(OLD.payment_status, '') NOT IN ('paid', 'completed') THEN
    NEW.metadata := COALESCE(NEW.metadata, '{}'::jsonb) - 'checkout_token';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS clear_order_checkout_token_on_paid_trigger ON public.orders;

CREATE TRIGGER clear_order_checkout_token_on_paid_trigger
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.clear_order_checkout_token_on_paid();

COMMENT ON FUNCTION public.set_order_checkout_token IS
  'Assigns a random one-time checkout_token in order metadata for guest payment sessions.';

-- =====================================================
-- 2. Course lessons: active enrollment or free preview only
-- =====================================================

DROP POLICY IF EXISTS "Lessons viewable by enrolled or free" ON public.course_lessons;

CREATE POLICY "Lessons viewable by enrolled or free"
  ON public.course_lessons
  FOR SELECT
  USING (
    public.is_platform_admin()
    OR public.user_can_manage_course(auth.uid(), course_lessons.course_id)
    OR EXISTS (
      SELECT 1
      FROM public.course_enrollments ce
      WHERE ce.course_id = course_lessons.course_id
        AND ce.user_id = auth.uid()
        AND ce.status = 'active'
    )
    OR EXISTS (
      SELECT 1
      FROM public.courses c
      INNER JOIN public.products p ON p.id = c.product_id
      WHERE c.id = course_lessons.course_id
        AND public.is_product_free_for_enrollment(p.id)
    )
  );

-- =====================================================
-- 3. Rate limit: checkout endpoint (used by Edge + client)
-- =====================================================

COMMENT ON COLUMN public.rate_limit_log.endpoint IS
  'Endpoint key: auth, api, webhook, payment, checkout, default, etc.';

COMMIT;
