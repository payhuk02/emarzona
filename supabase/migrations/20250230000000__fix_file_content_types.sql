/**
 * Corriger les Content-Type incorrects pour les fichiers dans attachments
 * Date: 31 Janvier 2025
 * 
 * Ce script vérifie et corrige les métadonnées Content-Type des fichiers
 * qui ont été uploadés avec le mauvais type MIME
 */

-- =====================================================
-- 1. VÉRIFIER LES FICHIERS AVEC MAUVAIS CONTENT-TYPE
-- =====================================================

SELECT 
  name as "Nom du fichier",
  metadata->>'mimetype' as "Content-Type actuel",
  CASE 
    WHEN name LIKE '%.png' THEN 'image/png'
    WHEN name LIKE '%.jpg' OR name LIKE '%.jpeg' THEN 'image/jpeg'
    WHEN name LIKE '%.gif' THEN 'image/gif'
    WHEN name LIKE '%.webp' THEN 'image/webp'
    WHEN name LIKE '%.pdf' THEN 'application/pdf'
    WHEN name LIKE '%.mp4' THEN 'video/mp4'
    ELSE 'unknown'
  END as "Content-Type attendu",
  CASE 
    WHEN metadata->>'mimetype' != CASE 
      WHEN name LIKE '%.png' THEN 'image/png'
      WHEN name LIKE '%.jpg' OR name LIKE '%.jpeg' THEN 'image/jpeg'
      WHEN name LIKE '%.gif' THEN 'image/gif'
      WHEN name LIKE '%.webp' THEN 'image/webp'
      WHEN name LIKE '%.pdf' THEN 'application/pdf'
      WHEN name LIKE '%.mp4' THEN 'video/mp4'
      ELSE metadata->>'mimetype'
    END THEN '❌ INCORRECT'
    ELSE '✅ Correct'
  END as "Statut"
FROM storage.objects
WHERE bucket_id = 'attachments'
  AND (
    name LIKE 'vendor-message-attachments/%'
    OR name LIKE 'message-attachments/%'
  )
ORDER BY created_at DESC
LIMIT 20;

-- =====================================================
-- 2. CORRIGER LES CONTENT-TYPE INCORRECTS
-- =====================================================

-- IMPORTANT: Cette requête met à jour les métadonnées, mais Supabase Storage
-- peut toujours servir les fichiers avec le mauvais Content-Type si les fichiers
-- eux-mêmes sont corrompus ou contiennent du JSON.

DO $$
DECLARE
  file_record RECORD;
  correct_mimetype TEXT;
  updated_count INTEGER := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'CORRECTION DES CONTENT-TYPE';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  
  FOR file_record IN 
    SELECT 
      id,
      name,
      metadata->>'mimetype' as current_mimetype
    FROM storage.objects
    WHERE bucket_id = 'attachments'
      AND (
        name LIKE 'vendor-message-attachments/%'
        OR name LIKE 'message-attachments/%'
      )
      AND (
        -- Fichiers avec Content-Type incorrect
        metadata->>'mimetype' = 'application/json'
        OR metadata->>'mimetype' IS NULL
        OR (
          name LIKE '%.png' AND metadata->>'mimetype' != 'image/png'
        )
        OR (
          (name LIKE '%.jpg' OR name LIKE '%.jpeg') 
          AND metadata->>'mimetype' != 'image/jpeg'
        )
        OR (
          name LIKE '%.gif' AND metadata->>'mimetype' != 'image/gif'
        )
        OR (
          name LIKE '%.webp' AND metadata->>'mimetype' != 'image/webp'
        )
      )
  LOOP
    -- Déterminer le bon Content-Type selon l'extension
    correct_mimetype := CASE 
      WHEN file_record.name LIKE '%.png' THEN 'image/png'
      WHEN file_record.name LIKE '%.jpg' OR file_record.name LIKE '%.jpeg' THEN 'image/jpeg'
      WHEN file_record.name LIKE '%.gif' THEN 'image/gif'
      WHEN file_record.name LIKE '%.webp' THEN 'image/webp'
      WHEN file_record.name LIKE '%.pdf' THEN 'application/pdf'
      WHEN file_record.name LIKE '%.mp4' THEN 'video/mp4'
      ELSE file_record.current_mimetype
    END;
    
    -- Mettre à jour les métadonnées
    UPDATE storage.objects
    SET metadata = jsonb_set(
      COALESCE(metadata, '{}'::jsonb),
      '{mimetype}',
      to_jsonb(correct_mimetype)
    )
    WHERE id = file_record.id;
    
    updated_count := updated_count + 1;
    RAISE NOTICE '✅ Corrigé: % → %', file_record.name, correct_mimetype;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE 'Total fichiers corrigés: %', updated_count;
  RAISE NOTICE '';
  
  IF updated_count = 0 THEN
    RAISE NOTICE '✅ Aucun fichier à corriger';
  ELSE
    RAISE NOTICE '⚠️ ATTENTION: Si les fichiers contiennent réellement du JSON';
    RAISE NOTICE '   (pas seulement les métadonnées), ils doivent être réuploadés.';
  END IF;
  
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;

-- =====================================================
-- 3. VÉRIFICATION APRÈS CORRECTION
-- =====================================================

SELECT 
  COUNT(*) FILTER (WHERE metadata->>'mimetype' = 'application/json') as "Fichiers avec JSON",
  COUNT(*) FILTER (WHERE name LIKE '%.png' AND metadata->>'mimetype' = 'image/png') as "PNG corrects",
  COUNT(*) FILTER (WHERE name LIKE '%.png' AND metadata->>'mimetype' != 'image/png') as "PNG incorrects",
  COUNT(*) as "Total fichiers"
FROM storage.objects
WHERE bucket_id = 'attachments'
  AND (
    name LIKE 'vendor-message-attachments/%'
    OR name LIKE 'message-attachments/%'
  );

-- =====================================================
-- 4. RECOMMANDATION
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'IMPORTANT:';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'Si les métadonnées sont corrigées mais les fichiers';
  RAISE NOTICE 'ne s''affichent toujours pas, cela signifie que les fichiers';
  RAISE NOTICE 'eux-mêmes contiennent du JSON (erreur d''upload).';
  RAISE NOTICE '';
  RAISE NOTICE 'Dans ce cas:';
  RAISE NOTICE '1. Les fichiers doivent être supprimés et réuploadés';
  RAISE NOTICE '2. Vérifiez le code d''upload pour s''assurer qu''il envoie';
  RAISE NOTICE '   le bon Content-Type lors de l''upload';
  RAISE NOTICE '3. Vérifiez que le fichier uploadé est bien une image';
  RAISE NOTICE '   et non un message d''erreur JSON';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;

