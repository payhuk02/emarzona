-- E41 Epic 4.4 — Audit logs exportables SOC2

SELECT proname
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'log_store_audit_event',
    'query_unified_audit_logs',
    'export_unified_audit_logs'
  );

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('store_audit_events', 'audit_export_logs');

SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'admin_actions'
  AND column_name IN ('ip_address', 'user_agent', 'actor_email');

-- Feature audit.export gated Enterprise (rank 3)
SELECT public.store_has_physical_feature(
  (SELECT id FROM public.stores LIMIT 1),
  'audit.export'
) IS NOT NULL AS audit_feature_fn_ok;
