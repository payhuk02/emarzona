-- Script de diagnostic pour identifier l'erreur tier_type
-- À exécuter dans Supabase SQL Editor pour trouver la ligne exacte de l'erreur

-- Test 1: Vérifier si le type existe
SELECT EXISTS (
  SELECT 1 FROM pg_type WHERE typname = 'loyalty_tier_type'
) AS type_exists;

-- Test 2: Vérifier si la table existe
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'loyalty_tiers'
) AS table_exists;

-- Test 3: Vérifier si la colonne tier_type existe dans loyalty_tiers
SELECT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_schema = 'public' 
  AND table_name = 'loyalty_tiers'
  AND column_name = 'tier_type'
) AS column_exists;

-- Test 4: Lister toutes les tables avec tier_type dans leur nom
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE column_name LIKE '%tier%'
AND table_schema = 'public';

