-- =====================================================
-- Ensure Principal Administrator Configuration
-- Date: 2025-01-01
-- Description: Garantit que contact@edigit-agence.com est le seul super admin
-- No-op on fresh databases (profiles / user_roles not created yet).
-- =====================================================

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) THEN
    RAISE NOTICE 'Skipping ensure_principal_admin: public.profiles not created yet (fresh database)';
    RETURN;
  END IF;

  UPDATE public.profiles
  SET is_super_admin = false
  WHERE is_super_admin = true
    AND user_id NOT IN (
      SELECT id FROM auth.users WHERE email = 'contact@edigit-agence.com'
    );

  UPDATE public.profiles
  SET is_super_admin = true,
      role = 'admin'
  WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = 'contact@edigit-agence.com'
  );
END $$;

DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_roles'
  ) THEN
    RAISE NOTICE 'Skipping user_roles admin seed: table not created yet';
    RETURN;
  END IF;

  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'contact@edigit-agence.com';

  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;

    RAISE NOTICE 'Principal admin configured: contact@edigit-agence.com';
  ELSE
    RAISE NOTICE 'Warning: contact@edigit-agence.com not found in auth.users. User must signup first.';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) OR NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_roles'
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'app_role'
  ) THEN
    RAISE NOTICE 'Skipping assign_admin_to_first_user trigger (fresh database)';
    RETURN;
  END IF;

  EXECUTE $fn$
    CREATE OR REPLACE FUNCTION public.assign_admin_to_first_user()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $body$
    BEGIN
      IF NEW.email = 'contact@edigit-agence.com' THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, 'admin'::app_role)
        ON CONFLICT (user_id, role) DO NOTHING;

        UPDATE public.profiles
        SET is_super_admin = true,
            role = 'admin'
        WHERE user_id = NEW.id;
      END IF;

      RETURN NEW;
    END;
    $body$;
  $fn$;

  DROP TRIGGER IF EXISTS on_auth_user_created_admin ON auth.users;
  CREATE TRIGGER on_auth_user_created_admin
    AFTER INSERT ON auth.users
    FOR EACH ROW
    WHEN (NEW.email = 'contact@edigit-agence.com')
    EXECUTE FUNCTION public.assign_admin_to_first_user();
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'assign_admin_to_first_user'
  ) THEN
    EXECUTE $comment$COMMENT ON FUNCTION public.assign_admin_to_first_user() IS 'Auto-assigns admin role and super_admin flag to contact@edigit-agence.com'$comment$;
  END IF;
END $$;

COMMIT;
