-- ============================================================
-- PHASE 5 : EMAIL ANALYTICS - TABLE ET FONCTIONS SQL
-- Date: 1er Février 2025
-- Description: Table d'agrégations quotidiennes et fonctions pour analytics email
-- ============================================================

-- ============================================================
-- 0. EXTEND email_logs TABLE
-- Ajouter les colonnes campaign_id et sequence_id si elles n'existent pas
-- ============================================================

-- Ajouter campaign_id si n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'email_logs' 
    AND column_name = 'campaign_id'
  ) THEN
    ALTER TABLE public.email_logs 
    ADD COLUMN campaign_id UUID REFERENCES public.email_campaigns(id) ON DELETE SET NULL;
    
    CREATE INDEX IF NOT EXISTS idx_email_logs_campaign_id 
    ON public.email_logs(campaign_id) WHERE campaign_id IS NOT NULL;
  END IF;
END $$;

-- Ajouter sequence_id si n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'email_logs' 
    AND column_name = 'sequence_id'
  ) THEN
    ALTER TABLE public.email_logs 
    ADD COLUMN sequence_id UUID REFERENCES public.email_sequences(id) ON DELETE SET NULL;
    
    CREATE INDEX IF NOT EXISTS idx_email_logs_sequence_id 
    ON public.email_logs(sequence_id) WHERE sequence_id IS NOT NULL;
  END IF;
END $$;

-- ============================================================
-- 1. TABLE: email_analytics_daily
-- Agrégations quotidiennes des métriques email
-- ============================================================

CREATE TABLE IF NOT EXISTS public.email_analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  
  -- Aggregations par type
  campaign_id UUID REFERENCES public.email_campaigns(id) ON DELETE SET NULL,
  sequence_id UUID REFERENCES public.email_sequences(id) ON DELETE SET NULL,
  template_id UUID REFERENCES public.email_templates(id) ON DELETE SET NULL,
  
  -- Métriques d'envoi
  total_sent INTEGER DEFAULT 0,
  total_delivered INTEGER DEFAULT 0,
  total_opened INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  total_bounced INTEGER DEFAULT 0,
  total_unsubscribed INTEGER DEFAULT 0,
  total_failed INTEGER DEFAULT 0,
  
  -- Taux
  delivery_rate NUMERIC(5, 2) DEFAULT 0, -- Pourcentage
  open_rate NUMERIC(5, 2) DEFAULT 0, -- Pourcentage
  click_rate NUMERIC(5, 2) DEFAULT 0, -- Pourcentage
  bounce_rate NUMERIC(5, 2) DEFAULT 0, -- Pourcentage
  unsubscribe_rate NUMERIC(5, 2) DEFAULT 0, -- Pourcentage
  click_to_open_rate NUMERIC(5, 2) DEFAULT 0, -- CTR / Open Rate
  
  -- Revenue
  revenue NUMERIC(12, 2) DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contraintes d'unicité
  UNIQUE(date, store_id, campaign_id, sequence_id, template_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_analytics_daily_date ON public.email_analytics_daily(date DESC);
CREATE INDEX IF NOT EXISTS idx_email_analytics_daily_store_id ON public.email_analytics_daily(store_id);
CREATE INDEX IF NOT EXISTS idx_email_analytics_daily_campaign_id ON public.email_analytics_daily(campaign_id) WHERE campaign_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_analytics_daily_sequence_id ON public.email_analytics_daily(sequence_id) WHERE sequence_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_analytics_daily_template_id ON public.email_analytics_daily(template_id) WHERE template_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_analytics_daily_store_date ON public.email_analytics_daily(store_id, date DESC);

-- Comments
COMMENT ON TABLE public.email_analytics_daily IS 'Agrégations quotidiennes des métriques email pour analytics';
COMMENT ON COLUMN public.email_analytics_daily.delivery_rate IS 'Taux de livraison en pourcentage';
COMMENT ON COLUMN public.email_analytics_daily.open_rate IS 'Taux d''ouverture en pourcentage';
COMMENT ON COLUMN public.email_analytics_daily.click_rate IS 'Taux de clic en pourcentage';

-- ============================================================
-- 2. FUNCTION: calculate_daily_email_analytics
-- Calcule et agrège les métriques email quotidiennes
-- ============================================================

CREATE OR REPLACE FUNCTION public.calculate_daily_email_analytics(
  p_date DATE DEFAULT CURRENT_DATE,
  p_store_id UUID DEFAULT NULL
)
RETURNS TABLE (
  date DATE,
  store_id UUID,
  campaign_id UUID,
  sequence_id UUID,
  template_id UUID,
  total_sent INTEGER,
  total_delivered INTEGER,
  total_opened INTEGER,
  total_clicked INTEGER,
  total_bounced INTEGER,
  total_unsubscribed INTEGER,
  total_failed INTEGER,
  delivery_rate NUMERIC,
  open_rate NUMERIC,
  click_rate NUMERIC,
  bounce_rate NUMERIC,
  unsubscribe_rate NUMERIC,
  click_to_open_rate NUMERIC,
  revenue NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH email_stats AS (
    SELECT
      DATE(el.sent_at) AS stat_date,
      el.store_id,
      el.campaign_id,
      el.sequence_id,
      el.template_id,
      
      -- Comptages
      COUNT(*)::INTEGER AS total_sent,
      COUNT(*) FILTER (WHERE el.sendgrid_status = 'delivered')::INTEGER AS total_delivered,
      COUNT(*) FILTER (WHERE el.opened_at IS NOT NULL)::INTEGER AS total_opened,
      COUNT(*) FILTER (WHERE el.clicked_at IS NOT NULL)::INTEGER AS total_clicked,
      COUNT(*) FILTER (WHERE el.bounced_at IS NOT NULL)::INTEGER AS total_bounced,
      COUNT(*) FILTER (WHERE EXISTS (
        SELECT 1 FROM public.email_unsubscribes eu
        WHERE eu.email = el.recipient_email
        AND DATE(eu.unsubscribed_at) = DATE(el.sent_at)
      ))::INTEGER AS total_unsubscribed,
      COUNT(*) FILTER (WHERE el.sendgrid_status = 'failed')::INTEGER AS total_failed,
      
      -- Revenue (si associé à une commande)
      COALESCE(SUM(
        CASE 
          WHEN el.order_id IS NOT NULL THEN
            (SELECT o.total_amount FROM public.orders o WHERE o.id = el.order_id LIMIT 1)
          ELSE 0
        END
      ), 0) AS revenue
    FROM public.email_logs el
    WHERE DATE(el.sent_at) = p_date
      AND (p_store_id IS NULL OR el.store_id = p_store_id)
    GROUP BY 
      DATE(el.sent_at),
      el.store_id,
      el.campaign_id,
      el.sequence_id,
      el.template_id
  )
  SELECT
    es.stat_date AS date,
    es.store_id,
    es.campaign_id,
    es.sequence_id,
    es.template_id,
    es.total_sent,
    es.total_delivered,
    es.total_opened,
    es.total_clicked,
    es.total_bounced,
    es.total_unsubscribed,
    es.total_failed,
    
    -- Taux calculés
    CASE 
      WHEN es.total_sent > 0 THEN 
        ROUND((es.total_delivered::NUMERIC / es.total_sent::NUMERIC) * 100, 2)
      ELSE 0
    END AS delivery_rate,
    
    CASE 
      WHEN es.total_delivered > 0 THEN 
        ROUND((es.total_opened::NUMERIC / es.total_delivered::NUMERIC) * 100, 2)
      ELSE 0
    END AS open_rate,
    
    CASE 
      WHEN es.total_delivered > 0 THEN 
        ROUND((es.total_clicked::NUMERIC / es.total_delivered::NUMERIC) * 100, 2)
      ELSE 0
    END AS click_rate,
    
    CASE 
      WHEN es.total_sent > 0 THEN 
        ROUND((es.total_bounced::NUMERIC / es.total_sent::NUMERIC) * 100, 2)
      ELSE 0
    END AS bounce_rate,
    
    CASE 
      WHEN es.total_delivered > 0 THEN 
        ROUND((es.total_unsubscribed::NUMERIC / es.total_delivered::NUMERIC) * 100, 2)
      ELSE 0
    END AS unsubscribe_rate,
    
    CASE 
      WHEN es.total_opened > 0 THEN 
        ROUND((es.total_clicked::NUMERIC / es.total_opened::NUMERIC) * 100, 2)
      ELSE 0
    END AS click_to_open_rate,
    
    es.revenue
  FROM email_stats es;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.calculate_daily_email_analytics IS 'Calcule les agrégations quotidiennes des métriques email';

-- ============================================================
-- 3. FUNCTION: aggregate_daily_email_analytics
-- Insère ou met à jour les agrégations quotidiennes
-- ============================================================

CREATE OR REPLACE FUNCTION public.aggregate_daily_email_analytics(
  p_date DATE DEFAULT CURRENT_DATE,
  p_store_id UUID DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_inserted_count INTEGER := 0;
  v_analytics RECORD;
BEGIN
  -- Pour chaque agrégation calculée, insérer ou mettre à jour
  FOR v_analytics IN
    SELECT * FROM public.calculate_daily_email_analytics(p_date, p_store_id)
  LOOP
    INSERT INTO public.email_analytics_daily (
      date,
      store_id,
      campaign_id,
      sequence_id,
      template_id,
      total_sent,
      total_delivered,
      total_opened,
      total_clicked,
      total_bounced,
      total_unsubscribed,
      total_failed,
      delivery_rate,
      open_rate,
      click_rate,
      bounce_rate,
      unsubscribe_rate,
      click_to_open_rate,
      revenue
    )
    VALUES (
      v_analytics.date,
      v_analytics.store_id,
      v_analytics.campaign_id,
      v_analytics.sequence_id,
      v_analytics.template_id,
      v_analytics.total_sent,
      v_analytics.total_delivered,
      v_analytics.total_opened,
      v_analytics.total_clicked,
      v_analytics.total_bounced,
      v_analytics.total_unsubscribed,
      v_analytics.total_failed,
      v_analytics.delivery_rate,
      v_analytics.open_rate,
      v_analytics.click_rate,
      v_analytics.bounce_rate,
      v_analytics.unsubscribe_rate,
      v_analytics.click_to_open_rate,
      v_analytics.revenue
    )
    ON CONFLICT (date, store_id, campaign_id, sequence_id, template_id)
    DO UPDATE SET
      total_sent = EXCLUDED.total_sent,
      total_delivered = EXCLUDED.total_delivered,
      total_opened = EXCLUDED.total_opened,
      total_clicked = EXCLUDED.total_clicked,
      total_bounced = EXCLUDED.total_bounced,
      total_unsubscribed = EXCLUDED.total_unsubscribed,
      total_failed = EXCLUDED.total_failed,
      delivery_rate = EXCLUDED.delivery_rate,
      open_rate = EXCLUDED.open_rate,
      click_rate = EXCLUDED.click_rate,
      bounce_rate = EXCLUDED.bounce_rate,
      unsubscribe_rate = EXCLUDED.unsubscribe_rate,
      click_to_open_rate = EXCLUDED.click_to_open_rate,
      revenue = EXCLUDED.revenue,
      updated_at = NOW();
    
    v_inserted_count := v_inserted_count + 1;
  END LOOP;
  
  RETURN v_inserted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.aggregate_daily_email_analytics IS 'Insère ou met à jour les agrégations quotidiennes des métriques email';

-- ============================================================
-- 4. TRIGGER: update_updated_at
-- ============================================================

CREATE TRIGGER update_email_analytics_daily_updated_at
BEFORE UPDATE ON public.email_analytics_daily
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 5. RLS POLICIES
-- ============================================================

ALTER TABLE public.email_analytics_daily ENABLE ROW LEVEL SECURITY;

-- Les vendeurs peuvent voir leurs propres analytics
CREATE POLICY "Store owners can view own analytics"
  ON public.email_analytics_daily
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = email_analytics_daily.store_id
      AND stores.user_id = auth.uid()
    )
  );

-- Les admins peuvent tout voir
CREATE POLICY "Admins can view all analytics"
  ON public.email_analytics_daily
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

