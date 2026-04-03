-- ============================================================
-- MIGRATION FINALE - Correction complète accès images product-images
-- Date : 1 Mars 2025
-- Description : Migration consolidée pour garantir l'accès public
--               aux images uploadées dans product-images (notamment artist/)
--               Cette migration nettoie et remplace toutes les configurations précédentes
-- ============================================================

-- ============================================================
-- ÉTAPE 1 : S'ASSURER QUE LE BUCKET EXISTE ET EST PUBLIC
-- ============================================================

-- Créer le bucket s'il n'existe pas, sinon le mettre à jour pour être public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true, -- PUBLIC
  524288000, -- 500MB max
  ARRAY[
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true, -- FORCER à public
  file_size_limit = 524288000,
  allowed_mime_types = ARRAY[
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'
  ];

-- Double vérification : Forcer le bucket à être public même s'il existe
UPDATE storage.buckets
SET public = true
WHERE id = 'product-images';

-- ============================================================
-- ÉTAPE 2 : NETTOYER TOUTES LES ANCIENNES POLITIQUES
-- ============================================================

-- Supprimer toutes les politiques existantes liées à product-images
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  -- Supprimer les politiques nommées spécifiquement
  DROP POLICY IF EXISTS "product-images - Upload authenticated" ON storage.objects;
  DROP POLICY IF EXISTS "product-images - Public read access" ON storage.objects;
  DROP POLICY IF EXISTS "product-images - Update authenticated" ON storage.objects;
  DROP POLICY IF EXISTS "product-images - Delete authenticated" ON storage.objects;
  DROP POLICY IF EXISTS "Users can upload product images" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update product images" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete product images" ON storage.objects;
  DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can upload product files" ON storage.objects;
  DROP POLICY IF EXISTS "Public can read product files" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can update product files" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can delete product files" ON storage.objects;
  DROP POLICY IF EXISTS "Allow public reads 16wiy3a_0" ON storage.objects;
  DROP POLICY IF EXISTS "Allow public uploads 16wiy3a_0" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated reads" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
  
  -- Supprimer toutes les autres politiques qui référencent product-images
  FOR policy_record IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects'
      AND (
        policyname LIKE '%product%image%'
        OR policyname LIKE '%product-images%'
        OR qual::text LIKE '%product-images%'
        OR with_check::text LIKE '%product-images%'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_record.policyname);
    RAISE NOTICE 'Politique supprimée: %', policy_record.policyname;
  END LOOP;
END $$;

-- ============================================================
-- ÉTAPE 3 : CRÉER LES POLITIQUES CORRECTES ET PROPRES
-- ============================================================

-- Politique 1: Upload pour utilisateurs authentifiés
-- Permet à tous les utilisateurs authentifiés d'uploader dans product-images
-- (y compris dans artist/ et autres dossiers)
CREATE POLICY "product-images - Upload authenticated"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
);

-- Politique 2: Lecture publique (CRITIQUE pour l'affichage des images)
-- Permet à TOUS (public) de lire TOUS les fichiers de product-images
-- C'est cette politique qui permet l'affichage des images
CREATE POLICY "product-images - Public read access"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'product-images'
);

-- Politique 3: Mise à jour pour utilisateurs authentifiés
-- Permet aux utilisateurs authentifiés de mettre à jour leurs fichiers
CREATE POLICY "product-images - Update authenticated"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images'
)
WITH CHECK (
  bucket_id = 'product-images'
);

-- Politique 4: Suppression pour utilisateurs authentifiés
-- Permet aux utilisateurs authentifiés de supprimer leurs fichiers
CREATE POLICY "product-images - Delete authenticated"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images'
);

-- ============================================================
-- ÉTAPE 4 : VÉRIFICATION FINALE
-- ============================================================

DO $$
DECLARE
  bucket_public BOOLEAN;
  public_read_exists BOOLEAN;
  policy_count INTEGER;
BEGIN
  -- Vérifier que le bucket est public
  SELECT public INTO bucket_public
  FROM storage.buckets
  WHERE id = 'product-images';
  
  -- Vérifier que la politique de lecture publique existe
  SELECT EXISTS (
    SELECT 1 
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'product-images - Public read access'
      AND cmd = 'SELECT'
      AND 'public' = ANY(roles)
  ) INTO public_read_exists;
  
  -- Compter les politiques pour product-images
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND (
      policyname LIKE '%product-images%'
      OR qual::text LIKE '%product-images%'
      OR with_check::text LIKE '%product-images%'
    );
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RÉSULTAT DE LA CONFIGURATION';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Bucket product-images public: %', CASE WHEN bucket_public THEN '✅ OUI' ELSE '❌ NON' END;
  RAISE NOTICE 'Politique lecture publique: %', CASE WHEN public_read_exists THEN '✅ EXISTE' ELSE '❌ MANQUANTE' END;
  RAISE NOTICE 'Nombre de politiques product-images: %', policy_count;
  RAISE NOTICE '';
  
  IF bucket_public AND public_read_exists AND policy_count = 4 THEN
    RAISE NOTICE '✅ CONFIGURATION CORRECTE !';
    RAISE NOTICE '';
    RAISE NOTICE 'Les images uploadées dans product-images/artist/ devraient maintenant être accessibles publiquement.';
    RAISE NOTICE '';
    RAISE NOTICE '📋 PROCHAINES ÉTAPES:';
    RAISE NOTICE '1. Attendez 2-3 minutes (délai de propagation Supabase)';
    RAISE NOTICE '2. Testez l''upload d''une image dans votre application';
    RAISE NOTICE '3. Vérifiez que l''image s''affiche correctement';
    RAISE NOTICE '';
    RAISE NOTICE 'Si le problème persiste après 3 minutes:';
    RAISE NOTICE '- Vérifiez dans le dashboard Supabase > Storage > Buckets > product-images';
    RAISE NOTICE '- Assurez-vous que "Public bucket" est activé';
    RAISE NOTICE '- Testez une URL directement dans votre navigateur';
  ELSE
    RAISE WARNING '⚠️ Configuration incomplète. Vérifiez les erreurs ci-dessus.';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================
-- ÉTAPE 5 : LISTER LES POLITIQUES FINALES (pour vérification manuelle)
-- ============================================================

-- Afficher toutes les politiques pour product-images
SELECT 
  policyname as "Nom de la politique",
  cmd as "Opération",
  roles::text as "Rôles",
  CASE 
    WHEN qual IS NOT NULL THEN substring(qual::text, 1, 100)
    WHEN with_check IS NOT NULL THEN substring(with_check::text, 1, 100)
    ELSE 'Aucune condition'
  END as "Conditions"
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND (
    policyname LIKE '%product-images%'
    OR qual::text LIKE '%product-images%'
    OR with_check::text LIKE '%product-images%'
  )
ORDER BY 
  CASE cmd
    WHEN 'SELECT' THEN 1
    WHEN 'INSERT' THEN 2
    WHEN 'UPDATE' THEN 3
    WHEN 'DELETE' THEN 4
    ELSE 5
  END,
  policyname;





