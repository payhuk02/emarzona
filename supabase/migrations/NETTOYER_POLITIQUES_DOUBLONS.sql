-- =====================================================
-- NETTOYAGE DES POLITIQUES EN DOUBLE
-- Date : 27 octobre 2025
-- Objectif : Supprimer uniquement les doublons
-- =====================================================

-- Afficher les politiques existantes AVANT nettoyage
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  RAISE NOTICE '📋 POLITIQUES EXISTANTES AVANT NETTOYAGE :';
  RAISE NOTICE '================================================';
  
  FOR policy_record IN 
    SELECT policyname, cmd 
    FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects'
      AND policyname LIKE '%video%'
    ORDER BY policyname
  LOOP
    RAISE NOTICE '  - % (%) ', policy_record.policyname, policy_record.cmd;
  END LOOP;
  
  RAISE NOTICE '';
END $$;

-- =====================================================
-- SUPPRIMER UNIQUEMENT LES DOUBLONS (avec suffixe)
-- =====================================================

-- Supprimer les politiques avec suffixe _0, _1, etc.
DROP POLICY IF EXISTS "Anyone can view videos 16wiy3a_0" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload videos 16wiy3a_0" ON storage.objects;

-- Supprimer toutes les variantes possibles avec suffixe
DO $$
DECLARE
  policy_name TEXT;
BEGIN
  -- Supprimer toutes les politiques qui ont un suffixe (underscore suivi de chiffres/lettres)
  FOR policy_name IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects'
      AND policyname ~ '.*_[a-z0-9]+$'  -- Regex pour détecter les suffixes
      AND policyname LIKE '%video%'
  LOOP
    RAISE NOTICE '🗑️  Suppression du doublon : %', policy_name;
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_name);
  END LOOP;
END $$;

-- =====================================================
-- VÉRIFIER QUE LES BONNES POLITIQUES EXISTENT
-- Si elles n'existent pas, les créer
-- =====================================================

-- 1. Politique SELECT (Lecture publique)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Anyone can view videos'
  ) THEN
    RAISE NOTICE '✅ Création de la politique : Anyone can view videos';
    CREATE POLICY "Anyone can view videos"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'videos');
  ELSE
    RAISE NOTICE '✅ Politique déjà existante : Anyone can view videos';
  END IF;
END $$;

-- 2. Politique INSERT (Upload)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Authenticated users can upload videos'
  ) THEN
    RAISE NOTICE '✅ Création de la politique : Authenticated users can upload videos';
    CREATE POLICY "Authenticated users can upload videos"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'videos' AND
      (storage.foldername(name))[1] = 'course-videos'
    );
  ELSE
    RAISE NOTICE '✅ Politique déjà existante : Authenticated users can upload videos';
  END IF;
END $$;

-- 3. Politique UPDATE (Modification)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Users can update their own videos'
  ) THEN
    RAISE NOTICE '✅ Création de la politique : Users can update their own videos';
    CREATE POLICY "Users can update their own videos"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'videos' AND
      owner = auth.uid()
    )
    WITH CHECK (
      bucket_id = 'videos' AND
      owner = auth.uid()
    );
  ELSE
    RAISE NOTICE '✅ Politique déjà existante : Users can update their own videos';
  END IF;
END $$;

-- 4. Politique DELETE (Suppression)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Users can delete their own videos'
  ) THEN
    RAISE NOTICE '✅ Création de la politique : Users can delete their own videos';
    CREATE POLICY "Users can delete their own videos"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'videos' AND
      owner = auth.uid()
    );
  ELSE
    RAISE NOTICE '✅ Politique déjà existante : Users can delete their own videos';
  END IF;
END $$;

-- =====================================================
-- AFFICHER LE RÉSULTAT FINAL
-- =====================================================

DO $$
DECLARE
  policy_count INTEGER;
  policy_record RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '📋 POLITIQUES FINALES APRÈS NETTOYAGE :';
  RAISE NOTICE '================================================';
  
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE schemaname = 'storage' 
    AND tablename = 'objects'
    AND policyname IN (
      'Anyone can view videos',
      'Authenticated users can upload videos',
      'Users can update their own videos',
      'Users can delete their own videos'
    );
  
  FOR policy_record IN 
    SELECT policyname, cmd, roles
    FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects'
      AND policyname LIKE '%video%'
    ORDER BY policyname
  LOOP
    RAISE NOTICE '  ✅ % (%) - Rôles: %', policy_record.policyname, policy_record.cmd, policy_record.roles;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  
  IF policy_count = 4 THEN
    RAISE NOTICE '🎉 NETTOYAGE RÉUSSI !';
    RAISE NOTICE '  ✅ 4 politiques actives (aucun doublon)';
    RAISE NOTICE '  ✅ Configuration optimale';
  ELSE
    RAISE WARNING '⚠️  Attention : % politiques trouvées (attendu: 4)', policy_count;
  END IF;
  
  RAISE NOTICE '================================================';
END $$;

