-- C5: Atomic download token consumption + vendor-only token minting without customer_id

-- ---------------------------------------------------------------------------
-- validate_download_token: atomically consume one download slot
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_download_token(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.download_tokens%ROWTYPE;
BEGIN
  UPDATE public.download_tokens
  SET
    current_downloads = current_downloads + 1,
    last_used_at = now(),
    is_used = CASE WHEN current_downloads + 1 >= max_downloads THEN true ELSE is_used END
  WHERE token = p_token
    AND NOT is_revoked
    AND expires_at > now()
    AND current_downloads < max_downloads
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    IF EXISTS (
      SELECT 1 FROM public.download_tokens
      WHERE token = p_token AND is_revoked
    ) THEN
      RETURN jsonb_build_object('valid', false, 'error', 'Token revoked');
    END IF;

    IF EXISTS (
      SELECT 1 FROM public.download_tokens
      WHERE token = p_token AND expires_at <= now()
    ) THEN
      RETURN jsonb_build_object('valid', false, 'error', 'Token expired');
    END IF;

    IF EXISTS (
      SELECT 1 FROM public.download_tokens
      WHERE token = p_token AND current_downloads >= max_downloads
    ) THEN
      RETURN jsonb_build_object('valid', false, 'error', 'Download limit reached');
    END IF;

    RETURN jsonb_build_object('valid', false, 'error', 'Token not found');
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'file_url', v_row.file_url,
    'token_id', v_row.id,
    'product_id', v_row.product_id
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- generate_download_token: require vendor ownership when no customer_id
-- ---------------------------------------------------------------------------
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
          SELECT 1 FROM public.orders o
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
      SELECT 1 FROM public.profiles pr
      WHERE pr.id = auth.uid() AND pr.role = 'admin'
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
    now() + (p_expires_hours || ' hours')::interval
  );

  RETURN v_token;
END;
$$;

COMMENT ON FUNCTION public.validate_download_token IS
  'Validates and atomically consumes a download token (increments current_downloads).';
