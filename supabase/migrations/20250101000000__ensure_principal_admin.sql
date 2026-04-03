-- =====================================================
-- Ensure Principal Administrator Configuration
-- Date: 2025-01-01
-- Description: Garantit que contact@edigit-agence.com est le seul super admin
-- =====================================================

BEGIN;

-- 1. Retirer is_super_admin de tous les utilisateurs sauf contact@edigit-agence.com
UPDATE public.profiles
SET is_super_admin = false
WHERE is_super_admin = true 
  AND user_id NOT IN (
    SELECT id FROM auth.users WHERE email = 'contact@edigit-agence.com'
  );

-- 2. Définir is_super_admin = true uniquement pour contact@edigit-agence.com
UPDATE public.profiles
SET is_super_admin = true,
    role = 'admin'
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'contact@edigit-agence.com'
);

-- 3. S'assurer que contact@edigit-agence.com a le rôle admin dans user_roles
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'contact@edigit-agence.com';

  IF admin_user_id IS NOT NULL THEN
    -- S'assurer qu'il a le rôle admin dans user_roles
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Principal admin configured: contact@edigit-agence.com';
  ELSE
    RAISE NOTICE 'Warning: contact@edigit-agence.com not found in auth.users. User must signup first.';
  END IF;
END $$;

-- 4. Créer/améliorer le trigger pour définir is_super_admin lors de la création
CREATE OR REPLACE FUNCTION public.assign_admin_to_first_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Si c'est l'email admin principal, attribuer automatiquement le rôle admin et is_super_admin
  IF NEW.email = 'contact@edigit-agence.com' THEN
    -- Attribuer le rôle admin dans user_roles
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Mettre à jour le profil pour définir is_super_admin et role
    UPDATE public.profiles
    SET is_super_admin = true,
        role = 'admin'
    WHERE user_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recréer le trigger
DROP TRIGGER IF EXISTS on_auth_user_created_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW
  WHEN (NEW.email = 'contact@edigit-agence.com')
  EXECUTE FUNCTION public.assign_admin_to_first_user();

COMMIT;

COMMENT ON FUNCTION public.assign_admin_to_first_user() IS 'Auto-assigns admin role and super_admin flag to contact@edigit-agence.com';

