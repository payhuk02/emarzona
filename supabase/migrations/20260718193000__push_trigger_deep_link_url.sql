-- Push trigger: include deep-link URL for SW notificationclick + badge unread count via edge function.

CREATE OR REPLACE FUNCTION public.trigger_send_push_notification_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, net
AS $$
DECLARE
  v_url text;
  v_supabase_url text;
  v_internal_secret text;
  v_prefs_sound boolean := true;
  v_prefs_vibrate boolean := true;
  v_prefs_intensity text := 'medium';
  v_prefs_push boolean := true;
  v_prefs_pause timestamptz;
BEGIN
  BEGIN
    SELECT
      sound_notifications,
      vibration_notifications,
      vibration_intensity,
      push_notifications,
      pause_until
    INTO
      v_prefs_sound,
      v_prefs_vibrate,
      v_prefs_intensity,
      v_prefs_push,
      v_prefs_pause
    FROM public.notification_preferences
    WHERE user_id = NEW.user_id;
  EXCEPTION WHEN OTHERS THEN
    v_prefs_sound := true;
    v_prefs_vibrate := true;
    v_prefs_intensity := 'medium';
    v_prefs_push := true;
    v_prefs_pause := NULL;
  END;

  IF v_prefs_pause IS NOT NULL AND v_prefs_pause > now() THEN
    RETURN NEW;
  END IF;

  IF v_prefs_push = false THEN
    RETURN NEW;
  END IF;

  BEGIN
    SELECT c.supabase_url, c.edge_internal_secret
    INTO v_supabase_url, v_internal_secret
    FROM private.welcome_email_hook_config c
    WHERE c.id = 1;
  EXCEPTION WHEN OTHERS THEN
    v_supabase_url := NULL;
    v_internal_secret := NULL;
  END;

  IF v_supabase_url IS NULL OR v_internal_secret IS NULL THEN
    v_supabase_url := nullif(trim(current_setting('app.settings.supabase_url', true)), '');
    v_internal_secret := nullif(trim(current_setting('app.settings.edge_internal_secret', true)), '');
  END IF;

  IF v_supabase_url IS NULL OR v_internal_secret IS NULL THEN
    RAISE WARNING 'Push notification skipped: configure app.settings.supabase_url and app.settings.edge_internal_secret';
    RETURN NEW;
  END IF;

  v_url := rtrim(v_supabase_url, '/') || '/functions/v1/send-push-notification';

  PERFORM net.http_post(
    url := v_url,
    headers := jsonb_strip_nulls(
      jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_internal_secret,
        'x-internal-secret', v_internal_secret
      )
    ),
    body := jsonb_build_object(
      'user_id', NEW.user_id::text,
      'title', NEW.title,
      'body', NEW.message,
      'url', COALESCE(NULLIF(trim(NEW.action_url), ''), '/dashboard'),
      'vibrate', CASE
        WHEN COALESCE(v_prefs_vibrate, true) = false THEN '[]'::jsonb
        WHEN v_prefs_intensity = 'light' THEN '[100, 50, 100]'::jsonb
        WHEN v_prefs_intensity = 'heavy' THEN '[300, 150, 300]'::jsonb
        ELSE '[200, 100, 200]'::jsonb
      END,
      'soundEnabled', COALESCE(v_prefs_sound, true),
      'vibrationEnabled', COALESCE(v_prefs_vibrate, true),
      'vibrationIntensity', COALESCE(v_prefs_intensity, 'medium'),
      'silent', NOT COALESCE(v_prefs_sound, true),
      'data', jsonb_build_object(
        'notification_id', NEW.id,
        'type', NEW.type,
        'action_url', NEW.action_url,
        'metadata', NEW.metadata,
        'soundEnabled', COALESCE(v_prefs_sound, true),
        'vibrationEnabled', COALESCE(v_prefs_vibrate, true),
        'vibrationIntensity', COALESCE(v_prefs_intensity, 'medium')
      ),
      'priority', NEW.priority
    )
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Push notification http_post failed: %', SQLERRM;
    RETURN NEW;
END;
$$;
