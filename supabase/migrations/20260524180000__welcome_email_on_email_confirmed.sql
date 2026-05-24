-- Email de bienvenue (welcome-user) après confirmation d'adresse email Auth
-- Déclenche send-welcome-email → send-email (Resend)

CREATE EXTENSION IF NOT EXISTS pg_net;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS welcome_email_sent_at TIMESTAMPTZ;

COMMENT ON COLUMN public.profiles.welcome_email_sent_at IS
  'Horodatage du premier envoi welcome-user (idempotence)';

CREATE OR REPLACE FUNCTION public.trigger_welcome_email_on_email_confirmed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, net
AS $$
DECLARE
  v_url text;
  v_service_key text;
  v_supabase_url text;
  v_internal_secret text;
  v_already_sent timestamptz;
  v_full_name text;
BEGIN
  IF NEW.email_confirmed_at IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.email_confirmed_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT welcome_email_sent_at
  INTO v_already_sent
  FROM public.profiles
  WHERE user_id = NEW.id;

  IF v_already_sent IS NOT NULL THEN
    RETURN NEW;
  END IF;

  v_supabase_url := nullif(trim(current_setting('app.settings.supabase_url', true)), '');
  v_service_key := nullif(trim(current_setting('app.settings.service_role_key', true)), '');
  v_internal_secret := nullif(trim(current_setting('app.settings.edge_internal_secret', true)), '');

  IF v_supabase_url IS NULL OR v_service_key IS NULL THEN
    RAISE WARNING
      'Welcome email skipped for user %: configure app.settings.supabase_url and app.settings.service_role_key (see docs/CONFIGURATION_AUTH_EMAIL_RESEND.md)',
      NEW.id;
    RETURN NEW;
  END IF;

  v_url := rtrim(v_supabase_url, '/') || '/functions/v1/send-welcome-email';

  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'name',
    split_part(COALESCE(NEW.email, ''), '@', 1)
  );

  PERFORM net.http_post(
    url := v_url,
    headers := jsonb_strip_nulls(
      jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_service_key,
        'x-internal-secret', v_internal_secret
      )
    ),
    body := jsonb_build_object(
      'user_id', NEW.id::text,
      'email', NEW.email,
      'full_name', v_full_name
    )
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Welcome email http_post failed for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.trigger_welcome_email_on_email_confirmed() IS
  'Appelle send-welcome-email (pg_net) quand email_confirmed_at passe de NULL à une valeur';

DROP TRIGGER IF EXISTS on_auth_user_email_confirmed_welcome ON auth.users;

CREATE TRIGGER on_auth_user_email_confirmed_welcome
  AFTER INSERT OR UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_welcome_email_on_email_confirmed();
