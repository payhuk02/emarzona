-- Hotfix ORDER BY type mismatch in filter_service_products
DROP FUNCTION IF EXISTS public.filter_service_products(
  integer, integer, text, numeric, numeric, numeric, text, text, boolean, text, text, uuid, uuid
);

CREATE OR REPLACE FUNCTION public.filter_service_products(
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
  duration_unit TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
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
    'minutes'::text AS duration_unit
  FROM public.products p
  INNER JOIN public.stores s ON s.id = p.store_id
  LEFT JOIN public.store_appearance sa ON sa.store_id = s.id
  LEFT JOIN public.service_products sp ON sp.product_id = p.id
  LEFT JOIN public.categories cat ON cat.id = p.category_id
  WHERE p.is_active = true
    AND COALESCE(p.is_draft, false) = false
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
    AND (p_min_price IS NULL OR COALESCE(p.promotional_price, p.price) >= p_min_price)
    AND (p_max_price IS NULL OR COALESCE(p.promotional_price, p.price) <= p_max_price)
    AND (p_min_rating IS NULL OR COALESCE(p.rating, 0) >= p_min_rating)
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
  ORDER BY
    CASE WHEN p_sort_by = 'price' AND p_sort_order = 'asc' THEN COALESCE(p.promotional_price, p.price) END ASC NULLS LAST,
    CASE WHEN p_sort_by = 'price' AND p_sort_order = 'desc' THEN COALESCE(p.promotional_price, p.price) END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'rating' AND p_sort_order = 'asc' THEN COALESCE(p.rating, 0) END ASC NULLS LAST,
    CASE WHEN p_sort_by = 'rating' AND p_sort_order = 'desc' THEN COALESCE(p.rating, 0) END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'created_at' AND p_sort_order = 'asc' THEN p.created_at END ASC NULLS LAST,
    CASE WHEN (p_sort_by = 'created_at' OR p_sort_by IS NULL OR p_sort_by = '') AND (p_sort_order = 'desc' OR p_sort_order IS NULL) THEN p.created_at END DESC NULLS LAST,
    p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.filter_service_products(
  integer, integer, text, numeric, numeric, numeric, text, text, boolean, text, text, uuid, uuid
) TO anon, authenticated, service_role;
