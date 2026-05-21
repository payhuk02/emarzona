-- Déploiement / correctif marketplace RPC

DROP VIEW IF EXISTS public.marketplace_products_optimized CASCADE;
DROP MATERIALIZED VIEW IF EXISTS public.marketplace_products_optimized CASCADE;

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

-- RPC sans unpack() (compatible PostgreSQL standard)
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

-- Catégories préférées via order_items (pas orders.items)
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
        COUNT(*)::bigint AS purchase_count
      FROM public.orders o
      JOIN public.order_items oi ON oi.order_id = o.id
      JOIN public.products p ON p.id = oi.product_id
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

-- Historique d'achats : orders.customer_id = customers.id (pas auth.uid())
CREATE OR REPLACE FUNCTION public.get_user_purchased_product_ids(p_user_id UUID)
RETURNS TABLE (product_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT oi.product_id
  FROM public.order_items oi
  INNER JOIN public.orders o ON o.id = oi.order_id
  WHERE oi.product_id IS NOT NULL
    AND (
      o.customer_id = p_user_id
      OR EXISTS (
        SELECT 1
        FROM public.customers c
        WHERE c.id = o.customer_id
          AND (
            coalesce(c.metadata->>'userId', '') = p_user_id::text
            OR coalesce(c.metadata->>'user_id', '') = p_user_id::text
          )
      )
      OR (
        o.metadata IS NOT NULL
        AND jsonb_typeof(o.metadata) = 'object'
        AND (
          coalesce(o.metadata->>'userId', '') = p_user_id::text
          OR coalesce(o.metadata->>'customerId', '') = p_user_id::text
        )
      )
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_purchased_product_ids(UUID) TO authenticated;

-- RLS acheteur (si pas encore appliquée)
DROP POLICY IF EXISTS "Buyers can select their orders" ON public.orders;
CREATE POLICY "Buyers can select their orders" ON public.orders
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND (
      customer_id = auth.uid()
      OR EXISTS (
        SELECT 1
        FROM public.customers c
        WHERE c.id = orders.customer_id
          AND c.email IS NOT NULL
          AND lower(btrim(c.email::text)) = lower(btrim(coalesce(auth.jwt() ->> 'email', '')))
          AND coalesce(auth.jwt() ->> 'email', '') <> ''
      )
      OR EXISTS (
        SELECT 1
        FROM public.customers c
        WHERE c.id = orders.customer_id
          AND (
            coalesce(c.metadata->>'userId', '') = auth.uid()::text
            OR coalesce(c.metadata->>'user_id', '') = auth.uid()::text
          )
      )
      OR (
        orders.metadata IS NOT NULL
        AND jsonb_typeof(orders.metadata) = 'object'
        AND (
          coalesce(orders.metadata->>'userId', '') = auth.uid()::text
          OR coalesce(orders.metadata->>'customerId', '') = auth.uid()::text
        )
      )
    )
  );

DROP POLICY IF EXISTS "Buyers can select their order items" ON public.order_items;
CREATE POLICY "Buyers can select their order items" ON public.order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.id = order_items.order_id
        AND auth.uid() IS NOT NULL
        AND (
          o.customer_id = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM public.customers c
            WHERE c.id = o.customer_id
              AND c.email IS NOT NULL
              AND lower(btrim(c.email::text)) = lower(btrim(coalesce(auth.jwt() ->> 'email', '')))
              AND coalesce(auth.jwt() ->> 'email', '') <> ''
          )
          OR EXISTS (
            SELECT 1
            FROM public.customers c
            WHERE c.id = o.customer_id
              AND (
                coalesce(c.metadata->>'userId', '') = auth.uid()::text
                OR coalesce(c.metadata->>'user_id', '') = auth.uid()::text
              )
          )
          OR (
            o.metadata IS NOT NULL
            AND jsonb_typeof(o.metadata) = 'object'
            AND (
              coalesce(o.metadata->>'userId', '') = auth.uid()::text
              OR coalesce(o.metadata->>'customerId', '') = auth.uid()::text
            )
          )
        )
    )
  );
