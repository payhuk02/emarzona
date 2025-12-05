-- ============================================================
-- VÉRIFICATION SIMPLE DES IMAGES ARTISTE
-- ============================================================
-- Cette requête vérifie si les images sont bien sauvegardées
-- pour les produits artistiques

-- 0. DIAGNOSTIC INITIAL : Vérifier l'existence de produits (même sans images)
SELECT 
  'DIAGNOSTIC INITIAL' as etape,
  COUNT(*) as total_produits_artistiques,
  COUNT(DISTINCT p.store_id) as nombre_boutiques
FROM products p
WHERE p.product_type = 'artist';

-- 1. Vérifier si des produits artistiques existent
SELECT 
  'Produits artistiques totaux' as type_verification,
  COUNT(*) as nombre
FROM products
WHERE product_type = 'artist';

-- 2. Vérifier les produits avec leurs images
SELECT 
  p.id,
  p.name,
  p.image_url as image_principale,
  CASE 
    WHEN p.images IS NULL THEN 'NULL'
    WHEN jsonb_typeof(p.images::jsonb) = 'array' THEN jsonb_array_length(p.images::jsonb)::text
    ELSE 'N/A'
  END as nombre_images,
  p.images as toutes_images,
  ap.artist_photo_url as photo_artiste,
  ap.created_at as date_creation
FROM products p
LEFT JOIN artist_products ap ON ap.product_id = p.id
WHERE p.product_type = 'artist'
ORDER BY p.created_at DESC
LIMIT 10;

-- 3. Statistiques détaillées
SELECT 
  COUNT(*) FILTER (WHERE p.images IS NOT NULL AND jsonb_array_length(p.images::jsonb) > 0) as avec_images_oeuvre,
  COUNT(*) FILTER (WHERE p.images IS NULL OR jsonb_array_length(p.images::jsonb) = 0) as sans_images_oeuvre,
  COUNT(*) FILTER (WHERE ap.artist_photo_url IS NOT NULL) as avec_photo_artiste,
  COUNT(*) FILTER (WHERE ap.artist_photo_url IS NULL) as sans_photo_artiste,
  COUNT(*) FILTER (
    WHERE (p.images IS NOT NULL AND jsonb_array_length(p.images::jsonb) > 0) 
    AND ap.artist_photo_url IS NOT NULL
  ) as avec_toutes_images,
  COUNT(*) as total_produits
FROM products p
INNER JOIN artist_products ap ON ap.product_id = p.id
WHERE p.product_type = 'artist';

