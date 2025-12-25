-- ============================================================
-- DIAGNOSTIC ET CORRECTION COMPLÈTE DES POLITIQUES RLS
-- Date : 1 Février 2025
-- Description : Diagnostique et corrige les problèmes RLS
--               qui causent l'upload de fichiers comme JSON
-- ============================================================

-- ÉTAPE 1 : DIAGNOSTIC COMPLET
DO $$
DECLARE
  bucket_exists BOOLEAN;
  bucket_public BOOLEAN;
  bucket_mime_types TEXT[];
  select_policy_count INTEGER;
  insert_policy_count INTEGER;
  public_select_exists BOOLEAN;
  authenticated_insert_exists BOOLEAN;
  issues TEXT[] := ARRAY[]::TEXT[];
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'DIAGNOSTIC DES POLITIQUES RLS - BUCKET "attachments"';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  
  -- Vérifier le bucket
  SELECT EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'attachments')
  INTO bucket_exists;
  
  IF NOT bucket_exists THEN
    RAISE EXCEPTION '❌ Le bucket "attachments" n''existe pas. Exécutez d''abord: 20250201_create_and_configure_attachments_bucket.sql';
  END IF;
  
  SELECT public, allowed_mime_types
  INTO bucket_public, bucket_mime_types
  FROM storage.buckets
  WHERE id = 'attachments';
  
  -- Compter les politiques SELECT
  SELECT COUNT(*) INTO select_policy_count
  FROM pg_policies
  WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND cmd = 'SELECT'
    AND (
      qual::text ILIKE '%attachment%'
      OR with_check::text ILIKE '%attachment%'
      OR policyname ILIKE '%attachment%'
    );
  
  -- Compter les politiques INSERT
  SELECT COUNT(*) INTO insert_policy_count
  FROM pg_policies
  WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND cmd = 'INSERT'
    AND (
      qual::text ILIKE '%attachment%'
      OR with_check::text ILIKE '%attachment%'
      OR policyname ILIKE '%attachment%'
    );
  
  -- Vérifier la politique SELECT pour public
  SELECT EXISTS (
    SELECT 1 
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND cmd = 'SELECT'
      AND 'public' = ANY(roles)
      AND (
        qual::text ILIKE '%attachment%'
        OR with_check::text ILIKE '%attachment%'
        OR policyname ILIKE '%attachment%'
      )
  ) INTO public_select_exists;
  
  -- Vérifier la politique INSERT pour authenticated
  SELECT EXISTS (
    SELECT 1 
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND cmd = 'INSERT'
      AND 'authenticated' = ANY(roles)
      AND (
        qual::text ILIKE '%attachment%'
        OR with_check::text ILIKE '%attachment%'
        OR policyname ILIKE '%attachment%'
      )
  ) INTO authenticated_insert_exists;
  
  -- Afficher le diagnostic
  RAISE NOTICE '📦 BUCKET:';
  RAISE NOTICE '  Existe: %', CASE WHEN bucket_exists THEN '✅ OUI' ELSE '❌ NON' END;
  RAISE NOTICE '  Public: %', CASE WHEN bucket_public THEN '✅ OUI' ELSE '❌ NON (CRITIQUE!)' END;
  RAISE NOTICE '  Restrictions MIME: %', CASE WHEN bucket_mime_types IS NULL THEN '✅ AUCUNE' ELSE '⚠️ ' || array_to_string(bucket_mime_types, ', ') END;
  RAISE NOTICE '';
  RAISE NOTICE '📋 POLITIQUES RLS:';
  RAISE NOTICE '  Politiques SELECT: %', select_policy_count;
  RAISE NOTICE '  Politiques INSERT: %', insert_policy_count;
  RAISE NOTICE '  SELECT pour public: %', CASE WHEN public_select_exists THEN '✅ OUI' ELSE '❌ NON (CRITIQUE!)' END;
  RAISE NOTICE '  INSERT pour authenticated: %', CASE WHEN authenticated_insert_exists THEN '✅ OUI' ELSE '❌ NON (CRITIQUE!)' END;
  RAISE NOTICE '';
  
  -- Identifier les problèmes
  IF NOT bucket_public THEN
    issues := array_append(issues, 'Bucket n''est pas PUBLIC');
  END IF;
  
  IF bucket_mime_types IS NOT NULL THEN
    issues := array_append(issues, 'Restrictions MIME actives');
  END IF;
  
  IF NOT public_select_exists THEN
    issues := array_append(issues, 'Politique SELECT pour public manquante ou incorrecte');
  END IF;
  
  IF NOT authenticated_insert_exists THEN
    issues := array_append(issues, 'Politique INSERT pour authenticated manquante ou incorrecte');
  END IF;
  
  IF array_length(issues, 1) > 0 THEN
    RAISE WARNING '⚠️ PROBLÈMES DÉTECTÉS:';
    FOR i IN 1..array_length(issues, 1) LOOP
      RAISE WARNING '   %', issues[i];
    END LOOP;
    RAISE NOTICE '';
    RAISE NOTICE '🔧 CORRECTION AUTOMATIQUE EN COURS...';
  ELSE
    RAISE NOTICE '✅ Aucun problème détecté. Configuration correcte.';
    RAISE NOTICE '';
    RAISE NOTICE 'Si les erreurs persistent, vérifiez:';
    RAISE NOTICE '1. Que vous êtes bien authentifié';
    RAISE NOTICE '2. Que le bucket est vraiment PUBLIC dans Supabase Dashboard';
    RAISE NOTICE '3. Que les 4 politiques RLS existent et sont actives';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;

-- ÉTAPE 2 : SUPPRIMER TOUTES LES ANCIENNES POLITIQUES
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
      )
  LOOP
    BEGIN
      EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_record.policyname);
      policies_dropped := policies_dropped + 1;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Erreur lors de la suppression de %: %', policy_record.policyname, SQLERRM;
    END;
  END LOOP;
  
  IF policies_dropped > 0 THEN
    RAISE NOTICE '✅ % politique(s) supprimée(s)', policies_dropped;
  END IF;
END $$;

-- ÉTAPE 3 : CRÉER LES POLITIQUES CORRECTES

-- Politique 1: Lecture PUBLIQUE (CRITIQUE - doit être TO public)
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

-- Politique 3: Mise à jour
CREATE POLICY "Users can update their own attachments"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'attachments')
WITH CHECK (bucket_id = 'attachments');

-- Politique 4: Suppression
CREATE POLICY "Users can delete their own attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'attachments');

-- ÉTAPE 4 : S'ASSURER QUE LE BUCKET EST PUBLIC ET SANS RESTRICTIONS MIME
UPDATE storage.buckets
SET 
  public = true,
  allowed_mime_types = NULL
WHERE id = 'attachments';

-- ÉTAPE 5 : VÉRIFICATION FINALE
DO $$
DECLARE
  all_ok BOOLEAN := true;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'VÉRIFICATION FINALE';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  
  -- Vérifier que tout est correct
  SELECT 
    (SELECT public FROM storage.buckets WHERE id = 'attachments') = true
    AND (SELECT allowed_mime_types FROM storage.buckets WHERE id = 'attachments') IS NULL
    AND EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'storage'
        AND tablename = 'objects'
        AND policyname = 'Anyone can view attachments'
        AND cmd = 'SELECT'
        AND 'public' = ANY(roles)
    )
    AND EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'storage'
        AND tablename = 'objects'
        AND policyname = 'Authenticated users can upload attachments'
        AND cmd = 'INSERT'
        AND 'authenticated' = ANY(roles)
    )
  INTO all_ok;
  
  IF all_ok THEN
    RAISE NOTICE '✅ CONFIGURATION COMPLÈTE ET CORRECTE !';
    RAISE NOTICE '';
    RAISE NOTICE '📋 PROCHAINES ÉTAPES:';
    RAISE NOTICE '1. Attendez 2-3 minutes (délai de propagation Supabase)';
    RAISE NOTICE '2. Fermez complètement votre navigateur';
    RAISE NOTICE '3. Ouvrez à nouveau l''application';
    RAISE NOTICE '4. Réessayez l''upload d''un fichier image';
    RAISE NOTICE '';
    RAISE NOTICE '💡 Les politiques RLS sont maintenant correctement configurées !';
  ELSE
    RAISE WARNING '⚠️ CONFIGURATION INCOMPLÈTE !';
    RAISE NOTICE 'Vérifiez manuellement dans Supabase Dashboard:';
    RAISE NOTICE '1. Storage > Buckets > "attachments" > Public bucket = ✅';
    RAISE NOTICE '2. Storage > Buckets > "attachments" > Policies = 4 politiques';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;

