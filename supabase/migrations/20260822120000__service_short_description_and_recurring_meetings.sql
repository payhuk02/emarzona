-- 1) Persist wizard short_description on service create (update RPC already had it).
-- 2) Recurring children must not inherit Daily/Zoom room of the parent booking.

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

  RETURN jsonb_build_object(
    'success', true,
    'product_id', v_product_id,
    'service_product_id', v_service_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_service_product_tx(UUID, JSONB, JSONB, JSONB, JSONB, JSONB) TO authenticated;

CREATE OR REPLACE FUNCTION public.generate_recurring_bookings(
  p_parent_booking_id UUID,
  p_recurrence_pattern TEXT,
  p_recurrence_interval INTEGER DEFAULT 1,
  p_recurrence_end_date DATE DEFAULT NULL,
  p_recurrence_count INTEGER DEFAULT NULL,
  p_recurrence_days_of_week INTEGER[] DEFAULT NULL,
  p_recurrence_day_of_month INTEGER DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_parent_booking RECORD;
  v_current_date DATE;
  v_end_date DATE;
  v_generated_count INTEGER := 0;
  v_day_of_week INTEGER;
BEGIN
  SELECT * INTO v_parent_booking
  FROM public.service_bookings
  WHERE id = p_parent_booking_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Parent booking not found';
  END IF;

  IF p_recurrence_end_date IS NOT NULL THEN
    v_end_date := p_recurrence_end_date;
  ELSIF p_recurrence_count IS NOT NULL THEN
    v_current_date := v_parent_booking.scheduled_date;
    CASE p_recurrence_pattern
      WHEN 'daily' THEN
        v_end_date := v_current_date + (p_recurrence_count - 1) * (p_recurrence_interval || ' days')::INTERVAL;
      WHEN 'weekly' THEN
        v_end_date := v_current_date + (p_recurrence_count - 1) * (p_recurrence_interval || ' weeks')::INTERVAL;
      WHEN 'monthly' THEN
        v_end_date := v_current_date + (p_recurrence_count - 1) * (p_recurrence_interval || ' months')::INTERVAL;
      ELSE
        v_end_date := v_current_date + (p_recurrence_count - 1) * (p_recurrence_interval || ' days')::INTERVAL;
    END CASE;
  ELSE
    v_end_date := v_parent_booking.scheduled_date + INTERVAL '30 days';
  END IF;

  v_current_date := v_parent_booking.scheduled_date;

  WHILE v_current_date <= v_end_date AND (p_recurrence_count IS NULL OR v_generated_count < p_recurrence_count - 1) LOOP
    CASE p_recurrence_pattern
      WHEN 'daily' THEN
        v_current_date := v_current_date + (p_recurrence_interval || ' days')::INTERVAL;
      WHEN 'weekly' THEN
        LOOP
          v_current_date := v_current_date + INTERVAL '1 day';
          v_day_of_week := EXTRACT(DOW FROM v_current_date);

          IF p_recurrence_days_of_week IS NULL OR v_day_of_week = ANY(p_recurrence_days_of_week) THEN
            EXIT;
          END IF;

          IF v_current_date > v_end_date THEN
            EXIT;
          END IF;
        END LOOP;

        IF v_current_date > v_end_date THEN
          EXIT;
        END IF;

        v_current_date := v_current_date + (p_recurrence_interval - 1 || ' weeks')::INTERVAL;
      WHEN 'monthly' THEN
        IF p_recurrence_day_of_month IS NOT NULL THEN
          v_current_date := DATE_TRUNC('month', v_current_date) + INTERVAL '1 month' + (p_recurrence_day_of_month - 1 || ' days')::INTERVAL;
        ELSE
          v_current_date := v_current_date + (p_recurrence_interval || ' months')::INTERVAL;
        END IF;
      ELSE
        v_current_date := v_current_date + (p_recurrence_interval || ' days')::INTERVAL;
    END CASE;

    IF v_parent_booking.recurrence_exceptions IS NOT NULL AND v_current_date = ANY(v_parent_booking.recurrence_exceptions) THEN
      CONTINUE;
    END IF;

    IF v_current_date > v_end_date THEN
      EXIT;
    END IF;

    INSERT INTO public.service_bookings (
      product_id,
      user_id,
      provider_id,
      scheduled_date,
      scheduled_start_time,
      scheduled_end_time,
      timezone,
      status,
      meeting_url,
      meeting_id,
      meeting_password,
      meeting_platform,
      customer_notes,
      provider_notes,
      internal_notes,
      payment_id,
      amount_paid,
      parent_booking_id,
      is_recurring,
      recurrence_pattern,
      recurrence_interval,
      recurrence_end_date,
      recurrence_count,
      recurrence_days_of_week,
      recurrence_day_of_month,
      recurrence_exceptions,
      staff_member_id,
      participants_count
    ) VALUES (
      v_parent_booking.product_id,
      v_parent_booking.user_id,
      v_parent_booking.provider_id,
      v_current_date,
      v_parent_booking.scheduled_start_time,
      v_parent_booking.scheduled_end_time,
      v_parent_booking.timezone,
      'pending',
      NULL,
      NULL,
      NULL,
      NULL,
      v_parent_booking.customer_notes,
      v_parent_booking.provider_notes,
      v_parent_booking.internal_notes,
      v_parent_booking.payment_id,
      v_parent_booking.amount_paid,
      p_parent_booking_id,
      TRUE,
      p_recurrence_pattern,
      p_recurrence_interval,
      p_recurrence_end_date,
      p_recurrence_count,
      p_recurrence_days_of_week,
      p_recurrence_day_of_month,
      v_parent_booking.recurrence_exceptions,
      v_parent_booking.staff_member_id,
      v_parent_booking.participants_count
    );

    v_generated_count := v_generated_count + 1;
  END LOOP;

  UPDATE public.recurring_bookings_series
  SET
    total_bookings = v_generated_count + 1,
    updated_at = NOW()
  WHERE parent_booking_id = p_parent_booking_id;

  RETURN v_generated_count;
END;
$$;

COMMENT ON FUNCTION public.generate_recurring_bookings IS
  'Génère les réservations récurrentes sans copier la salle visio du parent (Daily par occurrence au join).';
