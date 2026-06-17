-- Fix 403 errors on notifications settings page
-- Ensures authenticated role can execute notification RPCs and access required tables with RLS.

-- ---------------------------------------------------------------------------
-- 1) Required RPC execute grants (some environments revoke PUBLIC execute)
-- ---------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.get_unread_count() TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_notification_read(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_all_notifications_read() TO authenticated;
GRANT EXECUTE ON FUNCTION public.archive_notification(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_notification(UUID, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, UUID, TEXT) TO authenticated;

GRANT EXECUTE ON FUNCTION public.save_push_subscription(TEXT, JSONB, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_push_subscription(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_push_subscriptions() TO authenticated;

-- ---------------------------------------------------------------------------
-- 2) Table grants required by PostgREST + RLS evaluation
-- ---------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.notification_preferences TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.push_subscriptions TO authenticated;
GRANT SELECT ON TABLE public.notification_logs TO authenticated;

-- ---------------------------------------------------------------------------
-- 3) RLS hardening/idempotent policies for authenticated users
-- ---------------------------------------------------------------------------
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'notification_preferences'
      AND policyname = 'Users can view own preferences'
  ) THEN
    CREATE POLICY "Users can view own preferences"
      ON public.notification_preferences
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'notification_preferences'
      AND policyname = 'Users can insert own preferences'
  ) THEN
    CREATE POLICY "Users can insert own preferences"
      ON public.notification_preferences
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'notification_preferences'
      AND policyname = 'Users can update own preferences'
  ) THEN
    CREATE POLICY "Users can update own preferences"
      ON public.notification_preferences
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

