-- ============================================
-- Script SQL consolidé - Système Multi-Tenant
-- Fonctions RPC pour résolution de domaines
-- ============================================

-- 1. Supprimer les anciennes fonctions (nécessaire si le type de retour change)
DROP FUNCTION IF EXISTS public.get_store_by_subdomain(text);
DROP FUNCTION IF EXISTS public.get_store_by_custom_domain(text);

-- 2. Fonction RPC : Résolution par sous-domaine
CREATE FUNCTION public.get_store_by_subdomain(store_subdomain text)
RETURNS SETOF public.stores
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.stores
  WHERE subdomain = lower(trim(store_subdomain))
    AND is_active = true
  LIMIT 1;
$$;

-- 3. Fonction RPC : Résolution par domaine personnalisé
CREATE FUNCTION public.get_store_by_custom_domain(p_domain text)
RETURNS SETOF public.stores
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.stores
  WHERE is_active = true
    AND (
      custom_domain = lower(trim(p_domain))
      OR EXISTS (
        SELECT 1
        FROM jsonb_array_elements(COALESCE(secondary_domains, '[]'::jsonb)) d
        WHERE lower(trim(d->>'domain')) = lower(trim(p_domain))
      )
    )
  LIMIT 1;
$$;

-- 4. Index pour performances
CREATE INDEX IF NOT EXISTS idx_stores_subdomain ON public.stores (subdomain);
CREATE INDEX IF NOT EXISTS idx_stores_custom_domain ON public.stores (custom_domain);

-- 5. Permissions
GRANT EXECUTE ON FUNCTION public.get_store_by_subdomain(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_store_by_custom_domain(text) TO anon, authenticated, service_role;
