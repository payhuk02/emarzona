-- =========================================================
-- Script de diagnostic : Vérification upload fichiers
-- Date : 31 Janvier 2025
-- Description : Vérifie les fichiers uploadés, leurs URLs et les permissions
-- =========================================================

-- 1. Vérifier que le bucket product-images existe et est public
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE id = 'product-images';

-- 2. Vérifier les politiques RLS pour le bucket product-images
SELECT 
  policyname AS "Nom de la politique",
  cmd AS "Commande",
  roles AS "Rôles",
  qual AS "Condition USING",
  with_check AS "Condition WITH CHECK"
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%product-images%'
ORDER BY policyname;

-- 3. Lister les fichiers récents dans le dossier artist/
SELECT 
  name AS "Chemin du fichier",
  bucket_id AS "Bucket",
  created_at AS "Date de création",
  updated_at AS "Dernière modification",
  metadata->>'size' AS "Taille (bytes)",
  metadata->>'mimetype' AS "Type MIME",
  metadata->>'cacheControl' AS "Cache Control"
FROM storage.objects
WHERE bucket_id = 'product-images'
  AND name LIKE 'artist/%'
ORDER BY created_at DESC
LIMIT 20;

-- 4. Compter les fichiers par type dans artist/
SELECT 
  CASE 
    WHEN name LIKE '%artist-photo%' THEN 'Photo artiste'
    WHEN name LIKE '%artwork%' THEN 'Image œuvre'
    ELSE 'Autre'
  END AS "Type de fichier",
  COUNT(*) AS "Nombre",
  SUM((metadata->>'size')::bigint) AS "Taille totale (bytes)",
  ROUND(AVG((metadata->>'size')::bigint), 2) AS "Taille moyenne (bytes)"
FROM storage.objects
WHERE bucket_id = 'product-images'
  AND name LIKE 'artist/%'
GROUP BY 
  CASE 
    WHEN name LIKE '%artist-photo%' THEN 'Photo artiste'
    WHEN name LIKE '%artwork%' THEN 'Image œuvre'
    ELSE 'Autre'
  END;

-- 5. Vérifier les produits artistes récents et leurs URLs
SELECT 
  p.id AS "ID Produit",
  p.name AS "Nom produit",
  p.image_url AS "Image principale",
  p.images AS "Images (array)",
  ap.artist_photo_url AS "Photo artiste",
  ap.artist_name AS "Nom artiste",
  ap.artwork_title AS "Titre œuvre",
  p.created_at AS "Date création"
FROM products p
LEFT JOIN artist_products ap ON ap.product_id = p.id
WHERE p.product_type = 'artist'
ORDER BY p.created_at DESC
LIMIT 10;

-- 6. Vérifier les produits avec photo artiste mais fichier manquant
SELECT 
  p.id AS "ID Produit",
  ap.artist_photo_url AS "URL photo artiste",
  CASE 
    WHEN ap.artist_photo_url LIKE '%/storage/v1/object/public/product-images/%' THEN
      SUBSTRING(ap.artist_photo_url FROM 'product-images/(.+)$')
    ELSE NULL
  END AS "Chemin extrait",
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM storage.objects 
      WHERE bucket_id = 'product-images' 
      AND name = SUBSTRING(ap.artist_photo_url FROM 'product-images/(.+)$')
    ) THEN '✅ Fichier existe'
    ELSE '❌ Fichier manquant'
  END AS "Statut fichier"
FROM products p
JOIN artist_products ap ON ap.product_id = p.id
WHERE p.product_type = 'artist'
  AND ap.artist_photo_url IS NOT NULL
ORDER BY p.created_at DESC
LIMIT 10;

-- 7. Vérifier les permissions pour un utilisateur anonyme (lecture publique)
-- Cette requête simule ce qu'un utilisateur non authentifié verrait
SET ROLE anon;
SELECT 
  name,
  bucket_id,
  created_at
FROM storage.objects
WHERE bucket_id = 'product-images'
  AND name LIKE 'artist/%'
ORDER BY created_at DESC
LIMIT 5;
RESET ROLE;

-- 8. Statistiques générales
SELECT 
  COUNT(*) AS "Total fichiers artist/",
  COUNT(DISTINCT DATE(created_at)) AS "Jours avec uploads",
  MIN(created_at) AS "Premier upload",
  MAX(created_at) AS "Dernier upload",
  SUM((metadata->>'size')::bigint) AS "Taille totale (bytes)",
  ROUND(SUM((metadata->>'size')::bigint) / 1024.0 / 1024.0, 2) AS "Taille totale (MB)"
FROM storage.objects
WHERE bucket_id = 'product-images'
  AND name LIKE 'artist/%';










