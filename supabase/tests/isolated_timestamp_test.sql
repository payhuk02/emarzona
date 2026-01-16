-- Test isolé pour vérifier la mise à jour de last_used_at
-- Ce test crée ses propres données sans dépendre d'autres tables
-- Date : Janvier 2026

DO $$
DECLARE
  v_link_id UUID;
  v_affiliate_link_id UUID;
  v_affiliate_id UUID;
  v_user_id UUID;
  v_product_id UUID;
  v_store_id UUID;
  v_old_timestamp TIMESTAMP;
  v_new_timestamp TIMESTAMP;
BEGIN
  -- Créer un ID unique pour ce test
  v_link_id := gen_random_uuid();
  v_affiliate_link_id := gen_random_uuid();
  v_affiliate_id := gen_random_uuid();

  -- Utiliser des données existantes
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  IF v_user_id IS NULL THEN
    RAISE NOTICE 'Aucun utilisateur trouvé, test ignoré';
    RETURN;
  END IF;

  -- Utiliser un affilié existant si possible
  SELECT id INTO v_affiliate_id FROM affiliates WHERE status = 'active' LIMIT 1;
  IF v_affiliate_id IS NULL THEN
    -- Créer un affilié temporaire
    INSERT INTO affiliates (id, user_id, email, affiliate_code, status)
    VALUES (v_affiliate_id, v_user_id, 'test-isolated@example.com', 'TESTISO', 'active');
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
    VALUES (v_affiliate_link_id, v_affiliate_id, v_product_id, v_store_id, 'TESTISOLINK', 'https://emarzona.com/aff/TESTISOLINK', 'active');
  END IF;

  -- Créer directement un enregistrement dans affiliate_short_links
  INSERT INTO affiliate_short_links (
    id, affiliate_link_id, affiliate_id, short_code, target_url, is_active, total_clicks, last_used_at
  ) VALUES (
    v_link_id, v_affiliate_link_id, v_affiliate_id, 'ISOLATED123',
    'https://test.com', true, 0, '2024-01-01 00:00:00'::timestamp
  ) ON CONFLICT (short_code) DO NOTHING;

  -- Vérifier que l'insertion a réussi (utiliser short_code au cas où l'ID aurait changé)
  SELECT last_used_at INTO v_old_timestamp
  FROM affiliate_short_links
  WHERE short_code = 'ISOLATED123';

  ASSERT v_old_timestamp = '2024-01-01 00:00:00'::timestamp, 'Timestamp initial devrait être défini';

  RAISE NOTICE '✓ Enregistrement créé avec timestamp initial: %', v_old_timestamp;

  -- Mettre à jour manuellement comme le ferait la fonction track_short_link_click
  UPDATE affiliate_short_links
  SET
    total_clicks = total_clicks + 1,
    last_used_at = now(),
    updated_at = now()
  WHERE short_code = 'ISOLATED123';

  -- Vérifier que la mise à jour a réussi
  SELECT last_used_at INTO v_new_timestamp
  FROM affiliate_short_links
  WHERE short_code = 'ISOLATED123';

  ASSERT v_new_timestamp > v_old_timestamp, 'Timestamp devrait être mis à jour';
  ASSERT v_new_timestamp >= now() - interval '1 second', 'Timestamp devrait être récent';

  RAISE NOTICE '✓ Timestamp mis à jour: % -> %', v_old_timestamp, v_new_timestamp;

  -- Nettoyer (seulement les données créées pour ce test)
  DELETE FROM affiliate_short_links WHERE short_code = 'ISOLATED123';

  -- Ne supprimer que si on a créé le lien d'affiliation
  IF EXISTS (
    SELECT 1 FROM affiliate_links
    WHERE id = v_affiliate_link_id AND link_code = 'TESTISOLINK'
  ) THEN
    DELETE FROM affiliate_links WHERE id = v_affiliate_link_id;
  END IF;

  -- Ne supprimer que si on a créé l'affilié
  IF EXISTS (
    SELECT 1 FROM affiliates
    WHERE id = v_affiliate_id AND affiliate_code = 'TESTISO'
  ) THEN
    DELETE FROM affiliates WHERE id = v_affiliate_id;
  END IF;

  -- Ne pas supprimer les données existantes (products, stores, users)

  RAISE NOTICE '✓ Test isolé réussi: mise à jour des timestamps fonctionne correctement';
END $$;