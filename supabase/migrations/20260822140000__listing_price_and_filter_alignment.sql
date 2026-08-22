-- Listing price = displayed « À partir de » (min package) else promo/catalog.
-- Filter and sort on that amount so marketplace cards match the price slider.

BEGIN;

CREATE OR REPLACE VIEW public.marketplace_products_optimized AS
SELECT
  src.*,
  COALESCE(src.package_starting_price, src.effective_price) AS listing_price
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
  'Vue marketplace ; listing_price aligne filtre/tri sur le prix affiché (packages service).';

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
      (p_category IS NULL OR p_category = 'all' OR m.category = p_category)
      AND (p_product_type IS NULL OR p_product_type = 'all' OR m.product_type = p_product_type)
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

DROP FUNCTION IF EXISTS public.filter_service_products(
  integer, integer, text, numeric, numeric, numeric, text, text, boolean, text, text, uuid, uuid
);

CREATE FUNCTION public.filter_service_products(
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_category TEXT DEFAULT NULL,
  p_min_price NUMERIC DEFAULT NULL,
  p_max_price NUMERIC DEFAULT NULL,
  p_min_rating NUMERIC DEFAULT NULL,
  p_service_type TEXT DEFAULT NULL,
  p_location_type TEXT DEFAULT NULL,
  p_calendar_available BOOLEAN DEFAULT NULL,
  p_sort_by TEXT DEFAULT 'created_at',
  p_sort_order TEXT DEFAULT 'desc',
  p_category_id UUID DEFAULT NULL,
  p_parent_category_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  description TEXT,
  short_description TEXT,
  image_url TEXT,
  price NUMERIC,
  promotional_price NUMERIC,
  currency TEXT,
  category TEXT,
  product_type TEXT,
  rating NUMERIC,
  reviews_count INTEGER,
  purchases_count INTEGER,
  store_id UUID,
  is_active BOOLEAN,
  is_draft BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  tags TEXT[],
  store_name TEXT,
  store_slug TEXT,
  store_logo_url TEXT,
  service_type TEXT,
  location_type TEXT,
  calendar_available BOOLEAN,
  booking_required BOOLEAN,
  duration INTEGER,
  duration_unit TEXT,
  category_id UUID,
  category_attributes JSONB,
  pricing_type TEXT,
  fulfillment_mode TEXT,
  requires_staff BOOLEAN,
  package_starting_price NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH listed AS (
    SELECT
      p.id,
      p.name,
      p.slug,
      p.description,
      p.short_description,
      p.image_url,
      p.price,
      p.promotional_price,
      p.currency,
      p.category,
      p.product_type,
      p.rating,
      p.reviews_count,
      0::integer AS purchases_count,
      p.store_id,
      p.is_active,
      p.is_draft,
      p.created_at,
      p.updated_at,
      p.tags,
      s.name AS store_name,
      s.slug AS store_slug,
      sa.logo_url AS store_logo_url,
      sp.service_type,
      sp.location_type,
      EXISTS (
        SELECT 1 FROM public.service_availability_slots sas
        WHERE sas.service_product_id = sp.id
      ) AS calendar_available,
      true AS booking_required,
      sp.duration_minutes AS duration,
      'minutes'::text AS duration_unit,
      p.category_id,
      COALESCE(sp.category_attributes, '{}'::jsonb) AS category_attributes,
      sp.pricing_type,
      sp.fulfillment_mode,
      COALESCE(sp.requires_staff, false) AS requires_staff,
      (
        SELECT MIN(COALESCE(NULLIF(pkg.price, 0), NULLIF(pkg.package_price, 0)))
        FROM public.service_packages pkg
        WHERE pkg.service_product_id = sp.id
          AND pkg.package_kind = 'delivery_tier'
          AND COALESCE(pkg.is_active, true) = true
      ) AS package_starting_price,
      COALESCE(
        (
          SELECT MIN(COALESCE(NULLIF(pkg.price, 0), NULLIF(pkg.package_price, 0)))
          FROM public.service_packages pkg
          WHERE pkg.service_product_id = sp.id
            AND pkg.package_kind = 'delivery_tier'
            AND COALESCE(pkg.is_active, true) = true
        ),
        CASE
          WHEN p.promotional_price IS NOT NULL AND p.promotional_price < p.price
          THEN p.promotional_price
          ELSE p.price
        END
      ) AS listing_price
    FROM public.products p
    INNER JOIN public.stores s ON s.id = p.store_id
    LEFT JOIN public.store_appearance sa ON sa.store_id = s.id
    LEFT JOIN public.service_products sp ON sp.product_id = p.id
    LEFT JOIN public.categories cat ON cat.id = p.category_id
    WHERE p.is_active = true
      AND p.is_draft = false
      AND p.product_type = 'service'
      AND (
        p_category IS NULL
        OR p.category = p_category
        OR cat.slug = p_category
      )
      AND (
        p_category_id IS NULL
        OR p.category_id = p_category_id
      )
      AND (
        p_parent_category_id IS NULL
        OR cat.parent_id = p_parent_category_id
        OR p.category_id = p_parent_category_id
      )
      AND (p_min_rating IS NULL OR p.rating >= p_min_rating)
      AND (p_service_type IS NULL OR sp.service_type = p_service_type)
      AND (p_location_type IS NULL OR sp.location_type = p_location_type)
      AND (
        p_calendar_available IS NULL
        OR (
          p_calendar_available = EXISTS (
            SELECT 1 FROM public.service_availability_slots sas2
            WHERE sas2.service_product_id = sp.id
          )
        )
      )
  )
  SELECT
    listed.id,
    listed.name,
    listed.slug,
    listed.description,
    listed.short_description,
    listed.image_url,
    listed.price,
    listed.promotional_price,
    listed.currency,
    listed.category,
    listed.product_type,
    listed.rating,
    listed.reviews_count,
    listed.purchases_count,
    listed.store_id,
    listed.is_active,
    listed.is_draft,
    listed.created_at,
    listed.updated_at,
    listed.tags,
    listed.store_name,
    listed.store_slug,
    listed.store_logo_url,
    listed.service_type,
    listed.location_type,
    listed.calendar_available,
    listed.booking_required,
    listed.duration,
    listed.duration_unit,
    listed.category_id,
    listed.category_attributes,
    listed.pricing_type,
    listed.fulfillment_mode,
    listed.requires_staff,
    listed.package_starting_price
  FROM listed
  WHERE (p_min_price IS NULL OR listed.listing_price >= p_min_price)
    AND (p_max_price IS NULL OR listed.listing_price <= p_max_price)
  ORDER BY
    CASE
      WHEN p_sort_by = 'price' AND p_sort_order = 'asc' THEN listed.listing_price
      WHEN p_sort_by = 'price' AND p_sort_order = 'desc' THEN -listed.listing_price
    END NULLS LAST,
    CASE
      WHEN p_sort_by = 'rating' AND p_sort_order = 'asc' THEN listed.rating
      WHEN p_sort_by = 'rating' AND p_sort_order = 'desc' THEN -listed.rating
    END NULLS LAST,
    CASE
      WHEN p_sort_by = 'created_at' AND p_sort_order = 'asc' THEN EXTRACT(EPOCH FROM listed.created_at)
      WHEN p_sort_by = 'created_at' AND p_sort_order = 'desc' THEN -EXTRACT(EPOCH FROM listed.created_at)
    END NULLS LAST,
    CASE
      WHEN p_sort_by = 'purchases' AND p_sort_order = 'asc' THEN 0
      WHEN p_sort_by = 'purchases' AND p_sort_order = 'desc' THEN 0
    END NULLS LAST
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.filter_service_products(
  integer, integer, text, numeric, numeric, numeric, text, text, boolean, text, text, uuid, uuid
) TO anon, authenticated;

COMMIT;
