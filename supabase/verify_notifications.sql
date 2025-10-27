-- Script de vérification du système de notifications
-- Date : 27 octobre 2025

-- 1. Vérifier les tables créées
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('notifications', 'notification_preferences')
ORDER BY table_name;

-- 2. Vérifier les fonctions créées
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'mark_notification_read',
    'mark_all_notifications_read',
    'archive_notification',
    'get_unread_count',
    'create_default_notification_preferences'
  )
ORDER BY routine_name;

-- 3. Vérifier les policies RLS
SELECT tablename, policyname, cmd
FROM pg_policies 
WHERE tablename IN ('notifications', 'notification_preferences')
ORDER BY tablename, policyname;

-- 4. Vérifier les index
SELECT 
  tablename, 
  indexname
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('notifications', 'notification_preferences')
ORDER BY tablename, indexname;

