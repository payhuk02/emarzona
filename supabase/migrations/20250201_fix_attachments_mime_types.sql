-- ============================================================
-- CORRECTION DES RESTRICTIONS MIME TYPES DU BUCKET "attachments"
-- Date : 1 Février 2025
-- Description : Supprimer les restrictions MIME types qui causent
--               l'erreur "mime type application/json is not supported"
-- ============================================================

-- ÉTAPE 1 : Vérifier le bucket
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'attachments') THEN
    RAISE EXCEPTION 'Le bucket "attachments" n''existe pas. Exécutez d''abord: 20250201_create_attachments_bucket.sql';
  END IF;
END $$;

-- ÉTAPE 2 : SUPPRIMER les restrictions MIME types
-- Le problème est que Supabase rejette les uploads si le Content-Type
-- ne correspond pas aux types autorisés. Quand les RLS bloquent l'upload,
-- Supabase retourne une erreur JSON, qui est ensuite rejetée par la validation MIME.
-- En supprimant cette restriction, on permet à Supabase de retourner l'erreur RLS
-- correctement au lieu de la rejeter comme "mime type not supported".

UPDATE storage.buckets
SET 
  allowed_mime_types = NULL, -- Supprimer toutes les restrictions MIME
  public = true
WHERE id = 'attachments';

-- ÉTAPE 3 : Vérification
DO $$
DECLARE
  bucket_public BOOLEAN;
  bucket_mime_types TEXT[];
BEGIN
  SELECT public, allowed_mime_types
  INTO bucket_public, bucket_mime_types
  FROM storage.buckets
  WHERE id = 'attachments';
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RÉSULTAT DE LA CORRECTION';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Bucket public: %', CASE WHEN bucket_public THEN '✅ OUI' ELSE '❌ NON' END;
  RAISE NOTICE 'Restrictions MIME: %', CASE WHEN bucket_mime_types IS NULL THEN '✅ AUCUNE (corrigé)' ELSE '⚠️ ' || array_to_string(bucket_mime_types, ', ') END;
  RAISE NOTICE '';
  
  IF bucket_public AND bucket_mime_types IS NULL THEN
    RAISE NOTICE '✅ Configuration correcte !';
    RAISE NOTICE '';
    RAISE NOTICE '📋 PROCHAINES ÉTAPES:';
    RAISE NOTICE '1. Attendez 1-2 minutes (délai de propagation)';
    RAISE NOTICE '2. Rechargez votre application (F5)';
    RAISE NOTICE '3. Réessayez l''upload d''un fichier';
    RAISE NOTICE '';
    RAISE NOTICE '💡 Si le problème persiste, vérifiez les politiques RLS';
    RAISE NOTICE '   avec: SELECT * FROM pg_policies WHERE schemaname = ''storage'' AND tablename = ''objects'';';
  ELSE
    RAISE WARNING '⚠️ Configuration incomplète.';
    IF NOT bucket_public THEN
      RAISE WARNING '   → Activez "Public bucket" dans Supabase Dashboard';
    END IF;
    IF bucket_mime_types IS NOT NULL THEN
      RAISE WARNING '   → Les restrictions MIME n''ont pas été supprimées';
    END IF;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;

