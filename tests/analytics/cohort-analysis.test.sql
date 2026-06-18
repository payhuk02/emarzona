-- Smoke test: get_cohort_analysis (sans pgTAP — compatible SQL Editor Supabase)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'get_cohort_analysis'
  ) THEN
    RAISE EXCEPTION 'get_cohort_analysis missing — appliquez la migration 20260618150000';
  END IF;
END $$;

SELECT
  jsonb_typeof(
    public.get_cohort_analysis(
      (now() - interval '6 months'),
      '00000000-0000-0000-0000-000000000000'::uuid
    )
  ) = 'array' AS returns_json_array;
