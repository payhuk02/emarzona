-- Return full stores_public projection from get_store_by_subdomain (theme + commerce_type for multi-tenant).

BEGIN;

DROP FUNCTION IF EXISTS public.get_store_by_subdomain(text);

CREATE OR REPLACE FUNCTION public.get_store_by_subdomain(store_subdomain TEXT)
RETURNS SETOF public.stores_public
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sp.*
  FROM public.stores_public sp
  WHERE sp.subdomain = lower(trim(store_subdomain))
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.get_store_by_subdomain IS
  'Active store by subdomain with full public storefront projection (theme, commerce_type, etc.)';

COMMIT;
