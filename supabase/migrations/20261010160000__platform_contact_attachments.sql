-- Platform contact chat: attachments (gallery / photo / voice) + optional text content.

ALTER TABLE public.platform_contact_messages
  DROP CONSTRAINT IF EXISTS platform_contact_messages_content_check;

ALTER TABLE public.platform_contact_messages
  ALTER COLUMN content SET DEFAULT '';

ALTER TABLE public.platform_contact_messages
  ADD CONSTRAINT platform_contact_messages_content_check
  CHECK (char_length(content) <= 5000);

CREATE TABLE IF NOT EXISTS public.platform_contact_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.platform_contact_messages(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('image', 'audio', 'file')),
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL CHECK (file_size > 0 AND file_size <= 10485760),
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_platform_contact_attachments_message
  ON public.platform_contact_attachments (message_id);

ALTER TABLE public.platform_contact_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users select own contact attachments" ON public.platform_contact_attachments;
CREATE POLICY "Users select own contact attachments"
  ON public.platform_contact_attachments FOR SELECT TO authenticated
  USING (
    public.is_platform_contact_admin()
    OR EXISTS (
      SELECT 1
      FROM public.platform_contact_messages m
      JOIN public.platform_contact_threads t ON t.id = m.thread_id
      WHERE m.id = message_id AND t.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users insert own contact attachments" ON public.platform_contact_attachments;
CREATE POLICY "Users insert own contact attachments"
  ON public.platform_contact_attachments FOR INSERT TO authenticated
  WITH CHECK (
    public.is_platform_contact_admin()
    OR EXISTS (
      SELECT 1
      FROM public.platform_contact_messages m
      JOIN public.platform_contact_threads t ON t.id = m.thread_id
      WHERE m.id = message_id
        AND t.user_id = auth.uid()
        AND m.sender_id = auth.uid()
        AND m.sender_type = 'user'
    )
  );

-- Preview prefers text; falls back to media label when content empty
CREATE OR REPLACE FUNCTION public.touch_platform_contact_thread()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_preview TEXT;
BEGIN
  v_preview := nullif(trim(NEW.content), '');
  IF v_preview IS NULL THEN
    v_preview := 'Pièce jointe';
  END IF;

  UPDATE public.platform_contact_threads
  SET
    last_message_at = NEW.created_at,
    last_message_preview = left(v_preview, 160),
    updated_at = now(),
    user_unread_count = CASE
      WHEN NEW.sender_type = 'admin' THEN user_unread_count + 1
      ELSE user_unread_count
    END,
    admin_unread_count = CASE
      WHEN NEW.sender_type = 'user' THEN admin_unread_count + 1
      ELSE admin_unread_count
    END,
    status = CASE WHEN status = 'closed' THEN 'open' ELSE status END
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$;

-- Storage: users own platform-contact/{userId}/** ; admins via existing admin policy
DROP POLICY IF EXISTS "Users read own platform contact attachments" ON storage.objects;
CREATE POLICY "Users read own platform contact attachments"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'attachments'
    AND name LIKE 'platform-contact/' || auth.uid()::text || '/%'
  );

DROP POLICY IF EXISTS "Users upload own platform contact attachments" ON storage.objects;
CREATE POLICY "Users upload own platform contact attachments"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'attachments'
    AND name LIKE 'platform-contact/' || auth.uid()::text || '/%'
  );

DROP POLICY IF EXISTS "Users delete own platform contact attachments" ON storage.objects;
CREATE POLICY "Users delete own platform contact attachments"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'attachments'
    AND name LIKE 'platform-contact/' || auth.uid()::text || '/%'
  );

NOTIFY pgrst, 'reload schema';
