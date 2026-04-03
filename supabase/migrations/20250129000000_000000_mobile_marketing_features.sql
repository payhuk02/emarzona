-- Migration: Mobile Commerce & Marketing Automation Features
-- Date: January 29, 2025
-- Description: Adds tables and functions for mobile PWA features, behavioral analytics, abandoned carts, and marketing automation
-- Note: This migration handles existing tables gracefully by adding missing columns instead of recreating tables
-- Note: Unique constraints with expressions are handled by application logic to avoid IMMUTABLE function requirements
-- Note: RLS policies are recreated using DROP POLICY IF EXISTS to handle existing policies

-- =====================================================
-- BEHAVIORAL ANALYTICS TABLES
-- =====================================================

-- User behavior events table
CREATE TABLE IF NOT EXISTS user_behavior_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  page_url TEXT NOT NULL,
  referrer TEXT,
  device_info JSONB NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure all required columns exist for user_behavior_events
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'user_behavior_events'
        AND table_schema = 'public'
    ) THEN
        -- Add missing columns if they don't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'user_behavior_events'
            AND column_name = 'session_id'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE user_behavior_events ADD COLUMN session_id TEXT NOT NULL DEFAULT '';
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'user_behavior_events'
            AND column_name = 'device_info'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE user_behavior_events ADD COLUMN device_info JSONB NOT NULL DEFAULT '{}';
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'user_behavior_events'
            AND column_name = 'referrer'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE user_behavior_events ADD COLUMN referrer TEXT;
        END IF;
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_behavior_events_user_id ON user_behavior_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_behavior_events_event_type ON user_behavior_events(event_type);
CREATE INDEX IF NOT EXISTS idx_user_behavior_events_timestamp ON user_behavior_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_user_behavior_events_session_id ON user_behavior_events(session_id);

-- =====================================================
-- ABANDONED CARTS TABLES
-- =====================================================

-- Abandoned carts table
CREATE TABLE IF NOT EXISTS abandoned_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'XAF',
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  abandoned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  recovery_sent BOOLEAN NOT NULL DEFAULT FALSE,
  recovered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add recovery_sent column if it doesn't exist (for existing tables)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'abandoned_carts'
        AND column_name = 'recovery_sent'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE abandoned_carts ADD COLUMN recovery_sent BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;
END $$;

-- Add recovered_at column if it doesn't exist (for existing tables)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'abandoned_carts'
        AND column_name = 'recovered_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE abandoned_carts ADD COLUMN recovered_at TIMESTAMPTZ;
    END IF;
END $$;

-- Add updated_at column if it doesn't exist (for existing tables)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'abandoned_carts'
        AND column_name = 'updated_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE abandoned_carts ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    END IF;
END $$;

-- Abandoned cart items table
CREATE TABLE IF NOT EXISTS abandoned_cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES abandoned_carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure all required columns exist for abandoned_cart_items
DO $$
BEGIN
    -- Add any missing columns if table exists but is missing columns
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'abandoned_cart_items'
        AND table_schema = 'public'
    ) THEN
        -- Table exists, check for required columns
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'abandoned_cart_items'
            AND column_name = 'cart_id'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE abandoned_cart_items ADD COLUMN cart_id UUID NOT NULL REFERENCES abandoned_carts(id) ON DELETE CASCADE;
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'abandoned_cart_items'
            AND column_name = 'product_id'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE abandoned_cart_items ADD COLUMN product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE;
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'abandoned_cart_items'
            AND column_name = 'quantity'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE abandoned_cart_items ADD COLUMN quantity INTEGER NOT NULL CHECK (quantity > 0);
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'abandoned_cart_items'
            AND column_name = 'price'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE abandoned_cart_items ADD COLUMN price DECIMAL(10,2) NOT NULL;
        END IF;
    END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_user_id ON abandoned_carts(user_id);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_recovery_sent ON abandoned_carts(recovery_sent);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_recovered_at ON abandoned_carts(recovered_at);
CREATE INDEX IF NOT EXISTS idx_abandoned_cart_items_cart_id ON abandoned_cart_items(cart_id);

-- =====================================================
-- MARKETING AUTOMATION TABLES
-- =====================================================

-- Marketing campaigns table
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('email', 'push', 'in_app', 'sms')),
  trigger TEXT NOT NULL CHECK (trigger IN ('behavioral', 'time_based', 'segment_based', 'event_based')),
  conditions JSONB DEFAULT '{}',
  template_id UUID, -- References notification_templates if we create that table
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  priority INTEGER NOT NULL DEFAULT 1,
  cooldown_hours INTEGER NOT NULL DEFAULT 24,
  max_sends_per_user INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Campaign sends tracking
CREATE TABLE IF NOT EXISTS marketing_campaign_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  channel TEXT NOT NULL CHECK (channel IN ('email', 'push', 'in_app', 'sms')),
  metadata JSONB DEFAULT '{}'
);

-- Campaign performance table
CREATE TABLE IF NOT EXISTS campaign_performance (
  campaign_id UUID PRIMARY KEY REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  sent_count INTEGER NOT NULL DEFAULT 0,
  open_count INTEGER NOT NULL DEFAULT 0,
  click_count INTEGER NOT NULL DEFAULT 0,
  conversion_count INTEGER NOT NULL DEFAULT 0,
  revenue_generated DECIMAL(10,2) NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User segments table
CREATE TABLE IF NOT EXISTS user_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  criteria JSONB NOT NULL DEFAULT '{}',
  user_count INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_active ON marketing_campaigns(is_active);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_trigger ON marketing_campaigns(trigger);
CREATE INDEX IF NOT EXISTS idx_marketing_campaign_sends_user_id ON marketing_campaign_sends(user_id);
CREATE INDEX IF NOT EXISTS idx_marketing_campaign_sends_campaign_id ON marketing_campaign_sends(campaign_id);

-- Regular indexes for marketing campaign sends
CREATE INDEX IF NOT EXISTS idx_marketing_campaign_sends_user_id ON marketing_campaign_sends(user_id);
CREATE INDEX IF NOT EXISTS idx_marketing_campaign_sends_campaign_id ON marketing_campaign_sends(campaign_id);
CREATE INDEX IF NOT EXISTS idx_marketing_campaign_sends_sent_at ON marketing_campaign_sends(sent_at);

-- Note: Uniqueness per user/campaign/day is now handled by application logic
-- or by the record_recommendation_click function which checks existing records

-- =====================================================
-- RECOMMENDATION ANALYTICS TABLES
-- =====================================================

-- Recommendation analytics table (if not exists)
CREATE TABLE IF NOT EXISTS recommendation_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  recommended_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  score DECIMAL(5,4) NOT NULL,
  confidence DECIMAL(5,4),
  position INTEGER,
  clicked BOOLEAN DEFAULT FALSE,
  purchased BOOLEAN DEFAULT FALSE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure all required columns exist for recommendation_analytics
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'recommendation_analytics'
        AND table_schema = 'public'
    ) THEN
        -- Add missing columns if they don't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'recommendation_analytics'
            AND column_name = 'confidence'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE recommendation_analytics ADD COLUMN confidence DECIMAL(5,4);
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'recommendation_analytics'
            AND column_name = 'position'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE recommendation_analytics ADD COLUMN position INTEGER;
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'recommendation_analytics'
            AND column_name = 'clicked'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE recommendation_analytics ADD COLUMN clicked BOOLEAN DEFAULT FALSE;
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'recommendation_analytics'
            AND column_name = 'purchased'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE recommendation_analytics ADD COLUMN purchased BOOLEAN DEFAULT FALSE;
        END IF;
    END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_recommendation_analytics_user_id ON recommendation_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_analytics_date ON recommendation_analytics(date);
CREATE INDEX IF NOT EXISTS idx_recommendation_analytics_product_id ON recommendation_analytics(product_id);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- User behavior events - Users can only see their own events
ALTER TABLE user_behavior_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own behavior events" ON user_behavior_events;
CREATE POLICY "Users can view their own behavior events" ON user_behavior_events
  FOR SELECT USING (auth.uid() = user_id);

-- Abandoned carts - Users can only see their own carts, admins can see all
ALTER TABLE abandoned_carts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own abandoned carts" ON abandoned_carts;
CREATE POLICY "Users can view their own abandoned carts" ON abandoned_carts
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can manage all abandoned carts" ON abandoned_carts;
CREATE POLICY "Admins can manage all abandoned carts" ON abandoned_carts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Abandoned cart items - Same as above
ALTER TABLE abandoned_cart_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own cart items" ON abandoned_cart_items;
CREATE POLICY "Users can view their own cart items" ON abandoned_cart_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM abandoned_carts
      WHERE id = cart_id AND user_id = auth.uid()
    )
  );

-- Marketing campaigns - Only admins can manage
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage marketing campaigns" ON marketing_campaigns;
CREATE POLICY "Admins can manage marketing campaigns" ON marketing_campaigns
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Campaign sends - Users can see their own sends, admins can see all
ALTER TABLE marketing_campaign_sends ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own campaign sends" ON marketing_campaign_sends;
CREATE POLICY "Users can view their own campaign sends" ON marketing_campaign_sends
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can manage all campaign sends" ON marketing_campaign_sends;
CREATE POLICY "Admins can manage all campaign sends" ON marketing_campaign_sends
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Recommendation analytics - Users can see their own, admins can see all
ALTER TABLE recommendation_analytics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own recommendation analytics" ON recommendation_analytics;
CREATE POLICY "Users can view their own recommendation analytics" ON recommendation_analytics
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can manage all recommendation analytics" ON recommendation_analytics;
CREATE POLICY "Admins can manage all recommendation analytics" ON recommendation_analytics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to check if campaign was already sent to user today
CREATE OR REPLACE FUNCTION can_send_campaign_today(
  p_user_id UUID,
  p_campaign_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM marketing_campaign_sends
    WHERE user_id = p_user_id
    AND campaign_id = p_campaign_id
    AND DATE(sent_at) = CURRENT_DATE
  );
END;
$$;

-- Function to update segment user counts
CREATE OR REPLACE FUNCTION update_segment_user_count(segment_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_count INTEGER;
BEGIN
  -- This is a placeholder - actual implementation would depend on segment criteria
  -- For now, just count users who have logged in recently
  SELECT COUNT(DISTINCT user_id)::INTEGER INTO user_count
  FROM user_behavior_events
  WHERE event_type = 'page_view'
  AND timestamp > NOW() - INTERVAL '30 days';

  UPDATE user_segments
  SET user_count = user_count, last_updated = NOW()
  WHERE id = segment_id;

  RETURN user_count;
END;
$$;

-- Function to get marketing campaign stats
CREATE OR REPLACE FUNCTION get_marketing_campaign_stats(timeframe TEXT DEFAULT '30d')
RETURNS TABLE (
  total_campaigns BIGINT,
  active_campaigns BIGINT,
  total_sends BIGINT,
  total_opens BIGINT,
  total_clicks BIGINT,
  total_conversions BIGINT,
  total_revenue DECIMAL,
  average_open_rate DECIMAL,
  average_click_rate DECIMAL,
  average_conversion_rate DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  start_date TIMESTAMPTZ;
BEGIN
  -- Calculate start date based on timeframe
  CASE timeframe
    WHEN '7d' THEN start_date := NOW() - INTERVAL '7 days';
    WHEN '30d' THEN start_date := NOW() - INTERVAL '30 days';
    WHEN '90d' THEN start_date := NOW() - INTERVAL '90 days';
    ELSE start_date := NOW() - INTERVAL '30 days';
  END CASE;

  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM marketing_campaigns) as total_campaigns,
    (SELECT COUNT(*) FROM marketing_campaigns WHERE is_active = true) as active_campaigns,
    (SELECT COUNT(*) FROM marketing_campaign_sends WHERE sent_at >= start_date) as total_sends,
    COALESCE((SELECT SUM(open_count) FROM campaign_performance), 0) as total_opens,
    COALESCE((SELECT SUM(click_count) FROM campaign_performance), 0) as total_clicks,
    COALESCE((SELECT SUM(conversion_count) FROM campaign_performance), 0) as total_conversions,
    COALESCE((SELECT SUM(revenue_generated) FROM campaign_performance), 0) as total_revenue,
    CASE
      WHEN (SELECT COUNT(*) FROM marketing_campaign_sends WHERE sent_at >= start_date) > 0
      THEN ROUND(
        (COALESCE((SELECT SUM(open_count) FROM campaign_performance), 0)::DECIMAL /
         (SELECT COUNT(*) FROM marketing_campaign_sends WHERE sent_at >= start_date)::DECIMAL) * 100, 2
      )
      ELSE 0
    END as average_open_rate,
    CASE
      WHEN COALESCE((SELECT SUM(open_count) FROM campaign_performance), 0) > 0
      THEN ROUND(
        (COALESCE((SELECT SUM(click_count) FROM campaign_performance), 0)::DECIMAL /
         COALESCE((SELECT SUM(open_count) FROM campaign_performance), 0)::DECIMAL) * 100, 2
      )
      ELSE 0
    END as average_click_rate,
    CASE
      WHEN (SELECT COUNT(*) FROM marketing_campaign_sends WHERE sent_at >= start_date) > 0
      THEN ROUND(
        (COALESCE((SELECT SUM(conversion_count) FROM campaign_performance), 0)::DECIMAL /
         (SELECT COUNT(*) FROM marketing_campaign_sends WHERE sent_at >= start_date)::DECIMAL) * 100, 2
      )
      ELSE 0
    END as average_conversion_rate;
END;
$$;

-- Function to get behavioral analytics summary
CREATE OR REPLACE FUNCTION get_behavioral_analytics_summary(timeframe TEXT DEFAULT '30d')
RETURNS TABLE (
  date DATE,
  page_views BIGINT,
  product_views BIGINT,
  cart_adds BIGINT,
  purchases BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  start_date TIMESTAMPTZ;
BEGIN
  -- Calculate start date based on timeframe
  CASE timeframe
    WHEN '7d' THEN start_date := NOW() - INTERVAL '7 days';
    WHEN '30d' THEN start_date := NOW() - INTERVAL '30 days';
    WHEN '90d' THEN start_date := NOW() - INTERVAL '90 days';
    ELSE start_date := NOW() - INTERVAL '30 days';
  END CASE;

  RETURN QUERY
  SELECT
    DATE(timestamp) as date,
    COUNT(*) FILTER (WHERE event_type = 'page_view') as page_views,
    COUNT(*) FILTER (WHERE event_type = 'product_view') as product_views,
    COUNT(*) FILTER (WHERE event_type = 'cart_add') as cart_adds,
    COUNT(*) FILTER (WHERE event_type = 'purchase_complete') as purchases
  FROM user_behavior_events
  WHERE timestamp >= start_date
  GROUP BY DATE(timestamp)
  ORDER BY date DESC;
END;
$$;

-- Function to record recommendation clicks
CREATE OR REPLACE FUNCTION record_recommendation_click(
  p_user_id UUID,
  p_product_id UUID,
  p_recommended_product_id UUID,
  p_reason TEXT,
  p_score DECIMAL,
  p_confidence DECIMAL,
  p_position INTEGER
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  record_id UUID;
BEGIN
  INSERT INTO recommendation_analytics (
    user_id,
    product_id,
    recommended_product_id,
    reason,
    score,
    confidence,
    position,
    clicked,
    date
  ) VALUES (
    p_user_id,
    p_product_id,
    p_recommended_product_id,
    p_reason,
    p_score,
    p_confidence,
    p_position,
    TRUE,
    CURRENT_DATE
  )
  ON CONFLICT (user_id, recommended_product_id, date)
  DO UPDATE SET
    clicked = TRUE,
    position = EXCLUDED.position
  RETURNING id INTO record_id;

  RETURN record_id;
END;
$$;

-- =====================================================
-- SAMPLE DATA INSERTION
-- =====================================================

-- Insert sample marketing campaigns
INSERT INTO marketing_campaigns (name, type, trigger, conditions, is_active, priority, cooldown_hours, max_sends_per_user) VALUES
('Bienvenue - Premier achat', 'email', 'behavioral', '{"event_types": ["purchase_complete"], "min_amount": 0}', true, 10, 168, 1),
('Panier abandonné - Récupération', 'email', 'behavioral', '{"event_types": ["cart_add"], "time_since_last_activity": 3600}', true, 9, 24, 3),
('Réengagement - Inactif 7 jours', 'push', 'time_based', '{"days_inactive": 7}', true, 5, 168, 2),
('Produit similaire - Après achat', 'in_app', 'behavioral', '{"event_types": ["purchase_complete"]}', true, 7, 24, 5),
('Promotion spéciale - Anniversaire', 'email', 'time_based', '{"account_age_days": 365}', true, 8, 8760, 1)
ON CONFLICT DO NOTHING;

-- Insert sample user segments
INSERT INTO user_segments (name, criteria, user_count) VALUES
('Clients Premium', '{"min_total_purchases": 100000, "account_age_days": 180}', 0),
('Acheteurs Fréquents', '{"purchases_last_30_days": 3}', 0),
('Visiteurs Récents', '{"last_visit_days": 7}', 0),
('Panier Abandonné', '{"has_abandoned_cart": true}', 0),
('Nouveaux Clients', '{"account_age_days": 30}', 0)
ON CONFLICT DO NOTHING;

-- =====================================================
-- UPDATE TRIGGERS
-- =====================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_abandoned_carts_updated_at
    BEFORE UPDATE ON abandoned_carts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketing_campaigns_updated_at
    BEFORE UPDATE ON marketing_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- NOTIFICATIONS FOR REAL-TIME UPDATES
-- =====================================================

-- Function to notify on new behavior events (for real-time processing)
CREATE OR REPLACE FUNCTION notify_behavior_event()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('behavior_event', json_build_object(
    'user_id', NEW.user_id,
    'event_type', NEW.event_type,
    'event_data', NEW.event_data,
    'timestamp', NEW.timestamp
  )::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_behavior_event_trigger
  AFTER INSERT ON user_behavior_events
  FOR EACH ROW EXECUTE FUNCTION notify_behavior_event();

-- =====================================================
-- CLEANUP FUNCTIONS
-- =====================================================

-- Function to clean up old behavior events (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_behavior_events()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM user_behavior_events
  WHERE timestamp < NOW() - INTERVAL '90 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Function to clean up old abandoned carts (keep last 180 days)
CREATE OR REPLACE FUNCTION cleanup_old_abandoned_carts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM abandoned_carts
  WHERE abandoned_at < NOW() - INTERVAL '180 days'
  AND recovered_at IS NULL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;