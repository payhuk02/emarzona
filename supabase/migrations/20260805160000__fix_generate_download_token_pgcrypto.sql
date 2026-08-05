-- Hotfix: customer digital downloads — gen_random_bytes unavailable without pgcrypto on some projects.
-- Same approach as 20260707040000__fix_checkout_token_pgcrypto.sql (use gen_random_uuid instead).

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

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

  -- 128-bit hex token (no pgcrypto dependency)
  v_token := replace(
    gen_random_uuid()::text || gen_random_uuid()::text || gen_random_uuid()::text || gen_random_uuid()::text,
    '-',
    ''
  );

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
  'Mints a one-time download token after purchase/vendor authorization (no pgcrypto dependency).';

GRANT EXECUTE ON FUNCTION public.generate_download_token(UUID, TEXT, UUID, UUID, INTEGER) TO authenticated, anon, service_role;

COMMIT;
