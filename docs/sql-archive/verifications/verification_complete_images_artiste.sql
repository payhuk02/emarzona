-- ============================================================
-- VÉRIFICATION COMPLÈTE - IMAGES ARTISTE
-- Date : 28 Janvier 2025
-- 
-- Script complet pour vérifier que les images sont bien sauvegardées
-- ============================================================

-- ============================================================
-- 1. VÉRIFICATION STRUCTURE BASE DE DONNÉES
-- ============================================================

-- Vérifier que les colonnes existent
SELECT 
  'products' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'products'
  AND column_name IN ('image_url', 'images')
UNION ALL
SELECT 
  'artist_products' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'artist_products'
  AND column_name IN ('artist_photo_url', 'artwork_link_url')
ORDER BY table_name, column_name;

-- ============================================================
-- 2. RAPPORT COMPLET PRODUITS ARTISTE
-- ============================================================

SELECT 
  p.id as product_id,
  p.name as product_name,
  p.slug,
  p.product_type,
  p.is_active,
  p.is_draft,
  
  -- Images œuvre
  p.image_url as product_image_url,
  p.images as product_images,
  CASE 
    WHEN p.images IS NOT NULL THEN jsonb_array_length(p.images::jsonb)
    ELSE 0
  END as images_count,
  CASE 
    WHEN p.image_url IS NOT NULL THEN '✅ Image principale présente'
    ELSE '❌ Image principale manquante'
  END as image_url_status,
  CASE 
    WHEN p.images IS NOT NULL AND jsonb_array_length(p.images::jsonb) > 0 THEN 
      '✅ ' || jsonb_array_length(p.images::jsonb) || ' image(s) œuvre'
    ELSE '❌ Aucune image œuvre'
  END as images_status,
  
  -- Photo artiste
  ap.id as artist_product_id,
  ap.artist_name,
  ap.artwork_title,
  ap.artist_photo_url,
  CASE 
    WHEN ap.artist_photo_url IS NOT NULL THEN '✅ Photo artiste présente'
    ELSE '❌ Photo artiste manquante'
  END as photo_status,
  
  -- Format URLs
  CASE 
    WHEN ap.artist_photo_url LIKE '%supabase.co/storage/v1/object/public/product-images/%' THEN '✅ Format public valide'
    WHEN ap.artist_photo_url LIKE '%supabase.co/storage/v1/object/sign/product-images/%' THEN '✅ Format signé valide'
    WHEN ap.artist_photo_url IS NULL THEN '⚠️ NULL'
    ELSE '❌ Format suspect'
  END as photo_url_format,
  
  -- Dates
  p.created_at,
  p.updated_at,
  ap.created_at as artist_product_created_at
  
FROM products p
INNER JOIN artist_products ap ON ap.product_id = p.id
WHERE p.product_type = 'artist'
ORDER BY p.created_at DESC;

-- ============================================================
-- 3. STATISTIQUES GLOBALES
-- ============================================================

SELECT 
  COUNT(*) as total_products,
  COUNT(*) FILTER (WHERE p.is_active = true AND p.is_draft = false) as produits_actifs,
  COUNT(*) FILTER (WHERE ap.artist_photo_url IS NOT NULL) as avec_photo_artiste,
  COUNT(*) FILTER (WHERE ap.artist_photo_url IS NULL) as sans_photo_artiste,
  COUNT(*) FILTER (WHERE p.images IS NOT NULL AND jsonb_array_length(p.images::jsonb) > 0) as avec_images_oeuvre,
  COUNT(*) FILTER (WHERE p.images IS NULL OR jsonb_array_length(p.images::jsonb) = 0) as sans_images_oeuvre,
  COUNT(*) FILTER (WHERE p.image_url IS NOT NULL) as avec_image_principale,
  COUNT(*) FILTER (WHERE p.image_url IS NULL) as sans_image_principale
FROM products p
INNER JOIN artist_products ap ON ap.product_id = p.id
WHERE p.product_type = 'artist';

-- ============================================================
-- 4. PRODUITS RÉCENTS (DERNIÈRES 24H)
-- ============================================================

SELECT 
  p.id,
  p.name,
  ap.artist_name,
  ap.artwork_title,
  ap.artist_photo_url IS NOT NULL as has_photo,
  p.images IS NOT NULL AND jsonb_array_length(p.images::jsonb) > 0 as has_images,
  CASE 
    WHEN p.images IS NOT NULL THEN jsonb_array_length(p.images::jsonb)
    ELSE 0
  END as images_count,
  p.created_at,
  EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 3600 as heures_ecoulees
FROM products p
INNER JOIN artist_products ap ON ap.product_id = p.id
WHERE p.product_type = 'artist'
  AND p.created_at >= NOW() - INTERVAL '24 hours'
ORDER BY p.created_at DESC;

-- ============================================================
-- 5. VÉRIFICATION DÉTAILLÉE DU DERNIER PRODUIT
-- ============================================================

-- Note: Utilisation d'une CTE (Common Table Expression) pour éviter ORDER BY dans chaque UNION
WITH dernier_produit AS (
  SELECT 
    p.id,
    p.name,
    p.image_url,
    p.images,
    ap.artist_photo_url,
    p.created_at
  FROM products p
  INNER JOIN artist_products ap ON ap.product_id = p.id
  WHERE p.product_type = 'artist'
  ORDER BY p.created_at DESC
  LIMIT 1
)
SELECT 
  '=== PRODUIT ===' as section,
  id::text as valeur,
  'ID Produit' as description
FROM dernier_produit

UNION ALL

SELECT 
  '=== PRODUIT ===',
  name,
  'Nom'
FROM dernier_produit

UNION ALL

SELECT 
  '=== IMAGES ŒUVRE ===',
  COALESCE(image_url, 'NULL'),
  'Image principale (image_url)'
FROM dernier_produit

UNION ALL

SELECT 
  '=== IMAGES ŒUVRE ===',
  COALESCE(images::text, 'NULL'),
  'Toutes les images (images)'
FROM dernier_produit

UNION ALL

SELECT 
  '=== PHOTO ARTISTE ===',
  COALESCE(artist_photo_url, 'NULL'),
  'Photo artiste (artist_photo_url)'
FROM dernier_produit

UNION ALL

SELECT 
  '=== STATUT ===',
  CASE 
    WHEN artist_photo_url IS NOT NULL AND images IS NOT NULL AND jsonb_array_length(images::jsonb) > 0 
    THEN '✅ TOUTES LES IMAGES SAUVEGARDÉES'
    WHEN artist_photo_url IS NULL AND (images IS NULL OR jsonb_array_length(images::jsonb) = 0)
    THEN '❌ AUCUNE IMAGE SAUVEGARDÉE (normal si aucun produit créé)'
    WHEN artist_photo_url IS NULL
    THEN '⚠️ Photo artiste manquante'
    WHEN images IS NULL OR jsonb_array_length(images::jsonb) = 0
    THEN '⚠️ Images œuvre manquantes'
    ELSE '⚠️ Statut partiel'
  END,
  'Résumé'
FROM dernier_produit;

-- ============================================================
-- 6. VÉRIFICATION FORMAT URLs
-- ============================================================

SELECT 
  ap.id,
  ap.artist_name,
  ap.artwork_title,
  ap.artist_photo_url,
  CASE 
    WHEN ap.artist_photo_url LIKE '%supabase.co/storage/v1/object/public/product-images/artist/artist-photo%' 
    THEN '✅ Format correct (photo artiste)'
    WHEN ap.artist_photo_url LIKE '%supabase.co/storage/v1/object/public/product-images/artist/artwork%' 
    THEN '⚠️ Format suspect (artwork au lieu de artist-photo)'
    WHEN ap.artist_photo_url LIKE '%supabase.co/storage/v1/object/public/product-images/%' 
    THEN '✅ Format public valide'
    WHEN ap.artist_photo_url LIKE '%supabase.co/storage/v1/object/sign/product-images/%' 
    THEN '✅ Format signé valide'
    WHEN ap.artist_photo_url IS NULL 
    THEN '⚠️ NULL'
    ELSE '❌ Format incorrect'
  END as photo_url_validation,
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
LIMIT 10;

