/**
 * Create attachments storage bucket
 * Date: 30 Février 2025
 * 
 * Crée le bucket "attachments" pour le stockage des fichiers attachés aux messages
 * (images, vidéos, documents, etc.)
 */

-- =====================================================
-- CRÉATION DU BUCKET "attachments"
-- =====================================================

-- Créer le bucket "attachments" s'il n'existe pas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'attachments',
  'attachments',
  true, -- Bucket public pour permettre l'accès aux fichiers
  10485760, -- 10 MB en bytes (limite par fichier)
  ARRAY[
    -- Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    -- Vidéos
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm',
    'video/ogg',
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
    -- Texte
    'text/plain',
    'text/csv',
    'text/markdown',
    -- Autres
    'application/json',
    'application/xml',
    'text/xml'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm',
    'video/ogg',
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
    'text/plain',
    'text/csv',
    'text/markdown',
    'application/json',
    'application/xml',
    'text/xml'
  ];

-- =====================================================
-- POLITIQUES RLS POUR LE BUCKET "attachments"
-- =====================================================

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Anyone can view attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own attachments" ON storage.objects;

-- Politique 1 : Lecture publique (tout le monde peut voir les fichiers)
CREATE POLICY "Anyone can view attachments"
ON storage.objects
FOR SELECT
USING (bucket_id = 'attachments');

-- Politique 2 : Upload pour utilisateurs authentifiés
-- Permet à tous les utilisateurs authentifiés d'uploader dans n'importe quel dossier
CREATE POLICY "Authenticated users can upload attachments"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'attachments'
  AND auth.role() = 'authenticated'
);

-- Politique 3 : Mise à jour pour utilisateurs authentifiés
-- Permet à tous les utilisateurs authentifiés de mettre à jour les fichiers
CREATE POLICY "Users can update their own attachments"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'attachments'
  AND auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'attachments'
  AND auth.role() = 'authenticated'
);

-- Politique 4 : Suppression pour utilisateurs authentifiés
-- Permet à tous les utilisateurs authentifiés de supprimer les fichiers
CREATE POLICY "Users can delete their own attachments"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'attachments'
  AND auth.role() = 'authenticated'
);

