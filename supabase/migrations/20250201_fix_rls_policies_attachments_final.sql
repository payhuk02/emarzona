-- ============================================================
-- CORRECTION FINALE DES POLITIQUES RLS POUR "attachments"
-- Date : 1 Février 2025
-- Description : Supprime et recrée toutes les politiques RLS
--               pour garantir qu'elles sont correctement configurées
-- ============================================================

-- ÉTAPE 1 : Supprimer TOUTES les politiques existantes pour "attachments"
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
        OR policyname = 'Anyone can view attachments'
        OR policyname = 'Authenticated users can upload attachments'
        OR policyname = 'Users can update their own attachments'
        OR policyname = 'Users can delete their own attachments'
      )
  LOOP
    BEGIN
      EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_record.policyname);
      policies_dropped := policies_dropped + 1;
      RAISE NOTICE '✅ Politique supprimée: %', policy_record.policyname;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '⚠️ Erreur lors de la suppression de %: %', policy_record.policyname, SQLERRM;
    END;
  END LOOP;
  
  IF policies_dropped > 0 THEN
    RAISE NOTICE '✅ % politique(s) supprimée(s)', policies_dropped;
  ELSE
    RAISE NOTICE 'ℹ️ Aucune politique existante à supprimer';
  END IF;
END $$;

-- ÉTAPE 2 : Créer les politiques RLS CORRECTES

-- Politique 1: Lecture PUBLIQUE (CRITIQUE - doit être TO public, pas authenticated)
CREATE POLICY "Anyone can view attachments"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'attachments');

-- Politique 2: Upload pour utilisateurs authentifiés
CREATE POLICY "Authenticated users can upload attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'attachments');

-- Politique 3: Mise à jour pour utilisateurs authentifiés
CREATE POLICY "Users can update their own attachments"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'attachments')
WITH CHECK (bucket_id = 'attachments');

-- Politique 4: Suppression pour utilisateurs authentifiés
CREATE POLICY "Users can delete their own attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'attachments');

-- ÉTAPE 3 : Vérification finale
DO $$
DECLARE
  bucket_exists BOOLEAN;
  bucket_public BOOLEAN;
  public_read_policy_exists BOOLEAN;
  insert_policy_exists BOOLEAN;
  update_policy_exists BOOLEAN;
  delete_policy_exists BOOLEAN;
  all_ok BOOLEAN := true;
BEGIN
  -- Vérifier le bucket
  SELECT EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'attachments')
  INTO bucket_exists;
  
  IF bucket_exists THEN
    SELECT public INTO bucket_public
    FROM storage.buckets
    WHERE id = 'attachments';
    
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
    
    -- Afficher le rapport
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RAPPORT DE VÉRIFICATION FINALE';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '📦 BUCKET:';
    RAISE NOTICE '  Existe: %', CASE WHEN bucket_exists THEN '✅ OUI' ELSE '❌ NON' END;
    RAISE NOTICE '  Public: %', CASE WHEN bucket_public THEN '✅ OUI' ELSE '❌ NON (CRITIQUE!)' END;
    RAISE NOTICE '';
    RAISE NOTICE '📋 POLITIQUES RLS:';
    RAISE NOTICE '  Lecture publique (SELECT): %', CASE WHEN public_read_policy_exists THEN '✅ EXISTE' ELSE '❌ MANQUANTE' END;
    RAISE NOTICE '  Upload authentifié (INSERT): %', CASE WHEN insert_policy_exists THEN '✅ EXISTE' ELSE '❌ MANQUANTE' END;
    RAISE NOTICE '  Mise à jour (UPDATE): %', CASE WHEN update_policy_exists THEN '✅ EXISTE' ELSE '❌ MANQUANTE' END;
    RAISE NOTICE '  Suppression (DELETE): %', CASE WHEN delete_policy_exists THEN '✅ EXISTE' ELSE '❌ MANQUANTE' END;
    RAISE NOTICE '';
    
    IF bucket_public AND public_read_policy_exists AND insert_policy_exists AND update_policy_exists AND delete_policy_exists THEN
      RAISE NOTICE '✅ CONFIGURATION COMPLÈTE ET CORRECTE !';
      RAISE NOTICE '';
      RAISE NOTICE '📋 PROCHAINES ÉTAPES:';
      RAISE NOTICE '1. Attendez 1-2 minutes (délai de propagation Supabase)';
      RAISE NOTICE '2. Rechargez votre application (F5)';
      RAISE NOTICE '3. Réessayez l''upload d''un fichier image';
      RAISE NOTICE '';
    ELSE
      RAISE WARNING '⚠️ CONFIGURATION INCOMPLÈTE !';
      IF NOT bucket_public THEN
        RAISE WARNING '   ❌ Le bucket n''est PAS public.';
        RAISE WARNING '   → Allez dans Supabase Dashboard > Storage > Buckets > "attachments"';
        RAISE WARNING '   → Activez "Public bucket" et sauvegardez';
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
    RAISE EXCEPTION '❌ Le bucket "attachments" n''existe pas. Exécutez d''abord: 20250201_create_and_configure_attachments_bucket.sql';
  END IF;
END $$;

