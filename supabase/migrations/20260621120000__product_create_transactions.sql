-- Sprint 3 : créations produit transactionnelles (artist, digital, service, physique de base)

-- ============================================================
-- ARTISTE
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_artist_product_tx(
  p_store_id UUID,
  p_product JSONB,
  p_artist JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product_id UUID;
  v_error TEXT;
BEGIN
  IF NOT public.user_owns_store(p_store_id) THEN
    RAISE EXCEPTION 'Accès refusé à cette boutique';
  END IF;

  v_error := public.validate_artist_product(
    COALESCE(p_artist->>'artist_type', ''),
    COALESCE(p_artist->>'artist_name', ''),
    COALESCE(p_artist->>'artwork_title', ''),
    COALESCE((p_artist->>'artwork_year')::INTEGER, 0),
    COALESCE(p_artist->'artwork_dimensions', '{}'::jsonb),
    COALESCE(p_artist->>'artwork_edition_type', p_artist->>'edition_type', 'open_edition'),
    COALESCE((p_artist->>'edition_number')::INTEGER, NULL),
    COALESCE((p_artist->>'total_editions')::INTEGER, NULL),
    COALESCE((p_artist->>'requires_shipping')::BOOLEAN, false),
    COALESCE(p_artist->>'artwork_link_url', ''),
    COALESCE((p_artist->>'shipping_handling_time')::INTEGER, 0),
    COALESCE((p_artist->>'shipping_insurance_amount')::NUMERIC, 0)
  );

  IF v_error IS NOT NULL AND trim(v_error) <> '' THEN
    RAISE EXCEPTION '%', v_error;
  END IF;

  INSERT INTO public.products (
    store_id, name, slug, description, short_description, price, currency,
    product_type, category_id, image_url, images, tags,
    meta_title, meta_description, og_image, faqs, payment_options,
    is_draft, is_active, compare_at_price, cost_per_item
  ) VALUES (
    p_store_id,
    COALESCE(p_product->>'name', p_artist->>'artwork_title'),
    p_product->>'slug',
    COALESCE(p_product->>'description', ''),
    p_product->>'short_description',
    COALESCE((p_product->>'price')::NUMERIC, 0),
    COALESCE(p_product->>'currency', 'XOF'),
    'artist',
    NULLIF(p_product->>'category_id', '')::UUID,
    p_product->>'image_url',
    COALESCE(p_product->'images', '[]'::jsonb),
    COALESCE(p_product->'tags', '[]'::jsonb),
    p_product->>'meta_title',
    p_product->>'meta_description',
    p_product->>'og_image',
    COALESCE(p_product->'faqs', '[]'::jsonb),
    COALESCE(p_product->'payment_options', '{"payment_type":"full","percentage_rate":30}'::jsonb),
    COALESCE((p_product->>'is_draft')::BOOLEAN, false),
    COALESCE((p_product->>'is_active')::BOOLEAN, true),
    NULLIF(p_product->>'compare_at_price', '')::NUMERIC,
    NULLIF(p_product->>'cost_per_item', '')::NUMERIC
  )
  RETURNING id INTO v_product_id;

  INSERT INTO public.artist_products (
    product_id, store_id, artist_type, artist_name, artist_bio, artist_website,
    artist_photo_url, artist_social_links, artwork_title, artwork_year, artwork_medium,
    artwork_dimensions, artwork_link_url, artwork_edition_type, edition_number, total_editions,
    writer_specific, musician_specific, visual_artist_specific, designer_specific, multimedia_specific,
    requires_shipping, shipping_handling_time, shipping_fragile, shipping_insurance_required,
    shipping_insurance_amount, certificate_of_authenticity, certificate_file_url,
    signature_authenticated, signature_location
  ) VALUES (
    v_product_id,
    p_store_id,
    p_artist->>'artist_type',
    p_artist->>'artist_name',
    p_artist->>'artist_bio',
    p_artist->>'artist_website',
    p_artist->>'artist_photo_url',
    COALESCE(p_artist->'artist_social_links', '{}'::jsonb),
    p_artist->>'artwork_title',
    NULLIF(p_artist->>'artwork_year', '')::INTEGER,
    p_artist->>'artwork_medium',
    COALESCE(p_artist->'artwork_dimensions', '{}'::jsonb),
    p_artist->>'artwork_link_url',
    COALESCE(p_artist->>'artwork_edition_type', p_artist->>'edition_type', 'open_edition'),
    NULLIF(p_artist->>'edition_number', '')::INTEGER,
    NULLIF(p_artist->>'total_editions', '')::INTEGER,
    p_artist->'writer_specific',
    p_artist->'musician_specific',
    p_artist->'visual_artist_specific',
    p_artist->'designer_specific',
    p_artist->'multimedia_specific',
    COALESCE((p_artist->>'requires_shipping')::BOOLEAN, false),
    COALESCE((p_artist->>'shipping_handling_time')::INTEGER, 0),
    COALESCE((p_artist->>'shipping_fragile')::BOOLEAN, false),
    COALESCE((p_artist->>'shipping_insurance_required')::BOOLEAN, false),
    COALESCE((p_artist->>'shipping_insurance_amount')::NUMERIC, 0),
    COALESCE((p_artist->>'certificate_of_authenticity')::BOOLEAN, false),
    p_artist->>'certificate_file_url',
    COALESCE((p_artist->>'signature_authenticated')::BOOLEAN, false),
    p_artist->>'signature_location'
  );

  RETURN jsonb_build_object('success', true, 'product_id', v_product_id);
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

-- ============================================================
-- DIGITAL
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
    meta_title, meta_description, og_image, faqs
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
    COALESCE(p_product->'faqs', '[]'::jsonb)
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
-- SERVICE (produit + service_products — staff/slots restent côté app)
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
-- PHYSIQUE (produit + physical_products de base — variantes hors transaction)
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
BEGIN
  IF NOT public.user_owns_store(p_store_id) THEN
    RAISE EXCEPTION 'Accès refusé à cette boutique';
  END IF;

  INSERT INTO public.products (
    store_id, name, slug, description, short_description, price, currency,
    promotional_price, product_type, category_id, image_url, images,
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

  INSERT INTO public.physical_products (
    product_id, sku, weight, weight_unit, dimensions, quantity,
    track_inventory, low_stock_threshold
  ) VALUES (
    v_product_id,
    p_physical->>'sku',
    COALESCE((p_physical->>'weight')::NUMERIC, 0),
    COALESCE(p_physical->>'weight_unit', 'kg'),
    COALESCE(p_physical->'dimensions', '{}'::jsonb),
    COALESCE((p_physical->>'quantity')::INTEGER, 0),
    COALESCE((p_physical->>'track_inventory')::BOOLEAN, true),
    COALESCE((p_physical->>'low_stock_threshold')::INTEGER, 5)
  )
  RETURNING id INTO v_physical_id;

  RETURN jsonb_build_object('success', true, 'product_id', v_product_id, 'physical_product_id', v_physical_id);
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_artist_product_tx(UUID, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_digital_product_tx(UUID, JSONB, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_service_product_tx(UUID, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_physical_product_tx(UUID, JSONB, JSONB) TO authenticated;
