-- Script pour corriger le store_id des produits orphelins
-- À exécuter dans Supabase SQL Editor

-- 1. Voir les produits sans store_id ou avec un mauvais store_id
SELECT id, name, store_id, created_at 
FROM products 
WHERE store_id IS NULL OR store_id NOT IN (SELECT id FROM stores);

-- 2. Mettre à jour tous les produits pour les associer au store de l'utilisateur actuel
-- Remplacez 'YOUR_USER_ID' par votre vrai user_id
UPDATE products 
SET store_id = (
  SELECT id FROM stores WHERE user_id = 'cd50a4d0-6c7f-405a-b0ed-2ac5f12c33cc' LIMIT 1
)
WHERE store_id IS NULL OR store_id NOT IN (SELECT id FROM stores);

-- 3. Vérifier que la mise à jour a fonctionné
SELECT id, name, store_id, created_at 
FROM products;

