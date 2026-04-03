-- ============================================================
-- TEST COMPLET - Upload et Accès aux Fichiers
-- Date : 1 Février 2025
-- Description : Vérifie que le bucket est correctement configuré
--               et teste l'accès aux fichiers
-- ============================================================

-- Vérifier le bucket
SELECT 
  id,
  name,
  public as "Public (DOIT être true)",
  allowed_mime_types as "Restrictions MIME (DOIT être NULL)",
  file_size_limit as "Taille max (bytes)"
FROM storage.buckets
WHERE id = 'attachments';

-- Vérifier les fichiers existants dans le bucket
SELECT 
  name as "Nom du fichier",
  id,
  metadata->>'mimetype' as "Content-Type",
  (metadata->>'size')::bigint as "Taille (bytes)",
  created_at as "Créé le"
FROM storage.objects
WHERE bucket_id = 'attachments'
ORDER BY created_at DESC
LIMIT 10;

-- Vérifier les politiques RLS une dernière fois
SELECT 
  policyname as "Politique",
  cmd as "Opération",
  roles::text as "Rôles",
  CASE 
    WHEN 'public' = ANY(roles) THEN '✅ PUBLIC'
    WHEN 'authenticated' = ANY(roles) THEN '⚠️ AUTHENTICATED'
    ELSE '❓ AUTRE'
  END as "Type d'accès"
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname ILIKE '%attachment%'
ORDER BY 
  CASE cmd
    WHEN 'SELECT' THEN 1
    WHEN 'INSERT' THEN 2
    WHEN 'UPDATE' THEN 3
    WHEN 'DELETE' THEN 4
    ELSE 5
  END;

-- Diagnostic final
DO $$
DECLARE
  bucket_public BOOLEAN;
  bucket_mime_types TEXT[];
  select_policy_public BOOLEAN;
  file_count INTEGER;
BEGIN
  -- Vérifier le bucket
  SELECT public, allowed_mime_types
  INTO bucket_public, bucket_mime_types
  FROM storage.buckets
  WHERE id = 'attachments';
  
  -- Vérifier la politique SELECT
  SELECT EXISTS (
    SELECT 1 
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND cmd = 'SELECT'
      AND 'public' = ANY(roles)
      AND policyname ILIKE '%attachment%'
  ) INTO select_policy_public;
  
  -- Compter les fichiers
  SELECT COUNT(*) INTO file_count
  FROM storage.objects
  WHERE bucket_id = 'attachments';
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'DIAGNOSTIC FINAL';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📦 BUCKET:';
  RAISE NOTICE '  Public: %', CASE WHEN bucket_public THEN '✅ OUI' ELSE '❌ NON (PROBLÈME!)' END;
  RAISE NOTICE '  Restrictions MIME: %', CASE WHEN bucket_mime_types IS NULL THEN '✅ AUCUNE' ELSE '⚠️ ' || array_to_string(bucket_mime_types, ', ') END;
  RAISE NOTICE '';
  RAISE NOTICE '📋 POLITIQUES:';
  RAISE NOTICE '  SELECT pour public: %', CASE WHEN select_policy_public THEN '✅ OUI' ELSE '❌ NON (PROBLÈME!)' END;
  RAISE NOTICE '';
  RAISE NOTICE '📁 FICHIERS:';
  RAISE NOTICE '  Nombre de fichiers: %', file_count;
  RAISE NOTICE '';
  
  IF bucket_public AND bucket_mime_types IS NULL AND select_policy_public THEN
    RAISE NOTICE '✅ CONFIGURATION CORRECTE !';
    RAISE NOTICE '';
    RAISE NOTICE 'Si les erreurs persistent, le problème peut être:';
    RAISE NOTICE '1. Délai de propagation Supabase (attendez 5-10 minutes)';
    RAISE NOTICE '2. Cache du navigateur (videz le cache)';
    RAISE NOTICE '3. Problème avec le contenu réel du fichier uploadé';
    RAISE NOTICE '';
  ELSE
    RAISE WARNING '⚠️ PROBLÈMES DÉTECTÉS:';
    IF NOT bucket_public THEN
      RAISE WARNING '   ❌ Le bucket n''est pas PUBLIC';
      RAISE WARNING '   → Allez dans Supabase Dashboard > Storage > Buckets > "attachments"';
      RAISE WARNING '   → Activez "Public bucket" et sauvegardez';
    END IF;
    IF bucket_mime_types IS NOT NULL THEN
      RAISE WARNING '   ❌ Restrictions MIME actives';
      RAISE WARNING '   → Exécutez: UPDATE storage.buckets SET allowed_mime_types = NULL WHERE id = ''attachments'';';
    END IF;
    IF NOT select_policy_public THEN
      RAISE WARNING '   ❌ Politique SELECT pas pour public';
      RAISE WARNING '   → Vérifiez les politiques RLS';
    END IF;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;

