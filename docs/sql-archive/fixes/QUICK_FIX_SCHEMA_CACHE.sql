-- ============================================================
-- CORRECTION RAPIDE - Cache de schéma Supabase
-- Payhuk - Projet: hbdnzajbyjakdhuavrvb
-- ============================================================

-- Forcer la mise à jour du cache de schéma PostgREST
SELECT pg_notify('pgrst', 'reload schema');

-- Attendre un moment pour que le cache se mette à jour
SELECT pg_sleep(2);

-- Vérifier la structure de la table profiles
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Vérifier les politiques RLS
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles' 
ORDER BY policyname;

-- Test de création d'un profil de test
INSERT INTO public.profiles (
    user_id,
    display_name,
    first_name,
    last_name,
    bio,
    phone,
    location,
    website
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Test User Payhuk',
    'Test',
    'User',
    'Profil de test pour vérification',
    '+226 70 12 34 56',
    'Ouagadougou, Burkina Faso',
    'https://test.example.com'
) ON CONFLICT (user_id) DO NOTHING;

-- Vérifier que le profil a été créé
SELECT * FROM public.profiles 
WHERE user_id = '00000000-0000-0000-0000-000000000001';

-- Nettoyer le profil de test
DELETE FROM public.profiles 
WHERE user_id = '00000000-0000-0000-0000-000000000001';

-- Message de confirmation
SELECT 'Cache de schéma mis à jour avec succès !' as message;
