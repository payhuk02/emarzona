-- Audit P1 : tokens téléchargement sécurisés, révocation accès digital au remboursement

-- =========================================================
-- generate_download_token : exiger achat payé si customer_id fourni
-- =========================================================

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

-- =========================================================
-- Révocation accès digital (licences + tokens) sur remboursement
-- =========================================================

CREATE OR REPLACE FUNCTION public.revoke_digital_access_for_order(p_order_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.digital_licenses
  SET
    status = 'revoked',
    updated_at = now()
  WHERE order_id = p_order_id
    AND status IN ('active', 'pending');

  UPDATE public.download_tokens dt
  SET expires_at = now()
  FROM public.order_items oi
  INNER JOIN public.digital_products dp ON dp.id = oi.digital_product_id
  WHERE oi.order_id = p_order_id
    AND dt.product_id = dp.product_id
    AND dt.expires_at > now();

  UPDATE public.customer_downloads
  SET expires_at = now()
  WHERE order_id = p_order_id
    AND (expires_at IS NULL OR expires_at > now());
END;
$$;

COMMENT ON FUNCTION public.revoke_digital_access_for_order IS
  'Révoque licences et tokens de téléchargement après remboursement commande.';

CREATE OR REPLACE FUNCTION public.trigger_revoke_digital_access_on_refund()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
    AND NEW.payment_status = 'refunded'
    AND OLD.payment_status IS DISTINCT FROM 'refunded' THEN
    PERFORM public.revoke_digital_access_for_order(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS revoke_digital_access_on_order_refund ON public.orders;
CREATE TRIGGER revoke_digital_access_on_order_refund
  AFTER UPDATE OF payment_status ON public.orders
  FOR EACH ROW
  WHEN (
    NEW.payment_status = 'refunded'
    AND OLD.payment_status IS DISTINCT FROM 'refunded'
  )
  EXECUTE FUNCTION public.trigger_revoke_digital_access_on_refund();
