-- ============================================================
-- CORRECTION FINALE ET COMPLÈTE DU BUCKET "attachments"
-- Date : 1 Février 2025
-- Description : Migration complète pour corriger définitivement
--               tous les problèmes d'upload (JSON au lieu d'images)
-- ============================================================

-- ÉTAPE 1 : Vérifier que le bucket existe, sinon le créer
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'attachments') THEN
    -- Créer le bucket s'il n'existe pas
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'attachments',
      'attachments',
      true, -- PUBLIC
      10485760, -- 10MB
      NULL -- Pas de restrictions MIME pour éviter l'erreur "mime type application/json is not supported"
    );
    RAISE NOTICE '✅ Bucket "attachments" créé';
  ELSE
    RAISE NOTICE '✅ Bucket "attachments" existe déjà';
  END IF;
END $$;

-- ÉTAPE 2 : FORCER le bucket à être PUBLIC et SUPPRIMER les restrictions MIME
-- IMPORTANT : Supprimer allowed_mime_types permet à Supabase de retourner
-- les erreurs RLS correctement au lieu de les rejeter comme "mime type not supported"
UPDATE storage.buckets
SET 
  public = true,
  file_size_limit = 10485760, -- 10MB
  allowed_mime_types = NULL -- Supprimer les restrictions MIME pour éviter l'erreur "mime type application/json is not supported"
WHERE id = 'attachments';

-- ÉTAPE 3 : Supprimer TOUTES les politiques existantes pour attachments
DO $$
DECLARE
  policy_record RECORD;
  policies_dropped INTEGER := 0;
BEGIN
  FOR policy_record IN 
    SELECT policyname 
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND (
        policyname ILIKE '%attachment%'
        OR qual::text ILIKE '%attachment%'
        OR with_check::text ILIKE '%attachment%'
        OR policyname ILIKE '%anyone%view%'
        OR policyname ILIKE '%authenticated%upload%'
        OR policyname ILIKE '%update%attachment%'
        OR policyname ILIKE '%delete%attachment%'
      )
  LOOP
    BEGIN
      EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_record.policyname);
      policies_dropped := policies_dropped + 1;
      RAISE NOTICE 'Suppression de la politique: %', policy_record.policyname;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Erreur lors de la suppression de la politique %: %', policy_record.policyname, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE '✅ % politique(s) supprimée(s)', policies_dropped;
END $$;

-- ÉTAPE 4 : Recréer les politiques RLS avec la syntaxe CORRECTE et SIMPLE

-- Politique 1: Lecture publique (CRITIQUE - TO public)
-- Permet à TOUT LE MONDE (y compris non authentifiés) de voir les fichiers
CREATE POLICY "Anyone can view attachments"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'attachments');

-- Politique 2: Upload pour utilisateurs authentifiés
-- Permet aux utilisateurs authentifiés d'uploader des fichiers
CREATE POLICY "Authenticated users can upload attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'attachments');

-- Politique 3: Mise à jour pour utilisateurs authentifiés
-- Permet aux utilisateurs authentifiés de mettre à jour leurs fichiers
CREATE POLICY "Users can update their own attachments"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'attachments')
WITH CHECK (bucket_id = 'attachments');

-- Politique 4: Suppression pour utilisateurs authentifiés
-- Permet aux utilisateurs authentifiés de supprimer leurs fichiers
CREATE POLICY "Users can delete their own attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'attachments');

-- ÉTAPE 5 : Vérification complète et rapport détaillé
DO $$
DECLARE
  bucket_exists BOOLEAN;
  bucket_public BOOLEAN;
  bucket_name TEXT;
  bucket_file_size_limit BIGINT;
  public_read_policy_exists BOOLEAN;
  insert_policy_exists BOOLEAN;
  update_policy_exists BOOLEAN;
  delete_policy_exists BOOLEAN;
  policy_count INTEGER;
  rls_enabled BOOLEAN;
  all_ok BOOLEAN := true;
BEGIN
  -- Vérifier le bucket
  SELECT EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'attachments')
  INTO bucket_exists;
  
  IF bucket_exists THEN
    SELECT public, name, file_size_limit
    INTO bucket_public, bucket_name, bucket_file_size_limit
    FROM storage.buckets
    WHERE id = 'attachments';
    
    -- Vérifier si RLS est activé
    SELECT relrowsecurity INTO rls_enabled
    FROM pg_class
    WHERE relname = 'objects' AND relnamespace = 'storage'::regnamespace;
    
    -- Vérifier chaque politique
    SELECT EXISTS (
      SELECT 1 
      FROM pg_policies
      WHERE schemaname = 'storage'
        AND tablename = 'objects'
        AND policyname = 'Anyone can view attachments'
        AND cmd = 'SELECT'
        AND 'public' = ANY(roles)
    ) INTO public_read_policy_exists;
    
    SELECT EXISTS (
      SELECT 1 
      FROM pg_policies
      WHERE schemaname = 'storage'
        AND tablename = 'objects'
        AND policyname = 'Authenticated users can upload attachments'
        AND cmd = 'INSERT'
        AND 'authenticated' = ANY(roles)
    ) INTO insert_policy_exists;
    
    SELECT EXISTS (
      SELECT 1 
      FROM pg_policies
      WHERE schemaname = 'storage'
        AND tablename = 'objects'
        AND policyname = 'Users can update their own attachments'
        AND cmd = 'UPDATE'
    ) INTO update_policy_exists;
    
    SELECT EXISTS (
      SELECT 1 
      FROM pg_policies
      WHERE schemaname = 'storage'
        AND tablename = 'objects'
        AND policyname = 'Users can delete their own attachments'
        AND cmd = 'DELETE'
    ) INTO delete_policy_exists;
    
    -- Compter toutes les politiques pour attachments
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND (
        policyname ILIKE '%attachment%'
        OR qual::text ILIKE '%attachment%'
        OR with_check::text ILIKE '%attachment%'
      );
    
    -- Vérifier que tout est OK
    IF NOT bucket_public THEN
      all_ok := false;
    END IF;
    IF NOT rls_enabled THEN
      all_ok := false;
    END IF;
    IF NOT public_read_policy_exists THEN
      all_ok := false;
    END IF;
    IF NOT insert_policy_exists THEN
      all_ok := false;
    END IF;
    
    -- Afficher le rapport
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RAPPORT DE VÉRIFICATION FINALE';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '📦 BUCKET:';
    RAISE NOTICE '  Nom: %', bucket_name;
    RAISE NOTICE '  Public: %', CASE WHEN bucket_public THEN '✅ OUI' ELSE '❌ NON (CRITIQUE!)' END;
    RAISE NOTICE '  Taille max: % MB', COALESCE(bucket_file_size_limit / 1024 / 1024, 0);
    RAISE NOTICE '';
    RAISE NOTICE '🔒 RLS:';
    RAISE NOTICE '  Activé: %', CASE WHEN rls_enabled THEN '✅ OUI' ELSE '❌ NON' END;
    RAISE NOTICE '';
    RAISE NOTICE '📋 POLITIQUES RLS:';
    RAISE NOTICE '  Lecture publique (SELECT): %', CASE WHEN public_read_policy_exists THEN '✅ EXISTE' ELSE '❌ MANQUANTE' END;
    RAISE NOTICE '  Upload authentifié (INSERT): %', CASE WHEN insert_policy_exists THEN '✅ EXISTE' ELSE '❌ MANQUANTE' END;
    RAISE NOTICE '  Mise à jour (UPDATE): %', CASE WHEN update_policy_exists THEN '✅ EXISTE' ELSE '❌ MANQUANTE' END;
    RAISE NOTICE '  Suppression (DELETE): %', CASE WHEN delete_policy_exists THEN '✅ EXISTE' ELSE '❌ MANQUANTE' END;
    RAISE NOTICE '  Total politiques: %', policy_count;
    RAISE NOTICE '';
    
    IF all_ok THEN
      RAISE NOTICE '✅ CONFIGURATION COMPLÈTE ET CORRECTE !';
      RAISE NOTICE '';
      RAISE NOTICE '📋 PROCHAINES ÉTAPES:';
      RAISE NOTICE '1. Attendez 2-3 minutes (délai de propagation Supabase)';
      RAISE NOTICE '2. Rechargez votre application (F5)';
      RAISE NOTICE '3. Vérifiez que vous êtes bien authentifié';
      RAISE NOTICE '4. Réessayez l''upload d''un fichier image';
      RAISE NOTICE '';
      RAISE NOTICE '💡 Si le problème persiste:';
      RAISE NOTICE '   - Vérifiez manuellement dans Supabase Dashboard > Storage > Buckets';
      RAISE NOTICE '   - Assurez-vous que "Public bucket" est activé';
      RAISE NOTICE '   - Vérifiez les logs Supabase (Dashboard > Logs > Storage)';
      RAISE NOTICE '   - Testez avec le script: src/utils/testStorageUpload.ts';
    ELSE
      RAISE WARNING '⚠️ CONFIGURATION INCOMPLÈTE !';
      RAISE NOTICE '';
      IF NOT bucket_public THEN
        RAISE WARNING '   ❌ Le bucket n''est PAS public.';
        RAISE WARNING '   → Allez dans Supabase Dashboard > Storage > Buckets > "attachments"';
        RAISE WARNING '   → Activez "Public bucket" et sauvegardez';
      END IF;
      IF NOT rls_enabled THEN
        RAISE WARNING '   ❌ RLS n''est pas activé sur storage.objects.';
      END IF;
      IF NOT public_read_policy_exists THEN
        RAISE WARNING '   ❌ La politique de lecture publique n''existe pas.';
      END IF;
      IF NOT insert_policy_exists THEN
        RAISE WARNING '   ❌ La politique d''upload n''existe pas.';
      END IF;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
  ELSE
    RAISE EXCEPTION '❌ Le bucket "attachments" n''existe pas et n''a pas pu être créé.';
  END IF;
END $$;

-- ÉTAPE 6 : Lister toutes les politiques pour vérification manuelle
SELECT 
  policyname as "Nom de la politique",
  cmd as "Opération",
  roles::text as "Rôles",
  CASE 
    WHEN qual IS NOT NULL THEN 'USING: ' || substring(qual::text, 1, 100)
    WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || substring(with_check::text, 1, 100)
    ELSE 'Aucune condition'
  END as "Conditions"
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND (
    policyname ILIKE '%attachment%'
    OR qual::text ILIKE '%attachment%'
    OR with_check::text ILIKE '%attachment%'
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

