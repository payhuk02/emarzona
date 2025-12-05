-- ============================================================
-- DIAGNOSTIC PERMISSIONS BUCKET product-images
-- Ce script permet de vérifier l'état actuel des permissions
-- ============================================================

-- 1. Vérifier si le bucket existe et s'il est public
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'product-images';

-- 2. Vérifier toutes les politiques RLS pour product-images
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects' 
  AND (qual::text LIKE '%product-images%' OR with_check::text LIKE '%product-images%' OR policyname LIKE '%product-images%')
ORDER BY policyname;

-- 3. Vérifier les fichiers dans le dossier artist/
SELECT 
  name,
  bucket_id,
  created_at,
  updated_at,
  metadata
FROM storage.objects
WHERE bucket_id = 'product-images'
  AND name LIKE 'artist/%'
ORDER BY created_at DESC
LIMIT 10;

-- 4. Tester l'accès public (doit retourner des résultats si les permissions sont correctes)
-- Cette requête simule ce que fait le navigateur pour charger l'image
SELECT 
  name,
  bucket_id,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'objects' 
      AND cmd = 'SELECT' 
      AND (qual::text LIKE '%product-images%' OR policyname LIKE '%product-images%' OR policyname LIKE '%public%')
    ) THEN 'Politique de lecture publique trouvée'
    ELSE 'AUCUNE politique de lecture publique trouvée - PROBLÈME!'
  END as access_status
FROM storage.objects
WHERE bucket_id = 'product-images'
  AND name LIKE 'artist/%'
LIMIT 1;










