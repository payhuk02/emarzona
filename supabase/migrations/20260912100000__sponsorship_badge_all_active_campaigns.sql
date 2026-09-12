-- Badge "Sponsorisé": is_sponsored = any active campaign (not only feed slot ≤3).
-- Ranking still boosts via feed_sponsored (max 3 / 1 per store).

CREATE OR REPLACE FUNCTION public.get_marketplace_products_filtered(
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
  p_featured_only BOOLEAN DEFAULT false,
  p_sponsored_only BOOLEAN DEFAULT false
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
  is_sponsored BOOLEAN,
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
  active_sponsorship_id UUID,
  total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.expire_marketplace_sponsorships();

  RETURN QUERY
  WITH filtered AS (
    SELECT
      m.*,
      (
        SELECT s.id
        FROM public.marketplace_sponsorships s
        WHERE s.product_id = m.id
          AND s.status = 'active'
          AND s.starts_at IS NOT NULL
          AND s.ends_at IS NOT NULL
          AND now() >= s.starts_at
          AND now() < s.ends_at
        ORDER BY s.starts_at ASC
        LIMIT 1
      ) AS active_sponsorship_id,
      (
        SELECT s.starts_at
        FROM public.marketplace_sponsorships s
        WHERE s.product_id = m.id
          AND s.status = 'active'
          AND s.starts_at IS NOT NULL
          AND s.ends_at IS NOT NULL
          AND now() >= s.starts_at
          AND now() < s.ends_at
        ORDER BY s.starts_at ASC
        LIMIT 1
      ) AS sponsored_at
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
      AND (
        NOT p_sponsored_only
        OR m.is_sponsored = true
        OR EXISTS (
          SELECT 1
          FROM public.marketplace_sponsorships s
          WHERE s.product_id = m.id
            AND s.status = 'active'
            AND s.starts_at IS NOT NULL
            AND s.ends_at IS NOT NULL
            AND now() >= s.starts_at
            AND now() < s.ends_at
        )
      )
  ),
  with_store_rank AS (
    SELECT
      f.*,
      CASE
        WHEN f.active_sponsorship_id IS NOT NULL OR f.is_sponsored THEN
          ROW_NUMBER() OVER (
            PARTITION BY f.store_id
            ORDER BY f.sponsored_at ASC NULLS LAST, f.created_at DESC
          )
        ELSE NULL
      END AS store_sponsored_rn
    FROM filtered f
  ),
  capped AS (
    SELECT
      w.*,
      CASE
        WHEN (w.active_sponsorship_id IS NOT NULL OR w.is_sponsored)
          AND COALESCE(w.store_sponsored_rn, 1) = 1 THEN true
        ELSE false
      END AS eligible_sponsored
    FROM with_store_rank w
  ),
  numbered AS (
    SELECT
      c.*,
      CASE
        WHEN c.eligible_sponsored THEN
          ROW_NUMBER() OVER (
            ORDER BY c.sponsored_at ASC NULLS LAST, c.created_at DESC
          )
        ELSE NULL
      END AS global_sponsored_rn
    FROM capped c
  ),
  ranked AS (
    SELECT
      n.*,
      CASE
        WHEN n.eligible_sponsored AND n.global_sponsored_rn <= 3 THEN true
        ELSE false
      END AS feed_sponsored
    FROM numbered n
  ),
  counted AS (
    SELECT COUNT(*)::bigint AS cnt FROM ranked
  )
  SELECT
    r.id,
    r.name,
    r.slug,
    r.description,
    r.short_description,
    r.price,
    r.promotional_price,
    r.currency,
    r.category,
    r.product_type,
    r.licensing_type,
    r.license_terms,
    r.is_featured,
    (r.active_sponsorship_id IS NOT NULL OR r.is_sponsored) AS is_sponsored,
    r.rating,
    r.reviews_count,
    r.purchases_count,
    r.created_at,
    r.updated_at,
    r.image_url,
    r.tags,
    r.store_id,
    r.store_name,
    r.store_slug,
    r.store_logo_url,
    r.commission_rate,
    r.affiliate_enabled,
    r.payment_options,
    r.whatsapp_number,
    r.whatsapp_enabled,
    r.pricing_type,
    r.fulfillment_mode,
    r.duration_minutes,
    r.calendar_available,
    r.requires_staff,
    r.package_starting_price,
    r.category_attributes,
    r.active_sponsorship_id,
    c.cnt AS total_count
  FROM ranked r
  CROSS JOIN counted c
  ORDER BY
    r.feed_sponsored DESC,
    CASE WHEN p_sort_by = 'price' AND UPPER(p_sort_order) = 'ASC' THEN r.listing_price END ASC,
    CASE WHEN p_sort_by = 'price' AND UPPER(p_sort_order) <> 'ASC' THEN r.listing_price END DESC,
    CASE WHEN p_sort_by = 'rating' AND UPPER(p_sort_order) = 'ASC' THEN r.sort_rating END ASC,
    CASE WHEN p_sort_by = 'rating' AND UPPER(p_sort_order) <> 'ASC' THEN r.sort_rating END DESC,
    CASE WHEN p_sort_by IN ('popular', 'sales_count') AND UPPER(p_sort_order) = 'ASC' THEN r.sort_purchases END ASC,
    CASE WHEN p_sort_by IN ('popular', 'sales_count') AND UPPER(p_sort_order) <> 'ASC' THEN r.sort_purchases END DESC,
    CASE WHEN p_sort_by = 'oldest' THEN r.created_at END ASC,
    CASE WHEN p_sort_by IN ('newest', 'created_at') OR p_sort_by IS NULL THEN r.created_at END DESC,
    r.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_marketplace_products_filtered(
  INTEGER, INTEGER, TEXT, TEXT, DECIMAL, DECIMAL, DECIMAL, TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN
) TO anon, authenticated;
