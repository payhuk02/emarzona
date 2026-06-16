-- Expose payment_options on marketplace optimized view for physical checkout CTA labels.
-- PostgreSQL CREATE OR REPLACE VIEW only allows appending columns at the end (not inserting mid-list).

-- Drop RPC first: return type changes (adds payment_options); CREATE OR REPLACE is not allowed.
DO $$
DECLARE
  fn RECORD;
BEGIN
  FOR fn IN
    SELECT pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'get_marketplace_products_filtered'
  LOOP
    EXECUTE format(
      'DROP FUNCTION IF EXISTS public.get_marketplace_products_filtered(%s)',
      fn.args
    );
  END LOOP;
END $$;

DROP VIEW IF EXISTS public.marketplace_products_optimized CASCADE;

CREATE VIEW public.marketplace_products_optimized AS
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
  s.logo_url AS store_logo_url,
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
  p.payment_options
FROM public.products p
JOIN public.stores s ON p.store_id = s.id
LEFT JOIN public.product_affiliate_settings pas ON p.id = pas.product_id
WHERE p.is_active = true
  AND (p.is_draft IS NULL OR p.is_draft = false)
  AND s.is_active = true;

COMMENT ON VIEW public.marketplace_products_optimized IS
  'Vue optimisée marketplace incluant payment_options pour CTA checkout physique';

GRANT SELECT ON public.marketplace_products_optimized TO anon, authenticated;

-- Recreate RPC with payment_options in return type
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
      AND (p_min_price IS NULL OR m.effective_price >= p_min_price)
      AND (p_max_price IS NULL OR m.effective_price <= p_max_price)
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
    c.cnt AS total_count
  FROM filtered f
  CROSS JOIN counted c
  ORDER BY
    CASE WHEN p_sort_by = 'price' AND UPPER(p_sort_order) = 'ASC' THEN f.effective_price END ASC,
    CASE WHEN p_sort_by = 'price' AND UPPER(p_sort_order) <> 'ASC' THEN f.effective_price END DESC,
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
