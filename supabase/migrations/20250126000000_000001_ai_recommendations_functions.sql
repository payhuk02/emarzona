-- Migration: Fonctions IA pour les recommandations
-- Date: 26 Janvier 2025
-- Description: Ajout des fonctions de base de données pour le moteur de recommandations IA

-- Fonction pour trouver des utilisateurs similaires basés sur l'historique d'achat
CREATE OR REPLACE FUNCTION find_similar_users(p_user_id UUID, p_limit INTEGER DEFAULT 50)
RETURNS TABLE(user_id UUID, similarity_score FLOAT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH user_purchases AS (
    -- Produits achetés par l'utilisateur cible
    SELECT DISTINCT
      JSONB_ARRAY_ELEMENTS(oi.items)->>'product_id' as product_id
    FROM orders oi
    WHERE oi.customer_id = p_user_id
    AND oi.status = 'completed'
  ),
  similar_users AS (
    -- Utilisateurs ayant acheté les mêmes produits
    SELECT
      o.customer_id as user_id,
      COUNT(DISTINCT JSONB_ARRAY_ELEMENTS(o.items)->>'product_id') as common_products,
      (
        SELECT COUNT(DISTINCT up.product_id)
        FROM user_purchases up
      ) as user_total_products
    FROM orders o
    WHERE o.customer_id != p_user_id
    AND o.status = 'completed'
    AND EXISTS (
      SELECT 1
      FROM user_purchases up
      WHERE JSONB_ARRAY_ELEMENTS(o.items)->>'product_id' = up.product_id
    )
    GROUP BY o.customer_id
    HAVING COUNT(DISTINCT JSONB_ARRAY_ELEMENTS(o.items)->>'product_id') >= 2
  )
  SELECT
    su.user_id,
    (su.common_products::FLOAT / su.user_total_products) as similarity_score
  FROM similar_users su
  ORDER BY similarity_score DESC
  LIMIT p_limit;
END;
$$;

-- Fonction pour obtenir les catégories préférées d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_preferred_categories(p_user_id UUID)
RETURNS TEXT[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT ARRAY_AGG(category ORDER BY purchase_count DESC)
    FROM (
      SELECT
        p.category,
        COUNT(*) as purchase_count
      FROM orders o
      CROSS JOIN LATERAL JSONB_ARRAY_ELEMENTS(o.items) as item
      JOIN products p ON (item->>'product_id')::UUID = p.id
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

-- Fonction pour obtenir les produits tendance par catégories
CREATE OR REPLACE FUNCTION get_trending_products_by_categories(
  p_categories TEXT[],
  p_limit INTEGER DEFAULT 10,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE(
  id UUID,
  name TEXT,
  category TEXT,
  trend_score FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.category,
    (
      -- Score basé sur les ventes récentes pondérées
      COALESCE((
        SELECT SUM(
          CASE
            WHEN o.created_at >= NOW() - INTERVAL '7 days' THEN 3.0  -- Très récent
            WHEN o.created_at >= NOW() - INTERVAL '14 days' THEN 2.0 -- Récent
            WHEN o.created_at >= NOW() - INTERVAL '30 days' THEN 1.0 -- Normal
            ELSE 0.5
          END
        )
        FROM orders o
        CROSS JOIN LATERAL JSONB_ARRAY_ELEMENTS(o.items) as item
        WHERE (item->>'product_id')::UUID = p.id
        AND o.status = 'completed'
        AND o.created_at >= NOW() - (p_days || ' days')::INTERVAL
      ), 0) /
      -- Normalisation par le temps écoulé depuis la création
      GREATEST(EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 86400, 1)
    ) as trend_score
  FROM products p
  WHERE p.category = ANY(p_categories)
  AND p.is_active = true
  ORDER BY trend_score DESC
  LIMIT p_limit;
END;
$$;

-- Fonction pour obtenir les produits tendance généraux
CREATE OR REPLACE FUNCTION get_trending_products(
  p_limit INTEGER DEFAULT 10,
  p_days INTEGER DEFAULT 7
)
RETURNS TABLE(
  id UUID,
  name TEXT,
  trend_score FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    (
      COALESCE((
        SELECT SUM(
          CASE
            WHEN o.created_at >= NOW() - INTERVAL '1 day' THEN 5.0   -- Aujourd'hui
            WHEN o.created_at >= NOW() - INTERVAL '3 days' THEN 3.0  -- 3 derniers jours
            WHEN o.created_at >= NOW() - INTERVAL '7 days' THEN 2.0  -- Cette semaine
            ELSE 1.0
          END
        )
        FROM orders o
        CROSS JOIN LATERAL JSONB_ARRAY_ELEMENTS(o.items) as item
        WHERE (item->>'product_id')::UUID = p.id
        AND o.status = 'completed'
        AND o.created_at >= NOW() - (p_days || ' days')::INTERVAL
      ), 0) /
      GREATEST(EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 86400, 1)
    ) as trend_score
  FROM products p
  WHERE p.is_active = true
  ORDER BY trend_score DESC
  LIMIT p_limit;
END;
$$;

-- Table pour stocker les vues de produits (pour les recommandations)
CREATE TABLE IF NOT EXISTS product_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_id TEXT,
  source TEXT, -- 'direct', 'search', 'recommendation', 'category', etc.
  duration_seconds INTEGER, -- Temps passé sur la page (si disponible)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, product_id, DATE(viewed_at))
);

-- Index pour optimiser les requêtes de vues de produits
CREATE INDEX IF NOT EXISTS idx_product_views_user_product ON product_views(user_id, product_id);
CREATE INDEX IF NOT EXISTS idx_product_views_product_date ON product_views(product_id, DATE(viewed_at));
CREATE INDEX IF NOT EXISTS idx_product_views_user_date ON product_views(user_id, DATE(viewed_at));

-- Table pour les analytics des recommandations
CREATE TABLE IF NOT EXISTS recommendation_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  recommended_product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  reason TEXT NOT NULL, -- 'collaborative', 'content', 'trending', 'complementary'
  score FLOAT NOT NULL,
  confidence FLOAT NOT NULL,
  position INTEGER, -- Position dans la liste de recommandations
  clicked BOOLEAN DEFAULT false,
  purchased BOOLEAN DEFAULT false,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les analytics de recommandations
CREATE INDEX IF NOT EXISTS idx_recommendation_analytics_user_date ON recommendation_analytics(user_id, date);
CREATE INDEX IF NOT EXISTS idx_recommendation_analytics_product ON recommendation_analytics(recommended_product_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_analytics_reason ON recommendation_analytics(reason);

-- RLS pour product_views
ALTER TABLE product_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own product views" ON product_views
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own product views" ON product_views
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS pour recommendation_analytics
ALTER TABLE recommendation_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own recommendation analytics" ON recommendation_analytics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recommendation analytics" ON recommendation_analytics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Fonction pour enregistrer une vue de produit
CREATE OR REPLACE FUNCTION record_product_view(
  p_user_id UUID,
  p_product_id UUID,
  p_source TEXT DEFAULT 'direct',
  p_session_id TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO product_views (user_id, product_id, source, session_id)
  VALUES (p_user_id, p_product_id, p_source, p_session_id)
  ON CONFLICT (user_id, product_id, DATE(viewed_at))
  DO UPDATE SET
    viewed_at = NOW(),
    source = EXCLUDED.source;
END;
$$;

-- Fonction pour enregistrer un clic sur recommandation
CREATE OR REPLACE FUNCTION record_recommendation_click(
  p_user_id UUID,
  p_product_id UUID,
  p_recommended_product_id UUID,
  p_reason TEXT,
  p_score FLOAT,
  p_confidence FLOAT,
  p_position INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO recommendation_analytics (
    user_id,
    product_id,
    recommended_product_id,
    reason,
    score,
    confidence,
    position,
    clicked
  ) VALUES (
    p_user_id,
    p_product_id,
    p_recommended_product_id,
    p_reason,
    p_score,
    p_confidence,
    p_position,
    true
  );
END;
$$;