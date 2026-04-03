/**
 * Identifier les fichiers potentiellement corrompus dans attachments
 * Date: 31 Janvier 2025
 * 
 * Ce script liste les fichiers avec des métadonnées suspectes
 * pour identifier ceux qui doivent être vérifiés manuellement
 */

-- =====================================================
-- LISTER LES FICHIERS SUSPECTS
-- =====================================================

SELECT 
  name as "Nom du fichier",
  id as "ID",
  metadata->>'mimetype' as "Content-Type actuel",
  CASE 
    WHEN name LIKE '%.png' THEN 'image/png'
    WHEN name LIKE '%.jpg' OR name LIKE '%.jpeg' THEN 'image/jpeg'
    WHEN name LIKE '%.gif' THEN 'image/gif'
    WHEN name LIKE '%.webp' THEN 'image/webp'
    ELSE 'unknown'
  END as "Content-Type attendu",
  (metadata->>'size')::bigint as "Taille (bytes)",
  created_at as "Créé le",
  CASE 
    WHEN metadata->>'mimetype' = 'application/json' THEN '❌ SUSPECT (JSON)'
    WHEN name LIKE '%.png' AND metadata->>'mimetype' != 'image/png' THEN '⚠️ Content-Type incorrect'
    WHEN name LIKE '%.jpg' AND metadata->>'mimetype' != 'image/jpeg' THEN '⚠️ Content-Type incorrect'
    ELSE '✅ OK'
  END as "Statut"
FROM storage.objects
WHERE bucket_id = 'attachments'
  AND (
    name LIKE 'vendor-message-attachments/%'
    OR name LIKE 'message-attachments/%'
  )
ORDER BY 
  CASE 
    WHEN metadata->>'mimetype' = 'application/json' THEN 1
    WHEN name LIKE '%.png' AND metadata->>'mimetype' != 'image/png' THEN 2
    ELSE 3
  END,
  created_at DESC;

-- =====================================================
-- RECOMMANDATION
-- =====================================================

DO $$
DECLARE
  json_files_count INTEGER;
  total_files_count INTEGER;
BEGIN
  SELECT 
    COUNT(*) FILTER (WHERE metadata->>'mimetype' = 'application/json'),
    COUNT(*)
  INTO json_files_count, total_files_count
  FROM storage.objects
  WHERE bucket_id = 'attachments'
    AND (
      name LIKE 'vendor-message-attachments/%'
      OR name LIKE 'message-attachments/%'
    );
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'RÉSUMÉ:';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'Total fichiers: %', total_files_count;
  RAISE NOTICE 'Fichiers avec Content-Type JSON: %', json_files_count;
  RAISE NOTICE '';
  
  IF json_files_count > 0 THEN
    RAISE WARNING '⚠️ % fichier(s) ont un Content-Type JSON', json_files_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Ces fichiers doivent être vérifiés manuellement:';
    RAISE NOTICE '1. Téléchargez-les depuis Supabase Dashboard';
    RAISE NOTICE '2. Ouvrez-les avec un éditeur de texte';
    RAISE NOTICE '3. Si le contenu est du JSON, les fichiers sont corrompus';
    RAISE NOTICE '';
    RAISE NOTICE 'Si corrompus:';
    RAISE NOTICE '- Supprimez-les depuis Supabase Dashboard';
    RAISE NOTICE '- Réuploadez les images originales';
    RAISE NOTICE '';
    RAISE NOTICE 'Les nouveaux uploads fonctionneront correctement';
    RAISE NOTICE 'grâce aux corrections du code d''upload.';
  ELSE
    RAISE NOTICE '✅ Aucun fichier suspect trouvé dans les métadonnées';
    RAISE NOTICE '   (mais le contenu réel peut toujours être corrompu)';
  END IF;
  
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;

