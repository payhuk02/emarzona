-- ============================================================
-- CRÉATION ET CONFIGURATION COMPLÈTE DU BUCKET "attachments"
-- Date : 1 Février 2025
-- Description : Crée le bucket "attachments" s'il n'existe pas
--               et le configure complètement (public + RLS)
-- ============================================================

-- ÉTAPE 1 : Créer le bucket s'il n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'attachments') THEN
    -- Créer le bucket
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'attachments',
      'attachments',
      true, -- PUBLIC (très important)
      10485760, -- 10MB
      NULL -- Pas de restrictions MIME (pour éviter l'erreur "mime type application/json is not supported")
    );
    
    RAISE NOTICE '✅ Bucket "attachments" créé avec succès';
  ELSE
    RAISE NOTICE 'ℹ️ Le bucket "attachments" existe déjà';
    
    -- S'assurer qu'il est public et sans restrictions MIME
    UPDATE storage.buckets
    SET 
      public = true,
      allowed_mime_types = NULL
    WHERE id = 'attachments';
    
    IF FOUND THEN
      RAISE NOTICE '✅ Bucket "attachments" mis à jour (public + pas de restrictions MIME)';
    END IF;
  END IF;
END $$;

-- ÉTAPE 2 : Supprimer toutes les anciennes politiques pour éviter les conflits
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
  
  IF policies_dropped > 0 THEN
    RAISE NOTICE '✅ % politique(s) supprimée(s)', policies_dropped;
  ELSE
    RAISE NOTICE 'ℹ️ Aucune politique existante à supprimer';
  END IF;
END $$;

-- ÉTAPE 3 : Créer les politiques RLS

-- Politique 1: Lecture publique (CRITIQUE - doit être TO public)
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

-- ÉTAPE 4 : Vérification complète
DO $$
DECLARE
  bucket_exists BOOLEAN;
  bucket_public BOOLEAN;
  bucket_mime_types TEXT[];
  public_read_policy_exists BOOLEAN;
  insert_policy_exists BOOLEAN;
  update_policy_exists BOOLEAN;
  delete_policy_exists BOOLEAN;
  policy_count INTEGER;
  all_ok BOOLEAN := true;
BEGIN
  -- Vérifier le bucket
  SELECT EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'attachments')
  INTO bucket_exists;
  
  IF bucket_exists THEN
    SELECT public, allowed_mime_types
    INTO bucket_public, bucket_mime_types
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
    IF bucket_mime_types IS NOT NULL THEN
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
    RAISE NOTICE '  Existe: %', CASE WHEN bucket_exists THEN '✅ OUI' ELSE '❌ NON' END;
    RAISE NOTICE '  Public: %', CASE WHEN bucket_public THEN '✅ OUI' ELSE '❌ NON (CRITIQUE!)' END;
    RAISE NOTICE '  Restrictions MIME: %', CASE WHEN bucket_mime_types IS NULL THEN '✅ AUCUNE (correct)' ELSE '⚠️ ' || array_to_string(bucket_mime_types, ', ') END;
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
      RAISE NOTICE '1. Attendez 1-2 minutes (délai de propagation Supabase)';
      RAISE NOTICE '2. Rechargez votre application (F5)';
      RAISE NOTICE '3. Vérifiez que vous êtes bien authentifié';
      RAISE NOTICE '4. Réessayez l''upload d''un fichier image';
      RAISE NOTICE '';
      RAISE NOTICE '💡 Le bucket est maintenant créé et configuré correctement !';
    ELSE
      RAISE WARNING '⚠️ CONFIGURATION INCOMPLÈTE !';
      RAISE NOTICE '';
      IF NOT bucket_public THEN
        RAISE WARNING '   ❌ Le bucket n''est PAS public.';
        RAISE WARNING '   → Allez dans Supabase Dashboard > Storage > Buckets > "attachments"';
        RAISE WARNING '   → Activez "Public bucket" et sauvegardez';
      END IF;
      IF bucket_mime_types IS NOT NULL THEN
        RAISE WARNING '   ❌ Les restrictions MIME n''ont pas été supprimées.';
        RAISE WARNING '   → Exécutez: 20250201_fix_attachments_mime_types.sql';
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
    RAISE EXCEPTION '❌ Le bucket "attachments" n''a pas pu être créé. Vérifiez les permissions.';
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

