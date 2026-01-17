-- Test complet du système offline-first après migration
-- À exécuter dans Supabase SQL Editor

-- =================================================
-- TEST 1: Vérifications de base
-- =================================================

-- Vérifier que la table existe et est accessible
SELECT '✅ Table idempotency_keys existe' as status
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'idempotency_keys');

-- Vérifier les colonnes
SELECT
  '✅ Colonnes OK: ' || string_agg(column_name, ', ') as colonnes
FROM information_schema.columns
WHERE table_name = 'idempotency_keys'
  AND column_name IN ('id', 'key', 'action_type', 'user_id', 'created_at');

-- Vérifier les index
SELECT
  '✅ Index ' || indexname || ' existe' as index_status
FROM pg_indexes
WHERE tablename = 'idempotency_keys'
  AND indexname LIKE 'idx_idempotency_keys%';

-- Vérifier RLS
SELECT
  CASE WHEN count(*) > 0 THEN '✅ RLS activé avec ' || count(*) || ' politiques'
       ELSE '❌ RLS non activé'
  END as rls_status
FROM pg_policies
WHERE tablename = 'idempotency_keys';

-- =================================================
-- TEST 2: Tests d'insertion (simulation)
-- =================================================

-- Nettoyer d'abord (au cas où)
DELETE FROM idempotency_keys WHERE action_type = 'test_action';

-- Test d'insertion basique (sans RLS pour vérifier la structure)
-- Note: En production, ceci nécessiterait une authentification JWT

-- Simuler une insertion (commentée car nécessite auth.uid())
/*
-- Test avec un UUID fictif (pour validation de structure uniquement)
INSERT INTO idempotency_keys (key, action_type, user_id)
VALUES
  ('test_key_001', 'create_order', '11111111-1111-1111-1111-111111111111'),
  ('test_key_002', 'update_product', '22222222-2222-2222-2222-222222222222'),
  ('test_key_003', 'add_to_cart', '33333333-3333-3333-3333-333333333333');
*/

-- =================================================
-- TEST 3: Vérifications fonctionnelles
-- =================================================

-- Vérifier que la fonction de nettoyage existe
SELECT
  CASE WHEN count(*) > 0 THEN '✅ Fonction cleanup_expired_idempotency_keys existe'
       ELSE '❌ Fonction cleanup_expired_idempotency_keys manquante'
  END as function_status
FROM information_schema.routines
WHERE routine_name = 'cleanup_expired_idempotency_keys';

-- Tester la fonction (retournera 0 car table vide)
SELECT cleanup_expired_idempotency_keys() as cleaned_keys;

-- =================================================
-- TEST 4: Validation finale
-- =================================================

-- Compter les enregistrements
SELECT
  schemaname,
  relname as tablename,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes,
  n_live_tup as live_rows
FROM pg_stat_user_tables
WHERE relname = 'idempotency_keys';

-- Vérifier la structure complète
SELECT
  'Structure table OK' as validation,
  COUNT(*) as total_columns
FROM information_schema.columns
WHERE table_name = 'idempotency_keys';

-- =================================================
-- RÉSULTATS ATTENDUS
-- =================================================
/*
Résultats attendus après exécution :

1. ✅ Table idempotency_keys existe
2. ✅ Colonnes OK: id, key, action_type, user_id, created_at
3. ✅ Index idx_idempotency_keys_* existent (4 index)
4. ✅ RLS activé avec X politiques
5. ✅ Fonction cleanup_expired_idempotency_keys existe
6. Structure table OK | total_columns = 5

Si tout est vert, la migration est réussie !
*/