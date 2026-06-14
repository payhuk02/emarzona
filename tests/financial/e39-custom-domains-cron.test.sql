-- E39 Epic 4.2 — RPC cron domaines personnalisés

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'setup_verify_domains_cron_job'
  ) THEN
    RAISE EXCEPTION 'setup_verify_domains_cron_job missing';
  END IF;
END $$;

SELECT proname
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('setup_verify_domains_cron_job', 'get_store_by_custom_domain');
