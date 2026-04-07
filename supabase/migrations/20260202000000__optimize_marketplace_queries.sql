-- Optimisation des requêtes Marketplace
-- Date: 18 Janvier 2026
-- Optimise les requêtes avec beaucoup de jointures via des vues indexées et fonctions RPC

-- Vue indexée pour les produits marketplace optimisés
CREATE OR REPLACE VIEW marketplace_products_optimized AS
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
  p.purchases_count,
  p.created_at,
  p.updated_at,
  p.image_url,
  p.tags,
  -- Informations boutique
  s.id as store_id,
  s.name as store_name,
  s.slug as store_slug,
  s.logo_url as store_logo_url,
  -- Informations affiliation
  pas.commission_rate,
  pas.affiliate_enabled,
  -- Métriques calculées pour le tri
  COALESCE(p.rating, 0) as sort_rating,
  COALESCE(p.reviews_count, 0) as sort_reviews,
  COALESCE(p.purchases_count, 0) as sort_purchases,
  CASE
    WHEN p.promotional_price IS NOT NULL AND p.promotional_price < p.price
    THEN p.promotional_price
    ELSE p.price
  END as effective_price
FROM products p
JOIN stores s ON p.store_id = s.id
LEFT JOIN product_affiliate_settings pas ON p.id = pas.product_id
WHERE p.is_active = true
  AND p.is_draft = false
  AND s.is_active = true;

-- Créer les indexes pour optimiser les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_marketplace_products_category ON marketplace_products_optimized(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_type ON marketplace_products_optimized(product_type);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_price ON marketplace_products_optimized(effective_price);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_rating ON marketplace_products_optimized(sort_rating DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_featured ON marketplace_products_optimized(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_marketplace_products_created ON marketplace_products_optimized(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_store ON marketplace_products_optimized(store_id);

-- Index composite pour les filtres les plus fréquents
CREATE INDEX IF NOT EXISTS idx_marketplace_category_type_price ON marketplace_products_optimized(category, product_type, effective_price);
CREATE INDEX IF NOT EXISTS idx_marketplace_type_rating ON marketplace_products_optimized(product_type, sort_rating DESC);

-- Fonction RPC optimisée pour les produits marketplace avec filtrage côté serveur
CREATE OR REPLACE FUNCTION get_marketplace_products_filtered(
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
) AS $$
DECLARE
  query_sql TEXT;
  count_sql TEXT;
  order_clause TEXT;
  where_clauses TEXT[] := ARRAY[]::TEXT[];
  params TEXT[] := ARRAY[]::TEXT[];
  param_count INTEGER := 0;
BEGIN
  -- Construction de la clause ORDER BY
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

  -- Construction des clauses WHERE
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

  -- Construction de la requête de comptage
  count_sql := 'SELECT COUNT(*) FROM marketplace_products_optimized';
  IF array_length(where_clauses, 1) > 0 THEN
    count_sql := count_sql || ' WHERE ' || array_to_string(where_clauses, ' AND ');
  END IF;

  -- Construction de la requête principale
  query_sql := 'SELECT *, (' || count_sql || ') as total_count FROM marketplace_products_optimized';
  IF array_length(where_clauses, 1) > 0 THEN
    query_sql := query_sql || ' WHERE ' || array_to_string(where_clauses, ' AND ');
  END IF;
  query_sql := query_sql || order_clause || ' LIMIT ' || p_limit || ' OFFSET ' || p_offset;

  -- Exécution de la requête
  RETURN QUERY EXECUTE query_sql USING unpack(params);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour les filtres de type spécifique (digital, physical, etc.)
CREATE OR REPLACE FUNCTION get_marketplace_products_by_type(
  p_product_type TEXT,
  p_limit INTEGER DEFAULT 24,
  p_offset INTEGER DEFAULT 0,
  p_filters JSON DEFAULT NULL
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
  -- Champs spécifiques selon le type
  digital_type TEXT,
  license_type TEXT,
  service_type TEXT,
  location_type TEXT,
  calendar_available BOOLEAN,
  difficulty TEXT,
  access_type TEXT,
  total_duration INTEGER,
  artist_type TEXT,
  artwork_edition_type TEXT,
  certificate_of_authenticity BOOLEAN,
  total_count BIGINT
) AS $$
DECLARE
  query_sql TEXT;
  count_sql TEXT;
  join_clause TEXT := '';
  select_clause TEXT := '';
BEGIN
  -- Construction des jointures selon le type
  CASE p_product_type
    WHEN 'digital' THEN
      join_clause := ' LEFT JOIN digital_products dp ON mp.id = dp.product_id';
      select_clause := ', dp.digital_type, dp.license_type, NULL as service_type, NULL as location_type, NULL::boolean as calendar_available, NULL as difficulty, NULL as access_type, NULL::integer as total_duration, NULL as artist_type, NULL as artwork_edition_type, NULL::boolean as certificate_of_authenticity';
    WHEN 'physical' THEN
      select_clause := ', NULL as digital_type, NULL as license_type, NULL as service_type, NULL as location_type, NULL::boolean as calendar_available, NULL as difficulty, NULL as access_type, NULL::integer as total_duration, NULL as artist_type, NULL as artwork_edition_type, NULL::boolean as certificate_of_authenticity';
    WHEN 'service' THEN
      join_clause := ' LEFT JOIN service_products sp ON mp.id = sp.product_id';
      select_clause := ', NULL as digital_type, NULL as license_type, sp.service_type, sp.location_type, sp.calendar_available, NULL as difficulty, NULL as access_type, NULL::integer as total_duration, NULL as artist_type, NULL as artwork_edition_type, NULL::boolean as certificate_of_authenticity';
    WHEN 'course' THEN
      join_clause := ' LEFT JOIN courses c ON mp.id = c.product_id';
      select_clause := ', NULL as digital_type, NULL as license_type, NULL as service_type, NULL as location_type, NULL::boolean as calendar_available, c.difficulty, c.access_type, c.total_duration, NULL as artist_type, NULL as artwork_edition_type, NULL::boolean as certificate_of_authenticity';
    WHEN 'artist' THEN
      join_clause := ' LEFT JOIN artist_products ap ON mp.id = ap.product_id';
      select_clause := ', NULL as digital_type, NULL as license_type, NULL as service_type, NULL as location_type, NULL::boolean as calendar_available, NULL as difficulty, NULL as access_type, NULL::integer as total_duration, ap.artist_type, ap.artwork_edition_type, ap.certificate_of_authenticity';
    ELSE
      select_clause := ', NULL as digital_type, NULL as license_type, NULL as service_type, NULL as location_type, NULL::boolean as calendar_available, NULL as difficulty, NULL as access_type, NULL::integer as total_duration, NULL as artist_type, NULL as artwork_edition_type, NULL::boolean as certificate_of_authenticity';
  END CASE;

  -- Construction de la requête
  query_sql := '
    SELECT
      mp.*,
      COUNT(*) OVER() as total_count
      ' || select_clause || '
    FROM marketplace_products_optimized mp
    ' || join_clause || '
    WHERE mp.product_type = $1
    ORDER BY mp.created_at DESC
    LIMIT $2 OFFSET $3
  ';

  -- Exécution
  RETURN QUERY EXECUTE query_sql USING p_product_type, p_limit, p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour les statistiques du marketplace
CREATE OR REPLACE FUNCTION get_marketplace_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'totalProducts', (SELECT COUNT(*) FROM marketplace_products_optimized),
    'totalStores', (SELECT COUNT(DISTINCT store_id) FROM marketplace_products_optimized),
    'featuredProducts', (SELECT COUNT(*) FROM marketplace_products_optimized WHERE is_featured = true),
    'avgRating', (SELECT AVG(sort_rating) FROM marketplace_products_optimized WHERE sort_rating > 0),
    'totalReviews', (SELECT SUM(sort_reviews) FROM marketplace_products_optimized),
    'categories', (
      SELECT json_agg(DISTINCT category)
      FROM marketplace_products_optimized
      WHERE category IS NOT NULL
    ),
    'productTypes', (
      SELECT json_agg(DISTINCT product_type)
      FROM marketplace_products_optimized
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Donner les permissions nécessaires
GRANT SELECT ON marketplace_products_optimized TO authenticated;
GRANT EXECUTE ON FUNCTION get_marketplace_products_filtered TO authenticated;
GRANT EXECUTE ON FUNCTION get_marketplace_products_by_type TO authenticated;
GRANT EXECUTE ON FUNCTION get_marketplace_stats TO authenticated;

-- Commentaire pour documenter
COMMENT ON VIEW marketplace_products_optimized IS 'Vue optimisée pour les produits marketplace avec jointures pré-calculées';
COMMENT ON FUNCTION get_marketplace_products_filtered IS 'Fonction RPC pour récupérer les produits marketplace avec filtrage côté serveur optimisé';
COMMENT ON FUNCTION get_marketplace_products_by_type IS 'Fonction pour récupérer les produits par type spécifique avec champs spécialisés';
COMMENT ON FUNCTION get_marketplace_stats IS 'Fonction pour récupérer les statistiques générales du marketplace';