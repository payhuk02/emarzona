-- Migration pour créer/corriger la fonction get_user_product_recommendations
-- Version améliorée avec gestion d'erreurs défensive
-- Date: 2 Février 2025

-- Supprimer la fonction existante si elle a des problèmes
DROP FUNCTION IF EXISTS public.get_user_product_recommendations(UUID, INTEGER);

-- Créer une version améliorée de la fonction avec gestion d'erreurs
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
  v_has_orders BOOLEAN := FALSE;
BEGIN
  -- Vérifier si la table orders existe et a des données pour cet utilisateur
  -- Utiliser une approche défensive pour éviter les erreurs si les tables n'existent pas
  
  BEGIN
    -- Essayer de récupérer les catégories et tags des produits achetés
    SELECT 
      ARRAY_AGG(DISTINCT p.category) FILTER (WHERE p.category IS NOT NULL),
      ARRAY_AGG(DISTINCT tag) FILTER (WHERE tag IS NOT NULL),
      COUNT(*) > 0
    INTO v_purchased_categories, v_purchased_tags, v_has_orders
    FROM orders o
    INNER JOIN order_items oi ON oi.order_id = o.id
    INNER JOIN products p ON p.id = oi.product_id
    CROSS JOIN LATERAL unnest(COALESCE(p.tags, ARRAY[]::TEXT[])) tag
    WHERE o.customer_id = p_user_id
      AND o.payment_status = 'paid'
    LIMIT 100; -- Limiter pour performance
    
    -- Si des catégories ont été trouvées, les utiliser
    IF v_purchased_categories IS NOT NULL AND array_length(v_purchased_categories, 1) > 0 THEN
      v_has_orders := TRUE;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      -- Si une erreur se produit (table n'existe pas, colonne manquante, etc.)
      -- Continuer avec des recommandations populaires
      v_has_orders := FALSE;
      v_purchased_categories := NULL;
      v_purchased_tags := NULL;
  END;

  -- Si aucun achat trouvé ou erreur, retourner recommandations populaires
  IF NOT v_has_orders OR v_purchased_categories IS NULL OR array_length(v_purchased_categories, 1) IS NULL THEN
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
    ORDER BY COALESCE(p.purchases_count, 0) DESC, COALESCE(p.rating, 0) DESC NULLS LAST
    LIMIT p_limit;
    RETURN;
  END IF;

  -- Retourner les recommandations basées sur l'historique d'achat
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
            LEAST((SELECT COUNT(*) * 10 FROM unnest(v_purchased_tags) tag WHERE tag = ANY(p.tags)), 30)
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

-- Ajouter un commentaire
COMMENT ON FUNCTION public.get_user_product_recommendations(UUID, INTEGER) IS 
'Retourne des recommandations personnalisées basées sur l''historique d''achat de l''utilisateur. Version améliorée avec gestion d''erreurs défensive. Retourne des recommandations populaires si l''utilisateur n''a pas d''historique d''achat.';

-- Donner les permissions nécessaires
GRANT EXECUTE ON FUNCTION public.get_user_product_recommendations(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_product_recommendations(UUID, INTEGER) TO anon;





