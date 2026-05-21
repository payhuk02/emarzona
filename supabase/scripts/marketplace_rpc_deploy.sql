-- Déploiement ciblé : RPC marketplace + recommandations (sans purchases_count si absent)

DROP MATERIALIZED VIEW IF EXISTS public.marketplace_products_optimized CASCADE;
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
  END AS effective_price
FROM public.products p
JOIN public.stores s ON p.store_id = s.id
LEFT JOIN public.product_affiliate_settings pas ON p.id = pas.product_id
WHERE p.is_active = true
  AND (p.is_draft IS NULL OR p.is_draft = false)
  AND s.is_active = true;

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
  total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  query_sql TEXT;
  count_sql TEXT;
  order_clause TEXT;
  where_clauses TEXT[] := ARRAY[]::TEXT[];
  params TEXT[] := ARRAY[]::TEXT[];
  param_count INTEGER := 0;
BEGIN
  CASE p_sort_by
    WHEN 'price' THEN
      order_clause := ' ORDER BY effective_price ' || UPPER(p_sort_order);
    WHEN 'rating' THEN
      order_clause := ' ORDER BY sort_rating ' || UPPER(p_sort_order) || ', sort_reviews ' || UPPER(p_sort_order);
    WHEN 'popular' THEN
      order_clause := ' ORDER BY sort_purchases ' || UPPER(p_sort_order) || ', sort_rating ' || UPPER(p_sort_order);
    WHEN 'newest' THEN
      order_clause := ' ORDER BY created_at ' || UPPER(p_sort_order);
    WHEN 'oldest' THEN
      order_clause := ' ORDER BY created_at ASC';
    ELSE
      order_clause := ' ORDER BY created_at ' || UPPER(p_sort_order);
  END CASE;

  IF p_category IS NOT NULL AND p_category != 'all' THEN
    param_count := param_count + 1;
    where_clauses := array_append(where_clauses, 'category = $' || param_count);
    params := array_append(params, p_category);
  END IF;

  IF p_product_type IS NOT NULL AND p_product_type != 'all' THEN
    param_count := param_count + 1;
    where_clauses := array_append(where_clauses, 'product_type = $' || param_count);
    params := array_append(params, p_product_type);
  END IF;

  IF p_min_price IS NOT NULL THEN
    param_count := param_count + 1;
    where_clauses := array_append(where_clauses, 'effective_price >= $' || param_count);
    params := array_append(params, p_min_price::TEXT);
  END IF;

  IF p_max_price IS NOT NULL THEN
    param_count := param_count + 1;
    where_clauses := array_append(where_clauses, 'effective_price <= $' || param_count);
    params := array_append(params, p_max_price::TEXT);
  END IF;

  IF p_min_rating IS NOT NULL THEN
    param_count := param_count + 1;
    where_clauses := array_append(where_clauses, 'sort_rating >= $' || param_count);
    params := array_append(params, p_min_rating::TEXT);
  END IF;

  IF p_search_query IS NOT NULL AND TRIM(p_search_query) != '' THEN
    param_count := param_count + 1;
    where_clauses := array_append(where_clauses, '(name ILIKE $' || param_count || ' OR description ILIKE $' || param_count || ')');
    params := array_append(params, '%' || TRIM(p_search_query) || '%');
  END IF;

  IF p_featured_only = true THEN
    where_clauses := array_append(where_clauses, 'is_featured = true');
  END IF;

  count_sql := 'SELECT COUNT(*) FROM marketplace_products_optimized';
  IF array_length(where_clauses, 1) > 0 THEN
    count_sql := count_sql || ' WHERE ' || array_to_string(where_clauses, ' AND ');
  END IF;

  query_sql := 'SELECT *, (' || count_sql || ') as total_count FROM marketplace_products_optimized';
  IF array_length(where_clauses, 1) > 0 THEN
    query_sql := query_sql || ' WHERE ' || array_to_string(where_clauses, ' AND ');
  END IF;
  query_sql := query_sql || order_clause || ' LIMIT ' || p_limit || ' OFFSET ' || p_offset;

  RETURN QUERY EXECUTE query_sql USING unpack(params);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_preferred_categories(p_user_id UUID)
RETURNS TEXT[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT ARRAY_AGG(category ORDER BY purchase_count DESC)
    FROM (
      SELECT
        p.category,
        COUNT(*) AS purchase_count
      FROM public.orders o
      CROSS JOIN LATERAL JSONB_ARRAY_ELEMENTS(o.items) AS item
      JOIN public.products p ON (item->>'product_id')::UUID = p.id
      WHERE o.customer_id = p_user_id
        AND o.status = 'completed'
        AND p.category IS NOT NULL
      GROUP BY p.category
      ORDER BY purchase_count DESC
      LIMIT 5
    ) preferred_categories
  );
END;
$$;

GRANT SELECT ON public.marketplace_products_optimized TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_marketplace_products_filtered(
  INTEGER, INTEGER, TEXT, TEXT, DECIMAL, DECIMAL, DECIMAL, TEXT, TEXT, TEXT, BOOLEAN
) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_preferred_categories(UUID) TO anon, authenticated;
