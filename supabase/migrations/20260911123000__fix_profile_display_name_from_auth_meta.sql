-- Fix profile names: stop seeding display_name with email; read full_name from auth metadata;
-- backfill existing profiles; expose full_name via get_users_emails for admin lists.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_meta jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  v_full_name text;
  v_display_name text;
  v_first_name text;
  v_last_name text;
BEGIN
  v_full_name := NULLIF(
    trim(
      COALESCE(
        v_meta->>'full_name',
        v_meta->>'display_name',
        v_meta->>'name',
        ''
      )
    ),
    ''
  );

  v_display_name := NULLIF(trim(COALESCE(v_meta->>'display_name', v_full_name, '')), '');

  -- Never persist the email as a display name
  IF v_display_name IS NOT NULL
     AND NEW.email IS NOT NULL
     AND lower(v_display_name) = lower(NEW.email) THEN
    v_display_name := NULL;
  END IF;
  IF v_display_name IS NOT NULL AND v_display_name LIKE '%@%' THEN
    v_display_name := NULL;
  END IF;

  v_first_name := NULLIF(trim(COALESCE(v_meta->>'first_name', '')), '');
  v_last_name := NULLIF(trim(COALESCE(v_meta->>'last_name', '')), '');

  IF v_first_name IS NULL AND v_full_name IS NOT NULL THEN
    v_first_name := split_part(v_full_name, ' ', 1);
    IF position(' ' IN v_full_name) > 0 THEN
      v_last_name := NULLIF(trim(substr(v_full_name, position(' ' IN v_full_name) + 1)), '');
    END IF;
  END IF;

  INSERT INTO public.profiles (user_id, display_name, first_name, last_name)
  VALUES (
    NEW.id,
    COALESCE(v_display_name, v_full_name),
    v_first_name,
    v_last_name
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Keep buyer role seeding when the table/constraint exists
  BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'buyer')
    ON CONFLICT DO NOTHING;
  EXCEPTION
    WHEN undefined_table THEN
      NULL;
    WHEN undefined_object THEN
      NULL;
    WHEN invalid_text_representation THEN
      NULL;
    WHEN check_violation THEN
      NULL;
  END;

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    RETURN NEW;
  WHEN undefined_column THEN
    -- Fallback if an older schema variant is present
    BEGIN
      INSERT INTO public.profiles (user_id, display_name)
      VALUES (NEW.id, COALESCE(v_display_name, v_full_name));
    EXCEPTION
      WHEN OTHERS THEN
        NULL;
    END;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Batch email lookup + auth metadata name for admin / store UIs
-- Must DROP first: return type changed (added full_name) — CREATE OR REPLACE cannot alter OUT params
DROP FUNCTION IF EXISTS public.get_users_emails(UUID[]);

CREATE OR REPLACE FUNCTION public.get_users_emails(p_user_ids UUID[])
RETURNS TABLE(user_id UUID, email TEXT, full_name TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT
    au.id AS user_id,
    au.email::text AS email,
    NULLIF(
      trim(
        COALESCE(
          au.raw_user_meta_data->>'display_name',
          au.raw_user_meta_data->>'full_name',
          au.raw_user_meta_data->>'name',
          ''
        )
      ),
      ''
    ) AS full_name
  FROM auth.users au
  WHERE au.id = ANY(p_user_ids)
    AND auth.uid() IS NOT NULL
    AND public.user_can_view_user_email(auth.uid(), au.id);
$$;

COMMENT ON FUNCTION public.get_users_emails(UUID[]) IS
  'Batch email + auth metadata name lookup filtered by user_can_view_user_email.';

GRANT EXECUTE ON FUNCTION public.get_users_emails(UUID[]) TO authenticated;

-- Backfill profiles where display_name was wrongly set to the email (or empty)
WITH src AS (
  SELECT
    au.id AS user_id,
    au.email,
    NULLIF(
      trim(
        COALESCE(
          au.raw_user_meta_data->>'display_name',
          au.raw_user_meta_data->>'full_name',
          au.raw_user_meta_data->>'name',
          ''
        )
      ),
      ''
    ) AS meta_name,
    NULLIF(trim(COALESCE(au.raw_user_meta_data->>'first_name', '')), '') AS meta_first,
    NULLIF(trim(COALESCE(au.raw_user_meta_data->>'last_name', '')), '') AS meta_last
  FROM auth.users au
),
resolved AS (
  SELECT
    s.user_id,
    CASE
      WHEN s.meta_name IS NULL THEN NULL
      WHEN s.email IS NOT NULL AND lower(s.meta_name) = lower(s.email) THEN NULL
      WHEN s.meta_name LIKE '%@%' THEN NULL
      ELSE s.meta_name
    END AS clean_name,
    s.meta_first,
    s.meta_last
  FROM src s
)
UPDATE public.profiles p
SET
  display_name = COALESCE(
    CASE
      WHEN p.display_name IS NULL OR p.display_name = '' THEN NULL
      WHEN p.display_name LIKE '%@%' THEN NULL
      ELSE p.display_name
    END,
    r.clean_name
  ),
  first_name = COALESCE(
    NULLIF(trim(p.first_name), ''),
    r.meta_first,
    CASE
      WHEN r.clean_name IS NOT NULL THEN split_part(r.clean_name, ' ', 1)
      ELSE NULL
    END
  ),
  last_name = COALESCE(
    NULLIF(trim(p.last_name), ''),
    r.meta_last,
    CASE
      WHEN r.clean_name IS NOT NULL AND position(' ' IN r.clean_name) > 0
        THEN NULLIF(trim(substr(r.clean_name, position(' ' IN r.clean_name) + 1)), '')
      ELSE NULL
    END
  ),
  updated_at = now()
FROM resolved r
WHERE p.user_id = r.user_id
  AND (
    p.display_name IS NULL
    OR p.display_name = ''
    OR p.display_name LIKE '%@%'
    OR p.first_name IS NULL
    OR trim(p.first_name) = ''
  )
  AND (
    r.clean_name IS NOT NULL
    OR r.meta_first IS NOT NULL
    OR r.meta_last IS NOT NULL
  );
