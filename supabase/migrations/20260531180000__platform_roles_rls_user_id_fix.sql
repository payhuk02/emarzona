-- Fix RLS platform_roles : profiles.user_id (pas profiles.id) + is_platform_admin()

DROP POLICY IF EXISTS "Admins can read platform_roles" ON public.platform_roles;
CREATE POLICY "Admins can read platform_roles"
  ON public.platform_roles
  FOR SELECT
  TO authenticated
  USING (public.is_platform_admin());

DROP POLICY IF EXISTS "Admins can update platform_roles" ON public.platform_roles;
CREATE POLICY "Admins can update platform_roles"
  ON public.platform_roles
  FOR UPDATE
  TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());
