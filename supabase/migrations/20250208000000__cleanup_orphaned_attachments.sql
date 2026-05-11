-- ============================================================
-- NETTOYAGE DES FICHIERS ORPHELINS ET CORROMPUS
-- Date: 8 Décembre 2025
-- ============================================================
-- Ce script identifie et supprime les références aux fichiers
-- qui n'existent plus dans le bucket Supabase Storage
-- ============================================================

-- ============================================================
-- ÉTAPE 1: Identifier les fichiers orphelins
-- ============================================================
DO $$
DECLARE
  attachment_record RECORD;
  orphaned_count INT := 0;
  corrupted_count INT := 0;
BEGIN
  RAISE NOTICE '=== IDENTIFICATION DES FICHIERS ORPHELINS ET CORROMPUS ===';
  RAISE NOTICE '';

  -- Fichiers spécifiques identifiés dans les logs
  FOR attachment_record IN
    SELECT 
      id,
      message_id,
      file_name,
      file_url,
      storage_path,
      created_at
    FROM vendor_message_attachments
    WHERE storage_path IN (
      'vendor-message-attachments/1765211674422-n3cru35bsso.png',
      'vendor-message-attachments/1765223731377-b09nes58pjm.png',
      'vendor-message-attachments/1765224210801-7qzbp1xq9lm.png',
      'vendor-message-attachments/1765207968982-y0xu1n9lneq.png',
      'vendor-message-attachments/1765225361400-zpumaooy32e.png'
    )
    ORDER BY created_at DESC
  LOOP
    RAISE NOTICE 'Fichier trouvé: %', attachment_record.file_name;
    RAISE NOTICE '  - ID: %', attachment_record.id;
    RAISE NOTICE '  - Storage path: %', attachment_record.storage_path;
    RAISE NOTICE '  - Créé le: %', attachment_record.created_at;
    
    IF attachment_record.storage_path = 'vendor-message-attachments/1765225361400-zpumaooy32e.png' THEN
      corrupted_count := corrupted_count + 1;
      RAISE NOTICE '  - Statut: ⚠️ CORROMPU (retourne JSON au lieu d''image)';
    ELSE
      orphaned_count := orphaned_count + 1;
      RAISE NOTICE '  - Statut: ❌ ORPHELIN (introuvable dans le bucket)';
    END IF;
    RAISE NOTICE '';
  END LOOP;

  RAISE NOTICE '=== RÉSUMÉ ===';
  RAISE NOTICE 'Fichiers orphelins trouvés: %', orphaned_count;
  RAISE NOTICE 'Fichiers corrompus trouvés: %', corrupted_count;
  RAISE NOTICE 'Total: %', orphaned_count + corrupted_count;
END $$;

-- ============================================================
-- ÉTAPE 2: Afficher les détails avant suppression
-- ============================================================
SELECT 
  'Fichiers à supprimer' as "Action",
  COUNT(*) as "Nombre",
  STRING_AGG(file_name, ', ') as "Fichiers"
FROM vendor_message_attachments
WHERE storage_path IN (
  'vendor-message-attachments/1765211674422-n3cru35bsso.png',
  'vendor-message-attachments/1765223731377-b09nes58pjm.png',
  'vendor-message-attachments/1765224210801-7qzbp1xq9lm.png',
  'vendor-message-attachments/1765207968982-y0xu1n9lneq.png',
  'vendor-message-attachments/1765225361400-zpumaooy32e.png'
);

-- ============================================================
-- ÉTAPE 3: Supprimer les références orphelines/corrompues
-- ============================================================
-- ⚠️ DÉCOMMENTEZ CETTE SECTION APRÈS VÉRIFICATION ⚠️
-- 
-- DELETE FROM vendor_message_attachments
-- WHERE storage_path IN (
--   'vendor-message-attachments/1765211674422-n3cru35bsso.png',
--   'vendor-message-attachments/1765223731377-b09nes58pjm.png',
--   'vendor-message-attachments/1765224210801-7qzbp1xq9lm.png',
--   'vendor-message-attachments/1765207968982-y0xu1n9lneq.png',
--   'vendor-message-attachments/1765225361400-zpumaooy32e.png'
-- );
-- 
-- RAISE NOTICE '✅ Références supprimées avec succès';
-- ============================================================

-- ============================================================
-- ÉTAPE 4: Vérification finale
-- ============================================================
SELECT 
  'Fichiers restants' as "Action",
  COUNT(*) as "Nombre"
FROM vendor_message_attachments
WHERE storage_path IN (
  'vendor-message-attachments/1765211674422-n3cru35bsso.png',
  'vendor-message-attachments/1765223731377-b09nes58pjm.png',
  'vendor-message-attachments/1765224210801-7qzbp1xq9lm.png',
  'vendor-message-attachments/1765207968982-y0xu1n9lneq.png',
  'vendor-message-attachments/1765225361400-zpumaooy32e.png'
);

