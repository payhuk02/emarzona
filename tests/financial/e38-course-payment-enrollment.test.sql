-- E38 Epic 3.4: auto_enroll_course_on_payment + enroll_user_in_course
-- npx supabase db query --linked -f tests/financial/e38-course-payment-enrollment.test.sql

DO $$
BEGIN
  ASSERT to_regprocedure('public.enroll_user_in_course(uuid,uuid,uuid)') IS NOT NULL,
    'enroll_user_in_course must exist';
  RAISE NOTICE '✓ Test 1: enroll_user_in_course exists';
END $$;

DO $$
BEGIN
  ASSERT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'auto_enroll_course_on_payment'
  ), 'auto_enroll_course_on_payment trigger function must exist';
  RAISE NOTICE '✓ Test 2: auto_enroll_course_on_payment exists';
END $$;

DO $$
BEGIN
  ASSERT NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'course_enrollments'
      AND policyname = 'Users can enroll'
  ), 'insecure Users can enroll policy must be dropped';
  RAISE NOTICE '✓ Test 3: direct enroll policy removed';
END $$;
