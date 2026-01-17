-- Script de test pour la migration offline-first corrigée
-- À exécuter dans Supabase SQL Editor pour valider la migration

-- =================================================
-- ÉTAPE 1: Exécuter la migration corrigée
-- =================================================

-- La migration devrait maintenant fonctionner sans erreur
-- Elle crée la table idempotency_keys avec tous les index et politiques RLS

-- =================================================
-- ÉTAPE 2: Vérifications post-migration
-- =================================================

-- Vérifier que la table existe
SELECT
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE tablename = 'idempotency_keys';

-- Vérifier les colonnes
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'idempotency_keys'
ORDER BY ordinal_position;

-- Vérifier les index
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'idempotency_keys';

-- Vérifier les politiques RLS
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'idempotency_keys';

-- =================================================
-- ÉTAPE 3: Tests fonctionnels
-- =================================================

-- Tester l'insertion (devrait réussir pour un utilisateur authentifié)
-- INSERT INTO idempotency_keys (key, action_type, user_id)
-- VALUES ('test_key_' || gen_random_uuid(), 'test_action', auth.uid());

-- Tester la fonction de nettoyage
SELECT cleanup_expired_idempotency_keys();

-- Vérifier que tout fonctionne
SELECT COUNT(*) as total_keys FROM idempotency_keys;