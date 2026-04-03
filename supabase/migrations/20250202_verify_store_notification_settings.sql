-- Script de vérification: Vérifier que les policies RLS sont correctement configurées
-- Date: 2025-02-02

-- Vérifier que la table existe
SELECT 
  table_name,
  table_schema
FROM information_schema.tables 
WHERE table_name = 'store_notification_settings' 
  AND table_schema = 'public';

-- Vérifier les policies RLS existantes
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'store_notification_settings'
ORDER BY policyname;

-- Vérifier que la fonction helper existe
SELECT 
  routine_name,
  routine_type,
  routine_schema
FROM information_schema.routines
WHERE routine_name = 'get_or_create_store_notification_settings'
  AND routine_schema = 'public';

