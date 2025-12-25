-- ============================================================
-- CRÉATION DU BUCKET "attachments" SI IL N'EXISTE PAS
-- Date : 1 Février 2025
-- Description : Crée le bucket "attachments" avec configuration publique
--               si le bucket n'existe pas déjà
-- ============================================================

-- Créer le bucket "attachments" s'il n'existe pas
DO $$
BEGIN
  -- Vérifier si le bucket existe déjà
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'attachments') THEN
    -- Créer le bucket
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'attachments',
      'attachments',
      true, -- PUBLIC
      52428800, -- 50MB max file size
      ARRAY[
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
        'video/mp4',
        'video/webm',
        'application/pdf',
        'application/zip',
        'application/x-zip-compressed',
        'text/plain',
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]
    );
    
    RAISE NOTICE '✅ Bucket "attachments" créé avec succès';
  ELSE
    RAISE NOTICE 'ℹ️ Le bucket "attachments" existe déjà';
    
    -- S'assurer qu'il est public
    UPDATE storage.buckets
    SET public = true
    WHERE id = 'attachments' AND public = false;
    
    IF FOUND THEN
      RAISE NOTICE '✅ Bucket "attachments" mis à jour comme PUBLIC';
    END IF;
  END IF;
END $$;

-- Créer les politiques RLS pour le bucket "attachments"
-- (Même si elles existent déjà, on les recrée pour être sûr)

-- Supprimer les anciennes politiques pour éviter les conflits
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN 
    SELECT policyname 
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND (
        policyname LIKE '%attachment%'
        OR qual::text LIKE '%attachment%'
        OR with_check::text LIKE '%attachment%'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_record.policyname);
    RAISE NOTICE 'Suppression de la politique: %', policy_record.policyname;
  END LOOP;
END $$;

-- Politique 1: Lecture publique (TRÈS IMPORTANTE - doit être TO public)
DROP POLICY IF EXISTS "Anyone can view attachments" ON storage.objects;
CREATE POLICY "Anyone can view attachments"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'attachments');

-- Politique 2: Upload pour utilisateurs authentifiés
DROP POLICY IF EXISTS "Authenticated users can upload attachments" ON storage.objects;
CREATE POLICY "Authenticated users can upload attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'attachments');

-- Politique 3: Mise à jour pour utilisateurs authentifiés
DROP POLICY IF EXISTS "Users can update their own attachments" ON storage.objects;
CREATE POLICY "Users can update their own attachments"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'attachments')
WITH CHECK (bucket_id = 'attachments');

-- Politique 4: Suppression pour utilisateurs authentifiés
DROP POLICY IF EXISTS "Users can delete their own attachments" ON storage.objects;
CREATE POLICY "Users can delete their own attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'attachments');

-- Vérification finale
DO $$
DECLARE
  bucket_exists BOOLEAN;
  bucket_public BOOLEAN;
  public_read_policy_exists BOOLEAN;
  insert_policy_exists BOOLEAN;
BEGIN
  -- Vérifier le bucket
  SELECT EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'attachments')
  INTO bucket_exists;
  
  IF bucket_exists THEN
    SELECT public INTO bucket_public
    FROM storage.buckets
    WHERE id = 'attachments';
    
    -- Vérifier la politique de lecture publique
    SELECT EXISTS (
      SELECT 1 
      FROM pg_policies
      WHERE schemaname = 'storage'
        AND tablename = 'objects'
        AND policyname = 'Anyone can view attachments'
        AND cmd = 'SELECT'
        AND 'public' = ANY(roles)
    ) INTO public_read_policy_exists;
    
    -- Vérifier la politique d'upload
    SELECT EXISTS (
      SELECT 1 
      FROM pg_policies
      WHERE schemaname = 'storage'
        AND tablename = 'objects'
        AND policyname = 'Authenticated users can upload attachments'
        AND cmd = 'INSERT'
        AND 'authenticated' = ANY(roles)
    ) INTO insert_policy_exists;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RÉSULTAT DE LA VÉRIFICATION';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Bucket attachments existe: %', CASE WHEN bucket_exists THEN '✅ OUI' ELSE '❌ NON' END;
    RAISE NOTICE 'Bucket attachments public: %', CASE WHEN bucket_public THEN '✅ OUI' ELSE '❌ NON' END;
    RAISE NOTICE 'Politique lecture publique: %', CASE WHEN public_read_policy_exists THEN '✅ EXISTE' ELSE '❌ MANQUANTE' END;
    RAISE NOTICE 'Politique upload authentifié: %', CASE WHEN insert_policy_exists THEN '✅ EXISTE' ELSE '❌ MANQUANTE' END;
    RAISE NOTICE '';
    
    IF bucket_public AND public_read_policy_exists AND insert_policy_exists THEN
      RAISE NOTICE '✅ Configuration complète et correcte !';
      RAISE NOTICE '';
      RAISE NOTICE '📋 PROCHAINES ÉTAPES:';
      RAISE NOTICE '1. Attendez 2-3 minutes (délai de propagation Supabase)';
      RAISE NOTICE '2. Rechargez votre application (F5)';
      RAISE NOTICE '3. Réessayez l''upload d''un fichier';
    ELSE
      RAISE WARNING '⚠️ Configuration incomplète. Vérifiez les erreurs ci-dessus.';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
  ELSE
    RAISE EXCEPTION '❌ Le bucket "attachments" n''a pas pu être créé. Vérifiez les permissions.';
  END IF;
END $$;

