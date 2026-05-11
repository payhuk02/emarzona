-- Migration: Corrections Critiques - Système de Recommandations IA
-- Date: 13 Janvier 2026
-- Description: Corrige les problèmes critiques identifiés dans l'audit

-- ============================================================
-- PROBLÈME 1: Créer la table user_behavior_tracking manquante
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_behavior_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('view', 'cart', 'purchase', 'favorite', 'share')),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Colonne générée stockée pour la date (IMMUTABLE, peut être utilisée dans les index)
  date_day DATE GENERATED ALWAYS AS (date_trunc('day', timestamp AT TIME ZONE 'UTC')::date) STORED,
  duration INTEGER, -- Durée en secondes
  context JSONB, -- Contexte additionnel (category, price, tags, referrer, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index unique pour éviter les doublons exacts (même user, produit, action et date)
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_behavior_unique_daily 
ON user_behavior_tracking(user_id, product_id, action, date_day);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_user_behavior_user_product ON user_behavior_tracking(user_id, product_id);
CREATE INDEX IF NOT EXISTS idx_user_behavior_timestamp ON user_behavior_tracking(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_user_behavior_action ON user_behavior_tracking(action);
CREATE INDEX IF NOT EXISTS idx_user_behavior_user_timestamp ON user_behavior_tracking(user_id, timestamp DESC);

-- RLS pour user_behavior_tracking
ALTER TABLE user_behavior_tracking ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes si elles existent (pour éviter les erreurs)
DROP POLICY IF EXISTS "Users can view their own behavior tracking" ON user_behavior_tracking;
DROP POLICY IF EXISTS "Users can insert their own behavior tracking" ON user_behavior_tracking;

CREATE POLICY "Users can view their own behavior tracking" ON user_behavior_tracking
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own behavior tracking" ON user_behavior_tracking
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- PROBLÈME 2: Créer la fonction find_similar_products manquante
-- ============================================================
CREATE OR REPLACE FUNCTION public.find_similar_products(
  target_product_id UUID,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  category TEXT,
  tags TEXT[],
  price NUMERIC,
  name TEXT,
  store_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_target_product RECORD;
BEGIN
  -- Récupérer les détails du produit cible
  SELECT 
    p.id,
    p.category,
    p.tags,
    p.price,
    p.name,
    p.store_id
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
    p.store_id
  FROM products p
  WHERE p.id != target_product_id
    AND p.is_active = true
    AND p.is_draft = false
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
    -- Priorité: même catégorie > tags communs > prix similaire
    CASE WHEN p.category = v_target_product.category THEN 1 ELSE 2 END,
    CASE WHEN v_target_product.tags IS NOT NULL AND p.tags IS NOT NULL AND (
      SELECT COUNT(*) FROM unnest(v_target_product.tags) tag WHERE tag = ANY(p.tags)
    ) > 0 THEN 1 ELSE 2 END,
    ABS(COALESCE(p.price, 0) - COALESCE(v_target_product.price, 0))
  LIMIT limit_count;
END;
$$;

COMMENT ON FUNCTION public.find_similar_products(UUID, INTEGER) IS 
'Trouve des produits similaires basés sur catégorie, tags et prix. Utilisée par le moteur de recommandations IA.';

-- ============================================================
-- PROBLÈME 3: Corriger la fonction find_similar_users pour accepter les bons paramètres
-- ============================================================
-- Note: La fonction existe déjà mais avec des paramètres différents
-- Créer une version compatible avec les deux signatures

CREATE OR REPLACE FUNCTION public.find_similar_users(
  p_user_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  target_user_id UUID DEFAULT NULL,
  limit_count INTEGER DEFAULT NULL
)
RETURNS TABLE(user_id UUID, similarity_score FLOAT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_limit INTEGER;
BEGIN
  -- Gérer les deux signatures possibles
  v_user_id := COALESCE(p_user_id, target_user_id);
  v_limit := COALESCE(p_limit, limit_count, 50);

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User ID is required';
  END IF;

  RETURN QUERY
  WITH user_purchases AS (
    -- Produits achetés par l'utilisateur cible
    SELECT DISTINCT oi.product_id
    FROM orders o
    INNER JOIN order_items oi ON oi.order_id = o.id
    WHERE o.customer_id = v_user_id
      AND o.payment_status = 'paid'
  ),
  similar_users AS (
    -- Utilisateurs ayant acheté les mêmes produits
    SELECT
      o.customer_id as similar_user_id,
      COUNT(DISTINCT oi.product_id) as common_products,
      (
        SELECT COUNT(DISTINCT up.product_id)
        FROM user_purchases up
      ) as user_total_products
    FROM orders o
    INNER JOIN order_items oi ON oi.order_id = o.id
    WHERE o.customer_id != v_user_id
      AND o.payment_status = 'paid'
      AND oi.product_id IN (SELECT product_id FROM user_purchases)
    GROUP BY o.customer_id
    HAVING COUNT(DISTINCT oi.product_id) >= 2 -- Au moins 2 produits en commun
  )
  SELECT
    su.similar_user_id,
    CASE 
      WHEN su.user_total_products > 0 
      THEN (su.common_products::FLOAT / su.user_total_products)
      ELSE 0::FLOAT
    END as similarity_score
  FROM similar_users su
  ORDER BY similarity_score DESC
  LIMIT v_limit;
END;
$$;

COMMENT ON FUNCTION public.find_similar_users(UUID, INTEGER, UUID, INTEGER) IS 
'Version améliorée qui accepte plusieurs signatures de paramètres pour compatibilité. Trouve des utilisateurs similaires basés sur l''historique d''achat.';

-- ============================================================
-- Fonction utilitaire pour calculer la similarité de contenu (remplace Math.random)
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
  -- Récupérer les détails des deux produits
  SELECT category, tags, price INTO v_source
  FROM products WHERE id = source_product_id;
  
  SELECT category, tags, price INTO v_target
  FROM products WHERE id = target_product_id;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Score catégorie (40% du score max)
  IF v_source.category IS NOT NULL AND v_target.category IS NOT NULL THEN
    IF v_source.category = v_target.category THEN
      v_category_match := true;
      v_score := v_score + 40;
    END IF;
  END IF;

  -- Score tags (30% du score max)
  IF v_source.tags IS NOT NULL AND v_target.tags IS NOT NULL THEN
    SELECT COUNT(*) INTO v_tags_match
    FROM unnest(v_source.tags) tag
    WHERE tag = ANY(v_target.tags);
    
    IF array_length(v_source.tags, 1) > 0 THEN
      v_score := v_score + (v_tags_match::NUMERIC / array_length(v_source.tags, 1)::NUMERIC) * 30;
    END IF;
  END IF;

  -- Score prix (30% du score max)
  IF v_source.price IS NOT NULL AND v_target.price IS NOT NULL AND v_source.price > 0 THEN
    v_price_similarity := 1 - ABS(v_target.price - v_source.price) / v_source.price;
    IF v_price_similarity > 0 THEN
      v_score := v_score + v_price_similarity * 30;
    END IF;
  END IF;

  -- Normaliser sur 100
  RETURN LEAST(v_score, 100);
END;
$$;

COMMENT ON FUNCTION public.calculate_content_similarity(UUID, UUID) IS 
'Calcule un score de similarité entre deux produits basé sur catégorie, tags et prix. Remplace les calculs aléatoires.';

-- ============================================================
-- Permissions
-- ============================================================
GRANT SELECT, INSERT ON public.user_behavior_tracking TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_similar_products(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_similar_products(UUID, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION public.find_similar_users(UUID, INTEGER, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_similar_users(UUID, INTEGER, UUID, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION public.calculate_content_similarity(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_content_similarity(UUID, UUID) TO anon;

-- ============================================================
-- Fonctions supplémentaires pour corriger les requêtes COUNT()
-- ============================================================

-- Fonction pour obtenir les produits populaires par utilisateurs
CREATE OR REPLACE FUNCTION public.get_popular_products_by_users(
  p_user_ids UUID[],
  p_action TEXT DEFAULT 'purchase',
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  product_id UUID,
  popularity BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ubt.product_id,
    COUNT(*)::BIGINT as popularity
  FROM user_behavior_tracking ubt
  WHERE ubt.user_id = ANY(p_user_ids)
    AND ubt.action = p_action
  GROUP BY ubt.product_id
  ORDER BY popularity DESC
  LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION public.get_popular_products_by_users(UUID[], TEXT, INTEGER) IS 
'Retourne les produits les plus populaires (par nombre d''actions) parmi une liste d''utilisateurs. Utilisée pour les recommandations collaboratives.';

-- Fonction pour obtenir les produits tendance basés sur le comportement
CREATE OR REPLACE FUNCTION public.get_trending_products_by_behavior(
  p_days INTEGER DEFAULT 7,
  p_limit INTEGER DEFAULT 15
)
RETURNS TABLE (
  product_id UUID,
  trend_score BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ubt.product_id,
    COUNT(*)::BIGINT as trend_score
  FROM user_behavior_tracking ubt
  WHERE ubt.timestamp >= NOW() - (p_days || ' days')::INTERVAL
    AND ubt.action IN ('view', 'cart', 'purchase')
  GROUP BY ubt.product_id
  ORDER BY trend_score DESC
  LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION public.get_trending_products_by_behavior(INTEGER, INTEGER) IS 
'Retourne les produits tendance basés sur le nombre d''actions (vues, panier, achats) dans les derniers jours. Utilisée pour les recommandations trending.';

-- Permissions pour les nouvelles fonctions
GRANT EXECUTE ON FUNCTION public.get_popular_products_by_users(UUID[], TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_popular_products_by_users(UUID[], TEXT, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION public.get_trending_products_by_behavior(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_trending_products_by_behavior(INTEGER, INTEGER) TO anon;

-- ============================================================
-- Commentaires finaux
-- ============================================================
COMMENT ON TABLE public.user_behavior_tracking IS 
'Table pour le tracking comportemental des utilisateurs. Utilisée par le moteur de recommandations IA pour générer des recommandations personnalisées basées sur le comportement.';
