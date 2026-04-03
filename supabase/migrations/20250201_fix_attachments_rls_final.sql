-- =====================================================
-- Fix RLS Policies pour bucket "attachments" - Version Finale
-- Date: 1 Février 2025
-- 
-- Corrige le problème où le serveur retourne du JSON au lieu d'une image
-- =====================================================

-- ÉTAPE 1 : S'assurer que le bucket est public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'attachments';

-- ÉTAPE 2 : Supprimer toutes les politiques existantes
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
        OR policyname LIKE '%Anyone%'
        OR policyname LIKE '%Authenticated%'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_record.policyname);
  END LOOP;
END $$;

-- ÉTAPE 3 : Créer les politiques RLS correctes

-- Politique 1 : Lecture PUBLIQUE (TO public) - CRITIQUE pour getPublicUrl()
CREATE POLICY "Anyone can view attachments"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'attachments');

-- Politique 2 : Upload pour utilisateurs authentifiés
CREATE POLICY "Authenticated users can upload attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'attachments'
  AND auth.uid() IS NOT NULL
);

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

-- ÉTAPE 4 : Vérification
DO $$
DECLARE
  bucket_is_public BOOLEAN;
  select_policy_exists BOOLEAN;
BEGIN
  -- Vérifier que le bucket est public
  SELECT public INTO bucket_is_public
  FROM storage.buckets
  WHERE id = 'attachments';
  
  IF bucket_is_public THEN
    RAISE NOTICE '✅ Bucket "attachments" est public';
  ELSE
    RAISE WARNING '❌ Bucket "attachments" n''est PAS public';
  END IF;
  
  -- Vérifier que la politique SELECT existe
  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Anyone can view attachments'
      AND cmd = 'SELECT'
      AND roles::text LIKE '%public%'
  ) INTO select_policy_exists;
  
  IF select_policy_exists THEN
    RAISE NOTICE '✅ Politique SELECT publique existe';
  ELSE
    RAISE WARNING '❌ Politique SELECT publique MANQUANTE';
  END IF;
END $$;

