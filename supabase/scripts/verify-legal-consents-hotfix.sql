-- Smoke check: legal consents hotfix (prod)
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_consents'
  AND column_name IN ('document_type', 'document_version', 'is_revoked', 'consent_method')
ORDER BY column_name;

SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'get_latest_legal_document',
    'get_active_legal_document',
    'record_user_consent',
    'resolve_legal_document_type'
  )
ORDER BY routine_name;

SELECT type, version
FROM public.get_latest_legal_document('terms', 'fr');
