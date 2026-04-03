-- ============================================================
-- Migration: Création du bucket platform-assets pour les logos
-- Date: 30 Janvier 2025
-- Description: Bucket Supabase Storage pour stocker les logos et assets de la plateforme
-- ============================================================

-- Créer le bucket platform-assets s'il n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'platform-assets'
  ) THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'platform-assets',
      'platform-assets',
      true, -- Public pour permettre l'accès aux logos
      5242880, -- 5MB max par fichier
      ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp', 'image/x-icon', 'image/vnd.microsoft.icon']
    );
  ELSE
    -- Mettre à jour le bucket existant
    UPDATE storage.buckets
    SET
      public = true,
      file_size_limit = 5242880,
      allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp', 'image/x-icon', 'image/vnd.microsoft.icon']
    WHERE id = 'platform-assets';
  END IF;
END $$;

-- ============================================================
-- POLITIQUES RLS POUR LE BUCKET
-- ============================================================

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload platform assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update platform assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete platform assets" ON storage.objects;

-- Politique RLS : Tous les utilisateurs peuvent lire (public)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'platform-assets');

-- Politique RLS : Seuls les admins peuvent uploader
CREATE POLICY "Admins can upload platform assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'platform-assets' AND
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() 
    AND (p.is_super_admin = true OR p.role = 'admin')
  )
);

-- Politique RLS : Seuls les admins peuvent modifier
CREATE POLICY "Admins can update platform assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'platform-assets' AND
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() 
    AND (p.is_super_admin = true OR p.role = 'admin')
  )
)
WITH CHECK (
  bucket_id = 'platform-assets' AND
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() 
    AND (p.is_super_admin = true OR p.role = 'admin')
  )
);

-- Politique RLS : Seuls les admins peuvent supprimer
CREATE POLICY "Admins can delete platform assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'platform-assets' AND
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() 
    AND (p.is_super_admin = true OR p.role = 'admin')
  )
);

-- Note: Les commentaires sur les politiques storage.objects nécessitent des privilèges super-utilisateur
-- Les politiques sont documentées ci-dessus dans les commentaires SQL standard

