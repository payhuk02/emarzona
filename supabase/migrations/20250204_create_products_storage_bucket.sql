/**
 * Create products storage bucket
 * Date: 4 Février 2025
 * 
 * Crée le bucket "products" pour le stockage des fichiers de produits
 * (fichiers digitaux, images, etc.)
 */

-- =====================================================
-- CRÉATION DU BUCKET "products"
-- =====================================================

-- Créer le bucket "products" s'il n'existe pas (avec ON CONFLICT pour éviter les erreurs)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'products',
  'products',
  true, -- Bucket public pour permettre l'accès aux fichiers
  524288000, -- 500 MB en bytes (limite par fichier)
  ARRAY[
    -- Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    -- Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    -- Archives
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'application/gzip',
    -- Audio
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/aac',
    'audio/flac',
    -- Vidéo
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm',
    -- Ebooks
    'application/epub+zip',
    'application/x-mobipocket-ebook',
    -- Autres
    'application/json',
    'text/plain',
    'text/csv',
    'application/xml',
    'text/xml'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 524288000,
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'application/gzip',
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/aac',
    'audio/flac',
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm',
    'application/epub+zip',
    'application/x-mobipocket-ebook',
    'application/json',
    'text/plain',
    'text/csv',
    'application/xml',
    'text/xml'
  ];

-- =====================================================
-- POLITIQUES RLS POUR LE BUCKET "products"
-- =====================================================

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Authenticated users can upload product files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read product files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update product files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete product files" ON storage.objects;
DROP POLICY IF EXISTS "Public can read product files" ON storage.objects;

-- Politique 1: Les utilisateurs authentifiés peuvent uploader des fichiers
CREATE POLICY "Authenticated users can upload product files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'products' AND
  auth.role() = 'authenticated'
);

-- Politique 2: Les fichiers sont accessibles publiquement en lecture
CREATE POLICY "Public can read product files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'products');

-- Politique 3: Les utilisateurs authentifiés peuvent mettre à jour leurs fichiers
CREATE POLICY "Authenticated users can update product files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'products' AND
  auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'products' AND
  auth.role() = 'authenticated'
);

-- Politique 4: Les utilisateurs authentifiés peuvent supprimer leurs fichiers
CREATE POLICY "Authenticated users can delete product files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'products' AND
  auth.role() = 'authenticated'
);

