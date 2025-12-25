/**
 * Test d'accès direct au Storage pour le bucket attachments
 * Date: 31 Janvier 2025
 * 
 * Ce script teste si on peut vraiment accéder aux fichiers
 * et identifie les blocages restants
 */

-- =====================================================
-- 1. VÉRIFIER UN FICHIER EXEMPLE
-- =====================================================

-- Récupérer un fichier exemple du bucket
SELECT 
  name as "Nom du fichier",
  id as "ID",
  bucket_id as "Bucket",
  created_at as "Créé le",
  updated_at as "Modifié le",
  last_accessed_at as "Dernier accès",
  metadata->>'size' as "Taille (bytes)",
  metadata->>'mimetype' as "Type MIME"
FROM storage.objects
WHERE bucket_id = 'attachments'
  AND name LIKE 'vendor-message-attachments/%'
ORDER BY created_at DESC
LIMIT 5;

-- =====================================================
-- 2. VÉRIFIER LES PERMISSIONS AU NIVEAU DU FICHIER
-- =====================================================

-- Test avec un fichier spécifique
DO $$
DECLARE
  test_file_path TEXT;
  file_exists BOOLEAN;
BEGIN
  -- Prendre le premier fichier trouvé
  SELECT name INTO test_file_path
  FROM storage.objects
  WHERE bucket_id = 'attachments'
    AND name LIKE 'vendor-message-attachments/%.png'
  LIMIT 1;
  
  IF test_file_path IS NULL THEN
    RAISE NOTICE '⚠️ Aucun fichier PNG trouvé dans vendor-message-attachments/';
    RETURN;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'TEST D''ACCÈS POUR: %', test_file_path;
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  
  -- Vérifier si le fichier existe
  SELECT EXISTS(
    SELECT 1 FROM storage.objects
    WHERE bucket_id = 'attachments'
      AND name = test_file_path
  ) INTO file_exists;
  
  IF file_exists THEN
    RAISE NOTICE '✅ Fichier existe dans storage.objects';
  ELSE
    RAISE WARNING '❌ Fichier introuvable dans storage.objects';
    RETURN;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE 'URL publique attendue:';
  RAISE NOTICE 'https://[PROJECT].supabase.co/storage/v1/object/public/attachments/%', test_file_path;
  RAISE NOTICE '';
  RAISE NOTICE 'URL signée peut être générée avec:';
  RAISE NOTICE 'SELECT * FROM storage.create_signed_url(''attachments'', ''%'', 3600);', test_file_path;
  
END $$;

-- =====================================================
-- 3. VÉRIFIER S'IL Y A DES POLITIQUES QUI BLOQUENT GLOBALEMENT
-- =====================================================

-- Chercher des politiques qui pourraient bloquer TOUS les accès
SELECT 
  '⚠️ ATTENTION: Politique globale détectée' as "Alerte",
  policyname as "Nom",
  cmd as "Commande",
  roles::text as "Rôles",
  qual::text as "USING",
  with_check::text as "WITH CHECK"
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND cmd = 'SELECT'
  AND (
    -- Politique sans restriction (appliquée à tous)
    qual IS NULL
    OR qual::text = 'true'
    OR qual::text NOT LIKE '%bucket%'
  )
  AND roles::text NOT LIKE '%public%'
  AND policyname NOT LIKE '%attachment%'
ORDER BY policyname;

-- =====================================================
-- 4. VÉRIFIER L'ORDRE DES POLITIQUES (RESTRICTIVE vs PERMISSIVE)
-- =====================================================

DO $$
DECLARE
  total_policies INTEGER;
  restrictive_policies INTEGER;
  permissive_policies INTEGER;
BEGIN
  -- Compter toutes les politiques SELECT
  SELECT COUNT(*) INTO total_policies
  FROM pg_policies
  WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND cmd = 'SELECT';
  
  -- Compter les politiques restrictives (avec auth.uid() ou conditions)
  SELECT COUNT(*) INTO restrictive_policies
  FROM pg_policies
  WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND cmd = 'SELECT'
    AND (
      qual::text LIKE '%auth.uid()%'
      OR qual::text LIKE '%auth.role()%'
      OR roles::text LIKE '%authenticated%'
    );
  
  -- Compter les politiques permissives (public)
  SELECT COUNT(*) INTO permissive_policies
  FROM pg_policies
  WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND cmd = 'SELECT'
    AND roles::text LIKE '%public%';
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'ANALYSE DES POLITIQUES:';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'Total politiques SELECT: %', total_policies;
  RAISE NOTICE 'Politiques restrictives: %', restrictive_policies;
  RAISE NOTICE 'Politiques permissives (public): %', permissive_policies;
  RAISE NOTICE '';
  
  IF restrictive_policies > 0 AND permissive_policies = 0 THEN
    RAISE WARNING '⚠️ Seulement des politiques restrictives trouvées - pas d''accès public!';
  ELSIF restrictive_policies > permissive_policies THEN
    RAISE WARNING '⚠️ Plus de politiques restrictives que permissives - vérifiez les conflits!';
  END IF;
  
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;

-- =====================================================
-- 5. RECOMMANDATION FINALE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'RECOMMANDATIONS:';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'Si le bucket est public et les politiques sont correctes';
  RAISE NOTICE 'mais les images ne s''affichent toujours pas:';
  RAISE NOTICE '';
  RAISE NOTICE '1. Attendez 2-3 minutes pour la propagation des changements';
  RAISE NOTICE '2. Videz le cache du navigateur (Ctrl+Shift+R)';
  RAISE NOTICE '3. Testez avec un NOUVEAU fichier uploadé après la correction';
  RAISE NOTICE '4. Vérifiez dans le Dashboard que le bucket est vraiment public';
  RAISE NOTICE '5. Vérifiez qu''il n''y a pas de CDN ou proxy qui cache les erreurs';
  RAISE NOTICE '';
  RAISE NOTICE 'Si le problème persiste, contactez le support Supabase';
  RAISE NOTICE 'car cela peut être un problème au niveau de leur infrastructure.';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;

