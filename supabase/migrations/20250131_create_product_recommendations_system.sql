-- Migration: Système de Recommandations Intelligent pour Produits
-- Description: Crée des fonctions SQL pour générer des recommandations de produits intelligentes
-- Date: 31 Janvier 2025

-- ============================================================
-- FONCTION 1: Recommandations basées sur un produit
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_product_recommendations(
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
  v_product RECORD;
  v_category TEXT;
  v_tags TEXT[];
  v_store_id UUID;
BEGIN
  -- 1. Récupérer les détails du produit
  SELECT 
    p.id,
    p.category,
    p.tags,
    p.store_id,
    p.name,
    p.price
  INTO v_product
  FROM products p
  WHERE p.id = p_product_id
    AND p.is_active = true
    AND p.is_draft = false;

  -- Si produit non trouvé, retourner vide
  IF NOT FOUND THEN
    RETURN;
  END IF;

  v_category := v_product.category;
  v_tags := v_product.tags;
  v_store_id := v_product.store_id;

  -- 2. Retourner les recommandations basées sur différents critères
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
      -- Calcul du score de recommandation
      (
        -- Score catégorie (40 points max)
        CASE 
          WHEN p.category = v_category THEN 40
          ELSE 0
        END +
        -- Score tags (30 points max - 10 points par tag commun)
        CASE 
          WHEN v_tags IS NOT NULL AND p.tags IS NOT NULL THEN
            (SELECT COUNT(*) * 10 FROM unnest(v_tags) tag WHERE tag = ANY(p.tags))
          ELSE 0
        END +
        -- Score popularité (20 points max)
        CASE 
          WHEN COALESCE(p.purchases_count, 0) > 100 THEN 20
          WHEN COALESCE(p.purchases_count, 0) > 50 THEN 15
          WHEN COALESCE(p.purchases_count, 0) > 10 THEN 10
          WHEN COALESCE(p.purchases_count, 0) > 0 THEN 5
          ELSE 0
        END +
        -- Score rating (10 points max)
        CASE 
          WHEN p.rating >= 4.5 THEN 10
          WHEN p.rating >= 4.0 THEN 8
          WHEN p.rating >= 3.5 THEN 5
          WHEN p.rating >= 3.0 THEN 3
          ELSE 0
        END
      )::NUMERIC AS recommendation_score,
      -- Raison de la recommandation
      CASE 
        WHEN p.category = v_category AND v_tags IS NOT NULL AND p.tags IS NOT NULL AND (
          SELECT COUNT(*) FROM unnest(v_tags) tag WHERE tag = ANY(p.tags)
        ) > 0 THEN 'Catégorie et tags similaires'
        WHEN p.category = v_category THEN 'Même catégorie'
        WHEN v_tags IS NOT NULL AND p.tags IS NOT NULL AND (
          SELECT COUNT(*) FROM unnest(v_tags) tag WHERE tag = ANY(p.tags)
        ) > 0 THEN 'Tags similaires'
        WHEN COALESCE(p.purchases_count, 0) > 50 THEN 'Produit populaire'
        WHEN p.rating >= 4.0 THEN 'Bien noté'
        ELSE 'Produit similaire'
      END AS recommendation_reason,
      -- Type de recommandation
      CASE 
        WHEN p.category = v_category AND v_tags IS NOT NULL AND p.tags IS NOT NULL AND (
          SELECT COUNT(*) FROM unnest(v_tags) tag WHERE tag = ANY(p.tags)
        ) > 0 THEN 'similar'
        WHEN p.category = v_category THEN 'category'
        WHEN v_tags IS NOT NULL AND p.tags IS NOT NULL AND (
          SELECT COUNT(*) FROM unnest(v_tags) tag WHERE tag = ANY(p.tags)
        ) > 0 THEN 'tags'
        ELSE 'popular'
      END AS recommendation_type
    FROM products p
    INNER JOIN stores s ON s.id = p.store_id
    WHERE p.id != p_product_id
      AND p.is_active = true
      AND p.is_draft = false
      AND (
        -- Produits de la même catégorie
        p.category = v_category
        OR
        -- Produits avec tags similaires
        (v_tags IS NOT NULL AND p.tags IS NOT NULL AND (
          SELECT COUNT(*) FROM unnest(v_tags) tag WHERE tag = ANY(p.tags)
        ) > 0)
        OR
        -- Produits populaires (fallback)
        COALESCE(p.purchases_count, 0) > 10
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
  ORDER BY sp.recommendation_score DESC, sp.purchases_count DESC
  LIMIT p_limit;
END;
$$;

-- ============================================================
-- FONCTION 2: Recommandations basées sur l'historique d'achat
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_user_product_recommendations(
  p_user_id UUID,
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
  v_purchased_categories TEXT[];
  v_purchased_tags TEXT[];
BEGIN
  -- 1. Récupérer les catégories et tags des produits achetés
  SELECT 
    ARRAY_AGG(DISTINCT p.category) FILTER (WHERE p.category IS NOT NULL),
    ARRAY_AGG(DISTINCT tag) FILTER (WHERE tag IS NOT NULL)
  INTO v_purchased_categories, v_purchased_tags
  FROM orders o
  INNER JOIN order_items oi ON oi.order_id = o.id
  INNER JOIN products p ON p.id = oi.product_id
  CROSS JOIN LATERAL unnest(COALESCE(p.tags, ARRAY[]::TEXT[])) tag
  WHERE o.customer_id = p_user_id
    AND o.payment_status = 'paid';

  -- Si aucun achat, retourner recommandations populaires
  IF v_purchased_categories IS NULL OR array_length(v_purchased_categories, 1) IS NULL THEN
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
      (COALESCE(p.purchases_count, 0) * 0.5 + COALESCE(p.rating, 0) * 10)::NUMERIC AS recommendation_score,
      'Produit populaire' AS recommendation_reason,
      'popular' AS recommendation_type
    FROM products p
    INNER JOIN stores s ON s.id = p.store_id
    WHERE p.is_active = true
      AND p.is_draft = false
      AND NOT EXISTS (
        SELECT 1 FROM orders o
        INNER JOIN order_items oi ON oi.order_id = o.id
        WHERE o.customer_id = p_user_id
          AND oi.product_id = p.id
          AND o.payment_status = 'paid'
      )
    ORDER BY p.purchases_count DESC, p.rating DESC
    LIMIT p_limit;
    RETURN;
  END IF;

  -- 2. Retourner les recommandations basées sur l'historique
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
      -- Calcul du score
      (
        -- Score catégorie (50 points max)
        CASE 
          WHEN p.category = ANY(v_purchased_categories) THEN 50
          ELSE 0
        END +
        -- Score tags (30 points max)
        CASE 
          WHEN v_purchased_tags IS NOT NULL AND p.tags IS NOT NULL THEN
            (SELECT COUNT(*) * 10 FROM unnest(v_purchased_tags) tag WHERE tag = ANY(p.tags))
          ELSE 0
        END +
        -- Score popularité (20 points max)
        CASE 
          WHEN COALESCE(p.purchases_count, 0) > 100 THEN 20
          WHEN COALESCE(p.purchases_count, 0) > 50 THEN 15
          WHEN COALESCE(p.purchases_count, 0) > 10 THEN 10
          ELSE 0
        END
      )::NUMERIC AS recommendation_score,
      'Basé sur vos achats précédents' AS recommendation_reason,
      'purchase_history' AS recommendation_type
    FROM products p
    INNER JOIN stores s ON s.id = p.store_id
    WHERE p.is_active = true
      AND p.is_draft = false
      AND NOT EXISTS (
        SELECT 1 FROM orders o
        INNER JOIN order_items oi ON oi.order_id = o.id
        WHERE o.customer_id = p_user_id
          AND oi.product_id = p.id
          AND o.payment_status = 'paid'
      )
      AND (
        p.category = ANY(v_purchased_categories)
        OR
        (v_purchased_tags IS NOT NULL AND p.tags IS NOT NULL AND (
          SELECT COUNT(*) FROM unnest(v_purchased_tags) tag WHERE tag = ANY(p.tags)
        ) > 0)
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
-- FONCTION 3: Produits "Achetés ensemble" (Frequently Bought Together)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_frequently_bought_together(
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
  recommendation_score NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
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
      COUNT(DISTINCT oi.order_id) AS times_bought_together
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
    (bt.times_bought_together * 10 + COALESCE(p.rating, 0) * 5)::NUMERIC AS recommendation_score
  FROM bought_together bt
  INNER JOIN products p ON p.id = bt.product_id
  INNER JOIN stores s ON s.id = p.store_id
  WHERE p.is_active = true
    AND p.is_draft = false
  ORDER BY bt.times_bought_together DESC, p.rating DESC
  LIMIT p_limit;
END;
$$;

-- ============================================================
-- COMMENTAIRES
-- ============================================================
COMMENT ON FUNCTION public.get_product_recommendations(UUID, INTEGER) IS 
'Retourne des recommandations de produits similaires basées sur la catégorie, les tags et la popularité';

COMMENT ON FUNCTION public.get_user_product_recommendations(UUID, INTEGER) IS 
'Retourne des recommandations personnalisées basées sur l''historique d''achat de l''utilisateur';

COMMENT ON FUNCTION public.get_frequently_bought_together(UUID, INTEGER) IS 
'Retourne les produits fréquemment achetés ensemble avec le produit spécifié';







