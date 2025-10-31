-- =====================================================
-- Script de Vérification - Administrateur Principal
-- Description: Vérifie que contact@edigit-agence.com est le seul super admin
-- =====================================================

-- 1. Vérifier tous les utilisateurs avec is_super_admin = true
SELECT 
  u.email,
  u.id,
  p.is_super_admin,
  p.role,
  p.display_name,
  u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE p.is_super_admin = true
ORDER BY u.created_at;

-- 2. Vérifier tous les utilisateurs avec le rôle admin
SELECT 
  u.email,
  u.id,
  ur.role,
  p.is_super_admin,
  p.display_name,
  u.created_at
FROM auth.users u
JOIN public.user_roles ur ON ur.user_id = u.id
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE ur.role = 'admin'
ORDER BY u.created_at;

-- 3. Vérifier spécifiquement contact@edigit-agence.com
SELECT 
  u.email,
  u.id,
  p.is_super_admin,
  p.role,
  p.display_name,
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = u.id AND ur.role = 'admin'
  ) as has_admin_role,
  u.created_at,
  u.email_confirmed_at,
  u.last_sign_in_at
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE u.email = 'contact@edigit-agence.com';

-- 4. Compte des admins
SELECT 
  COUNT(DISTINCT u.id) FILTER (WHERE p.is_super_admin = true) as super_admin_count,
  COUNT(DISTINCT ur.user_id) FILTER (WHERE ur.role = 'admin') as admin_role_count,
  COUNT(DISTINCT u.id) FILTER (WHERE u.email = 'contact@edigit-agence.com') as principal_admin_exists
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
LEFT JOIN public.user_roles ur ON ur.user_id = u.id;

-- 5. Liste de tous les emails qui ont des privilèges admin (pour audit)
SELECT DISTINCT
  u.email,
  CASE 
    WHEN p.is_super_admin = true THEN 'SUPER_ADMIN'
    WHEN ur.role = 'admin' THEN 'ADMIN'
    ELSE 'NONE'
  END as privilege_level,
  CASE 
    WHEN p.is_super_admin = true THEN 1
    WHEN ur.role = 'admin' THEN 2
    ELSE 3
  END as sort_order,
  p.role as profile_role,
  u.created_at,
  u.email_confirmed_at IS NOT NULL as email_verified
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
LEFT JOIN public.user_roles ur ON ur.user_id = u.id AND ur.role = 'admin'
WHERE p.is_super_admin = true OR ur.role = 'admin'
ORDER BY 
  sort_order,
  u.created_at;

