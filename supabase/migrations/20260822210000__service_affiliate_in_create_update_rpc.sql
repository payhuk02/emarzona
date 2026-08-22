-- Persist p_affiliate on service create/update (lost when taxonomy patches replaced the RPCs).
-- Wizard `enabled` and course-style `affiliate_enabled` are both accepted.

CREATE OR REPLACE FUNCTION public.upsert_product_affiliate_settings_from_json(
  p_product_id UUID,
  p_store_id UUID,
  p_affiliate JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enabled BOOLEAN;
BEGIN
  IF p_affiliate IS NULL THEN
    RETURN;
  END IF;

  IF NOT public.user_owns_store(p_store_id) THEN
    RAISE EXCEPTION 'Accès refusé à cette boutique';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.products WHERE id = p_product_id AND store_id = p_store_id
  ) THEN
    RAISE EXCEPTION 'Produit introuvable';
  END IF;

  v_enabled := COALESCE(
    (p_affiliate->>'enabled')::BOOLEAN,
    (p_affiliate->>'affiliate_enabled')::BOOLEAN,
    false
  );

  IF v_enabled THEN
    INSERT INTO public.product_affiliate_settings (
      product_id, store_id, affiliate_enabled, commission_rate,
      commission_type, fixed_commission_amount, cookie_duration_days,
      max_commission_per_sale, min_order_amount, allow_self_referral,
      require_approval, terms_and_conditions
    ) VALUES (
      p_product_id,
      p_store_id,
      true,
      COALESCE(NULLIF(p_affiliate->>'commission_rate', '')::NUMERIC, 0),
      COALESCE(NULLIF(p_affiliate->>'commission_type', ''), 'percentage'),
      NULLIF(p_affiliate->>'fixed_commission_amount', '')::NUMERIC,
      COALESCE(NULLIF(p_affiliate->>'cookie_duration_days', '')::INTEGER, 30),
      NULLIF(p_affiliate->>'max_commission_per_sale', '')::NUMERIC,
      NULLIF(p_affiliate->>'min_order_amount', '')::NUMERIC,
      COALESCE((p_affiliate->>'allow_self_referral')::BOOLEAN, false),
      COALESCE((p_affiliate->>'require_approval')::BOOLEAN, false),
      p_affiliate->>'terms_and_conditions'
    )
    ON CONFLICT (product_id) DO UPDATE SET
      affiliate_enabled = true,
      commission_rate = EXCLUDED.commission_rate,
      commission_type = EXCLUDED.commission_type,
      fixed_commission_amount = EXCLUDED.fixed_commission_amount,
      cookie_duration_days = EXCLUDED.cookie_duration_days,
      max_commission_per_sale = EXCLUDED.max_commission_per_sale,
      min_order_amount = EXCLUDED.min_order_amount,
      allow_self_referral = EXCLUDED.allow_self_referral,
      require_approval = EXCLUDED.require_approval,
      terms_and_conditions = EXCLUDED.terms_and_conditions,
      updated_at = now();
  ELSE
    UPDATE public.product_affiliate_settings
    SET affiliate_enabled = false, updated_at = now()
    WHERE product_id = p_product_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_product_affiliate_settings_from_json(UUID, UUID, JSONB) FROM PUBLIC;

DROP FUNCTION IF EXISTS public.create_service_product_tx(UUID, JSONB, JSONB, JSONB, JSONB, JSONB);
DROP FUNCTION IF EXISTS public.create_service_product_tx(UUID, JSONB, JSONB, JSONB, JSONB, JSONB, JSONB);

CREATE OR REPLACE FUNCTION public.create_service_product_tx(
  p_store_id UUID,
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
  v_product_id UUID;
  v_service_id UUID;
  v_item JSONB;
BEGIN
  IF NOT public.user_owns_store(p_store_id) THEN
    RAISE EXCEPTION 'Accès refusé à cette boutique';
  END IF;

  INSERT INTO public.products (
    store_id, name, slug, description, short_description, price, currency, promotional_price,
    pricing_model, product_type, category, category_id, image_url, images,
    meta_title, meta_description, og_image, faqs, payment_options,
    tags, is_draft, is_active
  ) VALUES (
    p_store_id,
    p_product->>'name',
    p_product->>'slug',
    COALESCE(p_product->>'description', ''),
    NULLIF(p_product->>'short_description', ''),
    COALESCE((p_product->>'price')::NUMERIC, 0),
    COALESCE(p_product->>'currency', 'XOF'),
    NULLIF(p_product->>'promotional_price', '')::NUMERIC,
    COALESCE(p_product->>'pricing_model', 'one-time')::pricing_model,
    'service',
    p_product->>'category',
    NULLIF(p_product->>'category_id', '')::UUID,
    p_product->>'image_url',
    COALESCE(p_product->'images', '[]'::jsonb),
    p_product->>'meta_title',
    p_product->>'meta_description',
    p_product->>'og_image',
    COALESCE(p_product->'faqs', '[]'::jsonb),
    COALESCE(p_product->'payment_options', '{"payment_type":"full","percentage_rate":30}'::jsonb),
    CASE
      WHEN jsonb_typeof(p_product->'tags') = 'array' THEN
        ARRAY(SELECT jsonb_array_elements_text(p_product->'tags'))
      ELSE '{}'::text[]
    END,
    COALESCE((p_product->>'is_draft')::BOOLEAN, false),
    COALESCE((p_product->>'is_active')::BOOLEAN, true)
  )
  RETURNING id INTO v_product_id;

  INSERT INTO public.service_products (
    product_id, service_type, duration_minutes, location_type, location_address,
    meeting_url, timezone, requires_staff, max_participants, pricing_type,
    deposit_required, deposit_amount, deposit_type, allow_booking_cancellation,
    cancellation_deadline_hours, require_approval, buffer_time_before,
    buffer_time_after, max_bookings_per_day, advance_booking_days,
    fulfillment_mode, category_attributes
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
    COALESCE((p_service->>'advance_booking_days')::INTEGER, 30),
    COALESCE(NULLIF(p_service->>'fulfillment_mode', ''), 'appointment'),
    COALESCE(p_service->'category_attributes', '{}'::jsonb)
  )
  RETURNING id INTO v_service_id;

  IF jsonb_array_length(COALESCE(p_staff, '[]'::jsonb)) > 0 THEN
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

  IF jsonb_array_length(COALESCE(p_slots, '[]'::jsonb)) > 0 THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_slots)
    LOOP
      INSERT INTO public.service_availability_slots (
        service_product_id, day_of_week, start_time, end_time
      ) VALUES (
        v_service_id,
        COALESCE((v_item->>'day')::INTEGER, (v_item->>'day_of_week')::INTEGER),
        (v_item->>'start_time')::time,
        (v_item->>'end_time')::time
      );
    END LOOP;
  END IF;

  IF jsonb_array_length(COALESCE(p_resources, '[]'::jsonb)) > 0 THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_resources)
    LOOP
      INSERT INTO public.service_resources (
        service_product_id, name, resource_type, quantity, is_required
      ) VALUES (
        v_service_id,
        v_item->>'name',
        COALESCE(v_item->>'resource_type', 'other'),
        COALESCE((v_item->>'quantity')::INTEGER, 1),
        COALESCE((v_item->>'is_required')::BOOLEAN, false)
      );
    END LOOP;
  END IF;

  PERFORM public.upsert_product_affiliate_settings_from_json(v_product_id, p_store_id, p_affiliate);

  RETURN jsonb_build_object(
    'success', true,
    'product_id', v_product_id,
    'service_product_id', v_service_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_service_product_tx(UUID, JSONB, JSONB, JSONB, JSONB, JSONB, JSONB) TO authenticated;

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
    category = CASE WHEN p_product ? 'category' THEN p_product->>'category' ELSE category END,
    category_id = CASE WHEN p_product ? 'category_id' THEN NULLIF(p_product->>'category_id', '')::UUID ELSE category_id END,
    image_url = COALESCE(p_product->>'image_url', image_url),
    images = COALESCE(p_product->'images', images),
    tags = CASE
      WHEN p_product ? 'tags' AND jsonb_typeof(p_product->'tags') = 'array' THEN
        ARRAY(SELECT jsonb_array_elements_text(p_product->'tags'))
      ELSE tags
    END,
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
      buffer_time_after, max_bookings_per_day, advance_booking_days,
      fulfillment_mode, category_attributes
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
      COALESCE((p_service->>'advance_booking_days')::INTEGER, 30),
      COALESCE(NULLIF(p_service->>'fulfillment_mode', ''), 'appointment'),
      COALESCE(p_service->'category_attributes', '{}'::jsonb)
    )
    RETURNING id INTO v_service_id;
  ELSE
    UPDATE public.service_products SET
      service_type = COALESCE(p_service->>'service_type', service_type),
      duration_minutes = COALESCE((p_service->>'duration_minutes')::INTEGER, duration_minutes),
      location_type = COALESCE(p_service->>'location_type', location_type),
      location_address = COALESCE(p_service->>'location_address', location_address),
      meeting_url = COALESCE(p_service->>'meeting_url', meeting_url),
      timezone = COALESCE(p_service->>'timezone', timezone),
      requires_staff = COALESCE((p_service->>'requires_staff')::BOOLEAN, requires_staff),
      max_participants = COALESCE((p_service->>'max_participants')::INTEGER, max_participants),
      pricing_type = COALESCE(p_service->>'pricing_type', pricing_type),
      deposit_required = COALESCE((p_service->>'deposit_required')::BOOLEAN, deposit_required),
      deposit_amount = CASE WHEN p_service ? 'deposit_amount' THEN NULLIF(p_service->>'deposit_amount', '')::NUMERIC ELSE deposit_amount END,
      deposit_type = COALESCE(p_service->>'deposit_type', deposit_type),
      allow_booking_cancellation = COALESCE((p_service->>'allow_booking_cancellation')::BOOLEAN, allow_booking_cancellation),
      cancellation_deadline_hours = COALESCE((p_service->>'cancellation_deadline_hours')::INTEGER, cancellation_deadline_hours),
      require_approval = COALESCE((p_service->>'require_approval')::BOOLEAN, require_approval),
      buffer_time_before = COALESCE((p_service->>'buffer_time_before')::INTEGER, buffer_time_before),
      buffer_time_after = COALESCE((p_service->>'buffer_time_after')::INTEGER, buffer_time_after),
      max_bookings_per_day = CASE WHEN p_service ? 'max_bookings_per_day' THEN NULLIF(p_service->>'max_bookings_per_day', '')::INTEGER ELSE max_bookings_per_day END,
      advance_booking_days = COALESCE((p_service->>'advance_booking_days')::INTEGER, advance_booking_days),
      fulfillment_mode = COALESCE(NULLIF(p_service->>'fulfillment_mode', ''), fulfillment_mode),
      category_attributes = CASE
        WHEN p_service ? 'category_attributes' THEN COALESCE(p_service->'category_attributes', '{}'::jsonb)
        ELSE category_attributes
      END,
      updated_at = now()
    WHERE id = v_service_id;
  END IF;

  IF p_staff IS NOT NULL AND jsonb_typeof(p_staff) = 'array' THEN
    DELETE FROM public.service_staff_members WHERE service_product_id = v_service_id;
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_staff)
    LOOP
      INSERT INTO public.service_staff_members (
        service_product_id, store_id, name, role, bio, email, phone, avatar_url, is_active
      ) VALUES (
        v_service_id, p_store_id, v_item->>'name', v_item->>'role', v_item->>'bio',
        v_item->>'email', v_item->>'phone', v_item->>'avatar_url',
        COALESCE((v_item->>'is_active')::BOOLEAN, true)
      );
    END LOOP;
  END IF;

  IF p_slots IS NOT NULL AND jsonb_typeof(p_slots) = 'array' THEN
    DELETE FROM public.service_availability_slots WHERE service_product_id = v_service_id;
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_slots)
    LOOP
      INSERT INTO public.service_availability_slots (
        service_product_id, day_of_week, start_time, end_time
      ) VALUES (
        v_service_id,
        COALESCE((v_item->>'day')::INTEGER, (v_item->>'day_of_week')::INTEGER),
        (v_item->>'start_time')::time,
        (v_item->>'end_time')::time
      );
    END LOOP;
  END IF;

  IF p_resources IS NOT NULL AND jsonb_typeof(p_resources) = 'array' THEN
    DELETE FROM public.service_resources WHERE service_product_id = v_service_id;
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_resources)
    LOOP
      INSERT INTO public.service_resources (
        service_product_id, name, resource_type, quantity, is_required
      ) VALUES (
        v_service_id,
        v_item->>'name',
        COALESCE(v_item->>'resource_type', 'other'),
        COALESCE((v_item->>'quantity')::INTEGER, 1),
        COALESCE((v_item->>'is_required')::BOOLEAN, false)
      );
    END LOOP;
  END IF;

  PERFORM public.upsert_product_affiliate_settings_from_json(p_product_id, p_store_id, p_affiliate);

  RETURN jsonb_build_object(
    'success', true,
    'product_id', p_product_id,
    'service_product_id', v_service_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_service_product_tx(UUID, UUID, JSONB, JSONB, JSONB, JSONB, JSONB, JSONB) TO authenticated;
