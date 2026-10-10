-- Sync product_affiliate_settings inside update_digital_product_tx (same pattern as physical/service).

DROP FUNCTION IF EXISTS public.update_digital_product_tx(UUID, UUID, JSONB, JSONB, JSONB);
DROP FUNCTION IF EXISTS public.update_digital_product_tx(UUID, UUID, JSONB, JSONB);

CREATE OR REPLACE FUNCTION public.update_digital_product_tx(
  p_store_id UUID,
  p_product_id UUID,
  p_product JSONB,
  p_digital JSONB,
  p_files JSONB DEFAULT NULL,
  p_affiliate JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_digital_id UUID;
  v_file JSONB;
BEGIN
  IF NOT public.user_can_manage_store_products(p_store_id) THEN
    RAISE EXCEPTION 'Accès refusé à cette boutique';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.products
    WHERE id = p_product_id AND store_id = p_store_id AND product_type = 'digital'
  ) THEN
    RAISE EXCEPTION 'Produit digital introuvable';
  END IF;

  UPDATE public.products SET
    name = COALESCE(p_product->>'name', name),
    slug = COALESCE(p_product->>'slug', slug),
    description = COALESCE(p_product->>'description', description),
    short_description = COALESCE(p_product->>'short_description', short_description),
    category = COALESCE(p_product->>'category', category),
    price = COALESCE((p_product->>'price')::NUMERIC, price),
    promotional_price = CASE WHEN p_product ? 'promotional_price' THEN NULLIF(p_product->>'promotional_price', '')::NUMERIC ELSE promotional_price END,
    currency = COALESCE(p_product->>'currency', currency),
    pricing_model = COALESCE(p_product->>'pricing_model', pricing_model::text)::pricing_model,
    image_url = COALESCE(p_product->>'image_url', image_url),
    images = COALESCE(p_product->'images', images),
    licensing_type = COALESCE(p_product->>'licensing_type', licensing_type),
    license_terms = CASE WHEN p_product ? 'license_terms' THEN p_product->>'license_terms' ELSE license_terms END,
    meta_title = COALESCE(p_product->>'meta_title', meta_title),
    meta_description = COALESCE(p_product->>'meta_description', meta_description),
    og_image = COALESCE(p_product->>'og_image', og_image),
    faqs = COALESCE(p_product->'faqs', faqs),
    hide_purchase_count = COALESCE((p_product->>'hide_purchase_count')::BOOLEAN, hide_purchase_count),
    hide_likes_count = COALESCE((p_product->>'hide_likes_count')::BOOLEAN, hide_likes_count),
    hide_recommendations_count = COALESCE((p_product->>'hide_recommendations_count')::BOOLEAN, hide_recommendations_count),
    hide_downloads_count = COALESCE((p_product->>'hide_downloads_count')::BOOLEAN, hide_downloads_count),
    hide_reviews_count = COALESCE((p_product->>'hide_reviews_count')::BOOLEAN, hide_reviews_count),
    hide_rating = COALESCE((p_product->>'hide_rating')::BOOLEAN, hide_rating),
    is_active = COALESCE((p_product->>'is_active')::BOOLEAN, is_active),
    updated_at = now()
  WHERE id = p_product_id;

  SELECT id INTO v_digital_id FROM public.digital_products WHERE product_id = p_product_id LIMIT 1;

  IF v_digital_id IS NULL THEN
    INSERT INTO public.digital_products (
      product_id, digital_type, license_type, license_duration_days, max_activations,
      allow_license_transfer, auto_generate_keys, main_file_url, main_file_size_mb,
      main_file_format, main_file_version, total_files, total_size_mb,
      download_limit, download_expiry_days, require_registration,
      watermark_enabled, watermark_text, version
    ) VALUES (
      p_product_id,
      COALESCE(p_digital->>'digital_type', 'other'),
      COALESCE(p_digital->>'license_type', 'single'),
      NULLIF(p_digital->>'license_duration_days', '')::INTEGER,
      COALESCE((p_digital->>'max_activations')::INTEGER, 1),
      COALESCE((p_digital->>'allow_license_transfer')::BOOLEAN, false),
      COALESCE((p_digital->>'auto_generate_keys')::BOOLEAN, true),
      COALESCE(p_digital->>'main_file_url', ''),
      COALESCE((p_digital->>'main_file_size_mb')::NUMERIC, 0),
      COALESCE(p_digital->>'main_file_format', 'unknown'),
      COALESCE(p_digital->>'main_file_version', '1.0'),
      COALESCE((p_digital->>'total_files')::INTEGER, 1),
      COALESCE((p_digital->>'total_size_mb')::NUMERIC, 0),
      COALESCE((p_digital->>'download_limit')::INTEGER, 5),
      COALESCE((p_digital->>'download_expiry_days')::INTEGER, 30),
      COALESCE((p_digital->>'require_registration')::BOOLEAN, true),
      COALESCE((p_digital->>'watermark_enabled')::BOOLEAN, false),
      p_digital->>'watermark_text',
      COALESCE(p_digital->>'version', '1.0')
    )
    RETURNING id INTO v_digital_id;
  ELSE
    UPDATE public.digital_products SET
      digital_type = COALESCE(p_digital->>'digital_type', digital_type),
      license_type = COALESCE(p_digital->>'license_type', license_type),
      license_duration_days = CASE WHEN p_digital ? 'license_duration_days' THEN NULLIF(p_digital->>'license_duration_days', '')::INTEGER ELSE license_duration_days END,
      max_activations = COALESCE((p_digital->>'max_activations')::INTEGER, max_activations),
      allow_license_transfer = COALESCE((p_digital->>'allow_license_transfer')::BOOLEAN, allow_license_transfer),
      auto_generate_keys = COALESCE((p_digital->>'auto_generate_keys')::BOOLEAN, auto_generate_keys),
      main_file_url = COALESCE(p_digital->>'main_file_url', main_file_url),
      main_file_size_mb = COALESCE((p_digital->>'main_file_size_mb')::NUMERIC, main_file_size_mb),
      main_file_format = COALESCE(p_digital->>'main_file_format', main_file_format),
      main_file_version = COALESCE(p_digital->>'main_file_version', main_file_version),
      total_files = COALESCE((p_digital->>'total_files')::INTEGER, total_files),
      total_size_mb = COALESCE((p_digital->>'total_size_mb')::NUMERIC, total_size_mb),
      download_limit = COALESCE((p_digital->>'download_limit')::INTEGER, download_limit),
      download_expiry_days = COALESCE((p_digital->>'download_expiry_days')::INTEGER, download_expiry_days),
      require_registration = COALESCE((p_digital->>'require_registration')::BOOLEAN, require_registration),
      watermark_enabled = COALESCE((p_digital->>'watermark_enabled')::BOOLEAN, watermark_enabled),
      watermark_text = CASE WHEN p_digital ? 'watermark_text' THEN p_digital->>'watermark_text' ELSE watermark_text END,
      version = COALESCE(p_digital->>'version', version),
      updated_at = now()
    WHERE id = v_digital_id;
  END IF;

  IF p_files IS NOT NULL AND jsonb_typeof(p_files) = 'array' THEN
    UPDATE public.digital_product_files
    SET parent_file_id = NULL
    WHERE digital_product_id = v_digital_id
      AND parent_file_id IS NOT NULL;

    DELETE FROM public.digital_product_files
    WHERE digital_product_id = v_digital_id;

    IF jsonb_array_length(p_files) > 0 THEN
      FOR v_file IN SELECT * FROM jsonb_array_elements(p_files)
      LOOP
        INSERT INTO public.digital_product_files (
          digital_product_id, name, file_url, file_type, file_size_mb,
          order_index, is_main, is_preview, requires_purchase, version
        ) VALUES (
          v_digital_id,
          v_file->>'name',
          v_file->>'file_url',
          v_file->>'file_type',
          COALESCE((v_file->>'file_size_mb')::NUMERIC, 0),
          COALESCE((v_file->>'order_index')::INTEGER, 0),
          COALESCE((v_file->>'is_main')::BOOLEAN, false),
          COALESCE((v_file->>'is_preview')::BOOLEAN, false),
          COALESCE((v_file->>'requires_purchase')::BOOLEAN, true),
          COALESCE(v_file->>'version', '1.0')
        );
      END LOOP;
    END IF;
  END IF;

  -- NULL = leave affiliate unchanged ; object = replace (enabled false clears)
  IF p_affiliate IS NOT NULL THEN
    DELETE FROM public.product_affiliate_settings WHERE product_id = p_product_id;
    IF COALESCE((p_affiliate->>'enabled')::BOOLEAN, (p_affiliate->>'affiliate_enabled')::BOOLEAN, false) THEN
      INSERT INTO public.product_affiliate_settings (
        product_id, store_id, affiliate_enabled, commission_rate,
        commission_type, fixed_commission_amount, cookie_duration_days,
        min_order_amount, allow_self_referral, require_approval, terms_and_conditions
      ) VALUES (
        p_product_id,
        p_store_id,
        true,
        COALESCE((p_affiliate->>'commission_rate')::NUMERIC, 20),
        COALESCE(p_affiliate->>'commission_type', 'percentage'),
        COALESCE((p_affiliate->>'fixed_commission_amount')::NUMERIC, 0),
        COALESCE((p_affiliate->>'cookie_duration_days')::INTEGER, 30),
        COALESCE((p_affiliate->>'min_order_amount')::NUMERIC, 0),
        COALESCE((p_affiliate->>'allow_self_referral')::BOOLEAN, false),
        COALESCE((p_affiliate->>'require_approval')::BOOLEAN, false),
        COALESCE(p_affiliate->>'terms_and_conditions', '')
      );
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'product_id', p_product_id,
    'digital_product_id', v_digital_id
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_digital_product_tx(UUID, UUID, JSONB, JSONB, JSONB, JSONB) TO authenticated;

NOTIFY pgrst, 'reload schema';
