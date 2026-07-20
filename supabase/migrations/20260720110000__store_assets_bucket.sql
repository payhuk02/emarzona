-- Sprint 1.5 storage: bucket store-assets scoped by store_id.

BEGIN;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'store-assets',
  'store-assets',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/x-icon', 'image/vnd.microsoft.icon']
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = COALESCE(storage.buckets.file_size_limit, EXCLUDED.file_size_limit),
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Public read (storefront logos/banners)
DROP POLICY IF EXISTS "Public read store assets" ON storage.objects;
CREATE POLICY "Public read store assets"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'store-assets');

-- Store owners + team with settings.manage
DROP POLICY IF EXISTS "Store team upload store assets" ON storage.objects;
CREATE POLICY "Store team upload store assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'store-assets'
    AND (storage.foldername(name))[1] = 'stores'
    AND (storage.foldername(name))[2] ~ '^[0-9a-f-]{36}$'
    AND public.has_store_permission(
      ((storage.foldername(name))[2])::uuid,
      auth.uid(),
      'settings.manage'
    )
  );

DROP POLICY IF EXISTS "Store team update store assets" ON storage.objects;
CREATE POLICY "Store team update store assets"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'store-assets'
    AND (storage.foldername(name))[1] = 'stores'
    AND (storage.foldername(name))[2] ~ '^[0-9a-f-]{36}$'
    AND public.has_store_permission(
      ((storage.foldername(name))[2])::uuid,
      auth.uid(),
      'settings.manage'
    )
  )
  WITH CHECK (
    bucket_id = 'store-assets'
    AND (storage.foldername(name))[1] = 'stores'
    AND (storage.foldername(name))[2] ~ '^[0-9a-f-]{36}$'
    AND public.has_store_permission(
      ((storage.foldername(name))[2])::uuid,
      auth.uid(),
      'settings.manage'
    )
  );

DROP POLICY IF EXISTS "Store team delete store assets" ON storage.objects;
CREATE POLICY "Store team delete store assets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'store-assets'
    AND (storage.foldername(name))[1] = 'stores'
    AND (storage.foldername(name))[2] ~ '^[0-9a-f-]{36}$'
    AND public.has_store_permission(
      ((storage.foldername(name))[2])::uuid,
      auth.uid(),
      'settings.manage'
    )
  );

COMMIT;
