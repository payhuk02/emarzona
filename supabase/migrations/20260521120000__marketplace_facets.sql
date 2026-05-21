-- Facettes marketplace : comptages par type et catégorie (filtrage croisé)

CREATE OR REPLACE FUNCTION get_marketplace_facets(
  p_product_type TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_search_query TEXT DEFAULT NULL,
  p_featured_only BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_search TEXT;
BEGIN
  v_search := NULLIF(TRIM(COALESCE(p_search_query, '')), '');

  SELECT jsonb_build_object(
    'total',
    (
      SELECT COUNT(*)::bigint
      FROM marketplace_products_optimized m
      WHERE
        (p_product_type IS NULL OR p_product_type = 'all' OR m.product_type = p_product_type)
        AND (
          p_category IS NULL
          OR p_category = 'all'
          OR (p_category = 'featured' AND m.is_featured = true)
          OR (p_category <> 'featured' AND m.category = p_category)
        )
        AND (NOT p_featured_only OR m.is_featured = true)
        AND (
          v_search IS NULL
          OR m.name ILIKE '%' || v_search || '%'
          OR m.description ILIKE '%' || v_search || '%'
        )
    ),
    'product_types',
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object('value', product_type, 'count', cnt)
          ORDER BY cnt DESC
        )
        FROM (
          SELECT m.product_type, COUNT(*)::bigint AS cnt
          FROM marketplace_products_optimized m
          WHERE
            m.product_type IS NOT NULL
            AND (
              p_category IS NULL
              OR p_category = 'all'
              OR (p_category = 'featured' AND m.is_featured = true)
              OR (p_category <> 'featured' AND m.category = p_category)
            )
            AND (NOT p_featured_only OR m.is_featured = true)
            AND (
              v_search IS NULL
              OR m.name ILIKE '%' || v_search || '%'
              OR m.description ILIKE '%' || v_search || '%'
            )
          GROUP BY m.product_type
        ) pt
      ),
      '[]'::jsonb
    ),
    'categories',
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object('value', category, 'count', cnt)
          ORDER BY cnt DESC
        )
        FROM (
          SELECT m.category, COUNT(*)::bigint AS cnt
          FROM marketplace_products_optimized m
          WHERE
            m.category IS NOT NULL
            AND TRIM(m.category) <> ''
            AND (p_product_type IS NULL OR p_product_type = 'all' OR m.product_type = p_product_type)
            AND (NOT p_featured_only OR m.is_featured = true)
            AND (
              v_search IS NULL
              OR m.name ILIKE '%' || v_search || '%'
              OR m.description ILIKE '%' || v_search || '%'
            )
          GROUP BY m.category
          ORDER BY cnt DESC
          LIMIT 30
        ) cat
      ),
      '[]'::jsonb
    )
  )
  INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_marketplace_facets(TEXT, TEXT, TEXT, BOOLEAN) TO anon;
GRANT EXECUTE ON FUNCTION get_marketplace_facets(TEXT, TEXT, TEXT, BOOLEAN) TO authenticated;
