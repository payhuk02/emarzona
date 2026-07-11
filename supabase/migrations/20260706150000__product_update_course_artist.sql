-- Sprint 3 : RPC update transactionnels (cours + artiste)

-- ============================================================
-- UPDATE ARTISTE
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_artist_product_tx(
  p_store_id UUID,
  p_product_id UUID,
  p_product JSONB,
  p_artist JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_error TEXT;
BEGIN
  IF NOT public.user_owns_store(p_store_id) THEN
    RAISE EXCEPTION 'Accès refusé à cette boutique';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.products
    WHERE id = p_product_id AND store_id = p_store_id AND product_type = 'artist'
  ) THEN
    RAISE EXCEPTION 'Œuvre artiste introuvable';
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

  UPDATE public.products SET
    name = COALESCE(p_product->>'name', p_artist->>'artwork_title', name),
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
    is_draft = COALESCE((p_product->>'is_draft')::BOOLEAN, is_draft),
    is_active = COALESCE((p_product->>'is_active')::BOOLEAN, is_active),
    updated_at = now()
  WHERE id = p_product_id;

  IF EXISTS (SELECT 1 FROM public.artist_products WHERE product_id = p_product_id) THEN
    UPDATE public.artist_products SET
      artist_type = COALESCE(p_artist->>'artist_type', artist_type),
      artist_name = COALESCE(p_artist->>'artist_name', artist_name),
      artist_bio = COALESCE(p_artist->>'artist_bio', artist_bio),
      artist_website = COALESCE(p_artist->>'artist_website', artist_website),
      artist_photo_url = CASE WHEN p_artist ? 'artist_photo_url' THEN p_artist->>'artist_photo_url' ELSE artist_photo_url END,
      artist_social_links = COALESCE(p_artist->'artist_social_links', artist_social_links),
      artwork_title = COALESCE(p_artist->>'artwork_title', artwork_title),
      artwork_year = CASE WHEN p_artist ? 'artwork_year' THEN NULLIF(p_artist->>'artwork_year', '')::INTEGER ELSE artwork_year END,
      artwork_medium = COALESCE(p_artist->>'artwork_medium', artwork_medium),
      artwork_dimensions = COALESCE(p_artist->'artwork_dimensions', artwork_dimensions),
      artwork_link_url = CASE WHEN p_artist ? 'artwork_link_url' THEN p_artist->>'artwork_link_url' ELSE artwork_link_url END,
      artwork_edition_type = COALESCE(p_artist->>'artwork_edition_type', p_artist->>'edition_type', artwork_edition_type),
      edition_number = CASE WHEN p_artist ? 'edition_number' THEN NULLIF(p_artist->>'edition_number', '')::INTEGER ELSE edition_number END,
      total_editions = CASE WHEN p_artist ? 'total_editions' THEN NULLIF(p_artist->>'total_editions', '')::INTEGER ELSE total_editions END,
      writer_specific = COALESCE(p_artist->'writer_specific', writer_specific),
      musician_specific = COALESCE(p_artist->'musician_specific', musician_specific),
      visual_artist_specific = COALESCE(p_artist->'visual_artist_specific', visual_artist_specific),
      designer_specific = COALESCE(p_artist->'designer_specific', designer_specific),
      multimedia_specific = COALESCE(p_artist->'multimedia_specific', multimedia_specific),
      requires_shipping = COALESCE((p_artist->>'requires_shipping')::BOOLEAN, requires_shipping),
      shipping_handling_time = COALESCE((p_artist->>'shipping_handling_time')::INTEGER, shipping_handling_time),
      shipping_fragile = COALESCE((p_artist->>'shipping_fragile')::BOOLEAN, shipping_fragile),
      shipping_insurance_required = COALESCE((p_artist->>'shipping_insurance_required')::BOOLEAN, shipping_insurance_required),
      shipping_insurance_amount = COALESCE((p_artist->>'shipping_insurance_amount')::NUMERIC, shipping_insurance_amount),
      certificate_of_authenticity = COALESCE((p_artist->>'certificate_of_authenticity')::BOOLEAN, certificate_of_authenticity),
      certificate_file_url = CASE WHEN p_artist ? 'certificate_file_url' THEN p_artist->>'certificate_file_url' ELSE certificate_file_url END,
      signature_authenticated = COALESCE((p_artist->>'signature_authenticated')::BOOLEAN, signature_authenticated),
      signature_location = CASE WHEN p_artist ? 'signature_location' THEN p_artist->>'signature_location' ELSE signature_location END,
      updated_at = now()
    WHERE product_id = p_product_id;
  ELSE
    INSERT INTO public.artist_products (
      product_id, store_id, artist_type, artist_name, artist_bio, artist_website,
      artist_photo_url, artist_social_links, artwork_title, artwork_year, artwork_medium,
      artwork_dimensions, artwork_link_url, artwork_edition_type, edition_number, total_editions,
      writer_specific, musician_specific, visual_artist_specific, designer_specific, multimedia_specific,
      requires_shipping, shipping_handling_time, shipping_fragile, shipping_insurance_required,
      shipping_insurance_amount, certificate_of_authenticity, certificate_file_url,
      signature_authenticated, signature_location
    ) VALUES (
      p_product_id,
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
  END IF;

  RETURN jsonb_build_object('success', true, 'product_id', p_product_id);
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

-- ============================================================
-- UPDATE COURS (produit + cours + curriculum + affiliation)
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_full_course_tx(
  p_store_id UUID,
  p_product_id UUID,
  p_product JSONB,
  p_course JSONB,
  p_sections JSONB DEFAULT '[]'::jsonb,
  p_affiliate JSONB DEFAULT NULL,
  p_tracking JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_course_id UUID;
  v_section JSONB;
  v_lesson JSONB;
  v_created_section_id UUID;
  v_total_lessons INTEGER := 0;
  v_total_duration INTEGER := 0;
  v_pricing_model TEXT;
BEGIN
  IF NOT public.user_owns_store(p_store_id) THEN
    RAISE EXCEPTION 'Accès refusé à cette boutique';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.products
    WHERE id = p_product_id AND store_id = p_store_id AND product_type = 'course'
  ) THEN
    RAISE EXCEPTION 'Cours introuvable';
  END IF;

  v_pricing_model := COALESCE(p_product->>'pricing_model', 'one-time')::pricing_model;

  UPDATE public.products SET
    name = COALESCE(p_product->>'name', name),
    slug = COALESCE(p_product->>'slug', slug),
    short_description = COALESCE(p_product->>'short_description', short_description),
    description = COALESCE(p_product->>'description', description),
    category = COALESCE(p_product->>'category', category),
    category_id = CASE
      WHEN p_product ? 'category_id' THEN NULLIF(p_product->>'category_id', '')::UUID
      ELSE category_id
    END,
    price = CASE
      WHEN v_pricing_model = 'free' THEN 0
      ELSE COALESCE((p_product->>'price')::NUMERIC, price)
    END,
    currency = COALESCE(p_product->>'currency', currency),
    promotional_price = CASE
      WHEN p_product ? 'promotional_price' THEN NULLIF(p_product->>'promotional_price', '')::NUMERIC
      ELSE promotional_price
    END,
    pricing_model = COALESCE(v_pricing_model, pricing_model::text)::pricing_model,
    image_url = COALESCE(p_product->>'image_url', image_url),
    images = COALESCE(p_product->'images', images),
    licensing_type = COALESCE(p_product->>'licensing_type', licensing_type),
    license_terms = CASE WHEN p_product ? 'license_terms' THEN p_product->>'license_terms' ELSE license_terms END,
    meta_title = COALESCE(p_product->>'meta_title', meta_title),
    meta_description = COALESCE(p_product->>'meta_description', meta_description),
    meta_keywords = COALESCE(p_product->>'meta_keywords', meta_keywords),
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

  -- Recalcul stats curriculum
  IF p_sections IS NOT NULL THEN
    FOR v_section IN SELECT * FROM jsonb_array_elements(p_sections)
    LOOP
      IF v_section->'lessons' IS NOT NULL THEN
        FOR v_lesson IN SELECT * FROM jsonb_array_elements(v_section->'lessons')
        LOOP
          v_total_lessons := v_total_lessons + 1;
          v_total_duration := v_total_duration + COALESCE(
            (v_lesson->>'video_duration_seconds')::INTEGER,
            (v_lesson->>'video_duration')::INTEGER,
            0
          );
        END LOOP;
      END IF;
    END LOOP;
  END IF;

  SELECT id INTO v_course_id FROM public.courses WHERE product_id = p_product_id LIMIT 1;

  IF v_course_id IS NULL THEN
    INSERT INTO public.courses (
      product_id, level, language, total_duration_minutes, total_lessons,
      learning_objectives, prerequisites, target_audience,
      certificate_enabled, certificate_passing_score
    ) VALUES (
      p_product_id,
      COALESCE(p_course->>'level', ''),
      COALESCE(p_course->>'language', 'fr'),
      ROUND(v_total_duration / 60.0),
      v_total_lessons,
      COALESCE(
        CASE
          WHEN p_course ? 'learning_objectives' AND jsonb_array_length(COALESCE(p_course->'learning_objectives', '[]'::jsonb)) > 0
            THEN ARRAY(SELECT jsonb_array_elements_text(p_course->'learning_objectives'))
          ELSE NULL
        END,
        '{}'::text[]
      ),
      COALESCE(
        CASE
          WHEN p_course ? 'prerequisites' AND jsonb_array_length(COALESCE(p_course->'prerequisites', '[]'::jsonb)) > 0
            THEN ARRAY(SELECT jsonb_array_elements_text(p_course->'prerequisites'))
          ELSE NULL
        END,
        '{}'::text[]
      ),
      COALESCE(
        CASE
          WHEN p_course ? 'target_audience' AND jsonb_array_length(COALESCE(p_course->'target_audience', '[]'::jsonb)) > 0
            THEN ARRAY(SELECT jsonb_array_elements_text(p_course->'target_audience'))
          ELSE NULL
        END,
        '{}'::text[]
      ),
      COALESCE((p_course->>'certificate_enabled')::BOOLEAN, true),
      COALESCE((p_course->>'certificate_passing_score')::INTEGER, 80)
    )
    RETURNING id INTO v_course_id;
  ELSE
    UPDATE public.courses SET
      level = COALESCE(p_course->>'level', level),
      language = COALESCE(p_course->>'language', language),
      total_duration_minutes = ROUND(v_total_duration / 60.0),
      total_lessons = v_total_lessons,
      learning_objectives = COALESCE(
        CASE
          WHEN p_course ? 'learning_objectives' AND jsonb_array_length(COALESCE(p_course->'learning_objectives', '[]'::jsonb)) > 0
            THEN ARRAY(SELECT jsonb_array_elements_text(p_course->'learning_objectives'))
          ELSE NULL
        END,
        learning_objectives
      ),
      prerequisites = COALESCE(
        CASE
          WHEN p_course ? 'prerequisites' AND jsonb_array_length(COALESCE(p_course->'prerequisites', '[]'::jsonb)) > 0
            THEN ARRAY(SELECT jsonb_array_elements_text(p_course->'prerequisites'))
          ELSE NULL
        END,
        prerequisites
      ),
      target_audience = COALESCE(
        CASE
          WHEN p_course ? 'target_audience' AND jsonb_array_length(COALESCE(p_course->'target_audience', '[]'::jsonb)) > 0
            THEN ARRAY(SELECT jsonb_array_elements_text(p_course->'target_audience'))
          ELSE NULL
        END,
        target_audience
      ),
      certificate_enabled = COALESCE((p_course->>'certificate_enabled')::BOOLEAN, certificate_enabled),
      certificate_passing_score = COALESCE((p_course->>'certificate_passing_score')::INTEGER, certificate_passing_score),
      updated_at = now()
    WHERE id = v_course_id;
  END IF;

  -- Remplacement curriculum (atomique dans la transaction)
  DELETE FROM public.course_lessons WHERE course_id = v_course_id;
  DELETE FROM public.course_sections WHERE course_id = v_course_id;

  IF p_sections IS NOT NULL THEN
    FOR v_section IN SELECT * FROM jsonb_array_elements(p_sections)
    LOOP
      INSERT INTO public.course_sections (
        course_id, title, description, order_index
      ) VALUES (
        v_course_id,
        v_section->>'title',
        NULLIF(v_section->>'description', ''),
        COALESCE((v_section->>'order_index')::INTEGER, 0)
      )
      RETURNING id INTO v_created_section_id;

      IF v_section->'lessons' IS NOT NULL THEN
        FOR v_lesson IN SELECT * FROM jsonb_array_elements(v_section->'lessons')
        LOOP
          INSERT INTO public.course_lessons (
            section_id, course_id, title, description, notes, transcript,
            order_index, video_type, video_url, video_duration_seconds,
            is_preview, is_required
          ) VALUES (
            v_created_section_id,
            v_course_id,
            v_lesson->>'title',
            NULLIF(v_lesson->>'description', ''),
            NULLIF(COALESCE(v_lesson->>'notes', v_lesson->>'content'), ''),
            NULLIF(v_lesson->>'transcript', ''),
            COALESCE((v_lesson->>'order_index')::INTEGER, 0),
            COALESCE(v_lesson->>'video_type', 'upload'),
            COALESCE(v_lesson->>'video_url', ''),
            COALESCE(
              (v_lesson->>'video_duration_seconds')::INTEGER,
              (v_lesson->>'video_duration')::INTEGER,
              0
            ),
            COALESCE((v_lesson->>'is_preview')::BOOLEAN, false),
            COALESCE((v_lesson->>'is_required')::BOOLEAN, true)
          );
        END LOOP;
      END IF;
    END LOOP;
  END IF;

  -- Affiliation
  IF p_affiliate IS NOT NULL AND COALESCE((p_affiliate->>'affiliate_enabled')::BOOLEAN, false) THEN
    INSERT INTO public.product_affiliate_settings (
      product_id, store_id, affiliate_enabled, commission_rate, commission_type,
      fixed_commission_amount, cookie_duration_days, max_commission_per_sale,
      min_order_amount, allow_self_referral, require_approval, terms_and_conditions
    ) VALUES (
      p_product_id,
      p_store_id,
      true,
      NULLIF(p_affiliate->>'commission_rate', '')::NUMERIC,
      p_affiliate->>'commission_type',
      NULLIF(p_affiliate->>'fixed_commission_amount', '')::NUMERIC,
      NULLIF(p_affiliate->>'cookie_duration_days', '')::INTEGER,
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
  ELSIF p_affiliate IS NOT NULL THEN
    UPDATE public.product_affiliate_settings
    SET affiliate_enabled = false, updated_at = now()
    WHERE product_id = p_product_id;
  END IF;

  -- Tracking pixels (table optionnelle)
  IF p_tracking IS NOT NULL AND EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'course_tracking_settings'
  ) THEN
    IF EXISTS (SELECT 1 FROM public.course_tracking_settings WHERE course_id = v_course_id) THEN
      UPDATE public.course_tracking_settings SET
        tracking_enabled = COALESCE((p_tracking->>'tracking_enabled')::BOOLEAN, tracking_enabled),
        google_analytics_id = COALESCE(p_tracking->>'google_analytics_id', google_analytics_id),
        facebook_pixel_id = COALESCE(p_tracking->>'facebook_pixel_id', facebook_pixel_id),
        google_tag_manager_id = COALESCE(p_tracking->>'google_tag_manager_id', google_tag_manager_id),
        tiktok_pixel_id = COALESCE(p_tracking->>'tiktok_pixel_id', tiktok_pixel_id),
        track_video_events = COALESCE((p_tracking->>'track_video_events')::BOOLEAN, track_video_events),
        track_lesson_completion = COALESCE((p_tracking->>'track_lesson_completion')::BOOLEAN, track_lesson_completion),
        track_quiz_attempts = COALESCE((p_tracking->>'track_quiz_attempts')::BOOLEAN, track_quiz_attempts),
        track_certificate_downloads = COALESCE((p_tracking->>'track_certificate_downloads')::BOOLEAN, track_certificate_downloads),
        updated_at = now()
      WHERE course_id = v_course_id;
    ELSE
      INSERT INTO public.course_tracking_settings (
        course_id, tracking_enabled, google_analytics_id, facebook_pixel_id,
        google_tag_manager_id, tiktok_pixel_id, track_video_events,
        track_lesson_completion, track_quiz_attempts, track_certificate_downloads
      ) VALUES (
        v_course_id,
        COALESCE((p_tracking->>'tracking_enabled')::BOOLEAN, true),
        p_tracking->>'google_analytics_id',
        p_tracking->>'facebook_pixel_id',
        p_tracking->>'google_tag_manager_id',
        p_tracking->>'tiktok_pixel_id',
        COALESCE((p_tracking->>'track_video_events')::BOOLEAN, true),
        COALESCE((p_tracking->>'track_lesson_completion')::BOOLEAN, true),
        COALESCE((p_tracking->>'track_quiz_attempts')::BOOLEAN, true),
        COALESCE((p_tracking->>'track_certificate_downloads')::BOOLEAN, true)
      );
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'product_id', p_product_id,
    'course_id', v_course_id,
    'sections_count', jsonb_array_length(COALESCE(p_sections, '[]'::jsonb)),
    'lessons_count', v_total_lessons
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_artist_product_tx(UUID, UUID, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_full_course_tx(UUID, UUID, JSONB, JSONB, JSONB, JSONB, JSONB) TO authenticated;
