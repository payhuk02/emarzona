-- Admin peut lire toutes les platform_commissions (page /admin/revenue).
-- Avant : SELECT limité aux boutiques dont stores.user_id = auth.uid() → totaux toujours 0 pour l'admin.

BEGIN;

DROP POLICY IF EXISTS platform_commissions_select_policy ON public.platform_commissions;
DROP POLICY IF EXISTS "Admins can view all commissions" ON public.platform_commissions;
DROP POLICY IF EXISTS "Admins manage commissions" ON public.platform_commissions;
DROP POLICY IF EXISTS "Store owners view own commissions" ON public.platform_commissions;

CREATE POLICY platform_commissions_select_admin_or_owner
  ON public.platform_commissions
  FOR SELECT
  USING (
    public.is_platform_admin()
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR store_id IN (
      SELECT s.id FROM public.stores s WHERE s.user_id = auth.uid()
    )
  );

COMMENT ON POLICY platform_commissions_select_admin_or_owner ON public.platform_commissions IS
  'Admins voient toutes les commissions ; vendeurs voient celles de leurs boutiques.';

COMMIT;

NOTIFY pgrst, 'reload schema';
