-- E11 Epic 1.1: Lock products storage bucket (paid digital files must not be public)
-- Downloads are served via download tokens + redeem-download-token Edge Function.

BEGIN;

-- =====================================================
-- 1. Bucket: private (no anonymous read)
-- =====================================================

UPDATE storage.buckets
SET public = false
WHERE id = 'products';

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('products', 'products', false, 524288000)
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = COALESCE(storage.buckets.file_size_limit, EXCLUDED.file_size_limit);

-- =====================================================
-- 2. Storage RLS: remove public read, vendor/admin read only
-- =====================================================

DROP POLICY IF EXISTS "Public can read product files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read product files" ON storage.objects;

DROP POLICY IF EXISTS "Store owners read product files" ON storage.objects;
CREATE POLICY "Store owners read product files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'products'
  AND EXISTS (
    SELECT 1
    FROM public.stores s
    WHERE s.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Platform admins read product files" ON storage.objects;
CREATE POLICY "Platform admins read product files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'products'
  AND EXISTS (
    SELECT 1
    FROM public.profiles pr
    WHERE pr.id = auth.uid()
      AND pr.role IN ('admin', 'staff')
  )
);

-- Upload / update / delete policies (vendors authenticated — unchanged intent)
DROP POLICY IF EXISTS "Authenticated users can upload product files" ON storage.objects;
CREATE POLICY "Authenticated users can upload product files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'products'
  AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Authenticated users can update product files" ON storage.objects;
CREATE POLICY "Authenticated users can update product files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'products'
  AND auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'products'
  AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Authenticated users can delete product files" ON storage.objects;
CREATE POLICY "Authenticated users can delete product files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'products'
  AND auth.role() = 'authenticated'
);

-- =====================================================
-- 3. Harden generate_download_token (customer ownership)
-- =====================================================

CREATE OR REPLACE FUNCTION public.generate_download_token(
  p_product_id UUID,
  p_file_url TEXT,
  p_customer_id UUID DEFAULT NULL,
  p_license_id UUID DEFAULT NULL,
  p_expires_hours INTEGER DEFAULT 1
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token TEXT;
  v_products_id UUID;
  v_caller_email TEXT;
BEGIN
  SELECT p.id INTO v_products_id
  FROM public.products p
  WHERE p.id = p_product_id
  LIMIT 1;

  IF v_products_id IS NULL THEN
    SELECT dp.product_id INTO v_products_id
    FROM public.digital_products dp
    WHERE dp.id = p_product_id
    LIMIT 1;
  END IF;

  IF v_products_id IS NULL THEN
    RAISE EXCEPTION 'PRODUCT_NOT_FOUND';
  END IF;

  IF p_customer_id IS NOT NULL THEN
    IF auth.uid() IS NOT NULL THEN
      SELECT lower(trim(u.email))
      INTO v_caller_email
      FROM auth.users u
      WHERE u.id = auth.uid();

      IF v_caller_email IS NULL THEN
        RAISE EXCEPTION 'UNAUTHORIZED';
      END IF;

      IF NOT EXISTS (
        SELECT 1
        FROM public.customers c
        WHERE c.id = p_customer_id
          AND lower(trim(c.email)) = v_caller_email
      ) AND NOT EXISTS (
        SELECT 1
        FROM public.profiles pr
        WHERE pr.id = auth.uid()
          AND pr.role IN ('admin', 'staff')
      ) THEN
        RAISE EXCEPTION 'CUSTOMER_ACCESS_DENIED';
      END IF;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM public.order_items oi
      INNER JOIN public.orders o ON o.id = oi.order_id
      WHERE oi.product_id = v_products_id
        AND o.customer_id = p_customer_id
        AND o.payment_status = 'paid'
        AND public.is_order_paid_for_revenue(o.status, o.payment_status)
    ) AND NOT EXISTS (
      SELECT 1
      FROM public.digital_licenses dl
      INNER JOIN public.digital_products dp ON dp.id = dl.digital_product_id
      WHERE dp.product_id = v_products_id
        AND dl.status IN ('active', 'pending')
        AND dl.order_id IS NOT NULL
        AND EXISTS (
          SELECT 1
          FROM public.orders o
          WHERE o.id = dl.order_id
            AND o.customer_id = p_customer_id
            AND o.payment_status = 'paid'
            AND public.is_order_paid_for_revenue(o.status, o.payment_status)
        )
    ) THEN
      RAISE EXCEPTION 'DOWNLOAD_ACCESS_DENIED';
    END IF;
  ELSE
    IF auth.uid() IS NULL THEN
      RAISE EXCEPTION 'UNAUTHORIZED';
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM public.products p
      INNER JOIN public.stores s ON s.id = p.store_id
      WHERE p.id = v_products_id
        AND s.user_id = auth.uid()
    ) AND NOT EXISTS (
      SELECT 1
      FROM public.profiles pr
      WHERE pr.id = auth.uid()
        AND pr.role IN ('admin', 'staff')
    ) THEN
      RAISE EXCEPTION 'VENDOR_ACCESS_DENIED';
    END IF;
  END IF;

  v_token := encode(gen_random_bytes(32), 'base64');
  v_token := replace(v_token, '/', '_');
  v_token := replace(v_token, '+', '-');

  INSERT INTO public.download_tokens (
    product_id,
    customer_id,
    license_id,
    token,
    file_url,
    expires_at
  ) VALUES (
    v_products_id,
    p_customer_id,
    p_license_id,
    v_token,
    p_file_url,
    now() + (GREATEST(COALESCE(p_expires_hours, 1), 1) || ' hours')::interval
  );

  RETURN v_token;
END;
$$;

COMMENT ON FUNCTION public.generate_download_token IS
  'Mints a one-time download token after purchase/vendor authorization (E11 hardened).';

REVOKE ALL ON FUNCTION public.generate_download_token(UUID, TEXT, UUID, UUID, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_download_token(UUID, TEXT, UUID, UUID, INTEGER) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.validate_download_token(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_download_token(TEXT) TO service_role;

COMMIT;
