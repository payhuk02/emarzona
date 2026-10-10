-- Restore public SELECT on preview lessons for unpaid buyers on course detail pages.
-- e14 replaced "Lessons viewable by enrolled or free" without is_preview, which can
-- hide curriculum metadata and break paid-course CTA E2E for logged-in non-enrolled buyers.

BEGIN;

DROP POLICY IF EXISTS "Preview lessons are public" ON public.course_lessons;
CREATE POLICY "Preview lessons are public"
  ON public.course_lessons
  FOR SELECT
  USING (is_preview = true);

-- Ensure enrolled / free / manage path still works under a single coherent policy name
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

COMMIT;
