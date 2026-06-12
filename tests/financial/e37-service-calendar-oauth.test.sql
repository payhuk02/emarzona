-- E37 Epic 3.3.4/3.3.5: Tests migration service OAuth + meetings
-- Exécution : npx supabase db query --linked -f tests/financial/e37-service-calendar-oauth.test.sql

DO $$
BEGIN
  ASSERT to_regprocedure('public.upsert_google_calendar_busy_events(uuid,jsonb)') IS NOT NULL,
    'upsert_google_calendar_busy_events must exist';
  RAISE NOTICE '✓ Test 1: upsert_google_calendar_busy_events exists';
END $$;

DO $$
BEGIN
  ASSERT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'service_products'
      AND column_name = 'preferred_meeting_platform'
  ), 'service_products.preferred_meeting_platform must exist';
  RAISE NOTICE '✓ Test 2: preferred_meeting_platform column exists';
END $$;

DO $$
BEGIN
  ASSERT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'service_oauth_states'
  ), 'service_oauth_states table must exist';
  RAISE NOTICE '✓ Test 3: service_oauth_states table exists';
END $$;
