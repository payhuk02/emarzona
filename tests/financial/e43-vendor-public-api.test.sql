-- E43 Epic 4.6 — API publique vendeurs REST

SELECT proname
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'log_api_request',
    'create_store_api_key',
    'verify_api_key'
  );

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'api_request_logs';

-- verify_api_key returns key_id column
SELECT p.proname, pg_get_function_result(p.oid) AS result_type
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'verify_api_key';

-- Feature api.public available from rank 2
SELECT public.store_has_physical_feature(
  (SELECT id FROM public.stores LIMIT 1),
  'api.public'
) IS NOT NULL AS api_feature_fn_ok;
