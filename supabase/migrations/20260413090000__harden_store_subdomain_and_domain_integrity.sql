-- ============================================================================
-- Harden store slug/subdomain/custom-domain integrity and lookup reliability
-- Date: 2026-04-13
-- ============================================================================

BEGIN;

-- 1) Preflight checks: prevent unsafe canonicalization collisions
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM (
      SELECT lower(trim(slug)) AS canonical_slug, COUNT(*) AS c
      FROM public.stores
      GROUP BY lower(trim(slug))
      HAVING COUNT(*) > 1
    ) s
  ) THEN
    RAISE EXCEPTION 'Canonical slug collision detected. Resolve duplicate slugs before applying this migration.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM (
      SELECT lower(trim(subdomain)) AS canonical_subdomain, COUNT(*) AS c
      FROM public.stores
      WHERE subdomain IS NOT NULL AND trim(subdomain) <> ''
      GROUP BY lower(trim(subdomain))
      HAVING COUNT(*) > 1
    ) s
  ) THEN
    RAISE EXCEPTION 'Canonical subdomain collision detected. Resolve duplicate subdomains before applying this migration.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM (
      SELECT lower(trim(domain)) AS canonical_domain, COUNT(*) AS c
      FROM public.custom_domains
      GROUP BY lower(trim(domain))
      HAVING COUNT(*) > 1
    ) d
  ) THEN
    RAISE EXCEPTION 'Canonical custom domain collision detected. Resolve duplicate domains before applying this migration.';
  END IF;
END $$;

-- 2) Canonicalize values
UPDATE public.stores
SET slug = lower(trim(slug))
WHERE slug IS NOT NULL AND slug <> lower(trim(slug));

UPDATE public.stores
SET subdomain = lower(trim(subdomain))
WHERE subdomain IS NOT NULL AND subdomain <> lower(trim(subdomain));

UPDATE public.stores
SET custom_domain = lower(trim(custom_domain))
WHERE custom_domain IS NOT NULL AND custom_domain <> lower(trim(custom_domain));

UPDATE public.custom_domains
SET domain = lower(trim(domain))
WHERE domain IS NOT NULL AND domain <> lower(trim(domain));

-- 3) Ensure trigger always normalizes subdomain on insert/update
DROP TRIGGER IF EXISTS trigger_auto_generate_subdomain ON public.stores;
CREATE TRIGGER trigger_auto_generate_subdomain
  BEFORE INSERT OR UPDATE ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_subdomain();

-- 4) Add DB-level subdomain guardrails
ALTER TABLE public.stores
  DROP CONSTRAINT IF EXISTS chk_stores_subdomain_valid,
  ADD CONSTRAINT chk_stores_subdomain_valid
    CHECK (subdomain IS NULL OR public.is_valid_subdomain(lower(trim(subdomain))));

ALTER TABLE public.stores
  DROP CONSTRAINT IF EXISTS chk_stores_subdomain_not_reserved,
  ADD CONSTRAINT chk_stores_subdomain_not_reserved
    CHECK (subdomain IS NULL OR NOT public.is_subdomain_reserved(lower(trim(subdomain))));

-- 5) Case-insensitive uniqueness + lookup performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_stores_slug_canonical_unique
  ON public.stores (lower(trim(slug)));

CREATE UNIQUE INDEX IF NOT EXISTS idx_stores_subdomain_canonical_unique
  ON public.stores (lower(trim(subdomain)))
  WHERE subdomain IS NOT NULL AND trim(subdomain) <> '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_custom_domains_domain_canonical_unique
  ON public.custom_domains (lower(trim(domain)));

CREATE INDEX IF NOT EXISTS idx_custom_domains_active_domain_canonical
  ON public.custom_domains (lower(trim(domain)))
  WHERE status = 'active';

CREATE UNIQUE INDEX IF NOT EXISTS idx_custom_domains_one_primary_per_store
  ON public.custom_domains (store_id)
  WHERE is_primary = true;

-- 6) Harden custom domain resolution function
CREATE OR REPLACE FUNCTION public.get_store_by_custom_domain(p_domain text)
RETURNS SETOF public.stores
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.*
  FROM public.stores s
  INNER JOIN public.custom_domains cd ON cd.store_id = s.id
  WHERE lower(trim(cd.domain)) = lower(trim(p_domain))
    AND cd.status = 'active'
    AND s.is_active = true
  LIMIT 1;
$$;

COMMIT;

