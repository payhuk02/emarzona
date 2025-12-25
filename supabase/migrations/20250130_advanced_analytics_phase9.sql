-- =====================================================
-- ADVANCED ANALYTICS - Phase 9
-- Date: 2025-01-30
-- Description: Système d'analytics avancé avec dashboards, métriques avancées, et monitoring
-- =====================================================

-- =====================================================
-- 1. TABLE: advanced_analytics_dashboards
-- =====================================================

CREATE TABLE IF NOT EXISTS public.advanced_analytics_dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Dashboard info
  name TEXT NOT NULL,
  description TEXT,
  layout JSONB DEFAULT '{}'::jsonb, -- Layout personnalisé (grid, widgets, etc.)
  
  -- Configuration
  is_default BOOLEAN DEFAULT FALSE,
  is_shared BOOLEAN DEFAULT FALSE,
  shared_with_users UUID[], -- Liste des utilisateurs avec accès
  
  -- Widgets configuration
  widgets JSONB DEFAULT '[]'::jsonb, -- Configuration des widgets
  
  -- Display settings
  refresh_interval INTEGER DEFAULT 60, -- Secondes
  auto_refresh BOOLEAN DEFAULT TRUE,
  date_range_type TEXT CHECK (date_range_type IN ('today', 'yesterday', 'last_7_days', 'last_30_days', 'last_90_days', 'this_month', 'last_month', 'this_year', 'custom')) DEFAULT 'last_7_days',
  date_range_start DATE,
  date_range_end DATE,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_advanced_dashboards_store_id ON public.advanced_analytics_dashboards(store_id);
CREATE INDEX IF NOT EXISTS idx_advanced_dashboards_user_id ON public.advanced_analytics_dashboards(user_id);
CREATE INDEX IF NOT EXISTS idx_advanced_dashboards_is_default ON public.advanced_analytics_dashboards(is_default);

-- =====================================================
-- 2. TABLE: analytics_metrics
-- =====================================================

CREATE TABLE IF NOT EXISTS public.analytics_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  
  -- Period
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('hourly', 'daily', 'weekly', 'monthly', 'yearly')) DEFAULT 'daily',
  
  -- Sales metrics
  total_views INTEGER DEFAULT 0,
  unique_views INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  unique_clicks INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  unique_conversions INTEGER DEFAULT 0,
  total_revenue NUMERIC(10, 2) DEFAULT 0,
  average_order_value NUMERIC(10, 2) DEFAULT 0,
  
  -- Engagement metrics
  bounce_rate NUMERIC(5, 2) DEFAULT 0, -- Percentage
  avg_session_duration INTEGER DEFAULT 0, -- Seconds
  pages_per_session NUMERIC(5, 2) DEFAULT 0,
  returning_visitors INTEGER DEFAULT 0,
  new_visitors INTEGER DEFAULT 0,
  
  -- Conversion metrics
  conversion_rate NUMERIC(5, 2) DEFAULT 0, -- Percentage
  click_through_rate NUMERIC(5, 2) DEFAULT 0, -- Percentage
  cart_abandonment_rate NUMERIC(5, 2) DEFAULT 0, -- Percentage
  
  -- Performance metrics
  avg_page_load_time NUMERIC(10, 2) DEFAULT 0, -- Milliseconds
  avg_time_to_first_byte NUMERIC(10, 2) DEFAULT 0, -- Milliseconds
  error_rate NUMERIC(5, 2) DEFAULT 0, -- Percentage
  
  -- Device metrics
  desktop_views INTEGER DEFAULT 0,
  mobile_views INTEGER DEFAULT 0,
  tablet_views INTEGER DEFAULT 0,
  
  -- Traffic source metrics
  organic_search INTEGER DEFAULT 0,
  direct_traffic INTEGER DEFAULT 0,
  referral_traffic INTEGER DEFAULT 0,
  social_traffic INTEGER DEFAULT 0,
  paid_search INTEGER DEFAULT 0,
  email_traffic INTEGER DEFAULT 0,
  
  -- Geographic metrics
  country_breakdown JSONB DEFAULT '{}'::jsonb, -- {country_code: views}
  city_breakdown JSONB DEFAULT '{}'::jsonb, -- {city: views}
  
  -- Calculated at
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(store_id, product_id, period_start, period_end, period_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_store_id ON public.analytics_metrics(store_id);
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_product_id ON public.analytics_metrics(product_id);
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_period ON public.analytics_metrics(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_period_type ON public.analytics_metrics(period_type);

-- =====================================================
-- 3. TABLE: performance_monitoring
-- =====================================================

CREATE TABLE IF NOT EXISTS public.performance_monitoring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  
  -- Monitoring info
  metric_name TEXT NOT NULL,
  metric_value NUMERIC(10, 2) NOT NULL,
  metric_unit TEXT, -- 'ms', 's', 'bytes', 'percentage', etc.
  metric_type TEXT NOT NULL CHECK (metric_type IN (
    'page_load',
    'api_response',
    'database_query',
    'image_load',
    'script_execution',
    'network_request',
    'custom'
  )),
  
  -- Context
  page_url TEXT,
  api_endpoint TEXT,
  user_agent TEXT,
  device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet', 'unknown')),
  browser TEXT,
  os TEXT,
  
  -- Performance thresholds
  threshold_warning NUMERIC(10, 2),
  threshold_critical NUMERIC(10, 2),
  is_above_threshold BOOLEAN DEFAULT FALSE,
  
  -- Timestamp
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_performance_monitoring_store_id ON public.performance_monitoring(store_id);
CREATE INDEX IF NOT EXISTS idx_performance_monitoring_product_id ON public.performance_monitoring(product_id);
CREATE INDEX IF NOT EXISTS idx_performance_monitoring_metric_name ON public.performance_monitoring(metric_name);
CREATE INDEX IF NOT EXISTS idx_performance_monitoring_recorded_at ON public.performance_monitoring(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_monitoring_is_above_threshold ON public.performance_monitoring(is_above_threshold);

-- =====================================================
-- 4. TABLE: analytics_alerts
-- =====================================================

CREATE TABLE IF NOT EXISTS public.analytics_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Alert info
  name TEXT NOT NULL,
  description TEXT,
  alert_type TEXT NOT NULL CHECK (alert_type IN (
    'metric_threshold',
    'anomaly_detection',
    'goal_achievement',
    'goal_missed',
    'performance_issue',
    'custom'
  )),
  
  -- Conditions
  metric_name TEXT NOT NULL,
  condition_type TEXT NOT NULL CHECK (condition_type IN ('greater_than', 'less_than', 'equals', 'not_equals', 'percentage_change')),
  threshold_value NUMERIC(10, 2) NOT NULL,
  comparison_period TEXT CHECK (comparison_period IN ('previous_period', 'same_period_last_year', 'custom')),
  
  -- Notification settings
  email_enabled BOOLEAN DEFAULT TRUE,
  push_enabled BOOLEAN DEFAULT FALSE,
  webhook_url TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_triggered_at TIMESTAMPTZ,
  trigger_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_analytics_alerts_store_id ON public.analytics_alerts(store_id);
CREATE INDEX IF NOT EXISTS idx_analytics_alerts_user_id ON public.analytics_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_alerts_is_active ON public.analytics_alerts(is_active);

-- =====================================================
-- 5. TABLE: analytics_goals
-- =====================================================

CREATE TABLE IF NOT EXISTS public.analytics_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Goal info
  name TEXT NOT NULL,
  description TEXT,
  goal_type TEXT NOT NULL CHECK (goal_type IN (
    'revenue',
    'conversions',
    'views',
    'clicks',
    'conversion_rate',
    'custom'
  )),
  
  -- Target
  target_value NUMERIC(10, 2) NOT NULL,
  current_value NUMERIC(10, 2) DEFAULT 0,
  progress_percentage NUMERIC(5, 2) DEFAULT 0,
  
  -- Period
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'yearly')) DEFAULT 'monthly',
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Status
  status TEXT NOT NULL CHECK (status IN ('active', 'achieved', 'missed', 'cancelled')) DEFAULT 'active',
  achieved_at TIMESTAMPTZ,
  
  -- Notifications
  notify_on_achievement BOOLEAN DEFAULT TRUE,
  notify_on_missed BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_analytics_goals_store_id ON public.analytics_goals(store_id);
CREATE INDEX IF NOT EXISTS idx_analytics_goals_user_id ON public.analytics_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_goals_status ON public.analytics_goals(status);
CREATE INDEX IF NOT EXISTS idx_analytics_goals_period ON public.analytics_goals(period_start, period_end);

-- =====================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE public.advanced_analytics_dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_goals ENABLE ROW LEVEL SECURITY;

-- Policies: advanced_analytics_dashboards
DROP POLICY IF EXISTS "users_view_own_dashboards" ON public.advanced_analytics_dashboards;
CREATE POLICY "users_view_own_dashboards" ON public.advanced_analytics_dashboards
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    auth.uid() = ANY(shared_with_users) OR
    (is_shared = TRUE AND EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = advanced_analytics_dashboards.store_id
        AND s.user_id = auth.uid()
    ))
  );

DROP POLICY IF EXISTS "users_manage_own_dashboards" ON public.advanced_analytics_dashboards;
CREATE POLICY "users_manage_own_dashboards" ON public.advanced_analytics_dashboards
  FOR ALL
  USING (user_id = auth.uid());

-- Policies: analytics_metrics
DROP POLICY IF EXISTS "store_owners_view_metrics" ON public.analytics_metrics;
CREATE POLICY "store_owners_view_metrics" ON public.analytics_metrics
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = analytics_metrics.store_id
        AND s.user_id = auth.uid()
    )
  );

-- Policies: performance_monitoring
DROP POLICY IF EXISTS "store_owners_view_performance" ON public.performance_monitoring;
CREATE POLICY "store_owners_view_performance" ON public.performance_monitoring
  FOR SELECT
  USING (
    store_id IS NULL OR EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = performance_monitoring.store_id
        AND s.user_id = auth.uid()
    )
  );

-- Policies: analytics_alerts
DROP POLICY IF EXISTS "users_view_own_alerts" ON public.analytics_alerts;
CREATE POLICY "users_view_own_alerts" ON public.analytics_alerts
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "users_manage_own_alerts" ON public.analytics_alerts;
CREATE POLICY "users_manage_own_alerts" ON public.analytics_alerts
  FOR ALL
  USING (user_id = auth.uid());

-- Policies: analytics_goals
DROP POLICY IF EXISTS "users_view_own_goals" ON public.analytics_goals;
CREATE POLICY "users_view_own_goals" ON public.analytics_goals
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "users_manage_own_goals" ON public.analytics_goals;
CREATE POLICY "users_manage_own_goals" ON public.analytics_goals
  FOR ALL
  USING (user_id = auth.uid());

-- =====================================================
-- 7. FUNCTIONS
-- =====================================================

-- Function: Calculate analytics metrics for a period
CREATE OR REPLACE FUNCTION public.calculate_analytics_metrics(
  p_store_id UUID,
  p_period_start TIMESTAMPTZ,
  p_period_end TIMESTAMPTZ,
  p_product_id UUID DEFAULT NULL,
  p_period_type TEXT DEFAULT 'daily'
)
RETURNS JSON AS $$
DECLARE
  v_metrics JSON;
BEGIN
  -- Cette fonction calculera les métriques d'analytics
  -- Pour l'instant, retourne un JSON vide
  -- À implémenter avec la logique de calcul réelle
  SELECT json_build_object(
    'store_id', p_store_id,
    'product_id', p_product_id,
    'period_start', p_period_start,
    'period_end', p_period_end,
    'period_type', p_period_type
  ) INTO v_metrics;
  
  RETURN v_metrics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Check analytics alerts
CREATE OR REPLACE FUNCTION public.check_analytics_alerts(
  p_store_id UUID
)
RETURNS TABLE(
  alert_id UUID,
  alert_name TEXT,
  alert_type TEXT,
  triggered BOOLEAN
) AS $$
BEGIN
  -- Cette fonction vérifiera les alertes d'analytics
  -- Pour l'instant, retourne une table vide
  -- À implémenter avec la logique de vérification réelle
  RETURN QUERY
  SELECT
    a.id,
    a.name,
    a.alert_type,
    FALSE as triggered
  FROM public.analytics_alerts a
  WHERE a.store_id = p_store_id
    AND a.is_active = TRUE
  LIMIT 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. TRIGGERS
-- =====================================================

-- Trigger updated_at pour advanced_analytics_dashboards
CREATE TRIGGER update_advanced_dashboards_updated_at
  BEFORE UPDATE ON public.advanced_analytics_dashboards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger updated_at pour analytics_alerts
CREATE TRIGGER update_analytics_alerts_updated_at
  BEFORE UPDATE ON public.analytics_alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger updated_at pour analytics_goals
CREATE TRIGGER update_analytics_goals_updated_at
  BEFORE UPDATE ON public.analytics_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 9. COMMENTS
-- =====================================================

COMMENT ON TABLE public.advanced_analytics_dashboards IS 'Dashboards d''analytics personnalisables';
COMMENT ON TABLE public.analytics_metrics IS 'Métriques d''analytics agrégées par période';
COMMENT ON TABLE public.performance_monitoring IS 'Monitoring des performances (temps de chargement, etc.)';
COMMENT ON TABLE public.analytics_alerts IS 'Alertes d''analytics configurées par l''utilisateur';
COMMENT ON TABLE public.analytics_goals IS 'Objectifs d''analytics avec suivi de progression';

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================

