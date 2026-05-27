-- Admin panel phase 2
-- - is_platform_admin() helper for RLS
-- - Platform admins: read/update api_keys, read subscriptions
-- - Purge integration secrets from platform_settings.customization

BEGIN;

-- ---------------------------------------------------------------------------
-- Helper: platform admin (aligné avec checkUserIsAdmin côté app)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND (
        COALESCE(p.is_super_admin, false) = true
        OR p.role IN ('admin', 'staff', 'manager', 'support', 'viewer')
      )
  )
  OR public.has_role(auth.uid(), 'admin'::public.app_role);
$$;

COMMENT ON FUNCTION public.is_platform_admin() IS
  'True si l''utilisateur courant peut accéder au panneau admin plateforme.';

GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated;

-- ---------------------------------------------------------------------------
-- api_keys: supervision plateforme
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Platform admins can view all api_keys" ON public.api_keys;
CREATE POLICY "Platform admins can view all api_keys"
  ON public.api_keys
  FOR SELECT
  TO authenticated
  USING (public.is_platform_admin());

DROP POLICY IF EXISTS "Platform admins can update api_keys" ON public.api_keys;
CREATE POLICY "Platform admins can update api_keys"
  ON public.api_keys
  FOR UPDATE
  TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- subscriptions: vue agrégée admin
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Platform admins can view all subscriptions" ON public.subscriptions;
CREATE POLICY "Platform admins can view all subscriptions"
  ON public.subscriptions
  FOR SELECT
  TO authenticated
  USING (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- Purge secrets intégrations (customization JSON)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.strip_jsonb_integration_secrets(obj jsonb)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  k text;
  v jsonb;
  out jsonb := '{}'::jsonb;
BEGIN
  IF obj IS NULL OR jsonb_typeof(obj) <> 'object' THEN
    RETURN COALESCE(obj, '{}'::jsonb);
  END IF;

  FOR k, v IN SELECT * FROM jsonb_each(obj)
  LOOP
    IF k ~* '^(api[_-]?key|api[_-]?secret|password|secret|dsn|access[_-]?key|token|private[_-]?key)$' THEN
      CONTINUE;
    END IF;
    IF jsonb_typeof(v) = 'object' THEN
      out := out || jsonb_build_object(k, public.strip_jsonb_integration_secrets(v));
    ELSE
      out := out || jsonb_build_object(k, v);
    END IF;
  END LOOP;

  RETURN out;
END;
$$;

UPDATE public.platform_settings ps
SET settings = jsonb_set(
  ps.settings,
  '{integrations}',
  public.strip_jsonb_integration_secrets(ps.settings->'integrations'),
  true
)
WHERE ps.key = 'customization'
  AND ps.settings ? 'integrations'
  AND ps.settings->'integrations' IS NOT NULL;

COMMIT;
