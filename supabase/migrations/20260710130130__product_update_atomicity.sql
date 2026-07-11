-- ============================================================
-- MIGRATION: Rendre atomique la mise à jour (édition) des produits physiques et des services
-- ============================================================

-- 1. Refonte de update_service_product_tx
CREATE OR REPLACE FUNCTION public.update_service_product_tx(
  p_store_id UUID,
  p_product_id UUID,
  p_product JSONB,
  p_service JSONB,
  p_staff JSONB DEFAULT '[]'::jsonb,
  p_slots JSONB DEFAULT '[]'::jsonb,
  p_resources JSONB DEFAULT '[]'::jsonb,
  p_affiliate JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_service_id UUID;
  v_item JSONB;
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
    pricing_model = COALESCE(p_product->>'pricing_model', pricing_model::text)::pricing_model,
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

  -- Atomic update of staff
  DELETE FROM public.service_staff_members WHERE service_product_id = v_service_id;
  IF p_staff IS NOT NULL AND jsonb_array_length(p_staff) > 0 THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_staff)
    LOOP
      INSERT INTO public.service_staff_members (
        service_product_id, store_id, name, role, bio, email, phone, avatar_url, is_active
      ) VALUES (
        v_service_id,
        p_store_id,
        v_item->>'name',
        v_item->>'role',
        v_item->>'bio',
        v_item->>'email',
        v_item->>'phone',
        v_item->>'avatar_url',
        COALESCE((v_item->>'is_active')::BOOLEAN, true)
      );
    END LOOP;
  END IF;

  -- Atomic update of slots
  DELETE FROM public.service_availability_slots WHERE service_product_id = v_service_id;
  IF p_slots IS NOT NULL AND jsonb_array_length(p_slots) > 0 THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_slots)
    LOOP
      INSERT INTO public.service_availability_slots (
        service_product_id, day_of_week, start_time, end_time, staff_member_id, is_active
      ) VALUES (
        v_service_id,
        (v_item->>'day_of_week')::INTEGER,
        (v_item->>'start_time')::TIME,
        (v_item->>'end_time')::TIME,
        NULLIF(v_item->>'staff_member_id', '')::UUID,
        COALESCE((v_item->>'is_active')::BOOLEAN, true)
      );
    END LOOP;
  END IF;

  -- Atomic update of resources
  DELETE FROM public.service_resources WHERE service_product_id = v_service_id;
  IF p_resources IS NOT NULL AND jsonb_array_length(p_resources) > 0 THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_resources)
    LOOP
      INSERT INTO public.service_resources (
        service_product_id, name, description, resource_type, quantity_available, is_active
      ) VALUES (
        v_service_id,
        COALESCE(v_item->>'resource_name', v_item->>'name'),
        v_item->>'description',
        v_item->>'resource_type',
        COALESCE((v_item->>'quantity_available')::INTEGER, 1),
        COALESCE((v_item->>'is_active')::BOOLEAN, true)
      );
    END LOOP;
  END IF;

  -- Atomic update of affiliate
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
    'service_product_id', v_service_id
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;


-- 2. Refonte de update_physical_product_tx
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

  -- Atomic update of variants & inventory
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
      
      -- Inventaire correspondant
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
    -- Cas sans variantes (inventaire unique)
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

  -- Atomic update of size chart
  DELETE FROM public.product_size_charts WHERE product_id = p_product_id;
  IF p_size_chart_id IS NOT NULL THEN
    INSERT INTO public.product_size_charts (
      product_id, size_chart_id
    ) VALUES (
      p_product_id, p_size_chart_id
    );
  END IF;

  -- Atomic update of affiliate
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

GRANT EXECUTE ON FUNCTION public.update_service_product_tx(UUID, UUID, JSONB, JSONB, JSONB, JSONB, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_physical_product_tx(UUID, UUID, JSONB, JSONB, JSONB, JSONB, UUID, JSONB) TO authenticated;
