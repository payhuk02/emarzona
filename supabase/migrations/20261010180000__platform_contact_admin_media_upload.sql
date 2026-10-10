-- Allow contact admins to upload media into platform-contact/** (replies with photo/voice).

DROP POLICY IF EXISTS "Contact admins upload platform contact attachments" ON storage.objects;
CREATE POLICY "Contact admins upload platform contact attachments"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'attachments'
    AND name LIKE 'platform-contact/%'
    AND public.is_platform_contact_admin()
  );

DROP POLICY IF EXISTS "Contact admins delete platform contact attachments" ON storage.objects;
CREATE POLICY "Contact admins delete platform contact attachments"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'attachments'
    AND name LIKE 'platform-contact/%'
    AND public.is_platform_contact_admin()
  );

-- Aggregate unread for admin nav badge
CREATE OR REPLACE FUNCTION public.platform_contact_admin_unread_total()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN public.is_platform_contact_admin() THEN
      COALESCE((
        SELECT SUM(t.admin_unread_count)::integer
        FROM public.platform_contact_threads t
        WHERE t.admin_unread_count > 0
      ), 0)
    ELSE 0
  END;
$$;

REVOKE ALL ON FUNCTION public.platform_contact_admin_unread_total() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.platform_contact_admin_unread_total() TO authenticated;

NOTIFY pgrst, 'reload schema';
