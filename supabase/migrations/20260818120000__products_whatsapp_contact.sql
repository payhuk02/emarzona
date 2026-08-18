-- WhatsApp contact on all product types (marketplace cards + wizards).
-- Physical products already store this on physical_products; copy onto products.

BEGIN;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_enabled BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.products.whatsapp_number IS
  'Numéro WhatsApp E.164 sans + (indicatif pays + numéro), saisi dans le wizard produit';
COMMENT ON COLUMN public.products.whatsapp_enabled IS
  'Afficher le bouton WhatsApp sur les cartes produits';

UPDATE public.products p
SET
  whatsapp_number = pp.whatsapp_number,
  whatsapp_enabled = COALESCE(pp.whatsapp_enabled, false)
FROM public.physical_products pp
WHERE pp.product_id = p.id
  AND pp.whatsapp_number IS NOT NULL
  AND btrim(pp.whatsapp_number) <> ''
  AND (p.whatsapp_number IS NULL OR btrim(p.whatsapp_number) = '');

CREATE OR REPLACE VIEW public.marketplace_products_optimized AS
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
  p.whatsapp_enabled
FROM public.products p
JOIN public.stores s ON p.store_id = s.id
LEFT JOIN public.store_appearance sa ON sa.store_id = s.id
LEFT JOIN public.product_affiliate_settings pas ON p.id = pas.product_id
WHERE p.is_active = true
  AND (p.is_draft IS NULL OR p.is_draft = false)
  AND s.is_active = true;

COMMENT ON VIEW public.marketplace_products_optimized IS
  'Vue optimisée marketplace ; store_logo_url depuis store_appearance ; WhatsApp produit';

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
    f.whatsapp_number,
    f.whatsapp_enabled,
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

COMMIT;
