-- Configuration welcome-email sans ALTER DATABASE (souvent bloqué sur Supabase hébergé)
-- Renseigner une fois dans SQL Editor (voir docs/CONFIGURATION_AUTH_EMAIL_RESEND.md)

CREATE SCHEMA IF NOT EXISTS private;

CREATE TABLE IF NOT EXISTS private.welcome_email_hook_config (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  supabase_url text NOT NULL DEFAULT 'https://hbdnzajbyjakdhuavrvb.supabase.co',
  service_role_key text NOT NULL,
  edge_internal_secret text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE private.welcome_email_hook_config IS
  'Secrets pour pg_net → send-welcome-email (une seule ligne, id=1). Renseigner via SQL Editor.';

REVOKE ALL ON SCHEMA private FROM PUBLIC;
REVOKE ALL ON TABLE private.welcome_email_hook_config FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO postgres, service_role;

CREATE OR REPLACE FUNCTION public.setup_welcome_email_hook(
  p_service_role_key text,
  p_edge_internal_secret text DEFAULT NULL,
  p_supabase_url text DEFAULT 'https://hbdnzajbyjakdhuavrvb.supabase.co'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = private, public
AS $$
BEGIN
  IF p_service_role_key IS NULL OR length(trim(p_service_role_key)) < 20 THEN
    RAISE EXCEPTION 'p_service_role_key is required (JWT service_role eyJ...)';
  END IF;

  IF p_supabase_url IS NULL OR length(trim(p_supabase_url)) = 0 THEN
    RAISE EXCEPTION 'p_supabase_url is required';
  END IF;

  INSERT INTO private.welcome_email_hook_config (
    id,
    supabase_url,
    service_role_key,
    edge_internal_secret,
    updated_at
  )
  VALUES (
    1,
    rtrim(trim(p_supabase_url), '/'),
    trim(p_service_role_key),
    nullif(trim(p_edge_internal_secret), ''),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    supabase_url = EXCLUDED.supabase_url,
    service_role_key = EXCLUDED.service_role_key,
    edge_internal_secret = EXCLUDED.edge_internal_secret,
    updated_at = now();

  RETURN jsonb_build_object(
    'success', true,
    'supabase_url', rtrim(trim(p_supabase_url), '/'),
    'has_edge_internal_secret', p_edge_internal_secret IS NOT NULL AND length(trim(p_edge_internal_secret)) > 0
  );
END;
$$;

REVOKE ALL ON FUNCTION public.setup_welcome_email_hook(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.setup_welcome_email_hook(text, text, text) TO service_role;

COMMENT ON FUNCTION public.setup_welcome_email_hook IS
  'Enregistre les secrets pour le trigger welcome (appeler une fois avec JWT service_role).';

CREATE OR REPLACE FUNCTION public.trigger_welcome_email_on_email_confirmed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = private, public, net
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

  SELECT
    c.supabase_url,
    c.service_role_key,
    c.edge_internal_secret
  INTO v_supabase_url, v_service_key, v_internal_secret
  FROM private.welcome_email_hook_config c
  WHERE c.id = 1;

  IF v_supabase_url IS NULL OR v_service_key IS NULL THEN
    v_supabase_url := nullif(trim(current_setting('app.settings.supabase_url', true)), '');
    v_service_key := nullif(trim(current_setting('app.settings.service_role_key', true)), '');
    v_internal_secret := nullif(trim(current_setting('app.settings.edge_internal_secret', true)), '');
  END IF;

  IF v_supabase_url IS NULL OR v_service_key IS NULL THEN
    RAISE WARNING
      'Welcome email skipped for user %: run SELECT public.setup_welcome_email_hook(''eyJ...'', ''optional-secret'');',
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
