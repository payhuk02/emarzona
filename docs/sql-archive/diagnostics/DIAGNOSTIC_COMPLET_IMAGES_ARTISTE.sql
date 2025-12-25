-- ============================================================
-- DIAGNOSTIC COMPLET - IMAGES ARTISTE
-- ============================================================
-- Exécutez ces requêtes UNE PAR UNE dans l'ordre pour diagnostiquer
-- le problème de sauvegarde des images

-- ============================================================
-- ÉTAPE 1 : Vérifier l'existence de produits artistiques
-- ============================================================
-- Si cette requête retourne 0, AUCUN produit n'a été créé
SELECT 
  'ÉTAPE 1: Produits artistiques' as diagnostic,
  COUNT(*) as total_produits,
  CASE 
    WHEN COUNT(*) = 0 THEN '❌ AUCUN PRODUIT CRÉÉ - Créez d''abord un produit'
    ELSE '✅ Produits trouvés'
  END as statut
FROM products
WHERE product_type = 'artist';

-- ============================================================
-- ÉTAPE 2 : Voir TOUS les produits artistiques (même sans images)
-- ============================================================
-- Cette requête montre tous les produits, même s'ils n'ont pas d'images
SELECT 
  p.id,
  p.name,
  p.created_at,
  p.is_draft,
  p.is_active,
  CASE 
    WHEN p.image_url IS NULL THEN '❌ NULL'
    WHEN p.image_url = '' THEN '❌ VIDE'
    ELSE '✅ ' || LEFT(p.image_url, 50) || '...'
  END as image_principale,
  CASE 
    WHEN p.images IS NULL THEN '❌ NULL'
    WHEN jsonb_typeof(p.images::jsonb) != 'array' THEN '❌ PAS UN TABLEAU'
    WHEN jsonb_array_length(p.images::jsonb) = 0 THEN '❌ TABLEAU VIDE'
    ELSE '✅ ' || jsonb_array_length(p.images::jsonb)::text || ' image(s)'
  END as statut_images,
  CASE 
    WHEN ap.artist_photo_url IS NULL THEN '❌ NULL'
    WHEN ap.artist_photo_url = '' THEN '❌ VIDE'
    ELSE '✅ Photo présente'
  END as statut_photo_artiste
FROM products p
LEFT JOIN artist_products ap ON ap.product_id = p.id
WHERE p.product_type = 'artist'
ORDER BY p.created_at DESC
LIMIT 20;

-- ============================================================
-- ÉTAPE 3 : Vérifier les détails des images (si produits existent)
-- ============================================================
-- Cette requête montre le contenu exact des champs images
SELECT 
  p.id,
  p.name,
  p.image_url,
  p.images,
  jsonb_array_length(COALESCE(p.images::jsonb, '[]'::jsonb)) as nombre_images,
  ap.artist_photo_url,
  ap.created_at as date_creation_artiste
FROM products p
LEFT JOIN artist_products ap ON ap.product_id = p.id
WHERE p.product_type = 'artist'
ORDER BY p.created_at DESC
LIMIT 5;

-- ============================================================
-- ÉTAPE 4 : Statistiques détaillées (si produits existent)
-- ============================================================
SELECT 
  COUNT(*) as total_produits,
  COUNT(*) FILTER (WHERE p.image_url IS NOT NULL AND p.image_url != '') as avec_image_principale,
  COUNT(*) FILTER (WHERE p.image_url IS NULL OR p.image_url = '') as sans_image_principale,
  COUNT(*) FILTER (
    WHERE p.images IS NOT NULL 
    AND jsonb_typeof(p.images::jsonb) = 'array' 
    AND jsonb_array_length(p.images::jsonb) > 0
  ) as avec_images_tableau,
  COUNT(*) FILTER (
    WHERE p.images IS NULL 
    OR jsonb_typeof(p.images::jsonb) != 'array' 
    OR jsonb_array_length(p.images::jsonb) = 0
  ) as sans_images_tableau,
  COUNT(*) FILTER (WHERE ap.artist_photo_url IS NOT NULL AND ap.artist_photo_url != '') as avec_photo_artiste,
  COUNT(*) FILTER (WHERE ap.artist_photo_url IS NULL OR ap.artist_photo_url = '') as sans_photo_artiste,
  COUNT(*) FILTER (
    WHERE (p.images IS NOT NULL 
      AND jsonb_typeof(p.images::jsonb) = 'array' 
      AND jsonb_array_length(p.images::jsonb) > 0)
    AND (ap.artist_photo_url IS NOT NULL AND ap.artist_photo_url != '')
  ) as avec_toutes_images
FROM products p
LEFT JOIN artist_products ap ON ap.product_id = p.id
WHERE p.product_type = 'artist';

-- ============================================================
-- ÉTAPE 5 : Vérifier dans Supabase Storage (à faire manuellement)
-- ============================================================
-- Allez dans Supabase Dashboard > Storage > product-images
-- Cherchez le dossier "artist/"
-- Vous devriez voir :
--   - artist-photo_*.jpeg (photo artiste)
--   - artwork_*.jpeg (images œuvre)

