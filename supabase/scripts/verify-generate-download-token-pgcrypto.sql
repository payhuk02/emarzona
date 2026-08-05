-- Verify generate_download_token no longer references gen_random_bytes in its definition.
SELECT
  p.proname AS function_name,
  pg_get_functiondef(p.oid) NOT LIKE '%gen_random_bytes%' AS avoids_pgcrypto_bytes,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_can_execute
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'generate_download_token';
