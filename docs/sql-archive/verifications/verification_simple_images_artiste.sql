-- ============================================================
-- VÉRIFICATION SIMPLE - IMAGES ARTISTE
-- Date : 28 Janvier 2025
-- 
-- Version simplifiée sans UNION ALL pour éviter les erreurs de syntaxe
-- ============================================================

-- 1. Vérifier la structure de la table
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'artist_products'
  AND column_name IN ('artist_photo_url', 'artwork_link_url')
ORDER BY column_name;

-- 2. Vérifier les produits artiste avec leurs images
SELECT 
  p.id as product_id,
  p.name as product_name,
  p.image_url as product_image_url,
  p.images as product_images,
  CASE 
    WHEN p.images IS NOT NULL THEN jsonb_array_length(p.images::jsonb)
    ELSE 0
  END as images_count,
  ap.id as artist_product_id,
  ap.artist_name,
  ap.artwork_title,
  ap.artist_photo_url,
  CASE 
    WHEN ap.artist_photo_url IS NOT NULL THEN '✅ Photo présente'
    ELSE '❌ Photo manquante'
  END as photo_status,
  CASE 
    WHEN p.images IS NOT NULL AND jsonb_array_length(p.images::jsonb) > 0 THEN 
      '✅ Images présentes (' || jsonb_array_length(p.images::jsonb) || ')'
    ELSE '❌ Images manquantes'
  END as images_status,
  p.created_at
FROM products p
INNER JOIN artist_products ap ON ap.product_id = p.id
WHERE p.product_type = 'artist'
ORDER BY p.created_at DESC
LIMIT 10;

-- 3. Compter les produits avec/sans photo artiste
SELECT 
  COUNT(*) FILTER (WHERE ap.artist_photo_url IS NOT NULL) as avec_photo,
  COUNT(*) FILTER (WHERE ap.artist_photo_url IS NULL) as sans_photo,
  COUNT(*) as total
FROM artist_products ap;

-- 4. Compter les produits avec/sans images œuvre
SELECT 
  COUNT(*) FILTER (WHERE p.images IS NOT NULL AND jsonb_array_length(p.images::jsonb) > 0) as avec_images,
  COUNT(*) FILTER (WHERE p.images IS NULL OR jsonb_array_length(p.images::jsonb) = 0) as sans_images,
  COUNT(*) as total
FROM products p
INNER JOIN artist_products ap ON ap.product_id = p.id
WHERE p.product_type = 'artist';

-- 5. Vérifier les URLs valides (format Supabase Storage)
SELECT 
  ap.id,
  ap.artist_name,
  ap.artwork_title,
  ap.artist_photo_url,
  CASE 
    WHEN ap.artist_photo_url LIKE '%supabase.co/storage/v1/object/public/product-images/%' THEN '✅ Format valide'
    WHEN ap.artist_photo_url LIKE '%supabase.co/storage/v1/object/sign/product-images/%' THEN '✅ Format signé'
    WHEN ap.artist_photo_url IS NULL THEN '⚠️ NULL'
    ELSE '❌ Format suspect'
  END as photo_url_status,
  p.images,
  CASE 
    WHEN p.images IS NOT NULL THEN 
      jsonb_array_length(p.images::jsonb) || ' image(s)'
    ELSE '0 image'
  END as images_count
FROM artist_products ap
INNER JOIN products p ON p.id = ap.product_id
WHERE p.product_type = 'artist'
ORDER BY ap.created_at DESC
LIMIT 20;

-- 6. Dernier produit créé (détails complets)
SELECT 
  p.id,
  p.name,
  p.image_url,
  p.images,
  jsonb_array_length(p.images::jsonb) as images_count,
  ap.artist_name,
  ap.artwork_title,
  ap.artist_photo_url,
  CASE 
    WHEN ap.artist_photo_url IS NOT NULL AND p.images IS NOT NULL AND jsonb_array_length(p.images::jsonb) > 0 
    THEN '✅ TOUTES LES IMAGES SAUVEGARDÉES'
    WHEN ap.artist_photo_url IS NULL AND (p.images IS NULL OR jsonb_array_length(p.images::jsonb) = 0)
    THEN '❌ AUCUNE IMAGE SAUVEGARDÉE (normal si aucun produit créé)'
    WHEN ap.artist_photo_url IS NULL
    THEN '⚠️ Photo artiste manquante'
    WHEN p.images IS NULL OR jsonb_array_length(p.images::jsonb) = 0
    THEN '⚠️ Images œuvre manquantes'
    ELSE '⚠️ Statut partiel'
  END as statut_final,
  p.created_at
FROM products p
INNER JOIN artist_products ap ON ap.product_id = p.id
WHERE p.product_type = 'artist'
ORDER BY p.created_at DESC
LIMIT 1;

