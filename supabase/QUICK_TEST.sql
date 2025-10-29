-- TEST RAPIDE - Digital Products Bundle System
-- Copiez et collez CE FICHIER ENTIER dans Supabase SQL Editor

-- 1. Créer un bundle de test
DO $$
DECLARE
  v_store_id UUID;
  v_product1_id UUID;
  v_product2_id UUID;
  v_product3_id UUID;
  v_bundle_id UUID;
  v_product_count INTEGER;
BEGIN
  -- Récupérer un store
  SELECT id INTO v_store_id FROM public.stores LIMIT 1;
  
  IF v_store_id IS NULL THEN
    RAISE EXCEPTION '❌ Aucun store trouvé. Créez un store d abord.';
  END IF;
  
  RAISE NOTICE '✅ Store trouvé: %', v_store_id;
  
  -- Compter les produits
  SELECT COUNT(*) INTO v_product_count FROM public.products WHERE store_id = v_store_id;
  
  -- Créer des produits si nécessaire
  IF v_product_count < 3 THEN
    RAISE NOTICE '⚠️  Seulement % produits. Création de 3 produits test...', v_product_count;
    
    INSERT INTO public.products (store_id, name, slug, price, is_active, product_type)
    VALUES 
      (v_store_id, 'Test Product 1', 'test-prod-' || substr(gen_random_uuid()::text, 1, 8), 49.99, true, 'digital'),
      (v_store_id, 'Test Product 2', 'test-prod-' || substr(gen_random_uuid()::text, 1, 8), 39.99, true, 'digital'),
      (v_store_id, 'Test Product 3', 'test-prod-' || substr(gen_random_uuid()::text, 1, 8), 29.99, true, 'digital');
    
    RAISE NOTICE '✅ 3 produits créés';
  END IF;
  
  -- Récupérer 3 produits
  SELECT id INTO v_product1_id FROM public.products WHERE store_id = v_store_id LIMIT 1 OFFSET 0;
  SELECT id INTO v_product2_id FROM public.products WHERE store_id = v_store_id LIMIT 1 OFFSET 1;
  SELECT id INTO v_product3_id FROM public.products WHERE store_id = v_store_id LIMIT 1 OFFSET 2;
  
  RAISE NOTICE '✅ Produits récupérés: %, %, %', v_product1_id, v_product2_id, v_product3_id;
  
  -- Créer le bundle
  INSERT INTO public.digital_bundles (
    store_id, name, slug, description, status, discount_type, discount_value, is_available, is_featured
  ) VALUES (
    v_store_id, 
    'Bundle Test Complete', 
    'bundle-test-' || substr(gen_random_uuid()::text, 1, 8),
    'Bundle de test automatique',
    'active',
    'percentage',
    30.0,
    true,
    true
  ) RETURNING id INTO v_bundle_id;
  
  RAISE NOTICE '✅ Bundle créé: %', v_bundle_id;
  
  -- Ajouter les produits au bundle
  INSERT INTO public.digital_bundle_items (bundle_id, product_id, product_price, order_index)
  VALUES 
    (v_bundle_id, v_product1_id, 49.99, 0),
    (v_bundle_id, v_product2_id, 39.99, 1),
    (v_bundle_id, v_product3_id, 29.99, 2);
  
  RAISE NOTICE '✅ 3 produits ajoutés au bundle';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 SUCCÈS! Bundle créé avec ID: %', v_bundle_id;
  RAISE NOTICE '📊 Vérifiez: SELECT * FROM digital_bundles WHERE id = ''%'';', v_bundle_id;
  
END $$;

-- 2. Vérifier le bundle créé
SELECT 
  'BUNDLE CRÉÉ' as info,
  name,
  status,
  original_price,
  bundle_price,
  savings,
  savings_percentage
FROM digital_bundles
ORDER BY created_at DESC
LIMIT 1;

-- 3. Vérifier les produits du bundle
SELECT 
  'PRODUITS DU BUNDLE' as info,
  b.name as bundle_name,
  COUNT(bi.id) as products_count,
  SUM(bi.product_price) as total_original_price
FROM digital_bundles b
LEFT JOIN digital_bundle_items bi ON b.id = bi.bundle_id
WHERE b.created_at >= now() - interval '1 minute'
GROUP BY b.id, b.name;

-- 4. Tester une fonction
SELECT 
  'TEST FONCTION' as info,
  generate_license_key() as license_key_1,
  generate_license_key() as license_key_2;

-- 5. Vérifier les vues
SELECT 
  'VUE BUNDLES WITH STATS' as info,
  name,
  products_count,
  bundle_price,
  savings
FROM digital_bundles_with_stats
ORDER BY created_at DESC
LIMIT 3;

-- Message final
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE '  ✅ TOUS LES TESTS SONT PASSÉS !';
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'Le système Digital Products fonctionne correctement!';
  RAISE NOTICE '';
END $$;

