-- Phase 2 smoke checks (read-only)
SELECT 'resolve_user_id_for_store_email' AS check_name,
  EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'resolve_user_id_for_store_email'
  ) AS ok;

SELECT 'calculate_dynamic_segment_members' AS check_name,
  EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'calculate_dynamic_segment_members'
  ) AS ok;

SELECT p.proname,
  pg_get_function_identity_arguments(p.oid) AS args
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('resolve_user_id_for_store_email', 'calculate_dynamic_segment_members')
ORDER BY p.proname;
