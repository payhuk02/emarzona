-- =====================================================
-- Ensure Principal Administrator Full Access
-- Date: 2025-01-31
-- Description: Garantit que contact@edigit-agence.com a accès complet à toutes les pages admin
-- =====================================================

BEGIN;

-- 1. S'assurer que l'utilisateur a le rôle admin dans user_roles
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'contact@edigit-agence.com';

  IF admin_user_id IS NOT NULL THEN
    -- Ajouter le rôle admin dans user_roles
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- S'assurer que le profil existe et est configuré comme super admin
    INSERT INTO public.profiles (user_id, role, is_super_admin, display_name, created_at, updated_at)
    VALUES (
      admin_user_id,
      'admin',
      true,
      'Administrateur Principal',
      now(),
      now()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      role = 'admin',
      is_super_admin = true,
      updated_at = now();
    
    RAISE NOTICE 'Principal admin configured: contact@edigit-agence.com';
  ELSE
    RAISE NOTICE 'Warning: contact@edigit-agence.com not found in auth.users. User must signup first.';
  END IF;
END $$;

-- 2. Créer/améliorer le trigger pour auto-configurer l'admin principal lors de la création
CREATE OR REPLACE FUNCTION public.assign_principal_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Si c'est l'email admin principal, attribuer automatiquement tous les droits
  IF NEW.email = 'contact@edigit-agence.com' THEN
    -- Ajouter le rôle admin dans user_roles
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Créer/mettre à jour le profil avec is_super_admin = true
    INSERT INTO public.profiles (user_id, role, is_super_admin, display_name, created_at, updated_at)
    VALUES (
      NEW.id,
      'admin',
      true,
      'Administrateur Principal',
      now(),
      now()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      role = 'admin',
      is_super_admin = true,
      updated_at = now();
    
    RAISE NOTICE 'Principal admin auto-configured: %', NEW.email;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Créer le trigger pour auto-configurer l'admin principal
DROP TRIGGER IF EXISTS on_auth_user_created_principal_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_principal_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW
  WHEN (NEW.email = 'contact@edigit-agence.com')
  EXECUTE FUNCTION public.assign_principal_admin();

-- 3. S'assurer que tous les autres utilisateurs n'ont pas is_super_admin = true
-- (sauf contact@edigit-agence.com)
UPDATE public.profiles
SET is_super_admin = false
WHERE is_super_admin = true 
  AND user_id NOT IN (
    SELECT id FROM auth.users WHERE email = 'contact@edigit-agence.com'
  );

COMMIT;

