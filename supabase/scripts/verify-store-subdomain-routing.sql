-- ============================================
-- Verify: Subdomain routing (myemarzona.shop)
-- Features checked:
-- - public.get_store_by_subdomain(store_subdomain)
-- - public.get_store_by_custom_domain(p_domain)
-- - public.stores.subdomain (+ basic store columns)
-- - public.custom_domains (optional but used for custom domains)
-- - Active store coverage (how many active stores have a usable subdomain)
-- ============================================

-- 1) Existence checks: RPC + tables + columns + key indexes
SELECT
  -- RPCs
  EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'get_store_by_subdomain'
  ) AS has_get_store_by_subdomain,

  EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'get_store_by_custom_domain'
  ) AS has_get_store_by_custom_domain,

  -- Core tables
  EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'stores'
  ) AS has_stores_table,

  EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'custom_domains'
  ) AS has_custom_domains_table,

  -- Stores columns
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'stores' AND column_name = 'subdomain'
  ) AS stores_has_subdomain_column,

  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'stores' AND column_name = 'is_active'
  ) AS stores_has_is_active_column,

  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'stores' AND column_name = 'logo_url'
  ) AS stores_has_logo_url_column,

  -- Index (named in initial migration)
  EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname ILIKE 'idx_stores_subdomain%'
  ) AS has_subdomain_index;

-- 2) Active store coverage for *.myemarzona.shop
-- Notes:
-- - a "usable" subdomain is non-null and not empty
-- - the edge function rejects subdomains on myemarzona.shop when none is derived
SELECT
  COUNT(*) FILTER (WHERE is_active = true) AS active_stores,
  COUNT(*) FILTER (WHERE is_active = true AND subdomain IS NULL) AS active_without_subdomain,
  COUNT(*) FILTER (WHERE is_active = true AND subdomain IS NOT NULL AND trim(subdomain) = '') AS active_with_empty_subdomain,
  COUNT(*) FILTER (WHERE is_active = true AND subdomain IS NOT NULL AND trim(subdomain) <> '') AS active_with_usable_subdomain
FROM public.stores;

-- 3) Duplicates among active stores (should be prevented by unique index)
SELECT
  subdomain,
  COUNT(*) AS active_store_count
FROM public.stores
WHERE is_active = true
  AND subdomain IS NOT NULL
  AND trim(subdomain) <> ''
GROUP BY subdomain
HAVING COUNT(*) > 1
ORDER BY active_store_count DESC
LIMIT 20;

-- 4) Sample data: show first usable subdomains
SELECT
  id,
  slug,
  name,
  subdomain,
  is_active
FROM public.stores
WHERE is_active = true
  AND subdomain IS NOT NULL
  AND trim(subdomain) <> ''
ORDER BY updated_at DESC NULLS LAST
LIMIT 10;

-- 5) Optional: custom domains coverage (safe even if table does not exist)
-- Postgres parses referenced relations even in CASE branches, so we use dynamic SQL.
DO $$
DECLARE
  active_custom_domains bigint := 0;
  active_custom_domains_with_domain bigint := 0;
BEGIN
  IF to_regclass('public.custom_domains') IS NULL THEN
    RAISE NOTICE 'custom_domains: table does not exist (0 active domains)';
    RETURN;
  END IF;

  EXECUTE 'SELECT COUNT(*) FROM public.custom_domains WHERE status = ''active'''
    INTO active_custom_domains;

  EXECUTE $q$
    SELECT COUNT(*)
    FROM public.custom_domains
    WHERE status = 'active'
      AND domain IS NOT NULL
      AND trim(domain) <> ''
  $q$
    INTO active_custom_domains_with_domain;

  RAISE NOTICE 'custom_domains: active=% (with domain=%)', active_custom_domains, active_custom_domains_with_domain;
END $$;

-- 6) Which function definition is actually installed?
-- Useful when multiple migrations have defined these RPCs with different implementations.
SELECT
  'get_store_by_subdomain' AS function_name,
  pg_get_functiondef(p.oid) AS function_def
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'get_store_by_subdomain';

SELECT
  'get_store_by_custom_domain' AS function_name,
  pg_get_functiondef(p.oid) AS function_def
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'get_store_by_custom_domain';

-- 7) Runtime "smoke test" (dynamic SQL)
DO $$
DECLARE
  sample_subdomain TEXT;
  sample_custom_domain TEXT;
  has_sub BOOLEAN;
  has_custom BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'get_store_by_subdomain'
  ) INTO has_sub;

  SELECT EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'get_store_by_custom_domain'
  ) INTO has_custom;

  IF has_sub THEN
    SELECT subdomain INTO sample_subdomain
    FROM public.stores
    WHERE is_active = true
      AND subdomain IS NOT NULL
      AND trim(subdomain) <> ''
    ORDER BY updated_at DESC NULLS LAST
    LIMIT 1;

    IF sample_subdomain IS NOT NULL THEN
      RAISE NOTICE 'Testing get_store_by_subdomain(%):', sample_subdomain;
      EXECUTE format(
        'SELECT count(*) FROM public.get_store_by_subdomain(%L) AS t',
        sample_subdomain
      );
    ELSE
      RAISE NOTICE 'No active store with usable subdomain found.';
    END IF;
  ELSE
    RAISE NOTICE 'RPC public.get_store_by_subdomain is missing.';
  END IF;

  IF has_custom THEN
    PERFORM 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'custom_domains';

    IF FOUND THEN
      SELECT domain INTO sample_custom_domain
      FROM public.custom_domains
      WHERE status = 'active'
        AND domain IS NOT NULL
        AND trim(domain) <> ''
      ORDER BY updated_at DESC NULLS LAST
      LIMIT 1;

      IF sample_custom_domain IS NOT NULL THEN
        RAISE NOTICE 'Testing get_store_by_custom_domain(%):', sample_custom_domain;
        EXECUTE format(
          'SELECT count(*) FROM public.get_store_by_custom_domain(%L) AS t',
          sample_custom_domain
        );
      ELSE
        RAISE NOTICE 'No active custom domain found.';
      END IF;
    ELSE
      RAISE NOTICE 'Table public.custom_domains does not exist, skipping custom domain test.';
    END IF;
  ELSE
    RAISE NOTICE 'RPC public.get_store_by_custom_domain is missing.';
  END IF;
END $$;

