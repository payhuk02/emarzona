-- Platform contact chat: users message support; admins reply; unread badge for users.

CREATE TABLE IF NOT EXISTS public.platform_contact_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  user_unread_count INTEGER NOT NULL DEFAULT 0 CHECK (user_unread_count >= 0),
  admin_unread_count INTEGER NOT NULL DEFAULT 0 CHECK (admin_unread_count >= 0),
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT platform_contact_threads_user_unique UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS public.platform_contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.platform_contact_threads(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'admin')),
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL CHECK (char_length(trim(content)) > 0 AND char_length(content) <= 5000),
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_platform_contact_threads_last_message
  ON public.platform_contact_threads (last_message_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_platform_contact_threads_admin_unread
  ON public.platform_contact_threads (admin_unread_count DESC)
  WHERE admin_unread_count > 0;
CREATE INDEX IF NOT EXISTS idx_platform_contact_messages_thread_created
  ON public.platform_contact_messages (thread_id, created_at ASC);

CREATE OR REPLACE FUNCTION public.is_platform_contact_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND (
        COALESCE(p.is_super_admin, false) = true
        OR p.role IN ('admin', 'staff', 'super_admin')
      )
  )
  OR COALESCE(public.has_role(auth.uid(), 'admin'::public.app_role), false);
$$;

REVOKE ALL ON FUNCTION public.is_platform_contact_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_platform_contact_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.touch_platform_contact_thread()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.platform_contact_threads
  SET
    last_message_at = NEW.created_at,
    last_message_preview = left(NEW.content, 160),
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

DROP TRIGGER IF EXISTS trg_touch_platform_contact_thread ON public.platform_contact_messages;
CREATE TRIGGER trg_touch_platform_contact_thread
  AFTER INSERT ON public.platform_contact_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_platform_contact_thread();

ALTER TABLE public.platform_contact_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users select own contact threads" ON public.platform_contact_threads;
CREATE POLICY "Users select own contact threads"
  ON public.platform_contact_threads FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_platform_contact_admin());

DROP POLICY IF EXISTS "Users insert own contact threads" ON public.platform_contact_threads;
CREATE POLICY "Users insert own contact threads"
  ON public.platform_contact_threads FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users update own contact threads" ON public.platform_contact_threads;
CREATE POLICY "Users update own contact threads"
  ON public.platform_contact_threads FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_platform_contact_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_platform_contact_admin());

DROP POLICY IF EXISTS "Users select own contact messages" ON public.platform_contact_messages;
CREATE POLICY "Users select own contact messages"
  ON public.platform_contact_messages FOR SELECT TO authenticated
  USING (
    public.is_platform_contact_admin()
    OR EXISTS (
      SELECT 1 FROM public.platform_contact_threads t
      WHERE t.id = thread_id AND t.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users insert own contact messages" ON public.platform_contact_messages;
CREATE POLICY "Users insert own contact messages"
  ON public.platform_contact_messages FOR INSERT TO authenticated
  WITH CHECK (
    (
      sender_type = 'user'
      AND sender_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.platform_contact_threads t
        WHERE t.id = thread_id AND t.user_id = auth.uid()
      )
    )
    OR (
      sender_type = 'admin'
      AND public.is_platform_contact_admin()
    )
  );

DROP POLICY IF EXISTS "Users update own contact message read" ON public.platform_contact_messages;
CREATE POLICY "Users update own contact message read"
  ON public.platform_contact_messages FOR UPDATE TO authenticated
  USING (
    public.is_platform_contact_admin()
    OR EXISTS (
      SELECT 1 FROM public.platform_contact_threads t
      WHERE t.id = thread_id AND t.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_platform_contact_admin()
    OR EXISTS (
      SELECT 1 FROM public.platform_contact_threads t
      WHERE t.id = thread_id AND t.user_id = auth.uid()
    )
  );

-- Mark admin replies as read for the current user
CREATE OR REPLACE FUNCTION public.mark_platform_contact_replies_read(p_thread_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.platform_contact_threads
    WHERE id = p_thread_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;

  UPDATE public.platform_contact_messages
  SET is_read = true
  WHERE thread_id = p_thread_id
    AND sender_type = 'admin'
    AND is_read = false;

  UPDATE public.platform_contact_threads
  SET user_unread_count = 0, updated_at = now()
  WHERE id = p_thread_id AND user_id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_platform_contact_replies_read(UUID) TO authenticated;

-- Admin marks user messages as read
CREATE OR REPLACE FUNCTION public.mark_platform_contact_admin_read(p_thread_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_platform_contact_admin() THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;

  UPDATE public.platform_contact_messages
  SET is_read = true
  WHERE thread_id = p_thread_id
    AND sender_type = 'user'
    AND is_read = false;

  UPDATE public.platform_contact_threads
  SET admin_unread_count = 0, updated_at = now()
  WHERE id = p_thread_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_platform_contact_admin_read(UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';
