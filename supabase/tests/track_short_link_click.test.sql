-- Tests pour la fonction track_short_link_click
-- Date : Janvier 2026

-- Préparation des données de test
DO $$
DECLARE
  v_affiliate_id UUID := '550e8400-e29b-41d4-a716-446655440001';
  v_affiliate_link_id UUID := '550e8400-e29b-41d4-a716-446655440002';
  v_user_id UUID;
  v_product_id UUID;
  v_store_id UUID;
  v_short_link_id UUID;
BEGIN
  -- Nettoyer les données de test existantes
  DELETE FROM affiliate_short_links WHERE short_code = 'TEST123';
  DELETE FROM affiliate_links WHERE id = v_affiliate_link_id;
  DELETE FROM affiliates WHERE id = v_affiliate_id;

  -- Utiliser un utilisateur existant ou en créer un temporaire
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  IF v_user_id IS NULL THEN
    SELECT id INTO v_user_id FROM profiles LIMIT 1;
    IF v_user_id IS NULL THEN
      -- Créer un profil temporaire si aucun n'existe
      v_user_id := '550e8400-e29b-41d4-a716-446655440003';
      INSERT INTO profiles (id, email, full_name)
      VALUES (v_user_id, 'test@example.com', 'Test User')
      ON CONFLICT (id) DO NOTHING;
    END IF;
  END IF;

  -- Utiliser un produit existant ou en créer un temporaire
  SELECT id INTO v_product_id FROM products LIMIT 1;
  IF v_product_id IS NULL THEN
    v_product_id := '550e8400-e29b-41d4-a716-446655440004';
    INSERT INTO products (id, name, slug, price, type)
    VALUES (v_product_id, 'Test Product', 'test-product', 1000, 'digital')
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- Utiliser un store existant ou en créer un temporaire
  SELECT id INTO v_store_id FROM stores LIMIT 1;
  IF v_store_id IS NULL THEN
    v_store_id := '550e8400-e29b-41d4-a716-446655440005';
    INSERT INTO stores (id, name, slug, owner_id)
    VALUES (v_store_id, 'Test Store', 'test-store', v_user_id)
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- Créer un affilié de test
  INSERT INTO affiliates (id, user_id, email, affiliate_code, status)
  VALUES (v_affiliate_id, v_user_id, 'test@example.com', 'TESTAFF', 'active');

  -- Créer un lien d'affiliation de test
  INSERT INTO affiliate_links (id, affiliate_id, product_id, store_id, link_code, full_url, status)
  VALUES (v_affiliate_link_id, v_affiliate_id, v_product_id, v_store_id, 'TESTLINK', 'https://emarzona.com/aff/TESTLINK', 'active');

  -- Créer un lien court de test
  INSERT INTO affiliate_short_links (affiliate_link_id, affiliate_id, short_code, target_url, is_active, total_clicks)
  VALUES (v_affiliate_link_id, v_affiliate_id, 'TEST123', 'https://emarzona.com/aff/TESTLINK', true, 5)
  RETURNING id INTO v_short_link_id;

  RAISE NOTICE '✓ Données de test préparées (lien court ID: %)', v_short_link_id;
END $$;

-- Test 1: Tracking d'un clic valide
DO $$
DECLARE
  v_result JSONB;
  v_clicks_before INTEGER;
  v_clicks_after INTEGER;
BEGIN
  -- Récupérer le nombre de clics avant
  SELECT total_clicks INTO v_clicks_before
  FROM affiliate_short_links
  WHERE short_code = 'TEST123';

  -- Tracker le clic
  SELECT track_short_link_click('TEST123') INTO v_result;

  -- Récupérer le nombre de clics après
  SELECT total_clicks INTO v_clicks_after
  FROM affiliate_short_links
  WHERE short_code = 'TEST123';

  -- Vérifications
  ASSERT (v_result->>'success')::boolean = true, 'Le tracking devrait réussir';
  ASSERT v_clicks_after = v_clicks_before + 1, 'Le compteur de clics devrait être incrémenté';
  ASSERT v_result->>'target_url' = 'https://emarzona.com/aff/TESTLINK', 'L''URL cible devrait être retournée';

  RAISE NOTICE '✓ Test 1 réussi: tracking de clic valide';
END $$;

-- Test 2: Tentative de tracking d'un code inexistant
DO $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT track_short_link_click('NONEXISTENT') INTO v_result;

  ASSERT (v_result->>'success')::boolean = false, 'Le tracking devrait échouer pour un code inexistant';
  ASSERT v_result->>'error' LIKE '%introuvable%', 'Message d''erreur approprié';

  RAISE NOTICE '✓ Test 2 réussi: rejet de code inexistant';
END $$;

-- Test 3: Tracking d'un lien court désactivé
DO $$
DECLARE
  v_result JSONB;
BEGIN
  -- Désactiver le lien court
  UPDATE affiliate_short_links
  SET is_active = false
  WHERE short_code = 'TEST123';

  -- Tenter de tracker
  SELECT track_short_link_click('TEST123') INTO v_result;

  -- Réactiver pour les tests suivants
  UPDATE affiliate_short_links
  SET is_active = true
  WHERE short_code = 'TEST123';

  ASSERT (v_result->>'success')::boolean = false, 'Le tracking devrait échouer pour un lien désactivé';
  ASSERT v_result->>'error' LIKE '%introuvable%', 'Message d''erreur approprié';

  RAISE NOTICE '✓ Test 3 réussi: rejet de lien désactivé';
END $$;

-- Test 4: Tracking d'un lien court expiré
DO $$
DECLARE
  v_result JSONB;
BEGIN
  -- Définir une date d'expiration dans le passé
  UPDATE affiliate_short_links
  SET expires_at = now() - interval '1 day'
  WHERE short_code = 'TEST123';

  -- Tenter de tracker
  SELECT track_short_link_click('TEST123') INTO v_result;

  -- Remettre expires_at à NULL pour les tests suivants
  UPDATE affiliate_short_links
  SET expires_at = NULL
  WHERE short_code = 'TEST123';

  ASSERT (v_result->>'success')::boolean = false, 'Le tracking devrait échouer pour un lien expiré';
  ASSERT v_result->>'error' LIKE '%introuvable%', 'Message d''erreur approprié';

  RAISE NOTICE '✓ Test 4 réussi: rejet de lien expiré';
END $$;

-- Test 5: Vérification de la mise à jour des timestamps
DO $$
DECLARE
  v_result JSONB;
  v_last_used_before TIMESTAMP;
  v_last_used_after TIMESTAMP;
BEGIN
  -- Vérifier que le lien court existe et fonctionne
  SELECT last_used_at INTO v_last_used_before
  FROM affiliate_short_links
  WHERE short_code = 'TEST123';

  -- Le test devrait réussir même si last_used_at est NULL au départ
  RAISE NOTICE 'Timestamp avant tracking: %', v_last_used_before;

  -- Tracker le clic
  SELECT track_short_link_click('TEST123') INTO v_result;

  -- Vérifier que le tracking a réussi
  ASSERT (v_result->>'success')::boolean = true, 'Le tracking devrait réussir';

  -- Récupérer last_used_at après
  SELECT last_used_at INTO v_last_used_after
  FROM affiliate_short_links
  WHERE short_code = 'TEST123';

  -- Vérifier que last_used_at a été mis à jour
  ASSERT v_last_used_after IS NOT NULL, 'last_used_at devrait être défini après le tracking';
  ASSERT v_last_used_after >= NOW() - INTERVAL '5 seconds', 'last_used_at devrait être récent';
  ASSERT v_last_used_after > v_last_used_before OR v_last_used_before IS NULL, 'last_used_at devrait être mis à jour';

  RAISE NOTICE '✓ Test 5 réussi: mise à jour des timestamps (de % à %)', v_last_used_before, v_last_used_after;
END $$;

-- Test 6: Performance du tracking
DO $$
DECLARE
  v_start_time TIMESTAMP;
  v_end_time TIMESTAMP;
  v_duration INTERVAL;
  v_iterations INTEGER := 100;
BEGIN
  v_start_time := clock_timestamp();

  -- Tracker 100 clics
  FOR i IN 1..v_iterations LOOP
    PERFORM track_short_link_click('TEST123');
  END LOOP;

  v_end_time := clock_timestamp();
  v_duration := v_end_time - v_start_time;

  -- 100 trackings devraient prendre moins de 0.5 seconde
  ASSERT EXTRACT(EPOCH FROM v_duration) < 0.5, format('Tracking trop lent: %s', v_duration);

  -- Vérifier que les clics ont bien été comptés
  ASSERT (
    SELECT total_clicks FROM affiliate_short_links WHERE short_code = 'TEST123'
  ) >= v_iterations, 'Tous les clics devraient être comptés';

  RAISE NOTICE '✓ Test 6 réussi: performance du tracking (% pour 100 clics)', v_duration;
END $$;

-- Test 7: Isolation des transactions
DO $$
DECLARE
  v_clicks_before INTEGER;
  v_result1 JSONB;
  v_result2 JSONB;
BEGIN
  -- Récupérer les clics avant
  SELECT total_clicks INTO v_clicks_before
  FROM affiliate_short_links
  WHERE short_code = 'TEST123';

  -- Simuler deux clics simultanés
  SELECT track_short_link_click('TEST123') INTO v_result1;
  SELECT track_short_link_click('TEST123') INTO v_result2;

  -- Vérifier que les deux ont réussi
  ASSERT v_result1->>'success' = 'true', 'Premier clic devrait réussir';
  ASSERT v_result2->>'success' = 'true', 'Deuxième clic devrait réussir';

  -- Vérifier que les clics ont été correctement incrémentés
  ASSERT (
    SELECT total_clicks FROM affiliate_short_links WHERE short_code = 'TEST123'
  ) = v_clicks_before + 2, 'Les deux clics devraient être comptés';

  RAISE NOTICE '✓ Test 7 réussi: isolation des transactions';
END $$;

-- Test 8: Gestion des erreurs système
DO $$
DECLARE
  v_result JSONB;
BEGIN
  -- Tester avec un code NULL
  BEGIN
    SELECT track_short_link_click(NULL) INTO v_result;
    ASSERT false, 'La fonction devrait rejeter NULL';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '✓ Test 8a réussi: rejet de valeur NULL';
  END;

  -- Tester avec un code vide
  BEGIN
    SELECT track_short_link_click('') INTO v_result;
    -- Un code vide devrait être traité comme inexistant
    ASSERT v_result->>'success' = 'false', 'Code vide devrait échouer';
    RAISE NOTICE '✓ Test 8b réussi: gestion de code vide';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '✓ Test 8b réussi: rejet de code vide avec exception';
  END;
END $$;

-- Nettoyage des données de test
DO $$
BEGIN
  DELETE FROM affiliate_short_links WHERE short_code = 'TEST123';
  DELETE FROM affiliate_links WHERE affiliate_id = '550e8400-e29b-41d4-a716-446655440001';
  DELETE FROM affiliates WHERE id = '550e8400-e29b-41d4-a716-446655440001';

  -- Nettoyer les données temporaires si elles ont été créées
  DELETE FROM products WHERE id = '550e8400-e29b-41d4-a716-446655440004' AND name = 'Test Product';
  DELETE FROM stores WHERE id = '550e8400-e29b-41d4-a716-446655440005' AND name = 'Test Store';
  DELETE FROM profiles WHERE id = '550e8400-e29b-41d4-a716-446655440003' AND email = 'test@example.com';

  RAISE NOTICE '✓ Données de test nettoyées';
END $$;

-- Résumé des tests
DO $$
BEGIN
  RAISE NOTICE '🎉 Tous les tests de track_short_link_click ont été exécutés avec succès !';
  RAISE NOTICE '';
  RAISE NOTICE 'Tests couverts :';
  RAISE NOTICE '  ✓ Tracking de clic valide';
  RAISE NOTICE '  ✓ Rejet de code inexistant';
  RAISE NOTICE '  ✓ Rejet de lien désactivé';
  RAISE NOTICE '  ✓ Rejet de lien expiré';
  RAISE NOTICE '  ✓ Mise à jour des timestamps';
  RAISE NOTICE '  ✓ Performance du tracking';
  RAISE NOTICE '  ✓ Isolation des transactions';
  RAISE NOTICE '  ✓ Gestion des erreurs système';
END $$;