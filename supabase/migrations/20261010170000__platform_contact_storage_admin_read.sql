-- Allow contact admins (not only is_platform_admin) to read platform-contact storage objects.

DROP POLICY IF EXISTS "Contact admins read platform contact attachments" ON storage.objects;
CREATE POLICY "Contact admins read platform contact attachments"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'attachments'
    AND name LIKE 'platform-contact/%'
    AND public.is_platform_contact_admin()
  );

-- Keep unread counters coherent when a message is rolled back / deleted
CREATE OR REPLACE FUNCTION public.untouch_platform_contact_thread()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last_at TIMESTAMPTZ;
  v_last_preview TEXT;
BEGIN
  SELECT m.created_at,
         COALESCE(NULLIF(trim(m.content), ''), 'Pièce jointe')
  INTO v_last_at, v_last_preview
  FROM public.platform_contact_messages m
  WHERE m.thread_id = OLD.thread_id
  ORDER BY m.created_at DESC
  LIMIT 1;

  UPDATE public.platform_contact_threads
  SET
    last_message_at = v_last_at,
    last_message_preview = CASE WHEN v_last_at IS NULL THEN NULL ELSE left(v_last_preview, 160) END,
    updated_at = now(),
    user_unread_count = GREATEST(
      0,
      user_unread_count - CASE WHEN OLD.sender_type = 'admin' AND OLD.is_read = false THEN 1 ELSE 0 END
    ),
    admin_unread_count = GREATEST(
      0,
      admin_unread_count - CASE WHEN OLD.sender_type = 'user' AND OLD.is_read = false THEN 1 ELSE 0 END
    )
  WHERE id = OLD.thread_id;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_untouch_platform_contact_thread ON public.platform_contact_messages;
CREATE TRIGGER trg_untouch_platform_contact_thread
  AFTER DELETE ON public.platform_contact_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.untouch_platform_contact_thread();

NOTIFY pgrst, 'reload schema';
