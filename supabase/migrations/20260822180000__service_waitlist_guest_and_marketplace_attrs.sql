-- Waitlist: guest join (nullable user_id) + join RPC.
-- Marketplace: expose category_attributes so listing chips work on the generic grid.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Marketplace view + RPC: category_attributes
-- ---------------------------------------------------------------------------

-- CREATE OR REPLACE VIEW cannot rename/reorder columns (42P16).
-- listing_price stays last-but-one; category_attributes is appended.
CREATE OR REPLACE VIEW public.marketplace_products_optimized AS
SELECT
  src.*,
  COALESCE(src.package_starting_price, src.effective_price) AS listing_price,
  COALESCE(
    (
      SELECT sp.category_attributes
      FROM public.service_products sp
      WHERE sp.product_id = src.id
      LIMIT 1
    ),
    '{}'::jsonb
  ) AS category_attributes
FROM (
  SELECT
    p.id,
    p.name,
    p.slug,
    p.description,
    p.short_description,
    p.price,
    p.promotional_price,
    p.currency,
    p.category,
    p.product_type,
    p.licensing_type,
    p.license_terms,
    p.is_featured,
    p.is_active,
    p.rating,
    p.reviews_count,
    0::integer AS purchases_count,
    p.created_at,
    p.updated_at,
    p.image_url,
    p.tags,
    s.id AS store_id,
    s.name AS store_name,
    s.slug AS store_slug,
    sa.logo_url AS store_logo_url,
    pas.commission_rate,
    pas.affiliate_enabled,
    COALESCE(p.rating, 0) AS sort_rating,
    COALESCE(p.reviews_count, 0) AS sort_reviews,
    0::integer AS sort_purchases,
    CASE
      WHEN p.promotional_price IS NOT NULL AND p.promotional_price < p.price
      THEN p.promotional_price
      ELSE p.price
    END AS effective_price,
    p.payment_options,
    p.whatsapp_number,
    p.whatsapp_enabled,
    sp.pricing_type,
    sp.fulfillment_mode,
    sp.duration_minutes,
    EXISTS (
      SELECT 1 FROM public.service_availability_slots sas
      WHERE sas.service_product_id = sp.id
    ) AS calendar_available,
    COALESCE(sp.requires_staff, false) AS requires_staff,
    (
      SELECT MIN(COALESCE(NULLIF(pkg.price, 0), NULLIF(pkg.package_price, 0)))
      FROM public.service_packages pkg
      WHERE pkg.service_product_id = sp.id
        AND pkg.package_kind = 'delivery_tier'
        AND COALESCE(pkg.is_active, true) = true
    ) AS package_starting_price
  FROM public.products p
  JOIN public.stores s ON p.store_id = s.id
  LEFT JOIN public.store_appearance sa ON sa.store_id = s.id
  LEFT JOIN public.product_affiliate_settings pas ON p.id = pas.product_id
  LEFT JOIN public.service_products sp ON sp.product_id = p.id AND p.product_type = 'service'
  WHERE p.is_active = true
    AND (p.is_draft IS NULL OR p.is_draft = false)
    AND s.is_active = true
) src;

COMMENT ON VIEW public.marketplace_products_optimized IS
  'Vue marketplace ; listing_price + category_attributes pour chips service.';

GRANT SELECT ON public.marketplace_products_optimized TO anon, authenticated;

DROP FUNCTION IF EXISTS public.get_marketplace_products_filtered(
  INTEGER, INTEGER, TEXT, TEXT, DECIMAL, DECIMAL, DECIMAL, TEXT, TEXT, TEXT, BOOLEAN
);

CREATE FUNCTION public.get_marketplace_products_filtered(
  p_limit INTEGER DEFAULT 24,
  p_offset INTEGER DEFAULT 0,
  p_category TEXT DEFAULT NULL,
  p_product_type TEXT DEFAULT NULL,
  p_min_price DECIMAL DEFAULT NULL,
  p_max_price DECIMAL DEFAULT NULL,
  p_min_rating DECIMAL DEFAULT NULL,
  p_sort_by TEXT DEFAULT 'created_at',
  p_sort_order TEXT DEFAULT 'desc',
  p_search_query TEXT DEFAULT NULL,
  p_featured_only BOOLEAN DEFAULT false
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  description TEXT,
  short_description TEXT,
  price DECIMAL,
  promotional_price DECIMAL,
  currency TEXT,
  category TEXT,
  product_type TEXT,
  licensing_type TEXT,
  license_terms TEXT,
  is_featured BOOLEAN,
  rating DECIMAL,
  reviews_count INTEGER,
  purchases_count INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  image_url TEXT,
  tags TEXT[],
  store_id UUID,
  store_name TEXT,
  store_slug TEXT,
  store_logo_url TEXT,
  commission_rate DECIMAL,
  affiliate_enabled BOOLEAN,
  payment_options JSONB,
  whatsapp_number TEXT,
  whatsapp_enabled BOOLEAN,
  pricing_type TEXT,
  fulfillment_mode TEXT,
  duration_minutes INTEGER,
  calendar_available BOOLEAN,
  requires_staff BOOLEAN,
  package_starting_price DECIMAL,
  category_attributes JSONB,
  total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH filtered AS (
    SELECT m.*
    FROM marketplace_products_optimized m
    WHERE
      (p_product_type IS NULL OR p_product_type = 'all' OR m.product_type = p_product_type)
      AND (
        p_category IS NULL
        OR p_category = 'all'
        OR m.category = p_category
        OR EXISTS (
          SELECT 1
          FROM public.categories child
          JOIN public.categories parent ON child.parent_id = parent.id
          WHERE parent.slug = p_category
            AND child.slug = m.category
        )
      )
      AND (p_min_price IS NULL OR m.listing_price >= p_min_price)
      AND (p_max_price IS NULL OR m.listing_price <= p_max_price)
      AND (p_min_rating IS NULL OR m.sort_rating >= p_min_rating)
      AND (
        p_search_query IS NULL
        OR TRIM(p_search_query) = ''
        OR m.name ILIKE '%' || TRIM(p_search_query) || '%'
        OR m.description ILIKE '%' || TRIM(p_search_query) || '%'
      )
      AND (NOT p_featured_only OR m.is_featured = true)
  ),
  counted AS (
    SELECT COUNT(*)::bigint AS cnt FROM filtered
  )
  SELECT
    f.id,
    f.name,
    f.slug,
    f.description,
    f.short_description,
    f.price,
    f.promotional_price,
    f.currency,
    f.category,
    f.product_type,
    f.licensing_type,
    f.license_terms,
    f.is_featured,
    f.rating,
    f.reviews_count,
    f.purchases_count,
    f.created_at,
    f.updated_at,
    f.image_url,
    f.tags,
    f.store_id,
    f.store_name,
    f.store_slug,
    f.store_logo_url,
    f.commission_rate,
    f.affiliate_enabled,
    f.payment_options,
    f.whatsapp_number,
    f.whatsapp_enabled,
    f.pricing_type,
    f.fulfillment_mode,
    f.duration_minutes,
    f.calendar_available,
    f.requires_staff,
    f.package_starting_price,
    f.category_attributes,
    c.cnt AS total_count
  FROM filtered f
  CROSS JOIN counted c
  ORDER BY
    CASE WHEN p_sort_by = 'price' AND UPPER(p_sort_order) = 'ASC' THEN f.listing_price END ASC,
    CASE WHEN p_sort_by = 'price' AND UPPER(p_sort_order) <> 'ASC' THEN f.listing_price END DESC,
    CASE WHEN p_sort_by = 'rating' AND UPPER(p_sort_order) = 'ASC' THEN f.sort_rating END ASC,
    CASE WHEN p_sort_by = 'rating' AND UPPER(p_sort_order) <> 'ASC' THEN f.sort_rating END DESC,
    CASE WHEN p_sort_by IN ('popular', 'sales_count') AND UPPER(p_sort_order) = 'ASC' THEN f.sort_purchases END ASC,
    CASE WHEN p_sort_by IN ('popular', 'sales_count') AND UPPER(p_sort_order) <> 'ASC' THEN f.sort_purchases END DESC,
    CASE WHEN p_sort_by = 'oldest' THEN f.created_at END ASC,
    CASE WHEN p_sort_by IN ('newest', 'created_at') OR p_sort_by IS NULL THEN f.created_at END DESC,
    f.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_marketplace_products_filtered(
  INTEGER, INTEGER, TEXT, TEXT, DECIMAL, DECIMAL, DECIMAL, TEXT, TEXT, TEXT, BOOLEAN
) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Waitlist: guests (nullable user_id) + join RPC
-- ---------------------------------------------------------------------------

ALTER TABLE public.service_waitlist
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.service_waitlist
  DROP CONSTRAINT IF EXISTS service_waitlist_service_id_user_id_status_key;

CREATE UNIQUE INDEX IF NOT EXISTS service_waitlist_one_active_user
  ON public.service_waitlist (service_id, user_id)
  WHERE user_id IS NOT NULL AND status IN ('waiting', 'notified');

CREATE UNIQUE INDEX IF NOT EXISTS service_waitlist_one_active_email
  ON public.service_waitlist (service_id, lower(customer_email))
  WHERE status IN ('waiting', 'notified');

CREATE OR REPLACE FUNCTION public.join_service_waitlist(
  p_service_id uuid,
  p_store_id uuid,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text DEFAULT NULL,
  p_preferred_date date DEFAULT NULL,
  p_preferred_time time DEFAULT NULL,
  p_customer_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_email text;
  v_name text;
  v_row public.service_waitlist;
  v_product record;
BEGIN
  v_email := lower(trim(coalesce(p_customer_email, '')));
  v_name := trim(coalesce(p_customer_name, ''));

  IF v_email !~ '^[^@]+@[^@]+\.[^@]+$' THEN
    RAISE EXCEPTION 'invalid_email';
  END IF;
  IF length(v_name) < 2 THEN
    RAISE EXCEPTION 'invalid_name';
  END IF;

  SELECT p.id, p.store_id, p.product_type, p.is_active, p.is_draft
  INTO v_product
  FROM public.products p
  WHERE p.id = p_service_id;

  IF v_product.id IS NULL OR v_product.product_type <> 'service' THEN
    RAISE EXCEPTION 'service_not_found';
  END IF;
  IF v_product.store_id <> p_store_id THEN
    RAISE EXCEPTION 'store_mismatch';
  END IF;
  IF v_product.is_active IS NOT TRUE OR v_product.is_draft IS TRUE THEN
    RAISE EXCEPTION 'service_unavailable';
  END IF;

  SELECT *
  INTO v_row
  FROM public.service_waitlist
  WHERE service_id = p_service_id
    AND lower(customer_email) = v_email
    AND status IN ('waiting', 'notified')
  LIMIT 1;

  IF v_row.id IS NOT NULL THEN
    RETURN to_jsonb(v_row);
  END IF;

  INSERT INTO public.service_waitlist (
    service_id,
    store_id,
    user_id,
    customer_name,
    customer_email,
    customer_phone,
    preferred_date,
    preferred_time,
    customer_notes,
    status,
    priority
  ) VALUES (
    p_service_id,
    p_store_id,
    v_user_id,
    v_name,
    v_email,
    nullif(trim(coalesce(p_customer_phone, '')), ''),
    p_preferred_date,
    p_preferred_time,
    nullif(trim(coalesce(p_customer_notes, '')), ''),
    'waiting',
    'normal'
  )
  RETURNING * INTO v_row;

  RETURN to_jsonb(v_row);
END;
$$;

REVOKE ALL ON FUNCTION public.join_service_waitlist(
  uuid, uuid, text, text, text, date, time, text
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.join_service_waitlist(
  uuid, uuid, text, text, text, date, time, text
) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Rappels : une seule file (templates store, sinon 24h/2h)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.create_booking_reminders(p_booking_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking RECORD;
  v_templates RECORD;
  v_reminder_count INTEGER := 0;
  v_scheduled_at TIMESTAMPTZ;
  v_hours INTEGER;
BEGIN
  SELECT
    sb.id,
    sb.product_id,
    sb.user_id,
    sb.scheduled_date,
    sb.scheduled_start_time,
    sb.status,
    p.store_id,
    p.name AS service_name
  INTO v_booking
  FROM public.service_bookings sb
  INNER JOIN public.products p ON p.id = sb.product_id
  WHERE sb.id = p_booking_id;

  IF NOT FOUND OR v_booking.status != 'confirmed' THEN
    RETURN 0;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.service_booking_reminders
    WHERE booking_id = p_booking_id
      AND status = 'pending'
  ) THEN
    RETURN 0;
  END IF;

  FOR v_templates IN
    SELECT *
    FROM public.service_reminder_templates
    WHERE store_id = v_booking.store_id
      AND is_active = true
      AND template_type = 'email'
    ORDER BY reminder_timing_hours ASC
  LOOP
    v_scheduled_at := (v_booking.scheduled_date + v_booking.scheduled_start_time)::TIMESTAMPTZ
                      - (v_templates.reminder_timing_hours || ' hours')::INTERVAL;

    IF v_scheduled_at > now() THEN
      INSERT INTO public.service_booking_reminders (
        booking_id, service_id, store_id, user_id,
        reminder_type, reminder_scheduled_at, reminder_subject, reminder_message,
        reminder_template, status
      )
      VALUES (
        v_booking.id,
        v_booking.product_id,
        v_booking.store_id,
        v_booking.user_id,
        v_templates.template_type,
        v_scheduled_at,
        v_templates.subject_template,
        v_templates.message_template,
        v_templates.template_name,
        'pending'
      );
      v_reminder_count := v_reminder_count + 1;
    END IF;
  END LOOP;

  IF v_reminder_count = 0 THEN
    FOREACH v_hours IN ARRAY ARRAY[24, 2]
    LOOP
      v_scheduled_at := (v_booking.scheduled_date + v_booking.scheduled_start_time)::TIMESTAMPTZ
                        - (v_hours || ' hours')::INTERVAL;
      IF v_scheduled_at > now() THEN
        INSERT INTO public.service_booking_reminders (
          booking_id, service_id, store_id, user_id,
          reminder_type, reminder_scheduled_at, reminder_subject, reminder_message,
          reminder_template, status
        )
        VALUES (
          v_booking.id,
          v_booking.product_id,
          v_booking.store_id,
          v_booking.user_id,
          'email',
          v_scheduled_at,
          'Rappel ' || v_hours || 'h — votre rendez-vous',
          'Rappel ' || v_hours || 'h : votre réservation « ' || v_booking.service_name
            || ' » approche.',
          v_hours::text || 'h',
          'pending'
        );
        v_reminder_count := v_reminder_count + 1;
      END IF;
    END LOOP;
  END IF;

  RETURN v_reminder_count;
END;
$$;

COMMIT;
