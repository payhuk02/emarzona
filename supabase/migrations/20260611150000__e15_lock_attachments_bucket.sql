-- E15 Epic 1.1.5: Private attachments bucket (returns, vendor messages)

BEGIN;

UPDATE storage.buckets
SET public = false
WHERE id = 'attachments';

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('attachments', 'attachments', false, 10485760)
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = COALESCE(storage.buckets.file_size_limit, EXCLUDED.file_size_limit);

DROP POLICY IF EXISTS "Anyone can view attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read attachments" ON storage.objects;

CREATE POLICY "Users read own return attachments"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'attachments'
    AND name LIKE 'returns/' || auth.uid()::text || '/%'
  );

CREATE POLICY "Store owners read return attachments"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'attachments'
    AND name LIKE 'returns/%'
    AND EXISTS (
      SELECT 1
      FROM public.orders o
      INNER JOIN public.stores s ON s.id = o.store_id
      WHERE s.user_id = auth.uid()
        AND name LIKE 'returns/%/' || o.id::text || '/%'
    )
  );

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'vendor_conversations'
  ) THEN
    DROP POLICY IF EXISTS "Vendor conversation participants read message attachments" ON storage.objects;
    CREATE POLICY "Vendor conversation participants read message attachments"
      ON storage.objects
      FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'attachments'
        AND name LIKE 'vendor-message-attachments/%'
        AND EXISTS (
          SELECT 1
          FROM public.vendor_conversations vc
          WHERE name LIKE 'vendor-message-attachments/' || vc.id::text || '/%'
            AND (vc.customer_user_id = auth.uid() OR vc.store_user_id = auth.uid())
        )
      );
  END IF;
END $$;

CREATE POLICY "Platform admins read attachments"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'attachments'
    AND public.is_platform_admin()
  );

COMMIT;
