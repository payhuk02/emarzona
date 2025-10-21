-- Migration pour créer les tables d'analytics de produits
-- Payhuk - Système d'analytics dynamique et en temps réel

-- Table principale pour les analytics de produits
CREATE TABLE IF NOT EXISTS public.product_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  -- Métriques principales
  total_views INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  total_revenue NUMERIC DEFAULT 0,
  
  -- Métriques calculées
  conversion_rate NUMERIC DEFAULT 0,
  bounce_rate NUMERIC DEFAULT 0,
  avg_session_duration INTEGER DEFAULT 0, -- en secondes
  returning_visitors INTEGER DEFAULT 0,
  
  -- Métriques temporelles
  views_today INTEGER DEFAULT 0,
  clicks_today INTEGER DEFAULT 0,
  conversions_today INTEGER DEFAULT 0,
  revenue_today NUMERIC DEFAULT 0,
  
  -- Métriques de comparaison
  views_yesterday INTEGER DEFAULT 0,
  clicks_yesterday INTEGER DEFAULT 0,
  conversions_yesterday INTEGER DEFAULT 0,
  revenue_yesterday NUMERIC DEFAULT 0,
  
  -- Configuration du tracking
  tracking_enabled BOOLEAN DEFAULT true,
  track_views BOOLEAN DEFAULT true,
  track_clicks BOOLEAN DEFAULT true,
  track_conversions BOOLEAN DEFAULT true,
  track_time_spent BOOLEAN DEFAULT true,
  track_errors BOOLEAN DEFAULT true,
  advanced_tracking BOOLEAN DEFAULT false,
  custom_events TEXT[] DEFAULT '{}',
  
  -- Intégrations externes
  google_analytics_id TEXT,
  facebook_pixel_id TEXT,
  google_tag_manager_id TEXT,
  tiktok_pixel_id TEXT,
  pinterest_pixel_id TEXT,
  linkedin_insight_tag TEXT,
  
  -- Objectifs et alertes
  goal_views INTEGER,
  goal_revenue NUMERIC,
  goal_conversions INTEGER,
  goal_conversion_rate NUMERIC,
  email_alerts BOOLEAN DEFAULT false,
  
  -- Métadonnées
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table pour les événements d'analytics détaillés
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Type d'événement
  event_type TEXT NOT NULL CHECK (event_type IN (
    'view', 'click', 'conversion', 'purchase', 'session_start', 
    'session_end', 'error', 'custom'
  )),
  
  -- Données de l'événement
  event_data JSONB DEFAULT '{}',
  session_id TEXT,
  page_url TEXT,
  referrer TEXT,
  
  -- Informations techniques
  user_agent TEXT,
  ip_address INET,
  country TEXT,
  city TEXT,
  device_type TEXT, -- mobile, tablet, desktop
  browser TEXT,
  os TEXT,
  
  -- Métriques spécifiques
  duration INTEGER, -- durée en secondes pour les sessions
  revenue NUMERIC, -- revenu généré par cet événement
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table pour les sessions utilisateur
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL UNIQUE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Informations de session
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration INTEGER DEFAULT 0, -- en secondes
  page_views INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  
  -- Informations géographiques
  country TEXT,
  city TEXT,
  ip_address INET,
  
  -- Informations techniques
  user_agent TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  
  -- Métadonnées
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table pour les rapports générés
CREATE TABLE IF NOT EXISTS public.analytics_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Type de rapport
  report_type TEXT NOT NULL CHECK (report_type IN ('daily', 'weekly', 'monthly', 'custom')),
  report_format TEXT NOT NULL CHECK (report_format IN ('pdf', 'csv', 'xlsx', 'json')),
  
  -- Paramètres du rapport
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  include_charts BOOLEAN DEFAULT true,
  
  -- Données du rapport
  report_data JSONB DEFAULT '{}',
  file_url TEXT,
  file_size INTEGER,
  
  -- Statut
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
  error_message TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_product_analytics_product_id ON public.product_analytics(product_id);
CREATE INDEX IF NOT EXISTS idx_product_analytics_store_id ON public.product_analytics(store_id);
CREATE INDEX IF NOT EXISTS idx_product_analytics_last_updated ON public.product_analytics(last_updated);

CREATE INDEX IF NOT EXISTS idx_analytics_events_product_id ON public.analytics_events(product_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON public.analytics_events(session_id);

CREATE INDEX IF NOT EXISTS idx_user_sessions_product_id ON public.user_sessions(product_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON public.user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_start_time ON public.user_sessions(start_time);

CREATE INDEX IF NOT EXISTS idx_analytics_reports_product_id ON public.analytics_reports(product_id);
CREATE INDEX IF NOT EXISTS idx_analytics_reports_user_id ON public.analytics_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_reports_status ON public.analytics_reports(status);

-- Activer RLS sur toutes les tables
ALTER TABLE public.product_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_reports ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour product_analytics
CREATE POLICY "Users can view analytics for their own products"
  ON public.product_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products p 
      WHERE p.id = product_analytics.product_id 
      AND p.store_id IN (
        SELECT id FROM public.stores WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update analytics for their own products"
  ON public.product_analytics FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.products p 
      WHERE p.id = product_analytics.product_id 
      AND p.store_id IN (
        SELECT id FROM public.stores WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "System can insert analytics for products"
  ON public.product_analytics FOR INSERT
  WITH CHECK (true);

-- Politiques RLS pour analytics_events
CREATE POLICY "Users can view events for their own products"
  ON public.analytics_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products p 
      WHERE p.id = analytics_events.product_id 
      AND p.store_id IN (
        SELECT id FROM public.stores WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Anyone can insert analytics events"
  ON public.analytics_events FOR INSERT
  WITH CHECK (true);

-- Politiques RLS pour user_sessions
CREATE POLICY "Users can view sessions for their own products"
  ON public.user_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products p 
      WHERE p.id = user_sessions.product_id 
      AND p.store_id IN (
        SELECT id FROM public.stores WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "System can manage user sessions"
  ON public.user_sessions FOR ALL
  WITH CHECK (true);

-- Politiques RLS pour analytics_reports
CREATE POLICY "Users can manage their own reports"
  ON public.analytics_reports FOR ALL
  USING (auth.uid() = user_id);

-- Fonction pour mettre à jour les analytics automatiquement
CREATE OR REPLACE FUNCTION update_product_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour les métriques dans product_analytics
  INSERT INTO public.product_analytics (
    product_id, store_id,
    total_views, total_clicks, total_conversions, total_revenue,
    views_today, clicks_today, conversions_today, revenue_today,
    last_updated
  )
  VALUES (
    NEW.product_id,
    (SELECT store_id FROM public.products WHERE id = NEW.product_id),
    CASE WHEN NEW.event_type = 'view' THEN 1 ELSE 0 END,
    CASE WHEN NEW.event_type = 'click' THEN 1 ELSE 0 END,
    CASE WHEN NEW.event_type = 'conversion' THEN 1 ELSE 0 END,
    COALESCE(NEW.revenue, 0),
    CASE WHEN NEW.event_type = 'view' AND DATE(NEW.created_at) = CURRENT_DATE THEN 1 ELSE 0 END,
    CASE WHEN NEW.event_type = 'click' AND DATE(NEW.created_at) = CURRENT_DATE THEN 1 ELSE 0 END,
    CASE WHEN NEW.event_type = 'conversion' AND DATE(NEW.created_at) = CURRENT_DATE THEN 1 ELSE 0 END,
    CASE WHEN NEW.event_type = 'conversion' AND DATE(NEW.created_at) = CURRENT_DATE THEN COALESCE(NEW.revenue, 0) ELSE 0 END,
    now()
  )
  ON CONFLICT (product_id) DO UPDATE SET
    total_views = product_analytics.total_views + CASE WHEN NEW.event_type = 'view' THEN 1 ELSE 0 END,
    total_clicks = product_analytics.total_clicks + CASE WHEN NEW.event_type = 'click' THEN 1 ELSE 0 END,
    total_conversions = product_analytics.total_conversions + CASE WHEN NEW.event_type = 'conversion' THEN 1 ELSE 0 END,
    total_revenue = product_analytics.total_revenue + COALESCE(NEW.revenue, 0),
    views_today = product_analytics.views_today + CASE WHEN NEW.event_type = 'view' AND DATE(NEW.created_at) = CURRENT_DATE THEN 1 ELSE 0 END,
    clicks_today = product_analytics.clicks_today + CASE WHEN NEW.event_type = 'click' AND DATE(NEW.created_at) = CURRENT_DATE THEN 1 ELSE 0 END,
    conversions_today = product_analytics.conversions_today + CASE WHEN NEW.event_type = 'conversion' AND DATE(NEW.created_at) = CURRENT_DATE THEN 1 ELSE 0 END,
    revenue_today = product_analytics.revenue_today + CASE WHEN NEW.event_type = 'conversion' AND DATE(NEW.created_at) = CURRENT_DATE THEN COALESCE(NEW.revenue, 0) ELSE 0 END,
    conversion_rate = CASE 
      WHEN (product_analytics.total_clicks + CASE WHEN NEW.event_type = 'click' THEN 1 ELSE 0 END) > 0 
      THEN ((product_analytics.total_conversions + CASE WHEN NEW.event_type = 'conversion' THEN 1 ELSE 0 END)::NUMERIC / (product_analytics.total_clicks + CASE WHEN NEW.event_type = 'click' THEN 1 ELSE 0 END)::NUMERIC) * 100
      ELSE 0 
    END,
    last_updated = now(),
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour automatiquement les analytics
CREATE TRIGGER trigger_update_product_analytics
  AFTER INSERT ON public.analytics_events
  FOR EACH ROW
  EXECUTE FUNCTION update_product_analytics();

-- Fonction pour calculer les métriques de comparaison quotidienne
CREATE OR REPLACE FUNCTION calculate_daily_comparison()
RETURNS void AS $$
BEGIN
  UPDATE public.product_analytics 
  SET 
    views_yesterday = (
      SELECT COUNT(*) FROM public.analytics_events 
      WHERE product_id = product_analytics.product_id 
      AND event_type = 'view' 
      AND DATE(created_at) = CURRENT_DATE - INTERVAL '1 day'
    ),
    clicks_yesterday = (
      SELECT COUNT(*) FROM public.analytics_events 
      WHERE product_id = product_analytics.product_id 
      AND event_type = 'click' 
      AND DATE(created_at) = CURRENT_DATE - INTERVAL '1 day'
    ),
    conversions_yesterday = (
      SELECT COUNT(*) FROM public.analytics_events 
      WHERE product_id = product_analytics.product_id 
      AND event_type = 'conversion' 
      AND DATE(created_at) = CURRENT_DATE - INTERVAL '1 day'
    ),
    revenue_yesterday = (
      SELECT COALESCE(SUM(revenue), 0) FROM public.analytics_events 
      WHERE product_id = product_analytics.product_id 
      AND event_type = 'conversion' 
      AND DATE(created_at) = CURRENT_DATE - INTERVAL '1 day'
    ),
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Fonction pour initialiser les analytics d'un produit
CREATE OR REPLACE FUNCTION initialize_product_analytics(p_product_id UUID)
RETURNS void AS $$
DECLARE
  v_store_id UUID;
BEGIN
  -- Récupérer le store_id du produit
  SELECT store_id INTO v_store_id FROM public.products WHERE id = p_product_id;
  
  -- Insérer une entrée vide pour le produit
  INSERT INTO public.product_analytics (
    product_id, store_id,
    total_views, total_clicks, total_conversions, total_revenue,
    conversion_rate, bounce_rate, avg_session_duration, returning_visitors,
    views_today, clicks_today, conversions_today, revenue_today,
    views_yesterday, clicks_yesterday, conversions_yesterday, revenue_yesterday,
    tracking_enabled, track_views, track_clicks, track_conversions, track_time_spent, track_errors,
    advanced_tracking, custom_events, email_alerts,
    created_at, updated_at
  )
  VALUES (
    p_product_id, v_store_id,
    0, 0, 0, 0,
    0, 0, 0, 0,
    0, 0, 0, 0,
    0, 0, 0, 0,
    true, true, true, true, true, true,
    false, '{}', false,
    now(), now()
  )
  ON CONFLICT (product_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Commentaires pour la documentation
COMMENT ON TABLE public.product_analytics IS 'Table principale pour les métriques d''analytics des produits';
COMMENT ON TABLE public.analytics_events IS 'Table pour stocker tous les événements d''analytics détaillés';
COMMENT ON TABLE public.user_sessions IS 'Table pour suivre les sessions utilisateur sur les produits';
COMMENT ON TABLE public.analytics_reports IS 'Table pour stocker les rapports générés';

COMMENT ON FUNCTION update_product_analytics() IS 'Fonction trigger pour mettre à jour automatiquement les métriques d''analytics';
COMMENT ON FUNCTION calculate_daily_comparison() IS 'Fonction pour calculer les comparaisons quotidiennes';
COMMENT ON FUNCTION initialize_product_analytics(UUID) IS 'Fonction pour initialiser les analytics d''un nouveau produit';
