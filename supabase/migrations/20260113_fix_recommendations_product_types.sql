-- Migration: Support des 5 Types de Produits dans les Recommandations IA
-- Date: 13 Janvier 2026
-- Description: Améliore les fonctions de recommandations pour prendre en compte tous les types de produits

-- ============================================================
-- AMÉLIORATION 1: find_similar_products avec support product_type
-- ============================================================
CREATE OR REPLACE FUNCTION public.find_similar_products(
  target_product_id UUID,
  limit_count INTEGER DEFAULT 10,
  p_same_type_only BOOLEAN DEFAULT true -- Si true, retourne seulement le même type de produit
)
RETURNS TABLE (
  id UUID,
  category TEXT,
  tags TEXT[],
  price NUMERIC,
  name TEXT,
  store_id UUID,
  product_type TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_target_product RECORD;
BEGIN
  -- Récupérer les détails du produit cible (incluant product_type)
  SELECT 
    p.id,
    p.category,
    p.tags,
    p.price,
    p.name,
    p.store_id,
    p.product_type
  INTO v_target_product
  FROM products p
  WHERE p.id = target_product_id
    AND p.is_active = true
    AND p.is_draft = false;

  -- Si produit non trouvé, retourner vide
  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Retourner les produits similaires
  RETURN QUERY
  SELECT 
    p.id,
    p.category,
    p.tags,
    p.price,
    p.name,
    p.store_id,
    p.product_type
  FROM products p
  WHERE p.id != target_product_id
    AND p.is_active = true
    AND p.is_draft = false
    -- Filtrer par type de produit si demandé
    AND (NOT p_same_type_only OR p.product_type = v_target_product.product_type)
    AND (
      -- Même catégorie
      (v_target_product.category IS NOT NULL AND p.category = v_target_product.category)
      OR
      -- Tags similaires (au moins 1 tag en commun)
      (v_target_product.tags IS NOT NULL AND p.tags IS NOT NULL AND (
        SELECT COUNT(*) FROM unnest(v_target_product.tags) tag 
        WHERE tag = ANY(p.tags)
      ) > 0)
      OR
      -- Prix similaire (±20%)
      (v_target_product.price IS NOT NULL AND p.price IS NOT NULL 
       AND ABS(p.price - v_target_product.price) / v_target_product.price <= 0.2)
    )
  ORDER BY 
    -- Priorité: même type > même catégorie > tags communs > prix similaire
    CASE WHEN p.product_type = v_target_product.product_type THEN 1 ELSE 2 END,
    CASE WHEN p.category = v_target_product.category THEN 1 ELSE 2 END,
    CASE WHEN v_target_product.tags IS NOT NULL AND p.tags IS NOT NULL AND (
      SELECT COUNT(*) FROM unnest(v_target_product.tags) tag WHERE tag = ANY(p.tags)
    ) > 0 THEN 1 ELSE 2 END,
    ABS(COALESCE(p.price, 0) - COALESCE(v_target_product.price, 0))
  LIMIT limit_count;
END;
$$;

COMMENT ON FUNCTION public.find_similar_products(UUID, INTEGER, BOOLEAN) IS 
'Trouve des produits similaires basés sur catégorie, tags et prix. Prend en compte les 5 types de produits (digital, physical, service, course, artist). Si p_same_type_only=true, retourne seulement le même type de produit.';

-- ============================================================
-- AMÉLIORATION 2: calculate_content_similarity avec support product_type
-- ============================================================
CREATE OR REPLACE FUNCTION public.calculate_content_similarity(
  source_product_id UUID,
  target_product_id UUID
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_source RECORD;
  v_target RECORD;
  v_score NUMERIC := 0;
  v_category_match BOOLEAN := false;
  v_tags_match INTEGER := 0;
  v_price_similarity NUMERIC := 0;
BEGIN
  -- Récupérer les détails des deux produits (incluant product_type)
  SELECT category, tags, price, product_type INTO v_source
  FROM products WHERE id = source_product_id;
  
  SELECT category, tags, price, product_type INTO v_target
  FROM products WHERE id = target_product_id;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Score type de produit (50% du score max) - PRIORITÉ MAXIMALE
  IF v_source.product_type IS NOT NULL AND v_target.product_type IS NOT NULL THEN
    IF v_source.product_type = v_target.product_type THEN
      v_score := v_score + 50; -- Bonus majeur pour même type
    ELSE
      -- Malus pour types différents (mais pas zéro, pour permettre recommandations cross-type si nécessaire)
      v_score := v_score - 30;
    END IF;
  END IF;

  -- Score catégorie (30% du score max)
  IF v_source.category IS NOT NULL AND v_target.category IS NOT NULL THEN
    IF v_source.category = v_target.category THEN
      v_category_match := true;
      v_score := v_score + 30;
    END IF;
  END IF;

  -- Score tags (15% du score max)
  IF v_source.tags IS NOT NULL AND v_target.tags IS NOT NULL THEN
    SELECT COUNT(*) INTO v_tags_match
    FROM unnest(v_source.tags) tag
    WHERE tag = ANY(v_target.tags);
    
    IF array_length(v_source.tags, 1) > 0 THEN
      v_score := v_score + (v_tags_match::NUMERIC / array_length(v_source.tags, 1)::NUMERIC) * 15;
    END IF;
  END IF;

  -- Score prix (5% du score max) - moins important que le type
  IF v_source.price IS NOT NULL AND v_target.price IS NOT NULL AND v_source.price > 0 THEN
    v_price_similarity := 1 - ABS(v_target.price - v_source.price) / v_source.price;
    IF v_price_similarity > 0 THEN
      v_score := v_score + v_price_similarity * 5;
    END IF;
  END IF;

  -- Normaliser sur 100 (peut être négatif si types très différents)
  RETURN GREATEST(0, LEAST(v_score, 100));
END;
$$;

COMMENT ON FUNCTION public.calculate_content_similarity(UUID, UUID) IS 
'Calcule un score de similarité entre deux produits basé sur type (50%), catégorie (30%), tags (15%) et prix (5%). Prend en compte les 5 types de produits (digital, physical, service, course, artist).';

-- ============================================================
-- AMÉLIORATION 3: Fonction pour recommandations par type de produit
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_recommendations_by_product_type(
  p_product_type TEXT, -- 'digital', 'physical', 'service', 'course', 'artist'
  p_user_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  product_slug TEXT,
  store_id UUID,
  store_name TEXT,
  store_slug TEXT,
  image_url TEXT,
  price NUMERIC,
  promotional_price NUMERIC,
  currency TEXT,
  category TEXT,
  product_type TEXT,
  rating NUMERIC,
  reviews_count INTEGER,
  purchases_count INTEGER,
  recommendation_score NUMERIC,
  recommendation_reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH scored_products AS (
    SELECT 
      p.id AS product_id,
      p.name AS product_name,
      p.slug AS product_slug,
      p.store_id,
      s.name AS store_name,
      s.slug AS store_slug,
      p.image_url,
      p.price,
      p.promotional_price,
      p.currency,
      p.category,
      p.product_type,
      p.rating,
      p.reviews_count,
      COALESCE(p.purchases_count, 0) AS purchases_count,
      -- Score basé sur popularité, rating et récence
      (
        -- Score popularité (40 points max)
        CASE 
          WHEN COALESCE(p.purchases_count, 0) > 100 THEN 40
          WHEN COALESCE(p.purchases_count, 0) > 50 THEN 30
          WHEN COALESCE(p.purchases_count, 0) > 10 THEN 20
          WHEN COALESCE(p.purchases_count, 0) > 0 THEN 10
          ELSE 0
        END +
        -- Score rating (30 points max)
        CASE 
          WHEN p.rating >= 4.5 THEN 30
          WHEN p.rating >= 4.0 THEN 25
          WHEN p.rating >= 3.5 THEN 15
          WHEN p.rating >= 3.0 THEN 10
          ELSE 0
        END +
        -- Score récence (30 points max)
        CASE 
          WHEN p.created_at >= NOW() - INTERVAL '7 days' THEN 30
          WHEN p.created_at >= NOW() - INTERVAL '30 days' THEN 20
          WHEN p.created_at >= NOW() - INTERVAL '90 days' THEN 10
          ELSE 0
        END
      )::NUMERIC AS recommendation_score,
      'Produit populaire de type ' || p.product_type AS recommendation_reason
    FROM products p
    INNER JOIN stores s ON s.id = p.store_id
    WHERE p.is_active = true
      AND p.is_draft = false
      AND p.product_type = p_product_type
      -- Exclure les produits déjà achetés par l'utilisateur si spécifié
      AND (p_user_id IS NULL OR NOT EXISTS (
        SELECT 1 FROM orders o
        INNER JOIN order_items oi ON oi.order_id = o.id
        WHERE o.customer_id = p_user_id
          AND oi.product_id = p.id
          AND o.payment_status = 'paid'
      ))
  )
  SELECT 
    sp.product_id,
    sp.product_name,
    sp.product_slug,
    sp.store_id,
    sp.store_name,
    sp.store_slug,
    sp.image_url,
    sp.price,
    sp.promotional_price,
    sp.currency,
    sp.category,
    sp.product_type,
    sp.rating,
    sp.reviews_count,
    sp.purchases_count,
    sp.recommendation_score,
    sp.recommendation_reason
  FROM scored_products sp
  WHERE sp.recommendation_score > 0
  ORDER BY sp.recommendation_score DESC, sp.purchases_count DESC
  LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION public.get_recommendations_by_product_type(TEXT, UUID, INTEGER) IS 
'Retourne des recommandations filtrées par type de produit (digital, physical, service, course, artist). Utile pour afficher des recommandations cohérentes selon le contexte.';

-- ============================================================
-- AMÉLIORATION 4: Fonction pour recommandations cross-type intelligentes
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_cross_type_recommendations(
  p_user_id UUID,
  p_preferred_types TEXT[] DEFAULT NULL, -- Types préférés de l'utilisateur
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  product_type TEXT,
  recommendation_score NUMERIC,
  recommendation_reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_types TEXT[];
BEGIN
  -- Si types préférés non fournis, les déduire de l'historique d'achat
  IF p_preferred_types IS NULL OR array_length(p_preferred_types, 1) IS NULL THEN
    SELECT ARRAY_AGG(DISTINCT p.product_type) INTO v_user_types
    FROM orders o
    INNER JOIN order_items oi ON oi.order_id = o.id
    INNER JOIN products p ON p.id = oi.product_id
    WHERE o.customer_id = p_user_id
      AND o.payment_status = 'paid'
      AND p.product_type IS NOT NULL;
    
    v_user_types := COALESCE(v_user_types, ARRAY['digital', 'physical', 'service', 'course', 'artist']::TEXT[]);
  ELSE
    v_user_types := p_preferred_types;
  END IF;

  RETURN QUERY
  WITH user_purchases AS (
    SELECT DISTINCT oi.product_id
    FROM orders o
    INNER JOIN order_items oi ON oi.order_id = o.id
    WHERE o.customer_id = p_user_id
      AND o.payment_status = 'paid'
  ),
  scored_products AS (
    SELECT 
      p.id AS product_id,
      p.name AS product_name,
      p.product_type,
      (
        -- Bonus si type préféré (50 points)
        CASE WHEN p.product_type = ANY(v_user_types) THEN 50 ELSE 0 END +
        -- Score popularité (30 points)
        CASE 
          WHEN COALESCE(p.purchases_count, 0) > 50 THEN 30
          WHEN COALESCE(p.purchases_count, 0) > 10 THEN 20
          WHEN COALESCE(p.purchases_count, 0) > 0 THEN 10
          ELSE 0
        END +
        -- Score rating (20 points)
        CASE 
          WHEN p.rating >= 4.0 THEN 20
          WHEN p.rating >= 3.5 THEN 10
          ELSE 0
        END
      )::NUMERIC AS recommendation_score,
      CASE 
        WHEN p.product_type = ANY(v_user_types) THEN 'Type que vous aimez: ' || p.product_type
        ELSE 'Nouveau type à découvrir: ' || p.product_type
      END AS recommendation_reason
    FROM products p
    WHERE p.is_active = true
      AND p.is_draft = false
      AND p.product_type IN ('digital', 'physical', 'service', 'course', 'artist')
      AND p.id != ALL(SELECT product_id FROM user_purchases)
  )
  SELECT 
    sp.product_id,
    sp.product_name,
    sp.product_type,
    sp.recommendation_score,
    sp.recommendation_reason
  FROM scored_products sp
  WHERE sp.recommendation_score > 0
  ORDER BY sp.recommendation_score DESC
  LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION public.get_cross_type_recommendations(UUID, TEXT[], INTEGER) IS 
'Retourne des recommandations intelligentes qui peuvent inclure différents types de produits selon les préférences de l''utilisateur. Utile pour découvrir de nouveaux types de produits.';

-- ============================================================
-- ============================================================
-- AMÉLIORATION 5: Améliorer get_popular_products_by_users pour filtrer par type
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_popular_products_by_users(
  p_user_ids UUID[],
  p_action TEXT DEFAULT 'purchase',
  p_limit INTEGER DEFAULT 10,
  p_product_type TEXT DEFAULT NULL -- NOUVEAU: Filtrer par type de produit
)
RETURNS TABLE (
  product_id UUID,
  popularity BIGINT,
  product_type TEXT -- NOUVEAU: Retourner le type
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ubt.product_id,
    COUNT(*)::BIGINT as popularity,
    p.product_type -- NOUVEAU: Inclure le type
  FROM user_behavior_tracking ubt
  INNER JOIN products p ON p.id = ubt.product_id
  WHERE ubt.user_id = ANY(p_user_ids)
    AND ubt.action = p_action
    AND (p_product_type IS NULL OR p.product_type = p_product_type) -- NOUVEAU: Filtre optionnel
  GROUP BY ubt.product_id, p.product_type
  ORDER BY popularity DESC
  LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION public.get_popular_products_by_users(UUID[], TEXT, INTEGER, TEXT) IS 
'Retourne les produits les plus populaires parmi une liste d''utilisateurs. Peut filtrer par type de produit (digital, physical, service, course, artist).';

-- ============================================================
-- AMÉLIORATION 6: Améliorer get_trending_products_by_behavior pour filtrer par type
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_trending_products_by_behavior(
  p_days INTEGER DEFAULT 7,
  p_limit INTEGER DEFAULT 15,
  p_product_type TEXT DEFAULT NULL -- NOUVEAU: Filtrer par type de produit
)
RETURNS TABLE (
  product_id UUID,
  trend_score BIGINT,
  product_type TEXT -- NOUVEAU: Retourner le type
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ubt.product_id,
    COUNT(*)::BIGINT as trend_score,
    p.product_type -- NOUVEAU: Inclure le type
  FROM user_behavior_tracking ubt
  INNER JOIN products p ON p.id = ubt.product_id
  WHERE ubt.timestamp >= NOW() - (p_days || ' days')::INTERVAL
    AND ubt.action IN ('view', 'cart', 'purchase')
    AND (p_product_type IS NULL OR p.product_type = p_product_type) -- NOUVEAU: Filtre optionnel
  GROUP BY ubt.product_id, p.product_type
  ORDER BY trend_score DESC
  LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION public.get_trending_products_by_behavior(INTEGER, INTEGER, TEXT) IS 
'Retourne les produits tendance basés sur le nombre d''actions. Peut filtrer par type de produit (digital, physical, service, course, artist).';

-- Permissions pour les nouvelles fonctions
-- ============================================================
GRANT EXECUTE ON FUNCTION public.find_similar_products(UUID, INTEGER, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_similar_products(UUID, INTEGER, BOOLEAN) TO anon;
GRANT EXECUTE ON FUNCTION public.get_recommendations_by_product_type(TEXT, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_recommendations_by_product_type(TEXT, UUID, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION public.get_cross_type_recommendations(UUID, TEXT[], INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_cross_type_recommendations(UUID, TEXT[], INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION public.get_popular_products_by_users(UUID[], TEXT, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_popular_products_by_users(UUID[], TEXT, INTEGER, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_trending_products_by_behavior(INTEGER, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_trending_products_by_behavior(INTEGER, INTEGER, TEXT) TO anon;
