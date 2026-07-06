-- Sprint 2 : RPC update transactionnels (physical, digital, service)
-- + enrichissement create_* avec compare_at_price, tags, hide_*

-- ============================================================
-- CREATE PHYSICAL — champs produit complets
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_physical_product_tx(
  p_store_id UUID,
  p_product JSONB,
  p_physical JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product_id UUID;
  v_physical_id UUID;
  v_dims JSONB;
BEGIN
  IF NOT public.user_owns_store(p_store_id) THEN
    RAISE EXCEPTION 'Accès refusé à cette boutique';
  END IF;

  v_dims := COALESCE(p_physical->'dimensions', '{}'::jsonb);

  INSERT INTO public.products (
    store_id, name, slug, description, short_description, price, currency,
    compare_at_price, cost_per_item, promotional_price, product_type, category_id,
    image_url, images, tags,
    meta_title, meta_description, og_image, faqs, payment_options,
    hide_purchase_count, hide_likes_count, hide_recommendations_count,
    hide_downloads_count, hide_reviews_count, hide_rating,
    is_draft, is_active
  ) VALUES (
    p_store_id,
    p_product->>'name',
    p_product->>'slug',
    COALESCE(p_product->>'description', ''),
    p_product->>'short_description',
    COALESCE((p_product->>'price')::NUMERIC, 0),
    COALESCE(p_product->>'currency', 'XOF'),
    NULLIF(p_product->>'compare_at_price', '')::NUMERIC,
    NULLIF(p_product->>'cost_per_item', '')::NUMERIC,
    NULLIF(p_product->>'promotional_price', '')::NUMERIC,
    'physical',
    NULLIF(p_product->>'category_id', '')::UUID,
    p_product->>'image_url',
    COALESCE(p_product->'images', '[]'::jsonb),
    COALESCE(p_product->'tags', '[]'::jsonb),
    p_product->>'meta_title',
    p_product->>'meta_description',
    p_product->>'og_image',
    COALESCE(p_product->'faqs', '[]'::jsonb),
    COALESCE(p_product->'payment_options', '{}'::jsonb),
    COALESCE((p_product->>'hide_purchase_count')::BOOLEAN, false),
    COALESCE((p_product->>'hide_likes_count')::BOOLEAN, false),
    COALESCE((p_product->>'hide_recommendations_count')::BOOLEAN, false),
    COALESCE((p_product->>'hide_downloads_count')::BOOLEAN, false),
    COALESCE((p_product->>'hide_reviews_count')::BOOLEAN, false),
    COALESCE((p_product->>'hide_rating')::BOOLEAN, false),
    COALESCE((p_product->>'is_draft')::BOOLEAN, false),
    COALESCE((p_product->>'is_active')::BOOLEAN, true)
  )
  RETURNING id INTO v_product_id;

  INSERT INTO public.physical_products (
    product_id, sku, barcode, weight, weight_unit, length, width, height,
    dimensions_unit, track_inventory, low_stock_threshold, requires_shipping,
    free_shipping, inventory_policy, continue_selling_when_out_of_stock,
    country_of_origin, shipping_class, whatsapp_number, whatsapp_enabled,
    has_variants, option1_name, option2_name, option3_name
  ) VALUES (
    v_product_id,
    NULLIF(p_physical->>'sku', ''),
    NULLIF(p_physical->>'barcode', ''),
    NULLIF(COALESCE(p_physical->>'weight', ''), '')::NUMERIC,
    COALESCE(p_physical->>'weight_unit', 'kg'),
    NULLIF(COALESCE(p_physical->>'length', v_dims->>'length', ''), '')::NUMERIC,
    NULLIF(COALESCE(p_physical->>'width', v_dims->>'width', ''), '')::NUMERIC,
    NULLIF(COALESCE(p_physical->>'height', v_dims->>'height', ''), '')::NUMERIC,
    COALESCE(NULLIF(p_physical->>'dimensions_unit', ''), NULLIF(v_dims->>'unit', ''), 'cm'),
    COALESCE((p_physical->>'track_inventory')::BOOLEAN, true),
    COALESCE((p_physical->>'low_stock_threshold')::INTEGER, 5),
    COALESCE((p_physical->>'requires_shipping')::BOOLEAN, true),
    COALESCE((p_physical->>'free_shipping')::BOOLEAN, false),
    COALESCE(NULLIF(p_physical->>'inventory_policy', ''), 'deny'),
    COALESCE((p_physical->>'continue_selling_when_out_of_stock')::BOOLEAN, false),
    NULLIF(p_physical->>'country_of_origin', ''),
    NULLIF(p_physical->>'shipping_class', ''),
    NULLIF(p_physical->>'whatsapp_number', ''),
    COALESCE((p_physical->>'whatsapp_enabled')::BOOLEAN, false),
    COALESCE((p_physical->>'has_variants')::BOOLEAN, false),
    NULLIF(p_physical->>'option1_name', ''),
    NULLIF(p_physical->>'option2_name', ''),
    NULLIF(p_physical->>'option3_name', '')
  )
  RETURNING id INTO v_physical_id;

  RETURN jsonb_build_object(
    'success', true,
    'product_id', v_product_id,
    'physical_product_id', v_physical_id
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

-- ============================================================
-- UPDATE PHYSICAL
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_physical_product_tx(
  p_store_id UUID,
  p_product_id UUID,
  p_product JSONB,
  p_physical JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_physical_id UUID;
  v_dims JSONB;
BEGIN
  IF NOT public.user_owns_store(p_store_id) THEN
    RAISE EXCEPTION 'Accès refusé à cette boutique';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.products
    WHERE id = p_product_id AND store_id = p_store_id AND product_type = 'physical'
  ) THEN
    RAISE EXCEPTION 'Produit physique introuvable';
  END IF;

  v_dims := COALESCE(p_physical->'dimensions', '{}'::jsonb);

  UPDATE public.products SET
    name = COALESCE(p_product->>'name', name),
    slug = COALESCE(p_product->>'slug', slug),
    description = COALESCE(p_product->>'description', description),
    short_description = COALESCE(p_product->>'short_description', short_description),
    price = COALESCE((p_product->>'price')::NUMERIC, price),
    compare_at_price = CASE
      WHEN p_product ? 'compare_at_price' THEN NULLIF(p_product->>'compare_at_price', '')::NUMERIC
      ELSE compare_at_price
    END,
    cost_per_item = CASE
      WHEN p_product ? 'cost_per_item' THEN NULLIF(p_product->>'cost_per_item', '')::NUMERIC
      ELSE cost_per_item
    END,
    category_id = CASE
      WHEN p_product ? 'category_id' THEN NULLIF(p_product->>'category_id', '')::UUID
      ELSE category_id
    END,
    images = COALESCE(p_product->'images', images),
    tags = COALESCE(p_product->'tags', tags),
    meta_title = COALESCE(p_product->>'meta_title', meta_title),
    meta_description = COALESCE(p_product->>'meta_description', meta_description),
    og_image = COALESCE(p_product->>'og_image', og_image),
    faqs = COALESCE(p_product->'faqs', faqs),
    payment_options = COALESCE(p_product->'payment_options', payment_options),
    hide_purchase_count = COALESCE((p_product->>'hide_purchase_count')::BOOLEAN, hide_purchase_count),
    hide_likes_count = COALESCE((p_product->>'hide_likes_count')::BOOLEAN, hide_likes_count),
    hide_recommendations_count = COALESCE((p_product->>'hide_recommendations_count')::BOOLEAN, hide_recommendations_count),
    hide_downloads_count = COALESCE((p_product->>'hide_downloads_count')::BOOLEAN, hide_downloads_count),
    hide_reviews_count = COALESCE((p_product->>'hide_reviews_count')::BOOLEAN, hide_reviews_count),
    hide_rating = COALESCE((p_product->>'hide_rating')::BOOLEAN, hide_rating),
    is_active = COALESCE((p_product->>'is_active')::BOOLEAN, is_active),
    updated_at = now()
  WHERE id = p_product_id;

  SELECT id INTO v_physical_id
  FROM public.physical_products
  WHERE product_id = p_product_id
  LIMIT 1;

  IF v_physical_id IS NULL THEN
    INSERT INTO public.physical_products (
      product_id, sku, barcode, weight, weight_unit, length, width, height,
      dimensions_unit, track_inventory, low_stock_threshold, requires_shipping,
      free_shipping, inventory_policy, continue_selling_when_out_of_stock,
      shipping_class, whatsapp_number, whatsapp_enabled,
      has_variants, option1_name, option2_name, option3_name
    ) VALUES (
      p_product_id,
      NULLIF(p_physical->>'sku', ''),
      NULLIF(p_physical->>'barcode', ''),
      NULLIF(COALESCE(p_physical->>'weight', ''), '')::NUMERIC,
      COALESCE(p_physical->>'weight_unit', 'kg'),
      NULLIF(COALESCE(p_physical->>'length', v_dims->>'length', ''), '')::NUMERIC,
      NULLIF(COALESCE(p_physical->>'width', v_dims->>'width', ''), '')::NUMERIC,
      NULLIF(COALESCE(p_physical->>'height', v_dims->>'height', ''), '')::NUMERIC,
      COALESCE(NULLIF(p_physical->>'dimensions_unit', ''), NULLIF(v_dims->>'unit', ''), 'cm'),
      COALESCE((p_physical->>'track_inventory')::BOOLEAN, true),
      COALESCE((p_physical->>'low_stock_threshold')::INTEGER, 5),
      COALESCE((p_physical->>'requires_shipping')::BOOLEAN, true),
      COALESCE((p_physical->>'free_shipping')::BOOLEAN, false),
      COALESCE(NULLIF(p_physical->>'inventory_policy', ''), 'deny'),
      COALESCE((p_physical->>'continue_selling_when_out_of_stock')::BOOLEAN, false),
      NULLIF(p_physical->>'shipping_class', ''),
      NULLIF(p_physical->>'whatsapp_number', ''),
      COALESCE((p_physical->>'whatsapp_enabled')::BOOLEAN, false),
      COALESCE((p_physical->>'has_variants')::BOOLEAN, false),
      NULLIF(p_physical->>'option1_name', ''),
      NULLIF(p_physical->>'option2_name', ''),
      NULLIF(p_physical->>'option3_name', '')
    )
    RETURNING id INTO v_physical_id;
  ELSE
    UPDATE public.physical_products SET
      sku = COALESCE(NULLIF(p_physical->>'sku', ''), sku),
      barcode = COALESCE(NULLIF(p_physical->>'barcode', ''), barcode),
      weight = CASE WHEN p_physical ? 'weight' THEN NULLIF(p_physical->>'weight', '')::NUMERIC ELSE weight END,
      weight_unit = COALESCE(p_physical->>'weight_unit', weight_unit),
      length = CASE WHEN p_physical ? 'length' OR p_physical ? 'dimensions' THEN NULLIF(COALESCE(p_physical->>'length', v_dims->>'length', ''), '')::NUMERIC ELSE length END,
      width = CASE WHEN p_physical ? 'width' OR p_physical ? 'dimensions' THEN NULLIF(COALESCE(p_physical->>'width', v_dims->>'width', ''), '')::NUMERIC ELSE width END,
      height = CASE WHEN p_physical ? 'height' OR p_physical ? 'dimensions' THEN NULLIF(COALESCE(p_physical->>'height', v_dims->>'height', ''), '')::NUMERIC ELSE height END,
      dimensions_unit = COALESCE(NULLIF(p_physical->>'dimensions_unit', ''), NULLIF(v_dims->>'unit', ''), dimensions_unit),
      track_inventory = COALESCE((p_physical->>'track_inventory')::BOOLEAN, track_inventory),
      low_stock_threshold = COALESCE((p_physical->>'low_stock_threshold')::INTEGER, low_stock_threshold),
      requires_shipping = COALESCE((p_physical->>'requires_shipping')::BOOLEAN, requires_shipping),
      free_shipping = COALESCE((p_physical->>'free_shipping')::BOOLEAN, free_shipping),
      inventory_policy = COALESCE(NULLIF(p_physical->>'inventory_policy', ''), inventory_policy),
      continue_selling_when_out_of_stock = COALESCE((p_physical->>'continue_selling_when_out_of_stock')::BOOLEAN, continue_selling_when_out_of_stock),
      shipping_class = CASE WHEN p_physical ? 'shipping_class' THEN NULLIF(p_physical->>'shipping_class', '') ELSE shipping_class END,
      whatsapp_number = CASE WHEN p_physical ? 'whatsapp_number' THEN NULLIF(p_physical->>'whatsapp_number', '') ELSE whatsapp_number END,
      whatsapp_enabled = COALESCE((p_physical->>'whatsapp_enabled')::BOOLEAN, whatsapp_enabled),
      has_variants = COALESCE((p_physical->>'has_variants')::BOOLEAN, has_variants),
      option1_name = CASE WHEN p_physical ? 'option1_name' THEN NULLIF(p_physical->>'option1_name', '') ELSE option1_name END,
      option2_name = CASE WHEN p_physical ? 'option2_name' THEN NULLIF(p_physical->>'option2_name', '') ELSE option2_name END,
      option3_name = CASE WHEN p_physical ? 'option3_name' THEN NULLIF(p_physical->>'option3_name', '') ELSE option3_name END,
      updated_at = now()
    WHERE id = v_physical_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'product_id', p_product_id,
    'physical_product_id', v_physical_id
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

-- ============================================================
-- CREATE DIGITAL — hide_* stats
-- ============================================================
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
    COALESCE(p_product->>'pricing_model', 'one-time'),
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

  IF jsonb_array_length(COALESCE(p_files, '[]'::jsonb)) > 0 THEN
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

  RETURN jsonb_build_object('success', true, 'product_id', v_product_id, 'digital_product_id', v_digital_id);
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

-- ============================================================
-- UPDATE DIGITAL
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_digital_product_tx(
  p_store_id UUID,
  p_product_id UUID,
  p_product JSONB,
  p_digital JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_digital_id UUID;
BEGIN
  IF NOT public.user_owns_store(p_store_id) THEN
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
    pricing_model = COALESCE(p_product->>'pricing_model', pricing_model),
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

-- ============================================================
-- CREATE SERVICE — tags + hide_*
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_service_product_tx(
  p_store_id UUID,
  p_product JSONB,
  p_service JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product_id UUID;
  v_service_id UUID;
BEGIN
  IF NOT public.user_owns_store(p_store_id) THEN
    RAISE EXCEPTION 'Accès refusé à cette boutique';
  END IF;

  INSERT INTO public.products (
    store_id, name, slug, description, price, currency, promotional_price,
    pricing_model, product_type, category_id, image_url, images, tags,
    meta_title, meta_description, og_image, faqs, payment_options,
    hide_purchase_count, hide_likes_count, hide_recommendations_count,
    hide_downloads_count, hide_reviews_count, hide_rating,
    is_draft, is_active
  ) VALUES (
    p_store_id,
    p_product->>'name',
    p_product->>'slug',
    COALESCE(p_product->>'description', ''),
    COALESCE((p_product->>'price')::NUMERIC, 0),
    COALESCE(p_product->>'currency', 'XOF'),
    NULLIF(p_product->>'promotional_price', '')::NUMERIC,
    COALESCE(p_product->>'pricing_model', 'one-time'),
    'service',
    NULLIF(p_product->>'category_id', '')::UUID,
    p_product->>'image_url',
    COALESCE(p_product->'images', '[]'::jsonb),
    COALESCE(p_product->'tags', '[]'::jsonb),
    p_product->>'meta_title',
    p_product->>'meta_description',
    p_product->>'og_image',
    COALESCE(p_product->'faqs', '[]'::jsonb),
    COALESCE(p_product->'payment_options', '{"payment_type":"full","percentage_rate":30}'::jsonb),
    COALESCE((p_product->>'hide_purchase_count')::BOOLEAN, false),
    COALESCE((p_product->>'hide_likes_count')::BOOLEAN, false),
    COALESCE((p_product->>'hide_recommendations_count')::BOOLEAN, false),
    COALESCE((p_product->>'hide_downloads_count')::BOOLEAN, false),
    COALESCE((p_product->>'hide_reviews_count')::BOOLEAN, false),
    COALESCE((p_product->>'hide_rating')::BOOLEAN, false),
    COALESCE((p_product->>'is_draft')::BOOLEAN, false),
    COALESCE((p_product->>'is_active')::BOOLEAN, true)
  )
  RETURNING id INTO v_product_id;

  INSERT INTO public.service_products (
    product_id, service_type, duration_minutes, location_type, location_address,
    meeting_url, timezone, requires_staff, max_participants, pricing_type,
    deposit_required, deposit_amount, deposit_type, allow_booking_cancellation,
    cancellation_deadline_hours, require_approval, buffer_time_before,
    buffer_time_after, max_bookings_per_day, advance_booking_days
  ) VALUES (
    v_product_id,
    COALESCE(p_service->>'service_type', 'appointment'),
    COALESCE((p_service->>'duration_minutes')::INTEGER, 60),
    COALESCE(p_service->>'location_type', 'on_site'),
    p_service->>'location_address',
    p_service->>'meeting_url',
    COALESCE(p_service->>'timezone', 'UTC'),
    COALESCE((p_service->>'requires_staff')::BOOLEAN, true),
    COALESCE((p_service->>'max_participants')::INTEGER, 1),
    COALESCE(p_service->>'pricing_type', 'fixed'),
    COALESCE((p_service->>'deposit_required')::BOOLEAN, false),
    NULLIF(p_service->>'deposit_amount', '')::NUMERIC,
    p_service->>'deposit_type',
    COALESCE((p_service->>'allow_booking_cancellation')::BOOLEAN, true),
    COALESCE((p_service->>'cancellation_deadline_hours')::INTEGER, 24),
    COALESCE((p_service->>'require_approval')::BOOLEAN, false),
    COALESCE((p_service->>'buffer_time_before')::INTEGER, 0),
    COALESCE((p_service->>'buffer_time_after')::INTEGER, 0),
    NULLIF(p_service->>'max_bookings_per_day', '')::INTEGER,
    COALESCE((p_service->>'advance_booking_days')::INTEGER, 30)
  )
  RETURNING id INTO v_service_id;

  RETURN jsonb_build_object('success', true, 'product_id', v_product_id, 'service_product_id', v_service_id);
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

-- ============================================================
-- UPDATE SERVICE
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_service_product_tx(
  p_store_id UUID,
  p_product_id UUID,
  p_product JSONB,
  p_service JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_service_id UUID;
BEGIN
  IF NOT public.user_owns_store(p_store_id) THEN
    RAISE EXCEPTION 'Accès refusé à cette boutique';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.products
    WHERE id = p_product_id AND store_id = p_store_id AND product_type = 'service'
  ) THEN
    RAISE EXCEPTION 'Service introuvable';
  END IF;

  UPDATE public.products SET
    name = COALESCE(p_product->>'name', name),
    slug = COALESCE(p_product->>'slug', slug),
    description = COALESCE(p_product->>'description', description),
    short_description = COALESCE(p_product->>'short_description', short_description),
    price = COALESCE((p_product->>'price')::NUMERIC, price),
    promotional_price = CASE WHEN p_product ? 'promotional_price' THEN NULLIF(p_product->>'promotional_price', '')::NUMERIC ELSE promotional_price END,
    currency = COALESCE(p_product->>'currency', currency),
    pricing_model = COALESCE(p_product->>'pricing_model', pricing_model),
    category_id = CASE WHEN p_product ? 'category_id' THEN NULLIF(p_product->>'category_id', '')::UUID ELSE category_id END,
    image_url = COALESCE(p_product->>'image_url', image_url),
    images = COALESCE(p_product->'images', images),
    tags = COALESCE(p_product->'tags', tags),
    meta_title = COALESCE(p_product->>'meta_title', meta_title),
    meta_description = COALESCE(p_product->>'meta_description', meta_description),
    og_image = COALESCE(p_product->>'og_image', og_image),
    faqs = COALESCE(p_product->'faqs', faqs),
    payment_options = COALESCE(p_product->'payment_options', payment_options),
    hide_purchase_count = COALESCE((p_product->>'hide_purchase_count')::BOOLEAN, hide_purchase_count),
    hide_likes_count = COALESCE((p_product->>'hide_likes_count')::BOOLEAN, hide_likes_count),
    hide_recommendations_count = COALESCE((p_product->>'hide_recommendations_count')::BOOLEAN, hide_recommendations_count),
    hide_downloads_count = COALESCE((p_product->>'hide_downloads_count')::BOOLEAN, hide_downloads_count),
    hide_reviews_count = COALESCE((p_product->>'hide_reviews_count')::BOOLEAN, hide_reviews_count),
    hide_rating = COALESCE((p_product->>'hide_rating')::BOOLEAN, hide_rating),
    is_active = COALESCE((p_product->>'is_active')::BOOLEAN, is_active),
    updated_at = now()
  WHERE id = p_product_id;

  SELECT id INTO v_service_id FROM public.service_products WHERE product_id = p_product_id LIMIT 1;

  IF v_service_id IS NULL THEN
    INSERT INTO public.service_products (
      product_id, service_type, duration_minutes, location_type, location_address,
      meeting_url, timezone, requires_staff, max_participants, pricing_type,
      deposit_required, deposit_amount, deposit_type, allow_booking_cancellation,
      cancellation_deadline_hours, require_approval, buffer_time_before,
      buffer_time_after, max_bookings_per_day, advance_booking_days
    ) VALUES (
      p_product_id,
      COALESCE(p_service->>'service_type', 'appointment'),
      COALESCE((p_service->>'duration_minutes')::INTEGER, 60),
      COALESCE(p_service->>'location_type', 'on_site'),
      p_service->>'location_address',
      p_service->>'meeting_url',
      COALESCE(p_service->>'timezone', 'UTC'),
      COALESCE((p_service->>'requires_staff')::BOOLEAN, true),
      COALESCE((p_service->>'max_participants')::INTEGER, 1),
      COALESCE(p_service->>'pricing_type', 'fixed'),
      COALESCE((p_service->>'deposit_required')::BOOLEAN, false),
      NULLIF(p_service->>'deposit_amount', '')::NUMERIC,
      p_service->>'deposit_type',
      COALESCE((p_service->>'allow_booking_cancellation')::BOOLEAN, true),
      COALESCE((p_service->>'cancellation_deadline_hours')::INTEGER, 24),
      COALESCE((p_service->>'require_approval')::BOOLEAN, false),
      COALESCE((p_service->>'buffer_time_before')::INTEGER, 0),
      COALESCE((p_service->>'buffer_time_after')::INTEGER, 0),
      NULLIF(p_service->>'max_bookings_per_day', '')::INTEGER,
      COALESCE((p_service->>'advance_booking_days')::INTEGER, 30)
    )
    RETURNING id INTO v_service_id;
  ELSE
    UPDATE public.service_products SET
      service_type = COALESCE(p_service->>'service_type', service_type),
      duration_minutes = COALESCE((p_service->>'duration_minutes')::INTEGER, duration_minutes),
      location_type = COALESCE(p_service->>'location_type', location_type),
      location_address = CASE WHEN p_service ? 'location_address' THEN p_service->>'location_address' ELSE location_address END,
      meeting_url = CASE WHEN p_service ? 'meeting_url' THEN p_service->>'meeting_url' ELSE meeting_url END,
      timezone = COALESCE(p_service->>'timezone', timezone),
      requires_staff = COALESCE((p_service->>'requires_staff')::BOOLEAN, requires_staff),
      max_participants = COALESCE((p_service->>'max_participants')::INTEGER, max_participants),
      pricing_type = COALESCE(p_service->>'pricing_type', pricing_type),
      deposit_required = COALESCE((p_service->>'deposit_required')::BOOLEAN, deposit_required),
      deposit_amount = CASE WHEN p_service ? 'deposit_amount' THEN NULLIF(p_service->>'deposit_amount', '')::NUMERIC ELSE deposit_amount END,
      deposit_type = CASE WHEN p_service ? 'deposit_type' THEN p_service->>'deposit_type' ELSE deposit_type END,
      allow_booking_cancellation = COALESCE((p_service->>'allow_booking_cancellation')::BOOLEAN, allow_booking_cancellation),
      cancellation_deadline_hours = COALESCE((p_service->>'cancellation_deadline_hours')::INTEGER, cancellation_deadline_hours),
      require_approval = COALESCE((p_service->>'require_approval')::BOOLEAN, require_approval),
      buffer_time_before = COALESCE((p_service->>'buffer_time_before')::INTEGER, buffer_time_before),
      buffer_time_after = COALESCE((p_service->>'buffer_time_after')::INTEGER, buffer_time_after),
      max_bookings_per_day = CASE WHEN p_service ? 'max_bookings_per_day' THEN NULLIF(p_service->>'max_bookings_per_day', '')::INTEGER ELSE max_bookings_per_day END,
      advance_booking_days = COALESCE((p_service->>'advance_booking_days')::INTEGER, advance_booking_days),
      updated_at = now()
    WHERE id = v_service_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'product_id', p_product_id,
    'service_product_id', v_service_id
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_physical_product_tx(UUID, UUID, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_digital_product_tx(UUID, UUID, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_service_product_tx(UUID, UUID, JSONB, JSONB) TO authenticated;
