-- =========================================================
-- Migration : Amélioration Système de Recommandations ML
-- Date : 1 Février 2025
-- Description : Amélioration de l'algorithme de recommandations avec ML
-- =========================================================

-- ============================================================
-- FONCTION AMÉLIORÉE: Recommandations basées sur la similarité collaborative
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_collaborative_recommendations(
  p_user_id UUID,
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
  recommendation_reason TEXT,
  recommendation_type TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_purchases UUID[];
  v_similar_users UUID[];
BEGIN
  -- 1. Récupérer les produits achetés par l'utilisateur
  SELECT ARRAY_AGG(DISTINCT oi.product_id)
  INTO v_user_purchases
  FROM orders o
  INNER JOIN order_items oi ON oi.order_id = o.id
  WHERE o.customer_id = p_user_id
    AND o.payment_status = 'paid';

  -- Si aucun achat, retourner recommandations populaires
  IF v_user_purchases IS NULL OR array_length(v_user_purchases, 1) IS NULL THEN
    RETURN QUERY
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
      (COALESCE(p.purchases_count, 0) * 0.3 + COALESCE(p.rating, 0) * 7)::NUMERIC AS recommendation_score,
      'Produit populaire' AS recommendation_reason,
      'popular' AS recommendation_type
    FROM products p
    INNER JOIN stores s ON s.id = p.store_id
    WHERE p.is_active = true
      AND p.is_draft = false
    ORDER BY p.purchases_count DESC, p.rating DESC
    LIMIT p_limit;
    RETURN;
  END IF;

  -- 2. Trouver des utilisateurs similaires (qui ont acheté les mêmes produits)
  WITH user_similarity AS (
    SELECT 
      o.customer_id AS similar_user_id,
      COUNT(DISTINCT oi.product_id) AS common_products_count
    FROM orders o
    INNER JOIN order_items oi ON oi.order_id = o.id
    WHERE oi.product_id = ANY(v_user_purchases)
      AND o.customer_id != p_user_id
      AND o.payment_status = 'paid'
    GROUP BY o.customer_id
    HAVING COUNT(DISTINCT oi.product_id) >= 2 -- Au moins 2 produits en commun
    ORDER BY common_products_count DESC
    LIMIT 50
  )
  SELECT ARRAY_AGG(similar_user_id)
  INTO v_similar_users
  FROM user_similarity;

  -- 3. Recommandations basées sur les achats des utilisateurs similaires
  RETURN QUERY
  WITH similar_users_purchases AS (
    SELECT DISTINCT oi.product_id
    FROM orders o
    INNER JOIN order_items oi ON oi.order_id = o.id
    WHERE o.customer_id = ANY(COALESCE(v_similar_users, ARRAY[]::UUID[]))
      AND oi.product_id != ALL(v_user_purchases) -- Produits non achetés par l'utilisateur
      AND o.payment_status = 'paid'
  ),
  scored_products AS (
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
      -- Score basé sur: nombre d'utilisateurs similaires qui ont acheté + popularité + rating
      (
        -- Score utilisateurs similaires (60 points max)
        CASE 
          WHEN p.id IN (SELECT product_id FROM similar_users_purchases) THEN 60
          ELSE 0
        END +
        -- Score popularité (25 points max)
        CASE 
          WHEN COALESCE(p.purchases_count, 0) > 100 THEN 25
          WHEN COALESCE(p.purchases_count, 0) > 50 THEN 20
          WHEN COALESCE(p.purchases_count, 0) > 10 THEN 15
          WHEN COALESCE(p.purchases_count, 0) > 0 THEN 10
          ELSE 0
        END +
        -- Score rating (15 points max)
        CASE 
          WHEN p.rating >= 4.5 THEN 15
          WHEN p.rating >= 4.0 THEN 12
          WHEN p.rating >= 3.5 THEN 8
          WHEN p.rating >= 3.0 THEN 5
          ELSE 0
        END
      )::NUMERIC AS recommendation_score,
      'Recommandé par des utilisateurs similaires' AS recommendation_reason,
      'collaborative' AS recommendation_type
    FROM products p
    INNER JOIN stores s ON s.id = p.store_id
    WHERE p.is_active = true
      AND p.is_draft = false
      AND p.id != ALL(v_user_purchases) -- Exclure les produits déjà achetés
      AND (
        p.id IN (SELECT product_id FROM similar_users_purchases)
        OR COALESCE(p.purchases_count, 0) > 10 -- Fallback sur produits populaires
      )
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
    sp.recommendation_reason,
    sp.recommendation_type
  FROM scored_products sp
  WHERE sp.recommendation_score > 0
  ORDER BY sp.recommendation_score DESC, sp.purchases_count DESC
  LIMIT p_limit;
END;
$$;

-- ============================================================
-- FONCTION AMÉLIORÉE: "Fréquemment achetés ensemble" avec scoring avancé
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_frequently_bought_together_v2(
  p_product_id UUID,
  p_limit INTEGER DEFAULT 4
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
  times_bought_together INTEGER,
  recommendation_score NUMERIC,
  confidence_score NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_orders_with_product INTEGER;
BEGIN
  -- Compter le nombre total de commandes contenant ce produit
  SELECT COUNT(DISTINCT o.id)
  INTO v_total_orders_with_product
  FROM orders o
  INNER JOIN order_items oi ON oi.order_id = o.id
  WHERE oi.product_id = p_product_id
    AND o.payment_status = 'paid';

  -- Si moins de 2 commandes, retourner vide
  IF v_total_orders_with_product < 2 THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH product_orders AS (
    -- Commandes contenant le produit
    SELECT DISTINCT o.id AS order_id
    FROM orders o
    INNER JOIN order_items oi ON oi.order_id = o.id
    WHERE oi.product_id = p_product_id
      AND o.payment_status = 'paid'
  ),
  bought_together AS (
    -- Produits achetés dans les mêmes commandes
    SELECT 
      oi.product_id,
      COUNT(DISTINCT oi.order_id) AS times_bought_together,
      -- Score de confiance: plus le produit est acheté souvent avec, plus la confiance est élevée
      (COUNT(DISTINCT oi.order_id)::NUMERIC / v_total_orders_with_product::NUMERIC) AS confidence_ratio
    FROM order_items oi
    INNER JOIN product_orders po ON po.order_id = oi.order_id
    WHERE oi.product_id != p_product_id
    GROUP BY oi.product_id
    HAVING COUNT(DISTINCT oi.order_id) >= 2 -- Au moins 2 commandes ensemble
  )
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
    bt.times_bought_together,
    -- Score amélioré: combine fréquence, confiance, rating et popularité
    (
      bt.times_bought_together * 15 + -- Fréquence (60 points max pour 4+ fois)
      (bt.confidence_ratio * 100)::INTEGER * 0.3 + -- Confiance (30 points max)
      COALESCE(p.rating, 0) * 5 + -- Rating (25 points max)
      LEAST(COALESCE(p.purchases_count, 0) / 10, 1) * 10 -- Popularité (10 points max)
    )::NUMERIC AS recommendation_score,
    (bt.confidence_ratio * 100)::NUMERIC AS confidence_score
  FROM bought_together bt
  INNER JOIN products p ON p.id = bt.product_id
  INNER JOIN stores s ON s.id = p.store_id
  WHERE p.is_active = true
    AND p.is_draft = false
  ORDER BY bt.times_bought_together DESC, bt.confidence_ratio DESC, p.rating DESC
  LIMIT p_limit;
END;
$$;

-- ============================================================
-- FONCTION: Recommandations basées sur les vues (view-based)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_view_based_recommendations(
  p_product_id UUID,
  p_limit INTEGER DEFAULT 6
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
  recommendation_reason TEXT,
  recommendation_type TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_product_category TEXT;
  v_product_tags TEXT[];
BEGIN
  -- Récupérer les infos du produit
  SELECT category, tags
  INTO v_product_category, v_product_tags
  FROM products
  WHERE id = p_product_id;

  RETURN QUERY
  WITH product_views AS (
    -- Produits souvent vus ensemble (basé sur les sessions utilisateur)
    SELECT 
      pv2.product_id,
      COUNT(DISTINCT pv2.session_id) AS co_view_count
    FROM product_views pv1
    INNER JOIN product_views pv2 ON pv2.session_id = pv1.session_id
    WHERE pv1.product_id = p_product_id
      AND pv2.product_id != p_product_id
      AND pv1.viewed_at >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY pv2.product_id
    HAVING COUNT(DISTINCT pv2.session_id) >= 3 -- Au moins 3 sessions en commun
  )
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
    (
      -- Score basé sur co-vues (50 points max)
      LEAST(pv.co_view_count * 10, 50) +
      -- Score catégorie (30 points max)
      CASE WHEN p.category = v_product_category THEN 30 ELSE 0 END +
      -- Score tags (20 points max)
      CASE 
        WHEN v_product_tags IS NOT NULL AND p.tags IS NOT NULL THEN
          (SELECT COUNT(*) * 5 FROM unnest(v_product_tags) tag WHERE tag = ANY(p.tags))
        ELSE 0
      END
    )::NUMERIC AS recommendation_score,
    'Souvent consulté ensemble' AS recommendation_reason,
    'view_based' AS recommendation_type
  FROM product_views pv
  INNER JOIN products p ON p.id = pv.product_id
  INNER JOIN stores s ON s.id = p.store_id
  WHERE p.is_active = true
    AND p.is_draft = false
  ORDER BY pv.co_view_count DESC, p.rating DESC
  LIMIT p_limit;
END;
$$;

-- ============================================================
-- COMMENTAIRES
-- ============================================================
COMMENT ON FUNCTION public.get_collaborative_recommendations(UUID, INTEGER) IS 
'Recommandations basées sur le filtrage collaboratif - trouve des utilisateurs similaires et recommande leurs produits';

COMMENT ON FUNCTION public.get_frequently_bought_together_v2(UUID, INTEGER) IS 
'Version améliorée de "Fréquemment achetés ensemble" avec scoring de confiance';

COMMENT ON FUNCTION public.get_view_based_recommendations(UUID, INTEGER) IS 
'Recommandations basées sur les produits souvent consultés ensemble par les utilisateurs';

