-- Persist country_of_origin in update_physical_product_tx
-- (create already writes physical.country_of_origin; trigger syncs to products.
--  update RPC omitted the column — wizard also calls persistProductCountryOfOrigin as belt-and-suspenders.)

CREATE OR REPLACE FUNCTION public.update_physical_product_tx(
  p_store_id UUID,
  p_product_id UUID,
  p_product JSONB,
  p_physical JSONB,
  p_variants JSONB DEFAULT '[]'::jsonb,
  p_inventory JSONB DEFAULT '[]'::jsonb,
  p_size_chart_id UUID DEFAULT NULL,
  p_affiliate JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_physical_id UUID;
  v_dims JSONB;
  v_variant_id UUID;
  v_item JSONB;
  v_inv JSONB;
  v_idx INTEGER;
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
    category = CASE
      WHEN p_product ? 'category' THEN NULLIF(p_product->>'category', '')
      ELSE category
    END,
    category_id = CASE
      WHEN p_product ? 'category_id' THEN NULLIF(p_product->>'category_id', '')::UUID
      ELSE category_id
    END,
    country_of_origin = CASE
      WHEN p_product ? 'country_of_origin' THEN NULLIF(p_product->>'country_of_origin', '')
      WHEN p_physical ? 'country_of_origin' THEN NULLIF(p_physical->>'country_of_origin', '')
      ELSE country_of_origin
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
      country_of_origin, shipping_class, whatsapp_number, whatsapp_enabled,
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
      country_of_origin = CASE
        WHEN p_physical ? 'country_of_origin' THEN NULLIF(p_physical->>'country_of_origin', '')
        ELSE country_of_origin
      END,
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

  DELETE FROM public.physical_product_inventory WHERE physical_product_id = v_physical_id;
  DELETE FROM public.physical_product_variants WHERE physical_product_id = v_physical_id;

  IF p_variants IS NOT NULL AND jsonb_array_length(p_variants) > 0 THEN
    v_idx := 0;
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_variants)
    LOOP
      INSERT INTO public.physical_product_variants (
        physical_product_id, option1_value, option2_value, option3_value,
        price, compare_at_price, cost_per_item, sku, barcode, weight, image_url
      ) VALUES (
        v_physical_id,
        v_item->>'option1_value',
        v_item->>'option2_value',
        v_item->>'option3_value',
        COALESCE((v_item->>'price')::NUMERIC, (p_product->>'price')::NUMERIC, 0),
        (v_item->>'compare_at_price')::NUMERIC,
        (v_item->>'cost_per_item')::NUMERIC,
        v_item->>'sku',
        v_item->>'barcode',
        (v_item->>'weight')::NUMERIC,
        v_item->>'image_url'
      ) RETURNING id INTO v_variant_id;

      IF p_inventory IS NOT NULL AND jsonb_array_length(p_inventory) > v_idx THEN
        v_inv := p_inventory->v_idx;
        INSERT INTO public.physical_product_inventory (
          physical_product_id, product_id, store_id, variant_id,
          location_name, quantity_available, quantity_reserved,
          low_stock_threshold, track_inventory
        ) VALUES (
          v_physical_id, p_product_id, p_store_id, v_variant_id,
          COALESCE(v_inv->>'location_name', 'Default'),
          COALESCE((v_inv->>'quantity_available')::INTEGER, 0),
          0,
          COALESCE((v_inv->>'low_stock_threshold')::INTEGER, 5),
          COALESCE((v_inv->>'track_inventory')::BOOLEAN, true)
        );
      END IF;

      v_idx := v_idx + 1;
    END LOOP;
  ELSE
    IF p_inventory IS NOT NULL AND jsonb_array_length(p_inventory) > 0 THEN
      v_inv := p_inventory->0;
      INSERT INTO public.physical_product_inventory (
        physical_product_id, product_id, store_id, variant_id,
        location_name, quantity_available, quantity_reserved,
        low_stock_threshold, track_inventory
      ) VALUES (
        v_physical_id, p_product_id, p_store_id, NULL,
        COALESCE(v_inv->>'location_name', 'Default'),
        COALESCE((v_inv->>'quantity_available')::INTEGER, COALESCE((p_physical->>'quantity')::INTEGER, 0)),
        0,
        COALESCE((v_inv->>'low_stock_threshold')::INTEGER, 5),
        COALESCE((v_inv->>'track_inventory')::BOOLEAN, true)
      );
    END IF;
  END IF;

  DELETE FROM public.product_size_charts WHERE product_id = p_product_id;
  IF p_size_chart_id IS NOT NULL THEN
    INSERT INTO public.product_size_charts (
      product_id, size_chart_id
    ) VALUES (
      p_product_id, p_size_chart_id
    );
  END IF;

  DELETE FROM public.product_affiliate_settings WHERE product_id = p_product_id;
  IF p_affiliate IS NOT NULL AND (p_affiliate->>'enabled')::BOOLEAN = true THEN
    INSERT INTO public.product_affiliate_settings (
      product_id, store_id, affiliate_enabled, commission_rate,
      commission_type, fixed_commission_amount, cookie_duration_days,
      min_order_amount, allow_self_referral, require_approval, terms_and_conditions
    ) VALUES (
      p_product_id,
      p_store_id,
      true,
      (p_affiliate->>'commission_rate')::NUMERIC,
      p_affiliate->>'commission_type',
      (p_affiliate->>'fixed_commission_amount')::NUMERIC,
      (p_affiliate->>'cookie_duration_days')::INTEGER,
      (p_affiliate->>'min_order_amount')::NUMERIC,
      COALESCE((p_affiliate->>'allow_self_referral')::BOOLEAN, false),
      COALESCE((p_affiliate->>'require_approval')::BOOLEAN, false),
      p_affiliate->>'terms_and_conditions'
    );
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

GRANT EXECUTE ON FUNCTION public.update_physical_product_tx(UUID, UUID, JSONB, JSONB, JSONB, JSONB, UUID, JSONB) TO authenticated;

NOTIFY pgrst, 'reload schema';
