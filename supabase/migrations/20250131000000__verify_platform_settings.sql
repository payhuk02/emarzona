-- =========================================================
-- Vérification : Structure de la table platform_settings
-- Date : 31/01/2025
-- Description : Vérifie que la migration a bien fonctionné
-- =========================================================

-- 1. Vérifier la structure de la table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'platform_settings'
ORDER BY ordinal_position;

-- 2. Vérifier les contraintes
SELECT 
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public'
AND table_name = 'platform_settings';

-- 3. Vérifier les enregistrements
SELECT 
  "key",
  settings,
  updated_at
FROM public.platform_settings
ORDER BY "key";

-- 4. Vérifier que la colonne 'key' existe et est PRIMARY KEY
SELECT 
  a.attname AS column_name,
  c.conname AS constraint_name,
  c.contype AS constraint_type
FROM pg_constraint c
JOIN pg_class t ON t.oid = c.conrelid
JOIN pg_namespace n ON n.oid = t.relnamespace
JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(c.conkey)
WHERE n.nspname = 'public'
AND t.relname = 'platform_settings'
AND a.attname = 'key'
AND c.contype = 'p';

-- =========================================================
-- FIN VÉRIFICATION
-- =========================================================

