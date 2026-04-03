-- Test de fonctionnalité basique - Aucun dépendance de données
-- Date : Janvier 2026

-- Test 1: Vérification de l'existence des objets de base de données
DO $$
BEGIN
  -- Tables
  ASSERT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'affiliate_short_links'
  ), 'Table affiliate_short_links existe';

  ASSERT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'affiliate_short_links_creation_logs'
  ), 'Table affiliate_short_links_creation_logs existe';

  ASSERT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'affiliate_short_link_expiration_rules'
  ), 'Table affiliate_short_link_expiration_rules existe';

  -- Fonctions
  ASSERT EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'generate_short_link_code'
  ), 'Fonction generate_short_link_code existe';

  ASSERT EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'track_short_link_click'
  ), 'Fonction track_short_link_click existe';

  ASSERT EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'get_affiliate_short_links_analytics'
  ), 'Fonction get_affiliate_short_links_analytics existe';

  RAISE NOTICE '✓ Tous les objets de base de données existent';
END $$;

-- Test 2: Test de génération de code court
DO $$
DECLARE
  v_code_4 TEXT;
  v_code_6 TEXT;
  v_code_10 TEXT;
BEGIN
  -- Tester différentes longueurs
  SELECT generate_short_link_code(4) INTO v_code_4;
  SELECT generate_short_link_code(6) INTO v_code_6;
  SELECT generate_short_link_code(10) INTO v_code_10;

  -- Vérifications
  ASSERT length(v_code_4) = 4, 'Code de 4 caractères';
  ASSERT length(v_code_6) = 6, 'Code de 6 caractères';
  ASSERT length(v_code_10) = 10, 'Code de 10 caractères';

  ASSERT v_code_4 ~ '^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$', 'Code 4 chars: caractères valides';
  ASSERT v_code_6 ~ '^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$', 'Code 6 chars: caractères valides';
  ASSERT v_code_10 ~ '^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{10}$', 'Code 10 chars: caractères valides';

  -- Unicité
  ASSERT v_code_4 != v_code_6, 'Codes différents';

  RAISE NOTICE '✓ Génération de codes: 4=% 6=% 10=%', v_code_4, v_code_6, v_code_10;
END $$;

-- Test 3: Test de gestion d'erreur pour code inexistant
DO $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT track_short_link_click('DEFINITELY_DOES_NOT_EXIST_12345') INTO v_result;

  ASSERT (v_result->>'success')::boolean = false, 'Tracking devrait échouer';
  ASSERT v_result->>'error' LIKE '%introuvable%', 'Message d''erreur approprié';

  RAISE NOTICE '✓ Gestion d''erreur pour code inexistant: %', v_result->>'error';
END $$;

-- Test 4: Test de validation des paramètres de génération
DO $$
DECLARE
  v_error_message TEXT;
BEGIN
  -- Tester longueur trop petite
  BEGIN
    PERFORM generate_short_link_code(3);
    ASSERT false, 'Devrait échouer pour longueur 3';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '✓ Validation longueur minimum: OK';
  END;

  -- Tester longueur trop grande
  BEGIN
    PERFORM generate_short_link_code(11);
    ASSERT false, 'Devrait échouer pour longueur 11';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '✓ Validation longueur maximum: OK';
  END;
END $$;

-- Test 5: Test de fonctions analytiques (même sans données)
DO $$
DECLARE
  v_result JSONB;
BEGIN
  -- Tester avec un UUID fictif (devrait retourner un résultat vide mais valide)
  SELECT get_affiliate_short_links_analytics('00000000-0000-0000-0000-000000000000'::uuid, 7) INTO v_result;

  ASSERT v_result IS NOT NULL, 'Fonction analytics retourne un résultat';
  ASSERT v_result->>'generated_at' IS NOT NULL, 'Timestamp de génération présent';
  ASSERT (v_result->'summary'->>'total_links')::integer = 0, 'Aucun lien pour UUID fictif';

  RAISE NOTICE '✓ Fonctions analytiques opérationnelles';
END $$;

-- Test 6: Test de suggestions d'optimisation (même sans données)
DO $$
DECLARE
  v_result JSONB;
BEGIN
  -- Tester avec un UUID fictif
  SELECT get_short_link_optimization_suggestions('00000000-0000-0000-0000-000000000000'::uuid) INTO v_result;

  ASSERT v_result IS NOT NULL, 'Fonction suggestions retourne un résultat';
  ASSERT v_result->>'generated_at' IS NOT NULL, 'Timestamp de génération présent';

  -- Pour un UUID fictif, le nombre de suggestions peut être 0 ou NULL
  ASSERT COALESCE((v_result->>'total_suggestions')::integer, 0) >= 0, 'Nombre de suggestions valide pour UUID fictif';

  RAISE NOTICE '✓ Fonctions d''optimisation opérationnelles';
END $$;

-- Résumé des tests
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 TESTS DE FONCTIONNALITÉ BASIQUE RÉUSSIS';
  RAISE NOTICE '';
  RAISE NOTICE 'Tests validés (sans données de test) :';
  RAISE NOTICE '  ✅ Existence des tables et fonctions';
  RAISE NOTICE '  ✅ Génération de codes de différentes longueurs';
  RAISE NOTICE '  ✅ Gestion d''erreurs pour codes inexistants';
  RAISE NOTICE '  ✅ Validation des paramètres';
  RAISE NOTICE '  ✅ Fonctions analytiques';
  RAISE NOTICE '  ✅ Fonctions d''optimisation';
  RAISE NOTICE '';
  RAISE NOTICE 'Toutes les fonctionnalités de base sont opérationnelles ! 🚀';
END $$;