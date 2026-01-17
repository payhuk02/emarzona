-- Test simple et robuste du système offline-first
-- Compatible avec toutes les versions PostgreSQL

-- =================================================
-- VÉRIFICATIONS DE BASE
-- =================================================

-- 1. Table existe ?
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'idempotency_keys' AND table_schema = 'public') THEN
    RAISE NOTICE '✅ Table idempotency_keys existe';
  ELSE
    RAISE NOTICE '❌ Table idempotency_keys manquante';
  END IF;
END $$;

-- 2. Colonnes présentes ?
DO $$
DECLARE
  missing_columns TEXT[] := ARRAY[]::TEXT[];
  required_columns TEXT[] := ARRAY['id', 'key', 'action_type', 'user_id', 'created_at'];
BEGIN
  FOREACH col IN ARRAY required_columns LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'idempotency_keys'
        AND column_name = col
        AND table_schema = 'public'
    ) THEN
      missing_columns := array_append(missing_columns, col);
    END IF;
  END LOOP;

  IF array_length(missing_columns, 1) IS NULL THEN
    RAISE NOTICE '✅ Toutes les colonnes requises sont présentes';
  ELSE
    RAISE NOTICE '❌ Colonnes manquantes: %', array_to_string(missing_columns, ', ');
  END IF;
END $$;

-- 3. Index présents ?
DO $$
DECLARE
  expected_indexes TEXT[] := ARRAY[
    'idx_idempotency_keys_key',
    'idx_idempotency_keys_user_id',
    'idx_idempotency_keys_created_at',
    'idx_idempotency_keys_user_created'
  ];
  missing_indexes TEXT[] := ARRAY[]::TEXT[];
BEGIN
  FOREACH idx IN ARRAY expected_indexes LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE tablename = 'idempotency_keys'
        AND indexname = idx
        AND schemaname = 'public'
    ) THEN
      missing_indexes := array_append(missing_indexes, idx);
    END IF;
  END LOOP;

  IF array_length(missing_indexes, 1) IS NULL THEN
    RAISE NOTICE '✅ Tous les index sont présents';
  ELSE
    RAISE NOTICE '❌ Index manquants: %', array_to_string(missing_indexes, ', ');
  END IF;
END $$;

-- 4. RLS activé ?
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'idempotency_keys'
      AND n.nspname = 'public'
      AND c.relrowsecurity = true
  ) THEN
    RAISE NOTICE '✅ RLS est activé sur idempotency_keys';
  ELSE
    RAISE NOTICE '❌ RLS n''est pas activé sur idempotency_keys';
  END IF;
END $$;

-- 5. Politiques RLS présentes ?
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'idempotency_keys'
    AND schemaname = 'public';

  IF policy_count > 0 THEN
    RAISE NOTICE '✅ % politiques RLS définies', policy_count;
  ELSE
    RAISE NOTICE '❌ Aucune politique RLS définie';
  END IF;
END $$;

-- 6. Fonction de nettoyage existe ?
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_name = 'cleanup_expired_idempotency_keys'
      AND routine_schema = 'public'
  ) THEN
    RAISE NOTICE '✅ Fonction cleanup_expired_idempotency_keys existe';
  ELSE
    RAISE NOTICE '❌ Fonction cleanup_expired_idempotency_keys manquante';
  END IF;
END $$;

-- =================================================
-- TESTS FONCTIONNELS (COMMENTÉS - nécessitent auth)
-- =================================================

-- Test d'insertion (nécessite authentification JWT)
-- Décommentez et exécutez seulement si vous avez un JWT valide :
/*
INSERT INTO idempotency_keys (key, action_type, user_id)
VALUES ('test_key_' || gen_random_uuid(), 'test_action', auth.uid())
RETURNING id, key, action_type;
*/

-- =================================================
-- STATISTIQUES
-- =================================================

-- Nombre total d'enregistrements
SELECT
  COUNT(*) as total_keys,
  COUNT(CASE WHEN created_at > NOW() - INTERVAL '1 hour' THEN 1 END) as keys_last_hour,
  COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as keys_last_24h
FROM idempotency_keys;

-- Types d'actions présents
SELECT
  action_type,
  COUNT(*) as count
FROM idempotency_keys
GROUP BY action_type
ORDER BY count DESC;

-- =================================================
-- NETTOYAGE (optionnel)
-- =================================================

-- Nettoyer les clés expirées (plus de 24h)
-- SELECT cleanup_expired_idempotency_keys() as cleaned_count;

-- =================================================
-- RÉSULTATS ATTENDUS
-- =================================================
/*
Sortie attendue si tout fonctionne :

NOTICE:  ✅ Table idempotency_keys existe
NOTICE:  ✅ Toutes les colonnes requises sont présentes
NOTICE:  ✅ Tous les index sont présents
NOTICE:  ✅ RLS est activé sur idempotency_keys
NOTICE:  ✅ X politiques RLS définies
NOTICE:  ✅ Fonction cleanup_expired_idempotency_keys existe

total_keys | keys_last_hour | keys_last_24h
------------+----------------+---------------
          0 |              0 |             0

(1 row)
*/

-- =================================================
-- VALIDATION FINALE
-- =================================================

DO $$
DECLARE
  checks_passed INTEGER := 0;
  total_checks INTEGER := 6;
BEGIN
  -- Vérifier chaque composant
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'idempotency_keys' AND table_schema = 'public') THEN
    checks_passed := checks_passed + 1;
  END IF;

  IF (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_name = 'idempotency_keys'
      AND column_name IN ('id', 'key', 'action_type', 'user_id', 'created_at')
      AND table_schema = 'public'
  ) = 5 THEN
    checks_passed := checks_passed + 1;
  END IF;

  IF (
    SELECT COUNT(*) FROM pg_indexes
    WHERE tablename = 'idempotency_keys'
      AND indexname LIKE 'idx_idempotency_keys%'
      AND schemaname = 'public'
  ) >= 4 THEN
    checks_passed := checks_passed + 1;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'idempotency_keys'
      AND n.nspname = 'public'
      AND c.relrowsecurity = true
  ) THEN
    checks_passed := checks_passed + 1;
  END IF;

  IF (
    SELECT COUNT(*) FROM pg_policies
    WHERE tablename = 'idempotency_keys'
      AND schemaname = 'public'
  ) > 0 THEN
    checks_passed := checks_passed + 1;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_name = 'cleanup_expired_idempotency_keys'
      AND routine_schema = 'public'
  ) THEN
    checks_passed := checks_passed + 1;
  END IF;

  -- Résultat final
  RAISE NOTICE '📊 Score de validation: %/%', checks_passed, total_checks;

  IF checks_passed = total_checks THEN
    RAISE NOTICE '🎉 SUCCÈS ! Le système offline-first est correctement configuré !';
    RAISE NOTICE '🚀 Vous pouvez maintenant utiliser les endpoints API et le frontend.';
  ELSIF checks_passed >= total_checks * 0.8 THEN
    RAISE NOTICE '⚠️ PRESQUE ! Quelques éléments mineurs à vérifier.';
    RAISE NOTICE '💡 Vérifiez les index ou politiques RLS manquants.';
  ELSE
    RAISE NOTICE '❌ ÉCHEC ! Plusieurs composants sont manquants.';
    RAISE NOTICE '🔧 Ré-exécutez la migration et vérifiez les erreurs.';
  END IF;
END $$;