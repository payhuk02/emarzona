-- Test minimal pour vérifier la mise à jour de last_used_at
-- Date : Janvier 2026

-- Test direct de la fonctionnalité de mise à jour des timestamps
DO $$
DECLARE
  v_test_link_id UUID := gen_random_uuid();
  v_affiliate_link_id UUID := gen_random_uuid();
  v_affiliate_id UUID := gen_random_uuid();
  v_user_id UUID;
  v_product_id UUID;
  v_store_id UUID;
  v_result JSONB;
  v_last_used_before TIMESTAMP;
  v_last_used_after TIMESTAMP;
BEGIN
  -- Essayer d'utiliser des données existantes
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  IF v_user_id IS NULL THEN
    -- Si aucun utilisateur n'existe, on ne peut pas faire ce test
    RAISE NOTICE 'Aucun utilisateur trouvé, test ignoré';
    RETURN;
  END IF;

  -- Utiliser un affilié existant si possible
  SELECT id INTO v_affiliate_id FROM affiliates WHERE status = 'active' LIMIT 1;
  IF v_affiliate_id IS NULL THEN
    -- Créer un affilié temporaire
    INSERT INTO affiliates (id, user_id, email, affiliate_code, status)
    VALUES (v_affiliate_id, v_user_id, 'test-timestamp@example.com', 'TESTTS', 'active');
  END IF;

  -- Utiliser un produit existant
  SELECT id INTO v_product_id FROM products LIMIT 1;
  IF v_product_id IS NULL THEN
    RAISE NOTICE 'Aucun produit trouvé, test ignoré';
    RETURN;
  END IF;

  -- Utiliser un store existant
  SELECT id INTO v_store_id FROM stores LIMIT 1;
  IF v_store_id IS NULL THEN
    RAISE NOTICE 'Aucun store trouvé, test ignoré';
    RETURN;
  END IF;

  -- Utiliser un lien d'affiliation existant ou en créer un temporaire
  SELECT id INTO v_affiliate_link_id
  FROM affiliate_links
  WHERE affiliate_id = v_affiliate_id
  LIMIT 1;

  IF v_affiliate_link_id IS NULL THEN
    INSERT INTO affiliate_links (id, affiliate_id, product_id, store_id, link_code, full_url, status)
    VALUES (v_affiliate_link_id, v_affiliate_id, v_product_id, v_store_id, 'TESTTSLINK', 'https://emarzona.com/aff/TESTTSLINK', 'active');
  END IF;

  -- Créer un lien court minimal pour le test
  INSERT INTO affiliate_short_links (
    id, affiliate_link_id, affiliate_id, short_code, target_url, is_active, total_clicks
  ) VALUES (
    v_test_link_id, v_affiliate_link_id, v_affiliate_id, 'MINIMAL123', 'https://test.com', true, 0
  ) ON CONFLICT (short_code) DO NOTHING;

  -- Récupérer l'état initial (devrait utiliser le short_code puisque l'ID pourrait changer avec ON CONFLICT)
  SELECT last_used_at INTO v_last_used_before
  FROM affiliate_short_links
  WHERE short_code = 'MINIMAL123';

  RAISE NOTICE 'État initial last_used_at: %', v_last_used_before;

  -- Tester le tracking (même si cela peut échouer à cause des contraintes de clés étrangères,
  -- cela devrait au moins mettre à jour last_used_at si le lien existe)
  BEGIN
    SELECT track_short_link_click('MINIMAL123') INTO v_result;
  EXCEPTION WHEN OTHERS THEN
    -- Ignorer les erreurs de clés étrangères pour ce test minimal
    RAISE NOTICE 'Erreur attendue (contraintes): %', SQLERRM;
  END;

  -- Vérifier que last_used_at a été mis à jour même en cas d'erreur
  SELECT last_used_at INTO v_last_used_after
  FROM affiliate_short_links
  WHERE short_code = 'MINIMAL123';

  RAISE NOTICE 'État final last_used_at: %', v_last_used_after;

  -- Le timestamp devrait avoir été mis à jour
  ASSERT v_last_used_after IS NOT NULL, 'last_used_at devrait être défini';
  ASSERT v_last_used_after >= NOW() - INTERVAL '5 seconds', 'last_used_at devrait être récent';

  -- Nettoyer (seulement les données créées pour ce test)
  DELETE FROM affiliate_short_links WHERE short_code = 'MINIMAL123';

  -- Ne supprimer que si on a créé le lien d'affiliation
  IF EXISTS (
    SELECT 1 FROM affiliate_links
    WHERE id = v_affiliate_link_id AND link_code = 'TESTTSLINK'
  ) THEN
    DELETE FROM affiliate_links WHERE id = v_affiliate_link_id;
  END IF;

  -- Ne supprimer que si on a créé l'affilié
  IF EXISTS (
    SELECT 1 FROM affiliates
    WHERE id = v_affiliate_id AND affiliate_code = 'TESTTS'
  ) THEN
    DELETE FROM affiliates WHERE id = v_affiliate_id;
  END IF;

  -- Ne pas supprimer les données existantes (products, stores, users)

  RAISE NOTICE '✓ Test minimal réussi: timestamp mis à jour correctement';
END $$;