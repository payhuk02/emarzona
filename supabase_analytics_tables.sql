-- ============================================================
-- Script SQL pour créer les tables Analytics dans Supabase
-- Payhuk - Système de tracking des boutiques
-- ============================================================

-- ==================== TABLE : store_analytics_events ====================

-- Table des événements analytics bruts
CREATE TABLE IF NOT EXISTS public.store_analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_agent TEXT,
  referrer TEXT,
  device_type TEXT CHECK (device_type IN ('mobile', 'tablet', 'desktop')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contrainte pour valider les types d'événements
  CONSTRAINT valid_event_type CHECK (event_type IN (
    'page_view',
    'store_view',
    'product_view',
    'product_click',
    'add_to_cart',
    'checkout_initiated',
    'purchase',
    'share',
    'search'
  ))
);

-- Index pour optimiser les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_analytics_events_store_id 
  ON public.store_analytics_events(store_id);

CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at 
  ON public.store_analytics_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type 
  ON public.store_analytics_events(event_type);

CREATE INDEX IF NOT EXISTS idx_analytics_events_session 
  ON public.store_analytics_events(session_id);

-- Index composite pour les requêtes complexes
CREATE INDEX IF NOT EXISTS idx_analytics_events_store_date 
  ON public.store_analytics_events(store_id, created_at DESC);

-- Commentaires
COMMENT ON TABLE public.store_analytics_events IS 
  'Stocke tous les événements analytics des boutiques (vues, clics, conversions)';

COMMENT ON COLUMN public.store_analytics_events.event_data IS 
  'Données additionnelles de l''événement au format JSON';

COMMENT ON COLUMN public.store_analytics_events.session_id IS 
  'ID unique de session utilisateur (30 min de durée)';


-- ==================== TABLE : store_daily_stats ====================

-- Table des statistiques quotidiennes agrégées
CREATE TABLE IF NOT EXISTS public.store_daily_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Métriques principales
  total_views INT DEFAULT 0 CHECK (total_views >= 0),
  unique_visitors INT DEFAULT 0 CHECK (unique_visitors >= 0),
  product_views INT DEFAULT 0 CHECK (product_views >= 0),
  product_clicks INT DEFAULT 0 CHECK (product_clicks >= 0),
  add_to_cart_count INT DEFAULT 0 CHECK (add_to_cart_count >= 0),
  checkout_initiated_count INT DEFAULT 0 CHECK (checkout_initiated_count >= 0),
  purchases_count INT DEFAULT 0 CHECK (purchases_count >= 0),
  revenue_amount DECIMAL(12, 2) DEFAULT 0 CHECK (revenue_amount >= 0),
  
  -- Métriques par device
  mobile_views INT DEFAULT 0 CHECK (mobile_views >= 0),
  tablet_views INT DEFAULT 0 CHECK (tablet_views >= 0),
  desktop_views INT DEFAULT 0 CHECK (desktop_views >= 0),
  
  -- Métriques de sources de trafic
  direct_traffic INT DEFAULT 0 CHECK (direct_traffic >= 0),
  social_traffic INT DEFAULT 0 CHECK (social_traffic >= 0),
  search_traffic INT DEFAULT 0 CHECK (search_traffic >= 0),
  referral_traffic INT DEFAULT 0 CHECK (referral_traffic >= 0),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contrainte d'unicité : une seule ligne par boutique par jour
  CONSTRAINT unique_store_date UNIQUE (store_id, date)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_daily_stats_store_id 
  ON public.store_daily_stats(store_id);

CREATE INDEX IF NOT EXISTS idx_daily_stats_date 
  ON public.store_daily_stats(date DESC);

CREATE INDEX IF NOT EXISTS idx_daily_stats_store_date 
  ON public.store_daily_stats(store_id, date DESC);

-- Commentaires
COMMENT ON TABLE public.store_daily_stats IS 
  'Statistiques quotidiennes agrégées pour optimiser les requêtes analytics';


-- ==================== POLITIQUES RLS ====================

-- Activer RLS sur les deux tables
ALTER TABLE public.store_analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_daily_stats ENABLE ROW LEVEL SECURITY;

-- ===== Politiques pour store_analytics_events =====

-- Les propriétaires de boutique peuvent voir leurs analytics
DROP POLICY IF EXISTS "Propriétaires peuvent voir leurs analytics" 
  ON public.store_analytics_events;

CREATE POLICY "Propriétaires peuvent voir leurs analytics"
ON public.store_analytics_events
FOR SELECT
TO authenticated
USING (
  store_id IN (
    SELECT id FROM public.stores WHERE user_id = auth.uid()
  )
);

-- Tout le monde peut créer des événements (tracking public des visiteurs)
DROP POLICY IF EXISTS "Tout le monde peut créer des événements" 
  ON public.store_analytics_events;

CREATE POLICY "Tout le monde peut créer des événements"
ON public.store_analytics_events
FOR INSERT
TO public
WITH CHECK (true);

-- ===== Politiques pour store_daily_stats =====

-- Les propriétaires peuvent voir leurs stats quotidiennes
DROP POLICY IF EXISTS "Propriétaires peuvent voir leurs stats quotidiennes" 
  ON public.store_daily_stats;

CREATE POLICY "Propriétaires peuvent voir leurs stats quotidiennes"
ON public.store_daily_stats
FOR SELECT
TO authenticated
USING (
  store_id IN (
    SELECT id FROM public.stores WHERE user_id = auth.uid()
  )
);

-- Seul le système peut insérer/modifier les stats (via fonctions)
DROP POLICY IF EXISTS "Système peut gérer les stats" 
  ON public.store_daily_stats;

CREATE POLICY "Système peut gérer les stats"
ON public.store_daily_stats
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);


-- ==================== FONCTION D'AGRÉGATION ====================

-- Fonction pour calculer les stats quotidiennes
CREATE OR REPLACE FUNCTION public.aggregate_daily_stats(
  target_store_id UUID,
  target_date DATE DEFAULT CURRENT_DATE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_views INT;
  v_unique_visitors INT;
  v_product_views INT;
  v_product_clicks INT;
  v_add_to_cart INT;
  v_checkout INT;
  v_purchases INT;
  v_revenue DECIMAL(12, 2);
  v_mobile INT;
  v_tablet INT;
  v_desktop INT;
  v_direct INT;
  v_social INT;
  v_search INT;
  v_referral INT;
BEGIN
  -- Calculer les métriques
  SELECT
    COUNT(*) FILTER (WHERE event_type IN ('page_view', 'store_view')) AS total_views,
    COUNT(DISTINCT session_id) AS unique_visitors,
    COUNT(*) FILTER (WHERE event_type = 'product_view') AS product_views,
    COUNT(*) FILTER (WHERE event_type = 'product_click') AS product_clicks,
    COUNT(*) FILTER (WHERE event_type = 'add_to_cart') AS add_to_cart,
    COUNT(*) FILTER (WHERE event_type = 'checkout_initiated') AS checkout,
    COUNT(*) FILTER (WHERE event_type = 'purchase') AS purchases,
    COALESCE(SUM((event_data->>'amount')::DECIMAL) FILTER (WHERE event_type = 'purchase'), 0) AS revenue,
    COUNT(*) FILTER (WHERE device_type = 'mobile') AS mobile,
    COUNT(*) FILTER (WHERE device_type = 'tablet') AS tablet,
    COUNT(*) FILTER (WHERE device_type = 'desktop') AS desktop,
    COUNT(*) FILTER (WHERE referrer = 'direct') AS direct,
    COUNT(*) FILTER (WHERE referrer IN ('facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'youtube')) AS social,
    COUNT(*) FILTER (WHERE referrer IN ('google', 'bing', 'yahoo', 'duckduckgo')) AS search,
    COUNT(*) FILTER (WHERE referrer = 'referral') AS referral
  INTO
    v_total_views, v_unique_visitors, v_product_views, v_product_clicks,
    v_add_to_cart, v_checkout, v_purchases, v_revenue,
    v_mobile, v_tablet, v_desktop,
    v_direct, v_social, v_search, v_referral
  FROM public.store_analytics_events
  WHERE store_id = target_store_id
    AND DATE(created_at) = target_date;

  -- Insérer ou mettre à jour les stats
  INSERT INTO public.store_daily_stats (
    store_id, date,
    total_views, unique_visitors, product_views, product_clicks,
    add_to_cart_count, checkout_initiated_count, purchases_count, revenue_amount,
    mobile_views, tablet_views, desktop_views,
    direct_traffic, social_traffic, search_traffic, referral_traffic
  ) VALUES (
    target_store_id, target_date,
    v_total_views, v_unique_visitors, v_product_views, v_product_clicks,
    v_add_to_cart, v_checkout, v_purchases, v_revenue,
    v_mobile, v_tablet, v_desktop,
    v_direct, v_social, v_search, v_referral
  )
  ON CONFLICT (store_id, date) DO UPDATE SET
    total_views = EXCLUDED.total_views,
    unique_visitors = EXCLUDED.unique_visitors,
    product_views = EXCLUDED.product_views,
    product_clicks = EXCLUDED.product_clicks,
    add_to_cart_count = EXCLUDED.add_to_cart_count,
    checkout_initiated_count = EXCLUDED.checkout_initiated_count,
    purchases_count = EXCLUDED.purchases_count,
    revenue_amount = EXCLUDED.revenue_amount,
    mobile_views = EXCLUDED.mobile_views,
    tablet_views = EXCLUDED.tablet_views,
    desktop_views = EXCLUDED.desktop_views,
    direct_traffic = EXCLUDED.direct_traffic,
    social_traffic = EXCLUDED.social_traffic,
    search_traffic = EXCLUDED.search_traffic,
    referral_traffic = EXCLUDED.referral_traffic,
    updated_at = NOW();
    
END;
$$;

-- Commentaire
COMMENT ON FUNCTION public.aggregate_daily_stats IS 
  'Agrège les événements analytics en statistiques quotidiennes pour une boutique donnée';


-- ==================== VUES UTILES ====================

-- Vue pour les stats des 7 derniers jours
CREATE OR REPLACE VIEW public.store_stats_last_7_days AS
SELECT
  s.id AS store_id,
  s.name AS store_name,
  SUM(ds.total_views) AS total_views_7d,
  SUM(ds.unique_visitors) AS unique_visitors_7d,
  SUM(ds.purchases_count) AS purchases_7d,
  SUM(ds.revenue_amount) AS revenue_7d
FROM public.stores s
LEFT JOIN public.store_daily_stats ds 
  ON ds.store_id = s.id
  AND ds.date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY s.id, s.name;

-- Vue pour les stats des 30 derniers jours
CREATE OR REPLACE VIEW public.store_stats_last_30_days AS
SELECT
  s.id AS store_id,
  s.name AS store_name,
  SUM(ds.total_views) AS total_views_30d,
  SUM(ds.unique_visitors) AS unique_visitors_30d,
  SUM(ds.purchases_count) AS purchases_30d,
  SUM(ds.revenue_amount) AS revenue_30d
FROM public.stores s
LEFT JOIN public.store_daily_stats ds 
  ON ds.store_id = s.id
  AND ds.date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY s.id, s.name;


-- ==================== FINALISATION ====================

-- Message de succès
DO $$
BEGIN
  RAISE NOTICE '✅ Tables analytics créées avec succès !';
  RAISE NOTICE '📊 Tables : store_analytics_events, store_daily_stats';
  RAISE NOTICE '🔒 Politiques RLS activées';
  RAISE NOTICE '⚡ Fonction aggregate_daily_stats disponible';
  RAISE NOTICE '👁️  Vues : store_stats_last_7_days, store_stats_last_30_days';
END $$;

