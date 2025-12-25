/**
 * Fix RLS policies for attachments bucket
 * Date: 30 Janvier 2025
 * 
 * Force la réapplication des politiques RLS pour le bucket "attachments"
 * pour corriger les problèmes d'accès aux fichiers
 */

-- =====================================================
-- VÉRIFICATION ET CORRECTION DU BUCKET
-- =====================================================

-- S'assurer que le bucket est public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'attachments';

-- =====================================================
-- SUPPRESSION DES ANCIENNES POLITIQUES
-- =====================================================

-- Supprimer toutes les politiques existantes pour éviter les conflits
DROP POLICY IF EXISTS "Anyone can view attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own attachments" ON storage.objects;

-- =====================================================
-- CRÉATION DES NOUVELLES POLITIQUES RLS
-- =====================================================

-- Politique 1 : Lecture publique (TRÈS IMPORTANTE)
-- Permet à TOUT LE MONDE (y compris les utilisateurs non authentifiés) de voir les fichiers
CREATE POLICY "Anyone can view attachments"
ON storage.objects
FOR SELECT
USING (bucket_id = 'attachments');

-- Politique 2 : Upload pour utilisateurs authentifiés
-- Permet à tous les utilisateurs authentifiés d'uploader dans n'importe quel dossier
CREATE POLICY "Authenticated users can upload attachments"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'attachments'
  AND auth.role() = 'authenticated'
);

-- Politique 3 : Mise à jour pour utilisateurs authentifiés
CREATE POLICY "Users can update their own attachments"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'attachments'
  AND auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'attachments'
  AND auth.role() = 'authenticated'
);

-- Politique 4 : Suppression pour utilisateurs authentifiés
CREATE POLICY "Users can delete their own attachments"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'attachments'
  AND auth.role() = 'authenticated'
);

-- =====================================================
-- VÉRIFICATION
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
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'objects'
  AND schemaname = 'storage'
  AND policyname LIKE '%attachments%';
  
  IF policy_count >= 4 THEN
    RAISE NOTICE '✅ % politiques RLS créées pour le bucket "attachments"', policy_count;
  ELSE
    RAISE WARNING '⚠️ Seulement % politiques RLS trouvées (attendu: 4)', policy_count;
  END IF;
END $$;

