-- ============================================================
-- VÉRIFICATION ET CORRECTION FINALE - Bucket "attachments"
-- Date : 1 Février 2025
-- Description : Vérifie et corrige la configuration du bucket
--               et des politiques RLS pour garantir l'accès public
-- ============================================================

-- 1. Vérifier et forcer le bucket à être public
DO $$
BEGIN
  -- Vérifier si le bucket existe
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'attachments') THEN
    RAISE EXCEPTION 'Le bucket attachments n''existe pas. Créez-le d''abord dans le dashboard Supabase.';
  END IF;
  
  -- Forcer le bucket à être public
  UPDATE storage.buckets
  SET public = true
  WHERE id = 'attachments';
  
  IF FOUND THEN
    RAISE NOTICE '✅ Bucket attachments configuré comme PUBLIC';
  ELSE
    RAISE WARNING '⚠️ Impossible de mettre à jour le bucket (peut déjà être public)';
  END IF;
END $$;

-- 2. Supprimer TOUTES les politiques existantes pour attachments
-- (pour éviter les conflits)
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

-- 3. Créer les politiques RLS propres et correctes

-- Politique 1: Lecture publique (TRÈS IMPORTANTE - doit être TO public)
-- Permet à TOUT LE MONDE (y compris les utilisateurs non authentifiés) de voir les fichiers
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

-- 4. Vérification finale
DO $$
DECLARE
  bucket_public BOOLEAN;
  public_read_policy_exists BOOLEAN;
  insert_policy_exists BOOLEAN;
  policy_count INTEGER;
BEGIN
  -- Vérifier le bucket
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
      AND qual::text LIKE '%attachments%'
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
  
  -- Compter les politiques pour attachments
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND (
      policyname LIKE '%attachment%'
      OR qual::text LIKE '%attachment%'
      OR with_check::text LIKE '%attachment%'
    );
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RÉSULTAT DE LA VÉRIFICATION';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Bucket attachments public: %', CASE WHEN bucket_public THEN '✅ OUI' ELSE '❌ NON' END;
  RAISE NOTICE 'Politique lecture publique: %', CASE WHEN public_read_policy_exists THEN '✅ EXISTE' ELSE '❌ MANQUANTE' END;
  RAISE NOTICE 'Politique upload authentifié: %', CASE WHEN insert_policy_exists THEN '✅ EXISTE' ELSE '❌ MANQUANTE' END;
  RAISE NOTICE 'Total politiques attachments: %', policy_count;
  RAISE NOTICE '';
  
  IF bucket_public AND public_read_policy_exists AND insert_policy_exists THEN
    RAISE NOTICE '✅ Configuration correcte !';
    RAISE NOTICE '';
    RAISE NOTICE '📋 PROCHAINES ÉTAPES:';
    RAISE NOTICE '1. Attendez 2-3 minutes (délai de propagation Supabase)';
    RAISE NOTICE '2. Testez une URL directement dans votre navigateur:';
    RAISE NOTICE '   https://[votre-projet].supabase.co/storage/v1/object/public/attachments/[chemin-fichier]';
    RAISE NOTICE '3. Si l''image s''affiche, le problème est résolu';
    RAISE NOTICE '4. Rechargez votre application et réessayez l''upload';
  ELSE
    RAISE WARNING '⚠️ Configuration incomplète. Vérifiez les erreurs ci-dessus.';
    IF NOT bucket_public THEN
      RAISE WARNING '   → Le bucket n''est pas public. Activez "Public bucket" dans le dashboard Supabase.';
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
END $$;

-- 5. Lister toutes les politiques pour attachments (pour vérification manuelle)
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
    policyname LIKE '%attachment%'
    OR qual::text LIKE '%attachment%'
    OR with_check::text LIKE '%attachment%'
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

