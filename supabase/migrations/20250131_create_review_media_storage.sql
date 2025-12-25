-- Migration: Création du bucket Storage pour les médias de reviews
-- Date: 31 Janvier 2025
-- Description: Crée le bucket review-media avec les politiques RLS pour uploader photos et vidéos

-- ============================================================
-- CRÉATION DU BUCKET
-- ============================================================

-- Vérifier si le bucket existe déjà
DO $$
BEGIN
  -- Créer le bucket s'il n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'review-media'
  ) THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'review-media',
      'review-media',
      true, -- Bucket public pour permettre l'affichage des images/vidéos
      10485760, -- 10 MB max par fichier
      ARRAY[
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'video/mp4',
        'video/webm',
        'video/ogg',
        'video/quicktime',
        'video/x-msvideo'
      ]
    );
  ELSE
    -- Mettre à jour le bucket existant
    UPDATE storage.buckets
    SET
      public = true,
      file_size_limit = 10485760,
      allowed_mime_types = ARRAY[
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'video/mp4',
        'video/webm',
        'video/ogg',
        'video/quicktime',
        'video/x-msvideo'
      ]
    WHERE id = 'review-media';
  END IF;
END $$;

-- ============================================================
-- POLITIQUES RLS POUR LE BUCKET
-- ============================================================

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Authenticated users can upload review media" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view review media" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own review media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own review media" ON storage.objects;

-- Politique 1: Upload par les utilisateurs authentifiés
CREATE POLICY "Authenticated users can upload review media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'review-media'
  AND (
    -- Vérifier que l'utilisateur a créé une review correspondante
    -- Le chemin est review_id/filename, donc on extrait le review_id
    EXISTS (
      SELECT 1 FROM public.reviews
      WHERE reviews.id::text = (string_to_array(name, '/'))[1]
      AND reviews.user_id = auth.uid()
    )
  )
);

-- Politique 2: Lecture publique (pour afficher les médias)
CREATE POLICY "Anyone can view review media"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'review-media');

-- Politique 3: Mise à jour par le propriétaire de la review
CREATE POLICY "Users can update their own review media"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'review-media'
  AND EXISTS (
    SELECT 1 FROM public.reviews
    WHERE reviews.id::text = (string_to_array(name, '/'))[1]
    AND reviews.user_id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'review-media'
  AND EXISTS (
    SELECT 1 FROM public.reviews
    WHERE reviews.id::text = (string_to_array(name, '/'))[1]
    AND reviews.user_id = auth.uid()
  )
);

-- Politique 4: Suppression par le propriétaire de la review
CREATE POLICY "Users can delete their own review media"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'review-media'
  AND EXISTS (
    SELECT 1 FROM public.reviews
    WHERE reviews.id::text = (string_to_array(name, '/'))[1]
    AND reviews.user_id = auth.uid()
  )
);

-- Note: Les commentaires sur les politiques storage.objects nécessitent des privilèges super-utilisateur
-- Les politiques sont documentées ci-dessus dans les commentaires SQL standard

