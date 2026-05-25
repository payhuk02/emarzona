-- RLS email_campaigns : propriétaire boutique (user_id ou owner_id) + admins

DROP POLICY IF EXISTS "Store owners manage campaigns" ON public.email_campaigns;
DROP POLICY IF EXISTS "Store owners can manage own campaigns" ON public.email_campaigns;
DROP POLICY IF EXISTS "Admins can manage all campaigns" ON public.email_campaigns;

CREATE OR REPLACE FUNCTION public.user_owns_store(p_store_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.stores s
    WHERE s.id = p_store_id
      AND s.user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.user_owns_store(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_owns_store(uuid) TO authenticated;

CREATE POLICY "email_campaigns_store_owner_all"
  ON public.email_campaigns
  FOR ALL
  TO authenticated
  USING (public.user_owns_store(store_id))
  WITH CHECK (public.user_owns_store(store_id));

CREATE POLICY "email_campaigns_admin_all"
  ON public.email_campaigns
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'staff')
    )
  );

COMMENT ON POLICY "email_campaigns_store_owner_all" ON public.email_campaigns IS
  'Vendeur : CRUD campagnes de ses boutiques (stores.user_id = auth.uid())';
