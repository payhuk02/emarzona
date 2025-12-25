-- Script pour vérifier et corriger la fonction get_user_product_recommendations
-- Exécutez ce script dans Supabase Dashboard → SQL Editor

-- 1. Vérifier si la fonction existe
SELECT 
    p.proname AS function_name,
    pg_get_function_arguments(p.oid) AS arguments,
    pg_get_function_result(p.oid) AS return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'get_user_product_recommendations';

-- 2. Si la fonction n'existe pas ou a un problème, la recréer
-- (Le code complet se trouve dans supabase/migrations/20250131_create_product_recommendations_system.sql)

-- 3. Vérifier les permissions RLS sur les tables utilisées
-- La fonction utilise SECURITY DEFINER, donc elle devrait bypasser RLS
-- Mais vérifions que les tables existent et ont les bonnes colonnes

-- Vérifier que la table orders existe et a customer_id
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'orders'
  AND column_name IN ('customer_id', 'payment_status', 'id');

-- Vérifier que la table order_items existe
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'order_items'
  AND column_name IN ('order_id', 'product_id');

-- Vérifier que la table products existe
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'products'
  AND column_name IN ('id', 'category', 'tags', 'is_active', 'is_draft', 'purchases_count', 'rating');

-- Si les tables ou colonnes manquent, vous devrez les créer
-- Sinon, la fonction devrait fonctionner

-- 4. Test de la fonction (remplacez 'USER_ID_HERE' par un UUID valide)
-- SELECT * FROM get_user_product_recommendations('USER_ID_HERE'::UUID, 6);

-- 5. Si vous voulez désactiver temporairement les recommandations utilisateur,
-- vous pouvez modifier le composant pour ne pas appeler cette fonction
-- ou créer une fonction simplifiée qui retourne toujours un tableau vide





