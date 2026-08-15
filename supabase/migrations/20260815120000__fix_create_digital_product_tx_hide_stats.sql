-- Restore hide_* columns in create_digital_product_tx (regressed in 20260711120000)
-- Keeps pricing_model enum cast fix from 20260711120000

CREATE OR REPLACE FUNCTION public.create_digital_product_tx(
  p_store_id UUID,
  p_product JSONB,
  p_digital JSONB,
  p_files JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product_id UUID;
  v_digital_id UUID;
  v_file JSONB;
BEGIN
  IF NOT public.user_owns_store(p_store_id) THEN
    RAISE EXCEPTION 'Accès refusé à cette boutique';
  END IF;

  INSERT INTO public.products (
    store_id, name, slug, description, short_description, category, product_type,
    price, promotional_price, currency, pricing_model, image_url, images,
    licensing_type, license_terms, is_active, is_draft,
    meta_title, meta_description, og_image, faqs,
    hide_purchase_count, hide_likes_count, hide_recommendations_count,
    hide_downloads_count, hide_reviews_count, hide_rating
  ) VALUES (
    p_store_id,
    p_product->>'name',
    p_product->>'slug',
    COALESCE(p_product->>'description', ''),
    p_product->>'short_description',
    p_product->>'category',
    'digital',
    COALESCE((p_product->>'price')::NUMERIC, 0),
    NULLIF(p_product->>'promotional_price', '')::NUMERIC,
    COALESCE(p_product->>'currency', 'XOF'),
    COALESCE(p_product->>'pricing_model', 'one-time')::pricing_model,
    p_product->>'image_url',
    COALESCE(p_product->'images', '[]'::jsonb),
    COALESCE(p_product->>'licensing_type', 'standard'),
    p_product->>'license_terms',
    COALESCE((p_product->>'is_active')::BOOLEAN, true),
    COALESCE((p_product->>'is_draft')::BOOLEAN, false),
    p_product->>'meta_title',
    p_product->>'meta_description',
    p_product->>'og_image',
    COALESCE(p_product->'faqs', '[]'::jsonb),
    COALESCE((p_product->>'hide_purchase_count')::BOOLEAN, false),
    COALESCE((p_product->>'hide_likes_count')::BOOLEAN, false),
    COALESCE((p_product->>'hide_recommendations_count')::BOOLEAN, false),
    COALESCE((p_product->>'hide_downloads_count')::BOOLEAN, false),
    COALESCE((p_product->>'hide_reviews_count')::BOOLEAN, false),
    COALESCE((p_product->>'hide_rating')::BOOLEAN, false)
  )
  RETURNING id INTO v_product_id;

  INSERT INTO public.digital_products (
    product_id, digital_type, license_type, license_duration_days, max_activations,
    allow_license_transfer, auto_generate_keys, main_file_url, main_file_size_mb,
    main_file_format, main_file_version, total_files, total_size_mb,
    download_limit, download_expiry_days, require_registration,
    watermark_enabled, watermark_text, version
  ) VALUES (
    v_product_id,
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

  IF jsonb_typeof(COALESCE(p_files, '[]'::jsonb)) = 'array'
     AND jsonb_array_length(COALESCE(p_files, '[]'::jsonb)) > 0 THEN
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

  RETURN jsonb_build_object(
    'success', true,
    'product_id', v_product_id,
    'digital_product_id', v_digital_id
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_digital_product_tx(UUID, JSONB, JSONB, JSONB) TO authenticated;
