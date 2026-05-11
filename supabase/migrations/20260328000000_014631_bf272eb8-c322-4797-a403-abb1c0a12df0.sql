
-- 1. Table notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  message text NOT NULL,
  metadata jsonb DEFAULT '{}',
  action_url text,
  action_label text,
  is_read boolean NOT NULL DEFAULT false,
  is_archived boolean NOT NULL DEFAULT false,
  priority text NOT NULL DEFAULT 'normal',
  read_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- 2. Table notification_preferences
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  email_course_enrollment boolean DEFAULT true,
  email_lesson_complete boolean DEFAULT true,
  email_course_complete boolean DEFAULT true,
  email_certificate_ready boolean DEFAULT true,
  email_new_course boolean DEFAULT true,
  email_course_update boolean DEFAULT true,
  email_quiz_result boolean DEFAULT true,
  email_affiliate_sale boolean DEFAULT true,
  email_comment_reply boolean DEFAULT true,
  email_instructor_message boolean DEFAULT true,
  app_course_enrollment boolean DEFAULT true,
  app_lesson_complete boolean DEFAULT true,
  app_course_complete boolean DEFAULT true,
  app_certificate_ready boolean DEFAULT true,
  app_new_course boolean DEFAULT true,
  app_course_update boolean DEFAULT true,
  app_quiz_result boolean DEFAULT true,
  app_affiliate_sale boolean DEFAULT true,
  app_comment_reply boolean DEFAULT true,
  app_instructor_message boolean DEFAULT true,
  email_notifications boolean DEFAULT true,
  push_notifications boolean DEFAULT true,
  sms_notifications boolean DEFAULT false,
  email_digest_frequency text DEFAULT 'weekly',
  pause_until timestamp with time zone,
  sound_notifications boolean DEFAULT true,
  vibration_notifications boolean DEFAULT true,
  sound_volume integer DEFAULT 80,
  vibration_intensity text DEFAULT 'medium',
  notification_sound_type text DEFAULT 'default',
  accessibility_mode boolean DEFAULT false,
  high_contrast_sounds boolean DEFAULT false,
  screen_reader_friendly boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own preferences" ON public.notification_preferences;
CREATE POLICY "Users can view own preferences" ON public.notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own preferences" ON public.notification_preferences;
CREATE POLICY "Users can insert own preferences" ON public.notification_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own preferences" ON public.notification_preferences;
CREATE POLICY "Users can update own preferences" ON public.notification_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- 3. Table cookie_preferences
CREATE TABLE IF NOT EXISTS public.cookie_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  analytics boolean DEFAULT false,
  marketing boolean DEFAULT false,
  functional boolean DEFAULT true,
  necessary boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.cookie_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own cookie prefs" ON public.cookie_preferences;
CREATE POLICY "Users can view own cookie prefs" ON public.cookie_preferences
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own cookie prefs" ON public.cookie_preferences;
CREATE POLICY "Users can insert own cookie prefs" ON public.cookie_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own cookie prefs" ON public.cookie_preferences;
CREATE POLICY "Users can update own cookie prefs" ON public.cookie_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- 4. Function get_unread_count
CREATE OR REPLACE FUNCTION public.get_unread_count()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::integer
  FROM public.notifications
  WHERE user_id = auth.uid()
    AND is_read = false
    AND is_archived = false;
$$;

-- 5. Helper functions
CREATE OR REPLACE FUNCTION public.mark_notification_read(notification_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.notifications
  SET is_read = true, read_at = now()
  WHERE id = notification_id AND user_id = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.notifications
  SET is_read = true, read_at = now()
  WHERE user_id = auth.uid() AND is_read = false;
END;
$$;
