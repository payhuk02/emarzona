
-- Create storage buckets for the platform
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('product-images', 'product-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('store-assets', 'store-assets', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']),
  ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('digital-files', 'digital-files', false, 524288000, NULL),
  ('course-content', 'course-content', false, 524288000, NULL),
  ('invoice-files', 'invoice-files', false, 10485760, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- RLS policies for product-images (public read, authenticated upload)
CREATE POLICY "Public read product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload product images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Users can update own product images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'product-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own product images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS policies for store-assets (public read, authenticated upload)
CREATE POLICY "Public read store assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'store-assets');

CREATE POLICY "Authenticated users can upload store assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'store-assets');

CREATE POLICY "Users can update own store assets"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'store-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own store assets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'store-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS policies for avatars (public read, own upload)
CREATE POLICY "Public read avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS policies for digital-files (private, owner only)
CREATE POLICY "Authenticated users can upload digital files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'digital-files');

CREATE POLICY "Users can read own digital files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'digital-files' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own digital files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'digital-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS policies for course-content (private, owner only)
CREATE POLICY "Authenticated users can upload course content"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'course-content');

CREATE POLICY "Users can read own course content"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'course-content' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own course content"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'course-content' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS policies for invoice-files (private, owner only)
CREATE POLICY "Authenticated users can upload invoices"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'invoice-files');

CREATE POLICY "Users can read own invoices"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'invoice-files' AND (storage.foldername(name))[1] = auth.uid()::text);
