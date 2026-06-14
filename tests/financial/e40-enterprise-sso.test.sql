-- E40 Epic 4.3 — SSO Enterprise

SELECT proname
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'get_store_sso_public_config',
    'check_email_sso_enforcement',
    'provision_store_sso_member',
    'store_has_physical_feature'
  );

SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'store_sso_providers'
ORDER BY ordinal_position;
