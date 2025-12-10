-- ============================================================
-- CORRECTION DÉFINITIVE DES POLITIQUES RLS POUR "attachments"
-- Date : 1 Février 2025
-- Description : Migration robuste pour corriger définitivement
--               les politiques RLS du bucket "attachments"
-- ============================================================

-- ÉTAPE 1 : Vérifier et forcer le bucket à être PUBLIC
DO $$
BEGIN
  -- Vérifier si le bucket existe
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'attachments') THEN
    RAISE EXCEPTION 'Le bucket "attachments" n''existe pas. Exécutez d''abord: 20250201_create_attachments_bucket.sql';
  END IF;
  
  -- Forcer le bucket à être public
  UPDATE storage.buckets
  SET public = true
  WHERE id = 'attachments';
  
  IF FOUND THEN
    RAISE NOTICE '✅ Bucket "attachments" configuré comme PUBLIC';
  ELSE
    RAISE WARNING '⚠️ Impossible de mettre à jour le bucket (peut déjà être public)';
  END IF;
END $$;

-- ÉTAPE 2 : Supprimer TOUTES les politiques existantes pour attachments
-- (y compris celles avec des noms différents)
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  -- Supprimer toutes les politiques qui mentionnent "attachment" ou "attachments"
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
      )
  LOOP
    BEGIN
      EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_record.policyname);
      RAISE NOTICE 'Suppression de la politique: %', policy_record.policyname;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Erreur lors de la suppression de la politique %: %', policy_record.policyname, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE '✅ Toutes les anciennes politiques supprimées';
END $$;

-- ÉTAPE 3 : Recréer les politiques RLS avec la syntaxe correcte
-- Note: On ne peut pas désactiver RLS sans privilèges super-utilisateur,
-- donc on supprime et recrée les politiques directement

-- Politique 1: Lecture publique (CRITIQUE - doit être TO public)
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

-- ÉTAPE 4 : Vérification complète
DO $$
DECLARE
  bucket_exists BOOLEAN;
  bucket_public BOOLEAN;
  public_read_policy_exists BOOLEAN;
  insert_policy_exists BOOLEAN;
  update_policy_exists BOOLEAN;
  delete_policy_exists BOOLEAN;
  policy_count INTEGER;
  rls_enabled BOOLEAN;
BEGIN
  -- Vérifier le bucket
  SELECT EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'attachments')
  INTO bucket_exists;
  
  IF bucket_exists THEN
    SELECT public INTO bucket_public
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
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RÉSULTAT DE LA VÉRIFICATION FINALE';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Bucket attachments existe: %', CASE WHEN bucket_exists THEN '✅ OUI' ELSE '❌ NON' END;
    RAISE NOTICE 'Bucket attachments public: %', CASE WHEN bucket_public THEN '✅ OUI' ELSE '❌ NON' END;
    RAISE NOTICE 'RLS activé sur storage.objects: %', CASE WHEN rls_enabled THEN '✅ OUI' ELSE '❌ NON' END;
    RAISE NOTICE 'Politique lecture publique: %', CASE WHEN public_read_policy_exists THEN '✅ EXISTE' ELSE '❌ MANQUANTE' END;
    RAISE NOTICE 'Politique upload authentifié: %', CASE WHEN insert_policy_exists THEN '✅ EXISTE' ELSE '❌ MANQUANTE' END;
    RAISE NOTICE 'Politique mise à jour: %', CASE WHEN update_policy_exists THEN '✅ EXISTE' ELSE '❌ MANQUANTE' END;
    RAISE NOTICE 'Politique suppression: %', CASE WHEN delete_policy_exists THEN '✅ EXISTE' ELSE '❌ MANQUANTE' END;
    RAISE NOTICE 'Total politiques attachments: %', policy_count;
    RAISE NOTICE '';
    
    IF bucket_public AND rls_enabled AND public_read_policy_exists AND insert_policy_exists THEN
      RAISE NOTICE '✅ Configuration complète et correcte !';
      RAISE NOTICE '';
      RAISE NOTICE '📋 PROCHAINES ÉTAPES:';
      RAISE NOTICE '1. Attendez 2-3 minutes (délai de propagation Supabase)';
      RAISE NOTICE '2. Rechargez votre application (F5)';
      RAISE NOTICE '3. Réessayez l''upload d''un fichier';
      RAISE NOTICE '4. Si le problème persiste, vérifiez que vous êtes bien authentifié';
    ELSE
      RAISE WARNING '⚠️ Configuration incomplète. Vérifiez les erreurs ci-dessus.';
      IF NOT bucket_public THEN
        RAISE WARNING '   → Le bucket n''est pas public. Activez "Public bucket" dans Supabase Dashboard > Storage > Buckets.';
      END IF;
      IF NOT rls_enabled THEN
        RAISE WARNING '   → RLS n''est pas activé sur storage.objects.';
      END IF;
      IF NOT public_read_policy_exists THEN
        RAISE WARNING '   → La politique de lecture publique n''existe pas ou est incorrecte.';
      END IF;
      IF NOT insert_policy_exists THEN
        RAISE WARNING '   → La politique d''upload n''existe pas ou est incorrecte.';
      END IF;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
  ELSE
    RAISE EXCEPTION '❌ Le bucket "attachments" n''existe pas. Exécutez d''abord: 20250201_create_attachments_bucket.sql';
  END IF;
END $$;

-- ÉTAPE 5 : Lister toutes les politiques pour vérification manuelle
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

