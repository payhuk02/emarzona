-- ============================================================
-- MIGRATION: Rendre atomique la création des produits physiques et des services
-- ============================================================

-- 1. Refonte de create_service_product_tx
CREATE OR REPLACE FUNCTION public.create_service_product_tx(
  p_store_id UUID,
  p_product JSONB,
  p_service JSONB,
  p_staff JSONB DEFAULT '[]'::jsonb,
  p_slots JSONB DEFAULT '[]'::jsonb,
  p_resources JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product_id UUID;
  v_service_id UUID;
  v_item JSONB;
BEGIN
  IF NOT public.user_owns_store(p_store_id) THEN
    RAISE EXCEPTION 'Accès refusé à cette boutique';
  END IF;

  -- 1. Création du produit de base
  INSERT INTO public.products (
    store_id, name, slug, description, price, currency, promotional_price,
    pricing_model, product_type, category_id, image_url, images,
    meta_title, meta_description, og_image, faqs, payment_options,
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
    p_product->>'meta_title',
    p_product->>'meta_description',
    p_product->>'og_image',
    COALESCE(p_product->'faqs', '[]'::jsonb),
    COALESCE(p_product->'payment_options', '{"payment_type":"full","percentage_rate":30}'::jsonb),
    COALESCE((p_product->>'is_draft')::BOOLEAN, false),
    COALESCE((p_product->>'is_active')::BOOLEAN, true)
  )
  RETURNING id INTO v_product_id;

  -- 2. Création du service
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

  -- 3. Staff
  IF jsonb_array_length(p_staff) > 0 THEN
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

  -- 4. Slots
  IF jsonb_array_length(p_slots) > 0 THEN
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

  -- 5. Resources
  IF jsonb_array_length(p_resources) > 0 THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_resources)
    LOOP
      INSERT INTO public.service_resources (
        service_product_id, name, description, resource_type, quantity_available, is_active
      ) VALUES (
        v_service_id,
        v_item->>'name',
        v_item->>'description',
        v_item->>'resource_type',
        COALESCE((v_item->>'quantity_available')::INTEGER, 1),
        COALESCE((v_item->>'is_active')::BOOLEAN, true)
      );
    END LOOP;
  END IF;

  RETURN jsonb_build_object('success', true, 'product_id', v_product_id, 'service_product_id', v_service_id);
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;


-- 2. Refonte de create_physical_product_tx
CREATE OR REPLACE FUNCTION public.create_physical_product_tx(
  p_store_id UUID,
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
  v_product_id UUID;
  v_physical_id UUID;
  v_variant_id UUID;
  v_item JSONB;
  v_inv JSONB;
  v_idx INTEGER;
BEGIN
  IF NOT public.user_owns_store(p_store_id) THEN
    RAISE EXCEPTION 'Accès refusé à cette boutique';
  END IF;

  -- 1. Produit de base
  INSERT INTO public.products (
    store_id, name, slug, description, short_description, price, currency,
    promotional_price, compare_at_price, cost_per_item, product_type, category_id, image_url, images,
    meta_title, meta_description, og_image, faqs, payment_options,
    is_draft, is_active
  ) VALUES (
    p_store_id,
    p_product->>'name',
    p_product->>'slug',
    COALESCE(p_product->>'description', ''),
    p_product->>'short_description',
    COALESCE((p_product->>'price')::NUMERIC, 0),
    COALESCE(p_product->>'currency', 'XOF'),
    NULLIF(p_product->>'promotional_price', '')::NUMERIC,
    NULLIF(p_product->>'compare_at_price', '')::NUMERIC,
    NULLIF(p_product->>'cost_per_item', '')::NUMERIC,
    'physical',
    NULLIF(p_product->>'category_id', '')::UUID,
    p_product->>'image_url',
    COALESCE(p_product->'images', '[]'::jsonb),
    p_product->>'meta_title',
    p_product->>'meta_description',
    p_product->>'og_image',
    COALESCE(p_product->'faqs', '[]'::jsonb),
    COALESCE(p_product->'payment_options', '{}'::jsonb),
    COALESCE((p_product->>'is_draft')::BOOLEAN, false),
    COALESCE((p_product->>'is_active')::BOOLEAN, true)
  )
  RETURNING id INTO v_product_id;

  -- 2. Physical
  INSERT INTO public.physical_products (
    product_id, sku, barcode, weight, weight_unit, length, width, height, dimensions_unit, quantity,
    track_inventory, low_stock_threshold, requires_shipping, free_shipping, inventory_policy,
    continue_selling_when_out_of_stock, country_of_origin, shipping_class,
    whatsapp_number, whatsapp_enabled, has_variants, option1_name, option2_name, option3_name
  ) VALUES (
    v_product_id,
    p_physical->>'sku',
    p_physical->>'barcode',
    COALESCE((p_physical->>'weight')::NUMERIC, 0),
    COALESCE(p_physical->>'weight_unit', 'kg'),
    (p_physical->>'length')::NUMERIC,
    (p_physical->>'width')::NUMERIC,
    (p_physical->>'height')::NUMERIC,
    COALESCE(p_physical->>'dimensions_unit', 'cm'),
    COALESCE((p_physical->>'quantity')::INTEGER, 0),
    COALESCE((p_physical->>'track_inventory')::BOOLEAN, true),
    COALESCE((p_physical->>'low_stock_threshold')::INTEGER, 5),
    COALESCE((p_physical->>'requires_shipping')::BOOLEAN, true),
    COALESCE((p_physical->>'free_shipping')::BOOLEAN, false),
    COALESCE(p_physical->>'inventory_policy', 'deny'),
    COALESCE((p_physical->>'continue_selling_when_out_of_stock')::BOOLEAN, false),
    COALESCE(p_physical->>'country_of_origin', 'CI'),
    p_physical->>'shipping_class',
    p_physical->>'whatsapp_number',
    COALESCE((p_physical->>'whatsapp_enabled')::BOOLEAN, false),
    COALESCE((p_physical->>'has_variants')::BOOLEAN, false),
    p_physical->>'option1_name',
    p_physical->>'option2_name',
    p_physical->>'option3_name'
  )
  RETURNING id INTO v_physical_id;

  -- 3. Variants & Inventory
  IF jsonb_array_length(p_variants) > 0 THEN
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
      IF jsonb_array_length(p_inventory) > v_idx THEN
        v_inv := p_inventory->v_idx;
        INSERT INTO public.physical_product_inventory (
          physical_product_id, product_id, store_id, variant_id,
          location_name, quantity_available, quantity_reserved,
          low_stock_threshold, track_inventory
        ) VALUES (
          v_physical_id, v_product_id, p_store_id, v_variant_id,
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
    IF jsonb_array_length(p_inventory) > 0 THEN
      v_inv := p_inventory->0;
      INSERT INTO public.physical_product_inventory (
        physical_product_id, product_id, store_id, variant_id,
        location_name, quantity_available, quantity_reserved,
        low_stock_threshold, track_inventory
      ) VALUES (
        v_physical_id, v_product_id, p_store_id, NULL,
        COALESCE(v_inv->>'location_name', 'Default'),
        COALESCE((v_inv->>'quantity_available')::INTEGER, COALESCE((p_physical->>'quantity')::INTEGER, 0)),
        0,
        COALESCE((v_inv->>'low_stock_threshold')::INTEGER, 5),
        COALESCE((v_inv->>'track_inventory')::BOOLEAN, true)
      );
    END IF;
  END IF;

  -- 4. Size Chart
  IF p_size_chart_id IS NOT NULL THEN
    INSERT INTO public.product_size_charts (
      product_id, size_chart_id
    ) VALUES (
      v_product_id, p_size_chart_id
    );
  END IF;

  -- 5. Affiliate
  IF p_affiliate IS NOT NULL AND (p_affiliate->>'enabled')::BOOLEAN = true THEN
    INSERT INTO public.product_affiliate_settings (
      product_id, store_id, affiliate_enabled, commission_rate,
      commission_type, fixed_commission_amount, cookie_duration_days,
      min_order_amount, allow_self_referral, require_approval, terms_and_conditions
    ) VALUES (
      v_product_id,
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

  RETURN jsonb_build_object('success', true, 'product_id', v_product_id, 'physical_product_id', v_physical_id);
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_service_product_tx(UUID, JSONB, JSONB, JSONB, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_physical_product_tx(UUID, JSONB, JSONB, JSONB, JSONB, UUID, JSONB) TO authenticated;
