-- Optimisation des requêtes Products
-- Date: 18 Janvier 2026
-- Optimise les requêtes de gestion des produits avec pagination serveur

-- Vue pour les produits avec métriques optimisées
CREATE OR REPLACE VIEW products_management_view AS
SELECT
  p.*,
  -- Métriques calculées pour éviter les sous-requêtes répétées
  COALESCE(p.rating, 0) as sort_rating,
  COALESCE(p.reviews_count, 0) as sort_reviews,
  COALESCE(p.purchases_count, 0) as sort_purchases,
  CASE
    WHEN p.promotional_price IS NOT NULL AND p.promotional_price < p.price
    THEN p.promotional_price
    ELSE p.price
  END as effective_price,
  -- Informations sur les ventes récentes (30 derniers jours)
  (
    SELECT COUNT(*)
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE oi.product_id = p.id
      AND o.status = 'completed'
      AND o.created_at >= CURRENT_DATE - INTERVAL '30 days'
  ) as sales_last_30_days,
  -- Revenus récents
  (
    SELECT COALESCE(SUM(oi.total_price), 0)
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE oi.product_id = p.id
      AND o.status = 'completed'
      AND o.created_at >= CURRENT_DATE - INTERVAL '30 days'
  ) as revenue_last_30_days,
  -- Stock status calculé
  CASE
    WHEN p.stock_quantity IS NULL THEN 'not_tracked'
    WHEN p.stock_quantity = 0 THEN 'out_of_stock'
    WHEN p.stock_quantity <= 10 THEN 'low_stock'
    ELSE 'in_stock'
  END as stock_status
FROM products p;

-- Créer les indexes pour optimiser les requêtes de gestion
CREATE INDEX IF NOT EXISTS idx_products_management_store ON products_management_view(store_id);
CREATE INDEX IF NOT EXISTS idx_products_management_type ON products_management_view(product_type);
CREATE INDEX IF NOT EXISTS idx_products_management_status ON products_management_view(is_active);
CREATE INDEX IF NOT EXISTS idx_products_management_featured ON products_management_view(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_management_stock ON products_management_view(stock_status);
CREATE INDEX IF NOT EXISTS idx_products_management_created ON products_management_view(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_management_updated ON products_management_view(updated_at DESC);

-- Index composite pour les filtres fréquents
CREATE INDEX IF NOT EXISTS idx_products_store_type_status ON products_management_view(store_id, product_type, is_active);
CREATE INDEX IF NOT EXISTS idx_products_store_category ON products_management_view(store_id, category);
CREATE INDEX IF NOT EXISTS idx_products_store_search ON products_management_view(store_id, name, description);

-- Fonction RPC optimisée pour la gestion des produits avec pagination
CREATE OR REPLACE FUNCTION get_products_management(
  p_store_id UUID,
  p_page INTEGER DEFAULT 1,
  p_items_per_page INTEGER DEFAULT 12,
  p_sort_by TEXT DEFAULT 'recent',
  p_sort_order TEXT DEFAULT 'desc',
  p_search_query TEXT DEFAULT '',
  p_category TEXT DEFAULT 'all',
  p_product_type TEXT DEFAULT 'all',
  p_status TEXT DEFAULT 'all',
  p_stock_status TEXT DEFAULT 'all',
  p_price_range_min DECIMAL DEFAULT NULL,
  p_price_range_max DECIMAL DEFAULT NULL
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
  is_active BOOLEAN,
  is_featured BOOLEAN,
  rating DECIMAL,
  reviews_count INTEGER,
  purchases_count INTEGER,
  stock_quantity INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  image_url TEXT,
  tags TEXT[],
  effective_price DECIMAL,
  sales_last_30_days BIGINT,
  revenue_last_30_days DECIMAL,
  stock_status TEXT,
  total_count BIGINT
) AS $$
DECLARE
  query_sql TEXT;
  count_sql TEXT;
  order_clause TEXT;
  where_clauses TEXT[] := ARRAY['store_id = $1'];
  params TEXT[] := ARRAY[p_store_id::TEXT];
  param_count INTEGER := 1;
BEGIN
  -- Construction de la clause ORDER BY
  CASE p_sort_by
    WHEN 'recent' THEN
      order_clause := ' ORDER BY created_at DESC';
    WHEN 'oldest' THEN
      order_clause := ' ORDER BY created_at ASC';
    WHEN 'name-asc' THEN
      order_clause := ' ORDER BY name ASC';
    WHEN 'name-desc' THEN
      order_clause := ' ORDER BY name DESC';
    WHEN 'price-asc' THEN
      order_clause := ' ORDER BY effective_price ASC';
    WHEN 'price-desc' THEN
      order_clause := ' ORDER BY effective_price DESC';
    WHEN 'popular' THEN
      order_clause := ' ORDER BY sort_purchases DESC, sort_rating DESC';
    WHEN 'rating' THEN
      order_clause := ' ORDER BY sort_rating DESC, sort_reviews DESC';
    WHEN 'sales' THEN
      order_clause := ' ORDER BY sales_last_30_days DESC';
    WHEN 'revenue' THEN
      order_clause := ' ORDER BY revenue_last_30_days DESC';
    ELSE
      order_clause := ' ORDER BY created_at DESC';
  END CASE;

  -- Construction des clauses WHERE
  IF p_search_query != '' THEN
    param_count := param_count + 1;
    where_clauses := array_append(where_clauses, '(name ILIKE $' || param_count || ' OR description ILIKE $' || param_count || ' OR slug ILIKE $' || param_count || ')');
    params := array_append(params, '%' || p_search_query || '%');
  END IF;

  IF p_category != 'all' THEN
    param_count := param_count + 1;
    where_clauses := array_append(where_clauses, 'category = $' || param_count);
    params := array_append(params, p_category);
  END IF;

  IF p_product_type != 'all' THEN
    param_count := param_count + 1;
    where_clauses := array_append(where_clauses, 'product_type = $' || param_count);
    params := array_append(params, p_product_type);
  END IF;

  IF p_status = 'active' THEN
    where_clauses := array_append(where_clauses, 'is_active = true');
  ELSIF p_status = 'inactive' THEN
    where_clauses := array_append(where_clauses, 'is_active = false');
  END IF;

  IF p_stock_status != 'all' THEN
    param_count := param_count + 1;
    where_clauses := array_append(where_clauses, 'stock_status = $' || param_count);
    params := array_append(params, p_stock_status);
  END IF;

  IF p_price_range_min IS NOT NULL THEN
    param_count := param_count + 1;
    where_clauses := array_append(where_clauses, 'effective_price >= $' || param_count);
    params := array_append(params, p_price_range_min::TEXT);
  END IF;

  IF p_price_range_max IS NOT NULL THEN
    param_count := param_count + 1;
    where_clauses := array_append(where_clauses, 'effective_price <= $' || param_count);
    params := array_append(params, p_price_range_max::TEXT);
  END IF;

  -- Calcul du offset
  DECLARE
    offset_val INTEGER := (p_page - 1) * p_items_per_page;
  BEGIN
    -- Construction de la requête de comptage
    count_sql := 'SELECT COUNT(*) FROM products_management_view WHERE ' || array_to_string(where_clauses, ' AND ');

    -- Construction de la requête principale
    query_sql := '
      SELECT
        *,
        (' || count_sql || ') as total_count
      FROM products_management_view
      WHERE ' || array_to_string(where_clauses, ' AND ') ||
      order_clause ||
      ' LIMIT ' || p_items_per_page || ' OFFSET ' || offset_val;

    -- Exécution de la requête
    RETURN QUERY EXECUTE query_sql USING unpack(params);
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les statistiques de produits par boutique
CREATE OR REPLACE FUNCTION get_products_stats_by_store(p_store_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total', COUNT(*),
    'active', COUNT(CASE WHEN is_active THEN 1 END),
    'inactive', COUNT(CASE WHEN NOT is_active THEN 1 END),
    'featured', COUNT(CASE WHEN is_featured THEN 1 END),
    'byType', json_object_agg(
      product_type,
      COUNT(*)
    ),
    'byCategory', json_object_agg(
      COALESCE(category, 'uncategorized'),
      COUNT(*)
    ),
    'stockStatus', json_build_object(
      'in_stock', COUNT(CASE WHEN stock_status = 'in_stock' THEN 1 END),
      'low_stock', COUNT(CASE WHEN stock_status = 'low_stock' THEN 1 END),
      'out_of_stock', COUNT(CASE WHEN stock_status = 'out_of_stock' THEN 1 END),
      'not_tracked', COUNT(CASE WHEN stock_status = 'not_tracked' THEN 1 END)
    ),
    'avgPrice', AVG(effective_price),
    'totalValue', SUM(effective_price),
    'sales30d', SUM(sales_last_30_days),
    'revenue30d', SUM(revenue_last_30_days)
  ) INTO result
  FROM products_management_view
  WHERE store_id = p_store_id
  GROUP BY store_id;

  RETURN COALESCE(result, '{}'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour l'export CSV optimisé
CREATE OR REPLACE FUNCTION export_products_csv(p_store_id UUID)
RETURNS TEXT AS $$
DECLARE
  csv_header TEXT;
  csv_data TEXT;
  csv_result TEXT;
BEGIN
  -- Header CSV
  csv_header := 'id,name,slug,description,price,currency,category,product_type,is_active,is_featured,rating,reviews_count,purchases_count,stock_quantity,created_at,updated_at';

  -- Données CSV
  SELECT string_agg(
    format('%s,"%s","%s","%s",%s,"%s","%s","%s",%s,%s,%s,%s,%s,%s,"%s","%s"',
      id,
      regexp_replace(COALESCE(name, ''), '"', '""', 'g'),
      regexp_replace(COALESCE(slug, ''), '"', '""', 'g'),
      regexp_replace(COALESCE(description, ''), '"', '""', 'g'),
      price,
      currency,
      category,
      product_type,
      is_active,
      is_featured,
      rating,
      reviews_count,
      purchases_count,
      stock_quantity,
      created_at,
      updated_at
    ),
    E'\n'
    ORDER BY created_at DESC
  ) INTO csv_data
  FROM products_management_view
  WHERE store_id = p_store_id;

  -- Combiner header et données
  csv_result := csv_header || E'\n' || COALESCE(csv_data, '');

  RETURN csv_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour la recherche full-text optimisée
CREATE OR REPLACE FUNCTION search_products_fulltext(
  p_store_id UUID,
  p_query TEXT,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  description TEXT,
  score REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pmv.id,
    pmv.name,
    pmv.slug,
    pmv.description,
    -- Calcul d'un score de pertinence simple
    CASE
      WHEN pmv.name ILIKE '%' || p_query || '%' THEN 1.0
      WHEN pmv.slug ILIKE '%' || p_query || '%' THEN 0.9
      WHEN pmv.description ILIKE '%' || p_query || '%' THEN 0.7
      ELSE 0.5
    END as score
  FROM products_management_view pmv
  WHERE pmv.store_id = p_store_id
    AND (
      pmv.name ILIKE '%' || p_query || '%'
      OR pmv.slug ILIKE '%' || p_query || '%'
      OR pmv.description ILIKE '%' || p_query || '%'
    )
  ORDER BY score DESC, pmv.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Donner les permissions nécessaires
GRANT SELECT ON products_management_view TO authenticated;
GRANT EXECUTE ON FUNCTION get_products_management TO authenticated;
GRANT EXECUTE ON FUNCTION get_products_stats_by_store TO authenticated;
GRANT EXECUTE ON FUNCTION export_products_csv TO authenticated;
GRANT EXECUTE ON FUNCTION search_products_fulltext TO authenticated;

-- Commentaire pour documenter
COMMENT ON VIEW products_management_view IS 'Vue optimisée pour la gestion des produits avec métriques pré-calculées';
COMMENT ON FUNCTION get_products_management IS 'Fonction RPC optimisée pour récupérer les produits avec pagination et filtrage côté serveur';
COMMENT ON FUNCTION get_products_stats_by_store IS 'Fonction pour obtenir les statistiques détaillées des produits par boutique';
COMMENT ON FUNCTION export_products_csv IS 'Fonction pour exporter les produits au format CSV optimisé';
COMMENT ON FUNCTION search_products_fulltext IS 'Fonction de recherche full-text optimisée avec scoring de pertinence';