/**
 * Force fix RLS policies for attachments bucket
 * Date: 31 Janvier 2025
 * 
 * Ce script force la suppression et recréation de toutes les politiques RLS
 * pour résoudre les problèmes de politiques existantes ou mal configurées
 */

-- =====================================================
-- ÉTAPE 1 : S'ASSURER QUE LE BUCKET EST PUBLIC
-- =====================================================

UPDATE storage.buckets 
SET public = true 
WHERE id = 'attachments';

-- =====================================================
-- ÉTAPE 2 : SUPPRESSION FORCÉE DE TOUTES LES POLITIQUES
-- =====================================================

-- Supprimer toutes les variantes possibles de noms de politiques
DROP POLICY IF EXISTS "Anyone can view attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own attachments" ON storage.objects;

-- Supprimer aussi d'éventuelles politiques avec des noms légèrement différents
DROP POLICY IF EXISTS "anyone_can_view_attachments" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_users_can_upload_attachments" ON storage.objects;
DROP POLICY IF EXISTS "users_can_update_their_own_attachments" ON storage.objects;
DROP POLICY IF EXISTS "users_can_delete_their_own_attachments" ON storage.objects;

-- Supprimer toutes les politiques contenant "attachments" (au cas où)
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN 
    SELECT policyname 
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname LIKE '%attachment%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_record.policyname);
    RAISE NOTICE 'Suppression de la politique: %', policy_record.policyname;
  END LOOP;
END $$;

-- =====================================================
-- ÉTAPE 3 : CRÉATION DES NOUVELLES POLITIQUES
-- =====================================================

-- Politique 1 : Lecture publique (TRÈS IMPORTANTE)
-- Permet à TOUT LE MONDE (y compris les utilisateurs non authentifiés) de voir les fichiers
-- IMPORTANT : Utiliser TO public pour garantir l'accès public
CREATE POLICY "Anyone can view attachments"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'attachments');

-- Politique 2 : Upload pour utilisateurs authentifiés
-- IMPORTANT : Utilise WITH CHECK (pas USING) pour INSERT et TO authenticated
CREATE POLICY "Authenticated users can upload attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'attachments');

-- Politique 3 : Mise à jour pour utilisateurs authentifiés
CREATE POLICY "Users can update their own attachments"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'attachments')
WITH CHECK (bucket_id = 'attachments');

-- Politique 4 : Suppression pour utilisateurs authentifiés
CREATE POLICY "Users can delete their own attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'attachments');

-- =====================================================
-- ÉTAPE 4 : VÉRIFICATION
-- =====================================================

-- Vérifier que le bucket est bien public
DO $$
DECLARE
  bucket_is_public BOOLEAN;
BEGIN
  SELECT public INTO bucket_is_public
  FROM storage.buckets
  WHERE id = 'attachments';
  
  IF bucket_is_public THEN
    RAISE NOTICE '✅ Bucket "attachments" est public';
  ELSE
    RAISE WARNING '❌ Bucket "attachments" n''est PAS public. Problème de configuration!';
  END IF;
END $$;

-- Vérifier que les politiques existent
DO $$
DECLARE
  policy_count INTEGER;
  select_policy_exists BOOLEAN;
  insert_policy_exists BOOLEAN;
  update_policy_exists BOOLEAN;
  delete_policy_exists BOOLEAN;
BEGIN
  -- Compter les politiques
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname LIKE '%attachment%';
  
  -- Vérifier chaque politique individuellement
  SELECT EXISTS(
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Anyone can view attachments'
      AND cmd = 'SELECT'
  ) INTO select_policy_exists;
  
  SELECT EXISTS(
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Authenticated users can upload attachments'
      AND cmd = 'INSERT'
  ) INTO insert_policy_exists;
  
  SELECT EXISTS(
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users can update their own attachments'
      AND cmd = 'UPDATE'
  ) INTO update_policy_exists;
  
  SELECT EXISTS(
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users can delete their own attachments'
      AND cmd = 'DELETE'
  ) INTO delete_policy_exists;
  
  -- Afficher les résultats
  RAISE NOTICE '';
  RAISE NOTICE '📋 RÉSULTATS DE LA CRÉATION:';
  RAISE NOTICE '';
  
  IF select_policy_exists THEN
    RAISE NOTICE '✅ "Anyone can view attachments" (SELECT) - Créée';
  ELSE
    RAISE WARNING '❌ "Anyone can view attachments" (SELECT) - ÉCHEC DE CRÉATION';
  END IF;
  
  IF insert_policy_exists THEN
    RAISE NOTICE '✅ "Authenticated users can upload attachments" (INSERT) - Créée';
  ELSE
    RAISE WARNING '❌ "Authenticated users can upload attachments" (INSERT) - ÉCHEC DE CRÉATION';
  END IF;
  
  IF update_policy_exists THEN
    RAISE NOTICE '✅ "Users can update their own attachments" (UPDATE) - Créée';
  ELSE
    RAISE WARNING '❌ "Users can update their own attachments" (UPDATE) - ÉCHEC DE CRÉATION';
  END IF;
  
  IF delete_policy_exists THEN
    RAISE NOTICE '✅ "Users can delete their own attachments" (DELETE) - Créée';
  ELSE
    RAISE WARNING '❌ "Users can delete their own attachments" (DELETE) - ÉCHEC DE CRÉATION';
  END IF;
  
  -- Résumé
  IF select_policy_exists AND insert_policy_exists AND update_policy_exists AND delete_policy_exists THEN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Toutes les politiques RLS ont été créées avec succès!';
    RAISE NOTICE '';
    RAISE NOTICE 'Prochaines étapes:';
    RAISE NOTICE '1. Exécutez le script de vérification: 20250230_verify_attachments_rls.sql';
    RAISE NOTICE '2. Testez l''upload d''une nouvelle image dans la messagerie';
    RAISE NOTICE '3. Vérifiez que les images existantes s''affichent correctement';
  ELSE
    RAISE NOTICE '';
    RAISE WARNING '⚠️ Certaines politiques n''ont pas pu être créées. Vérifiez les erreurs ci-dessus.';
  END IF;
END $$;

