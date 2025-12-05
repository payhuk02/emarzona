-- ============================================================
-- VÉRIFICATION ULTRA-SIMPLE
-- ============================================================
-- Exécutez cette requête pour vérifier si des produits existent

-- Question 1 : Y a-t-il des produits artistiques dans la base ?
SELECT 
  COUNT(*) as nombre_produits,
  CASE 
    WHEN COUNT(*) = 0 THEN '❌ AUCUN PRODUIT - Créez d''abord un produit artiste'
    ELSE '✅ ' || COUNT(*)::text || ' produit(s) trouvé(s)'
  END as message
FROM products
WHERE product_type = 'artist';

-- Question 2 : Si des produits existent, montrez-les tous
SELECT 
  p.id,
  p.name,
  p.created_at,
  p.is_draft,
  p.is_active,
  p.store_id,
  -- Images
  CASE WHEN p.image_url IS NULL THEN 'NULL' ELSE 'OK' END as a_image_principale,
  CASE 
    WHEN p.images IS NULL THEN 'NULL'
    WHEN jsonb_typeof(p.images::jsonb) = 'array' THEN jsonb_array_length(p.images::jsonb)::text || ' image(s)'
    ELSE 'ERREUR'
  END as nombre_images,
  -- Photo artiste
  CASE 
    WHEN ap.artist_photo_url IS NULL THEN 'NULL'
    WHEN ap.artist_photo_url = '' THEN 'VIDE'
    ELSE 'OK'
  END as a_photo_artiste
FROM products p
LEFT JOIN artist_products ap ON ap.product_id = p.id
WHERE p.product_type = 'artist'
ORDER BY p.created_at DESC;

-- Question 3 : Vérifier tous les types de produits (pour comparaison)
SELECT 
  product_type,
  COUNT(*) as nombre
FROM products
GROUP BY product_type
ORDER BY nombre DESC;

