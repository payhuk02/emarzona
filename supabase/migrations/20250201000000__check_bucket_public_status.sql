-- ============================================================
-- VÉRIFICATION DU STATUT PUBLIC DU BUCKET "attachments"
-- Date : 1 Février 2025
-- Description : Vérifie si le bucket est vraiment public
-- ============================================================

-- Vérifier le statut du bucket
SELECT 
  id as "Bucket ID",
  name as "Nom",
  public as "Est Public",
  file_size_limit as "Limite Taille",
  allowed_mime_types as "Types MIME Autorisés",
  created_at as "Créé le"
FROM storage.buckets
WHERE id = 'attachments';

-- Si le bucket n'est pas public, l'afficher clairement
DO $$
DECLARE
  bucket_public BOOLEAN;
BEGIN
  SELECT public INTO bucket_public
  FROM storage.buckets
  WHERE id = 'attachments';
  
  IF bucket_public IS NULL THEN
    RAISE EXCEPTION '❌ Le bucket "attachments" n''existe pas !';
  ELSIF NOT bucket_public THEN
    RAISE WARNING '⚠️ ATTENTION: Le bucket "attachments" n''est PAS public !';
    RAISE NOTICE '';
    RAISE NOTICE '📋 SOLUTION:';
    RAISE NOTICE '1. Allez dans Supabase Dashboard > Storage > Buckets';
    RAISE NOTICE '2. Cliquez sur le bucket "attachments"';
    RAISE NOTICE '3. Activez l''option "Public bucket" (icône de globe 🌐)';
    RAISE NOTICE '4. Attendez 2-3 minutes pour la propagation';
    RAISE NOTICE '';
    RAISE NOTICE '💡 Même avec les politiques RLS correctes, le bucket DOIT être marqué comme public';
    RAISE NOTICE '   pour que les URLs publiques fonctionnent correctement.';
  ELSE
    RAISE NOTICE '✅ Le bucket "attachments" est PUBLIC';
  END IF;
END $$;

