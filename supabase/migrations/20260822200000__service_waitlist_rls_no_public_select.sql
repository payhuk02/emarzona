-- Waitlist: stop public SELECT of PII (emails / phones).
-- Stats stay available via a SECURITY DEFINER RPC that returns a count only.
-- Vendor access uses is_store_member (owner + team), not stores.user_id alone.

BEGIN;

DROP POLICY IF EXISTS "Public can view waitlist stats" ON public.service_waitlist;
DROP POLICY IF EXISTS "Store owners can manage waitlist" ON public.service_waitlist;
DROP POLICY IF EXISTS "Store owners manage waitlist" ON public.service_waitlist;
DROP POLICY IF EXISTS "Store members can manage waitlist" ON public.service_waitlist;

CREATE POLICY "Store members can manage waitlist"
  ON public.service_waitlist
  FOR ALL
  TO authenticated
  USING (public.is_store_member(store_id, auth.uid()))
  WITH CHECK (public.is_store_member(store_id, auth.uid()));

CREATE OR REPLACE FUNCTION public.get_service_waitlist_public_stats(p_service_id uuid)
RETURNS TABLE (
  service_id uuid,
  waiting_count integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p_service_id,
    COUNT(*)::integer
  FROM public.service_waitlist w
  WHERE w.service_id = p_service_id
    AND w.status = 'waiting';
$$;

REVOKE ALL ON FUNCTION public.get_service_waitlist_public_stats(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_service_waitlist_public_stats(uuid)
  TO anon, authenticated;

COMMENT ON FUNCTION public.get_service_waitlist_public_stats(uuid) IS
  'Compte waitlist public (status=waiting). Aucune PII.';

COMMIT;
