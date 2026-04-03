-- Create user style preferences table for personalized recommendations
-- Migration: 20250126000000_create_user_style_preferences

CREATE TABLE IF NOT EXISTS user_style_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile JSONB NOT NULL, -- StyleProfile as JSON
  quiz_completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  recommendations_viewed INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure one preference per user
  UNIQUE(user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_style_preferences_user_id ON user_style_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_style_preferences_quiz_completed ON user_style_preferences(quiz_completed_at);
CREATE INDEX IF NOT EXISTS idx_user_style_preferences_profile ON user_style_preferences USING GIN(profile);

-- Row Level Security
ALTER TABLE user_style_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only access their own preferences
-- Drop existing policies if they exist to make migration idempotent
DROP POLICY IF EXISTS "Users can view their own style preferences" ON user_style_preferences;
DROP POLICY IF EXISTS "Users can insert their own style preferences" ON user_style_preferences;
DROP POLICY IF EXISTS "Users can update their own style preferences" ON user_style_preferences;
DROP POLICY IF EXISTS "Users can delete their own style preferences" ON user_style_preferences;

CREATE POLICY "Users can view their own style preferences" ON user_style_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own style preferences" ON user_style_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own style preferences" ON user_style_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own style preferences" ON user_style_preferences
  FOR DELETE USING (auth.uid() = user_id);

-- Function to get personalized recommendations
CREATE OR REPLACE FUNCTION get_personalized_recommendations(
  p_user_id UUID DEFAULT NULL,
  p_style_profile JSONB DEFAULT NULL,
  p_filters JSONB DEFAULT '{}',
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  price DECIMAL,
  category TEXT,
  tags TEXT[],
  store_id UUID,
  store_name TEXT,
  average_rating DECIMAL,
  total_reviews INTEGER,
  image_url TEXT,
  relevance_score DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_aesthetic TEXT;
  v_color_palette TEXT;
  v_budget_range TEXT;
  v_occasion_focus TEXT;
  v_sustainability TEXT;
  v_min_price DECIMAL := 0;
  v_max_price DECIMAL := 10000;
  v_style_tags TEXT[];
  v_occasion_tags TEXT[];
  v_sustainability_filter BOOLEAN := FALSE;
BEGIN
  -- Extract profile preferences
  IF p_style_profile IS NOT NULL THEN
    v_aesthetic := p_style_profile->>'aesthetic';
    v_color_palette := p_style_profile->>'colorPalette';
    v_budget_range := p_style_profile->>'budgetRange';
    v_occasion_focus := p_style_profile->>'occasionFocus';
    v_sustainability := p_style_profile->>'sustainability';

    -- Build price range based on budget
    CASE v_budget_range
      WHEN 'budget' THEN
        v_min_price := 0;
        v_max_price := 50;
      WHEN 'midrange' THEN
        v_min_price := 30;
        v_max_price := 200;
      WHEN 'premium' THEN
        v_min_price := 150;
        v_max_price := 1000;
      WHEN 'luxury' THEN
        v_min_price := 500;
        v_max_price := 10000;
      ELSE
        -- Keep defaults
    END CASE;

    -- Build style and occasion tags
    v_style_tags := ARRAY[v_aesthetic, v_color_palette];
    v_occasion_tags := ARRAY[v_occasion_focus];

    -- Sustainability filter
    IF v_sustainability = 'very_important' THEN
      v_sustainability_filter := TRUE;
    END IF;
  END IF;

  -- Override with custom filters if provided
  IF p_filters->>'min_price' IS NOT NULL THEN
    v_min_price := (p_filters->>'min_price')::DECIMAL;
  END IF;

  IF p_filters->>'max_price' IS NOT NULL THEN
    v_max_price := (p_filters->>'max_price')::DECIMAL;
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.description,
    p.price,
    p.category,
    p.tags,
    s.id as store_id,
    s.name as store_name,
    COALESCE(AVG(r.rating), 0) as average_rating,
    COUNT(r.id) as total_reviews,
    (p.images->>0) as image_url,
    -- Calculate relevance score
    CASE
      WHEN p_style_profile IS NOT NULL THEN
        (
          -- Style matching (40% weight)
          CASE WHEN p.tags && v_style_tags THEN 40 ELSE 0 END +
          -- Occasion matching (20% weight)
          CASE WHEN p.category = ANY(v_occasion_tags) THEN 20 ELSE 0 END +
          -- Price range matching (20% weight)
          CASE WHEN p.price BETWEEN v_min_price AND v_max_price THEN 20 ELSE 0 END +
          -- Sustainability matching (10% weight)
          CASE WHEN v_sustainability_filter AND p.is_sustainable = TRUE THEN 10 ELSE 0 END +
          -- Rating bonus (10% weight)
          LEAST(COALESCE(AVG(r.rating), 0) * 2, 10)
        )
      ELSE 50 -- Default score for non-personalized
    END as relevance_score
  FROM products p
  LEFT JOIN stores s ON p.store_id = s.id
  LEFT JOIN reviews r ON p.id = r.product_id
  WHERE p.is_active = TRUE
    AND p.price BETWEEN v_min_price AND v_max_price
    AND (NOT v_sustainability_filter OR p.is_sustainable = TRUE)
    AND (p_style_profile IS NULL OR (
      -- Style matching for personalized recommendations
      (p.tags && v_style_tags) OR
      (p.category = ANY(v_occasion_tags))
    ))
  GROUP BY p.id, p.name, p.description, p.price, p.category, p.tags, s.id, s.name, p.images
  ORDER BY relevance_score DESC, COALESCE(AVG(r.rating), 0) DESC, p.total_sales DESC
  LIMIT p_limit;
END;
$$;

-- Function to get similar products
CREATE OR REPLACE FUNCTION get_similar_products(
  p_product_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 8
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  price DECIMAL,
  category TEXT,
  tags TEXT[],
  image_url TEXT,
  similarity_score DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH target_product AS (
    SELECT category, tags, price, total_sales
    FROM products
    WHERE id = p_product_id
  )
  SELECT
    p.id,
    p.name,
    p.price,
    p.category,
    p.tags,
    (p.images->>0) as image_url,
    -- Calculate similarity score
    (
      -- Category match (40% weight)
      CASE WHEN p.category = tp.category THEN 40 ELSE 0 END +
      -- Tag overlap (30% weight)
      CASE WHEN p.tags && tp.tags THEN
        LEAST(array_length(array_intersect(p.tags, tp.tags), 1) * 10, 30)
      ELSE 0 END +
      -- Price similarity (20% weight)
      CASE WHEN ABS(p.price - tp.price) / GREATEST(tp.price, 1) < 0.5 THEN 20 ELSE 0 END +
      -- Popularity similarity (10% weight)
      LEAST(p.total_sales::DECIMAL / GREATEST(tp.total_sales, 1) * 10, 10)
    ) as similarity_score
  FROM products p, target_product tp
  WHERE p.id != p_product_id
    AND p.is_active = TRUE
  ORDER BY similarity_score DESC
  LIMIT p_limit;
END;
$$;

-- Function to get trending recommendations
CREATE OR REPLACE FUNCTION get_trending_recommendations(
  p_limit INTEGER DEFAULT 12,
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  price DECIMAL,
  category TEXT,
  image_url TEXT,
  trending_score DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.price,
    p.category,
    (p.images->>0) as image_url,
    -- Calculate trending score based on recent activity
    (
      -- Recent sales (40% weight)
      LEAST((p.recent_sales_30d::DECIMAL / GREATEST(p.total_sales, 1)) * 40, 40) +
      -- Recent reviews (30% weight)
      LEAST((p.recent_reviews_30d::DECIMAL / GREATEST(p.total_reviews, 1)) * 30, 30) +
      -- Recent views (20% weight)
      LEAST((p.recent_views_30d::DECIMAL / GREATEST(p.total_views, 1)) * 20, 20) +
      -- Base popularity (10% weight)
      LEAST(p.total_sales::DECIMAL / 1000 * 10, 10)
    ) as trending_score
  FROM products p
  WHERE p.is_active = TRUE
    AND (
      p.recent_sales_30d > 0 OR
      p.recent_reviews_30d > 0 OR
      p.recent_views_30d > 10
    )
  ORDER BY trending_score DESC
  LIMIT p_limit;
END;
$$;

-- Function to get history-based recommendations
CREATE OR REPLACE FUNCTION get_history_based_recommendations(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 15
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  price DECIMAL,
  category TEXT,
  image_url TEXT,
  history_score DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH user_history AS (
    -- Get user's purchase and view history
    SELECT DISTINCT
      p.category,
      p.tags,
      unnest(p.tags) as individual_tag,
      p.price_range as price_category
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN products p ON oi.product_id = p.id
    WHERE o.user_id = p_user_id
      AND o.status = 'completed'
      AND o.created_at > NOW() - INTERVAL '6 months'

    UNION

    -- Also consider recently viewed products
    SELECT DISTINCT
      p.category,
      p.tags,
      unnest(p.tags) as individual_tag,
      p.price_range as price_category
    FROM product_views pv
    JOIN products p ON pv.product_id = p.id
    WHERE pv.user_id = p_user_id
      AND pv.viewed_at > NOW() - INTERVAL '30 days'
  )
  SELECT
    p.id,
    p.name,
    p.price,
    p.category,
    (p.images->>0) as image_url,
    -- Calculate history-based score
    (
      -- Category preference (30% weight)
      CASE WHEN p.category = ANY(array_agg(uh.category)) THEN 30 ELSE 0 END +
      -- Tag preference (40% weight)
      CASE WHEN p.tags && array_agg(uh.individual_tag) THEN
        LEAST(array_length(array_intersect(p.tags, array_agg(uh.individual_tag)), 1) * 13.33, 40)
      ELSE 0 END +
      -- Price range preference (20% weight)
      CASE WHEN p.price_range = ANY(array_agg(uh.price_category)) THEN 20 ELSE 0 END +
      -- Not already purchased (10% weight)
      CASE WHEN NOT EXISTS (
        SELECT 1 FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        WHERE o.user_id = p_user_id
          AND oi.product_id = p.id
          AND o.status = 'completed'
      ) THEN 10 ELSE 0 END
    ) as history_score
  FROM products p, user_history uh
  WHERE p.is_active = TRUE
  GROUP BY p.id, p.name, p.price, p.category, p.tags, p.images, p.price_range
  HAVING (
    -- Category match OR tag match OR price match
    p.category = ANY(array_agg(uh.category)) OR
    p.tags && array_agg(uh.individual_tag) OR
    p.price_range = ANY(array_agg(uh.price_category))
  )
  ORDER BY history_score DESC, p.total_sales DESC
  LIMIT p_limit;
END;
$$;

-- Add helpful comments
COMMENT ON TABLE user_style_preferences IS 'Stores user style preferences from the personalization quiz for personalized recommendations';
COMMENT ON FUNCTION get_personalized_recommendations IS 'Returns personalized product recommendations based on user style profile';
COMMENT ON FUNCTION get_similar_products IS 'Returns products similar to a given product';
COMMENT ON FUNCTION get_trending_recommendations IS 'Returns trending products based on recent activity';
COMMENT ON FUNCTION get_history_based_recommendations IS 'Returns recommendations based on user purchase and view history';

-- Add some sample data for testing (optional)
-- This would be inserted by the application when users complete the quiz