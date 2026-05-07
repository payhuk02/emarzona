-- ============================================================
-- Emarzona Domain Go-Live Verification
-- Scope:
-- - Platform domain: emarzona.com
-- - Store wildcard domain: *.myemarzona.shop
-- - User custom domains (public.custom_domains)
-- ============================================================

-- 1) Core RPC/functions existence
SELECT
  EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'get_store_by_subdomain'
  ) AS has_get_store_by_subdomain,
  EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'get_store_by_custom_domain'
  ) AS has_get_store_by_custom_domain;

-- 2) Required tables
SELECT
  to_regclass('public.stores') AS stores_table,
  to_regclass('public.custom_domains') AS custom_domains_table;

-- 3) custom_domains schema integrity
SELECT
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='custom_domains' AND column_name='domain') AS has_domain,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='custom_domains' AND column_name='status') AS has_status,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='custom_domains' AND column_name='verification_token') AS has_verification_token,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='custom_domains' AND column_name='ssl_status') AS has_ssl_status,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='custom_domains' AND column_name='verified_at') AS has_verified_at,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='custom_domains' AND column_name='last_checked_at') AS has_last_checked_at;

-- 4) Unique/index checks
SELECT
  EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname='public' AND tablename='custom_domains' AND indexname='idx_custom_domains_domain'
  ) AS has_idx_custom_domains_domain,
  EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname='public' AND tablename='stores' AND indexname ILIKE 'idx_stores_subdomain%'
  ) AS has_idx_stores_subdomain;

-- 5) RLS enabled + policies on custom_domains
SELECT
  c.relrowsecurity AS custom_domains_rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname='public' AND c.relname='custom_domains';

SELECT
  policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname='public' AND tablename='custom_domains'
ORDER BY cmd, policyname;

-- 6) Active stores with usable subdomain coverage
SELECT
  COUNT(*) FILTER (WHERE is_active = true) AS active_stores,
  COUNT(*) FILTER (WHERE is_active = true AND (subdomain IS NULL OR trim(subdomain) = '')) AS active_missing_subdomain,
  COUNT(*) FILTER (WHERE is_active = true AND subdomain IS NOT NULL AND trim(subdomain) <> '') AS active_with_subdomain
FROM public.stores;

-- 7) Duplicate active subdomains (must be empty)
SELECT subdomain, COUNT(*) AS cnt
FROM public.stores
WHERE is_active = true
  AND subdomain IS NOT NULL
  AND trim(subdomain) <> ''
GROUP BY subdomain
HAVING COUNT(*) > 1
ORDER BY cnt DESC, subdomain;

-- 8) custom_domains status distribution
SELECT
  status,
  ssl_status,
  COUNT(*) AS count_domains
FROM public.custom_domains
GROUP BY status, ssl_status
ORDER BY status, ssl_status;

-- 9) Problematic custom domains (manual review queue)
SELECT
  cd.id,
  cd.domain,
  cd.status,
  cd.ssl_status,
  cd.error_message,
  cd.verified_at,
  cd.last_checked_at,
  s.id AS store_id,
  s.name AS store_name,
  s.slug AS store_slug,
  s.subdomain AS store_subdomain
FROM public.custom_domains cd
JOIN public.stores s ON s.id = cd.store_id
WHERE
  cd.status IN ('error', 'removed')
  OR (cd.status IN ('pending', 'verifying') AND cd.created_at < now() - interval '48 hours')
  OR (cd.status IN ('active', 'verified') AND (cd.last_checked_at IS NULL OR cd.last_checked_at < now() - interval '7 days'))
ORDER BY cd.updated_at DESC NULLS LAST
LIMIT 200;

-- 10) Runtime smoke tests for RPCs
DO $$
DECLARE
  sample_subdomain text;
  sample_custom_domain text;
BEGIN
  SELECT subdomain INTO sample_subdomain
  FROM public.stores
  WHERE is_active = true
    AND subdomain IS NOT NULL
    AND trim(subdomain) <> ''
  ORDER BY updated_at DESC NULLS LAST
  LIMIT 1;

  IF sample_subdomain IS NOT NULL THEN
    RAISE NOTICE 'Smoke test get_store_by_subdomain(%)', sample_subdomain;
    EXECUTE format(
      'SELECT count(*) FROM public.get_store_by_subdomain(%L)',
      sample_subdomain
    );
  ELSE
    RAISE NOTICE 'No active store with usable subdomain for smoke test.';
  END IF;

  SELECT domain INTO sample_custom_domain
  FROM public.custom_domains
  WHERE status = 'active'
    AND domain IS NOT NULL
    AND trim(domain) <> ''
  ORDER BY updated_at DESC NULLS LAST
  LIMIT 1;

  IF sample_custom_domain IS NOT NULL THEN
    RAISE NOTICE 'Smoke test get_store_by_custom_domain(%)', sample_custom_domain;
    EXECUTE format(
      'SELECT count(*) FROM public.get_store_by_custom_domain(%L)',
      sample_custom_domain
    );
  ELSE
    RAISE NOTICE 'No active custom domain for smoke test.';
  END IF;
END $$;

