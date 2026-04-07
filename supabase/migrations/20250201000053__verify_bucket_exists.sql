-- ============================================================
-- VÉRIFICATION RAPIDE - Bucket "attachments"
-- Date : 1 Février 2025
-- Description : Vérifie si le bucket existe et le crée si nécessaire
-- ============================================================

-- Vérifier et créer le bucket si nécessaire
DO $$
DECLARE
  bucket_exists BOOLEAN;
  bucket_public BOOLEAN;
BEGIN
  -- Vérifier si le bucket existe
  SELECT EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'attachments')
  INTO bucket_exists;
  
  IF NOT bucket_exists THEN
    -- Créer le bucket
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'attachments',
      'attachments',
      true, -- PUBLIC
      10485760, -- 10MB
      NULL -- Pas de restrictions MIME
    );
    RAISE NOTICE '✅ Bucket "attachments" créé avec succès';
  ELSE
    -- Vérifier si le bucket est public
    SELECT public INTO bucket_public
    FROM storage.buckets
    WHERE id = 'attachments';
    
    IF NOT bucket_public THEN
      -- Mettre à jour pour le rendre public
      UPDATE storage.buckets
      SET public = true, allowed_mime_types = NULL
      WHERE id = 'attachments';
      RAISE NOTICE '✅ Bucket "attachments" mis à jour (maintenant PUBLIC)';
    ELSE
      RAISE NOTICE '✅ Bucket "attachments" existe déjà et est PUBLIC';
    END IF;
  END IF;
END $$;

-- Afficher le statut final
SELECT 
  id as "ID Bucket",
  name as "Nom",
  public as "Public",
  file_size_limit as "Taille Max (bytes)",
  allowed_mime_types as "Restrictions MIME"
FROM storage.buckets
WHERE id = 'attachments';

