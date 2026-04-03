-- =====================================================
-- EMARZONA DEMAND FORECASTING SYSTEM
-- Date: 31 Janvier 2025
-- Description: Système de prévisions de demande pour produits physiques
--              Analyse des ventes historiques, calcul de la demande prévue, alertes
-- Version: 1.0
-- =====================================================

-- =====================================================
-- 1. TABLE: demand_forecasts
-- =====================================================

CREATE TABLE IF NOT EXISTS public.demand_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  
  -- Période de prévision
  forecast_period_start DATE NOT NULL,
  forecast_period_end DATE NOT NULL,
  forecast_type TEXT NOT NULL CHECK (forecast_type IN (
    'daily',      -- Prévision journalière
    'weekly',     -- Prévision hebdomadaire
    'monthly',    -- Prévision mensuelle
    'quarterly',  -- Prévision trimestrielle
    'yearly'      -- Prévision annuelle
  )) DEFAULT 'monthly',
  
  -- Prévisions
  forecasted_quantity INTEGER NOT NULL DEFAULT 0,
  confidence_level NUMERIC DEFAULT 0.8, -- Niveau de confiance (0-1)
  
  -- Méthode utilisée
  forecast_method TEXT NOT NULL CHECK (forecast_method IN (
    'moving_average',     -- Moyenne mobile
    'exponential_smoothing', -- Lissage exponentiel
    'linear_regression',  -- Régression linéaire
    'seasonal_decomposition', -- Décomposition saisonnière
    'arima',              -- ARIMA
    'machine_learning'    -- Machine Learning
  )) DEFAULT 'moving_average',
  
  -- Paramètres de la méthode
  method_parameters JSONB DEFAULT '{}'::jsonb,
  
  -- Données historiques utilisées
  historical_data_points INTEGER DEFAULT 0,
  historical_period_start DATE,
  historical_period_end DATE,
  
  -- Métriques de précision
  mae NUMERIC, -- Mean Absolute Error
  mse NUMERIC, -- Mean Squared Error
  mape NUMERIC, -- Mean Absolute Percentage Error
  
  -- Statut
  is_active BOOLEAN DEFAULT true,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Contraintes
  CONSTRAINT valid_forecast_period CHECK (forecast_period_end >= forecast_period_start),
  CONSTRAINT valid_confidence CHECK (confidence_level >= 0 AND confidence_level <= 1)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_demand_forecasts_store_id ON public.demand_forecasts(store_id);
CREATE INDEX IF NOT EXISTS idx_demand_forecasts_product_id ON public.demand_forecasts(product_id);
CREATE INDEX IF NOT EXISTS idx_demand_forecasts_variant_id ON public.demand_forecasts(variant_id);
CREATE INDEX IF NOT EXISTS idx_demand_forecasts_period ON public.demand_forecasts(forecast_period_start, forecast_period_end);

-- Ajouter is_active si la colonne n'existe pas, puis créer l'index
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'demand_forecasts' 
    AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.demand_forecasts
    ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
  
  -- Créer l'index seulement si la colonne existe maintenant
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'demand_forecasts' 
    AND column_name = 'is_active'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_demand_forecasts_active ON public.demand_forecasts(is_active);
  END IF;
END $$;

-- =====================================================
-- 2. TABLE: demand_forecast_history
-- =====================================================

CREATE TABLE IF NOT EXISTS public.demand_forecast_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  forecast_id UUID NOT NULL REFERENCES public.demand_forecasts(id) ON DELETE CASCADE,
  
  -- Date de la prévision
  forecast_date DATE NOT NULL,
  
  -- Prévision vs Réalité
  forecasted_quantity INTEGER NOT NULL,
  actual_quantity INTEGER, -- Quantité réelle vendue (remplie après)
  
  -- Erreur de prévision
  forecast_error INTEGER, -- actual_quantity - forecasted_quantity
  absolute_error INTEGER, -- ABS(forecast_error)
  percentage_error NUMERIC, -- (absolute_error / actual_quantity) * 100
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_forecast_history_forecast_id ON public.demand_forecast_history(forecast_id);
CREATE INDEX IF NOT EXISTS idx_forecast_history_date ON public.demand_forecast_history(forecast_date);

-- =====================================================
-- 3. TABLE: reorder_suggestions
-- =====================================================

CREATE TABLE IF NOT EXISTS public.reorder_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  
  -- Calculs
  current_stock INTEGER NOT NULL DEFAULT 0,
  forecasted_demand INTEGER NOT NULL DEFAULT 0,
  safety_stock INTEGER DEFAULT 0, -- Stock de sécurité
  reorder_point INTEGER NOT NULL DEFAULT 0, -- Point de réapprovisionnement
  suggested_quantity INTEGER NOT NULL DEFAULT 0, -- Quantité suggérée à commander
  
  -- Urgence
  urgency_level TEXT NOT NULL CHECK (urgency_level IN (
    'low',      -- Faible urgence
    'medium',   -- Urgence moyenne
    'high',     -- Urgence élevée
    'critical'  -- Urgence critique
  )) DEFAULT 'medium',
  
  -- Dates
  estimated_stockout_date DATE, -- Date estimée de rupture de stock
  suggested_order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Fournisseur suggéré
  suggested_supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  estimated_cost NUMERIC,
  estimated_delivery_days INTEGER,
  
  -- Statut
  status TEXT NOT NULL CHECK (status IN (
    'pending',      -- En attente
    'reviewed',     -- Revu
    'ordered',      -- Commandé
    'dismissed'     -- Ignoré
  )) DEFAULT 'pending',
  
  -- Actif
  is_active BOOLEAN DEFAULT true,
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reorder_suggestions_store_id ON public.reorder_suggestions(store_id);
CREATE INDEX IF NOT EXISTS idx_reorder_suggestions_product_id ON public.reorder_suggestions(product_id);
CREATE INDEX IF NOT EXISTS idx_reorder_suggestions_status ON public.reorder_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_reorder_suggestions_urgency ON public.reorder_suggestions(urgency_level);

-- Ajouter is_active si la colonne n'existe pas, puis créer l'index
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'reorder_suggestions' 
    AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.reorder_suggestions
    ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
  
  -- Créer l'index seulement si la colonne existe maintenant
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'reorder_suggestions' 
    AND column_name = 'is_active'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_reorder_suggestions_active ON public.reorder_suggestions(is_active);
  END IF;
END $$;

-- =====================================================
-- 4. FUNCTIONS
-- =====================================================

-- Fonction pour calculer la moyenne mobile simple
CREATE OR REPLACE FUNCTION calculate_moving_average(
  p_product_id UUID,
  p_variant_id UUID DEFAULT NULL,
  p_periods INTEGER DEFAULT 30,
  p_store_id UUID DEFAULT NULL
)
RETURNS NUMERIC AS $$
DECLARE
  v_average NUMERIC;
BEGIN
  SELECT AVG(quantity) INTO v_average
  FROM public.order_items oi
  INNER JOIN public.orders o ON o.id = oi.order_id
  WHERE oi.product_id = p_product_id
    AND (p_variant_id IS NULL OR oi.variant_id = p_variant_id)
    AND (p_store_id IS NULL OR o.store_id = p_store_id)
    AND o.status = 'completed'
    AND o.created_at >= CURRENT_DATE - (p_periods || ' days')::INTERVAL
    AND o.created_at < CURRENT_DATE;
  
  RETURN COALESCE(v_average, 0);
END;
$$ LANGUAGE plpgsql;

-- Fonction pour calculer la prévision de demande
CREATE OR REPLACE FUNCTION calculate_demand_forecast(
  p_product_id UUID,
  p_variant_id UUID DEFAULT NULL,
  p_store_id UUID DEFAULT NULL,
  p_forecast_method TEXT DEFAULT 'moving_average',
  p_periods INTEGER DEFAULT 30,
  p_forecast_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  forecasted_quantity INTEGER,
  confidence_level NUMERIC,
  method_parameters JSONB
) AS $$
DECLARE
  v_forecasted_quantity INTEGER;
  v_confidence NUMERIC;
  v_parameters JSONB;
  v_historical_avg NUMERIC;
  v_historical_std NUMERIC;
BEGIN
  -- Calculer la moyenne historique
  SELECT AVG(quantity), STDDEV(quantity) INTO v_historical_avg, v_historical_std
  FROM public.order_items oi
  INNER JOIN public.orders o ON o.id = oi.order_id
  WHERE oi.product_id = p_product_id
    AND (p_variant_id IS NULL OR oi.variant_id = p_variant_id)
    AND (p_store_id IS NULL OR o.store_id = p_store_id)
    AND o.status = 'completed'
    AND o.created_at >= CURRENT_DATE - (p_periods || ' days')::INTERVAL
    AND o.created_at < CURRENT_DATE;
  
  -- Calculer la prévision selon la méthode
  CASE p_forecast_method
    WHEN 'moving_average' THEN
      v_forecasted_quantity := FLOOR(COALESCE(v_historical_avg, 0) * p_forecast_days);
      v_confidence := 0.7;
      v_parameters := jsonb_build_object(
        'periods', p_periods,
        'forecast_days', p_forecast_days,
        'historical_avg', v_historical_avg,
        'historical_std', v_historical_std
      );
    ELSE
      v_forecasted_quantity := FLOOR(COALESCE(v_historical_avg, 0) * p_forecast_days);
      v_confidence := 0.6;
      v_parameters := jsonb_build_object('method', p_forecast_method);
  END CASE;
  
  RETURN QUERY SELECT 
    v_forecasted_quantity::INTEGER,
    v_confidence,
    v_parameters;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour générer des suggestions de réapprovisionnement
CREATE OR REPLACE FUNCTION generate_reorder_suggestions(
  p_store_id UUID,
  p_urgency_filter TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_product RECORD;
  v_current_stock INTEGER;
  v_forecasted_demand INTEGER;
  v_safety_stock INTEGER;
  v_reorder_point INTEGER;
  v_suggested_quantity INTEGER;
  v_urgency TEXT;
  v_estimated_stockout_date DATE;
  v_suggestions_count INTEGER := 0;
BEGIN
  -- Parcourir tous les produits physiques du store
  FOR v_product IN
    SELECT p.id, pv.id as variant_id
    FROM public.products p
    LEFT JOIN public.product_variants pv ON pv.product_id = p.id
    WHERE p.store_id = p_store_id
      AND p.product_type = 'physical'
      AND (p.is_active IS NULL OR p.is_active = true)
      AND (pv.id IS NULL OR pv.is_active IS NULL OR pv.is_active = true)
  LOOP
    -- Récupérer le stock actuel
    SELECT COALESCE(SUM(current_quantity), 0) INTO v_current_stock
    FROM public.inventory
    WHERE product_id = v_product.id
      AND (v_product.variant_id IS NULL OR variant_id = v_product.variant_id)
      AND store_id = p_store_id;
    
    -- Calculer la demande prévue (30 jours)
    SELECT forecasted_quantity INTO v_forecasted_demand
    FROM calculate_demand_forecast(
      v_product.id,
      v_product.variant_id,
      p_store_id,
      'moving_average',
      30,
      30
    );
    
    -- Calculer le stock de sécurité (20% de la demande prévue)
    v_safety_stock := FLOOR(v_forecasted_demand * 0.2);
    
    -- Calculer le point de réapprovisionnement
    v_reorder_point := v_safety_stock + FLOOR(v_forecasted_demand * 0.5);
    
    -- Si le stock actuel est en dessous du point de réapprovisionnement
    IF v_current_stock <= v_reorder_point THEN
      -- Calculer la quantité suggérée
      v_suggested_quantity := GREATEST(
        v_forecasted_demand - v_current_stock + v_safety_stock,
        v_reorder_point - v_current_stock
      );
      
      -- Calculer l'urgence
      IF v_current_stock = 0 THEN
        v_urgency := 'critical';
      ELSIF v_current_stock <= v_safety_stock THEN
        v_urgency := 'high';
      ELSIF v_current_stock <= v_reorder_point THEN
        v_urgency := 'medium';
      ELSE
        v_urgency := 'low';
      END IF;
      
      -- Calculer la date estimée de rupture de stock
      IF v_forecasted_demand > 0 THEN
        v_estimated_stockout_date := CURRENT_DATE + FLOOR((v_current_stock::NUMERIC / v_forecasted_demand) * 30)::INTEGER;
      ELSE
        v_estimated_stockout_date := NULL;
      END IF;
      
      -- Filtrer par urgence si demandé
      IF p_urgency_filter IS NULL OR v_urgency = p_urgency_filter THEN
        -- Insérer ou mettre à jour la suggestion
        INSERT INTO public.reorder_suggestions (
          store_id,
          product_id,
          variant_id,
          current_stock,
          forecasted_demand,
          safety_stock,
          reorder_point,
          suggested_quantity,
          urgency_level,
          estimated_stockout_date,
          status
        )
        VALUES (
          p_store_id,
          v_product.id,
          v_product.variant_id,
          v_current_stock,
          v_forecasted_demand,
          v_safety_stock,
          v_reorder_point,
          v_suggested_quantity,
          v_urgency,
          v_estimated_stockout_date,
          'pending'
        )
        ON CONFLICT DO NOTHING;
        
        v_suggestions_count := v_suggestions_count + 1;
      END IF;
    END IF;
  END LOOP;
  
  RETURN v_suggestions_count;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
DO $$ 
BEGIN
  -- Vérifier et créer le trigger pour demand_forecasts
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_trigger 
    WHERE tgname = 'update_demand_forecasts_updated_at'
  ) THEN
    CREATE TRIGGER update_demand_forecasts_updated_at
      BEFORE UPDATE ON public.demand_forecasts
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  
  -- Vérifier et créer le trigger pour reorder_suggestions
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_trigger 
    WHERE tgname = 'update_reorder_suggestions_updated_at'
  ) THEN
    CREATE TRIGGER update_reorder_suggestions_updated_at
      BEFORE UPDATE ON public.reorder_suggestions
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- =====================================================
-- 5. RLS POLICIES
-- =====================================================

ALTER TABLE public.demand_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demand_forecast_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reorder_suggestions ENABLE ROW LEVEL SECURITY;

-- Store owners can view their forecasts
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Store owners can view their forecasts" ON public.demand_forecasts;
  DROP POLICY IF EXISTS "Store owners can manage their forecasts" ON public.demand_forecasts;
  DROP POLICY IF EXISTS "Store owners can view their forecast history" ON public.demand_forecast_history;
  DROP POLICY IF EXISTS "Store owners can view their reorder suggestions" ON public.reorder_suggestions;
  DROP POLICY IF EXISTS "Store owners can manage their reorder suggestions" ON public.reorder_suggestions;
  
  -- Vérifier quelle colonne existe dans stores
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'stores' 
    AND column_name = 'user_id'
  ) THEN
    -- Utiliser user_id
    CREATE POLICY "Store owners can view their forecasts"
    ON public.demand_forecasts FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.stores
        WHERE stores.id = demand_forecasts.store_id
        AND stores.user_id = auth.uid()
      )
    );

    CREATE POLICY "Store owners can manage their forecasts"
    ON public.demand_forecasts FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM public.stores
        WHERE stores.id = demand_forecasts.store_id
        AND stores.user_id = auth.uid()
      )
    );

    CREATE POLICY "Store owners can view their forecast history"
    ON public.demand_forecast_history FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.demand_forecasts df
        INNER JOIN public.stores s ON s.id = df.store_id
        WHERE df.id = demand_forecast_history.forecast_id
        AND s.user_id = auth.uid()
      )
    );

    CREATE POLICY "Store owners can view their reorder suggestions"
    ON public.reorder_suggestions FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.stores
        WHERE stores.id = reorder_suggestions.store_id
        AND stores.user_id = auth.uid()
      )
    );

    CREATE POLICY "Store owners can manage their reorder suggestions"
    ON public.reorder_suggestions FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM public.stores
        WHERE stores.id = reorder_suggestions.store_id
        AND stores.user_id = auth.uid()
      )
    );
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'stores' 
    AND column_name = 'owner_id'
  ) THEN
    -- Utiliser owner_id si user_id n'existe pas
    CREATE POLICY "Store owners can view their forecasts"
    ON public.demand_forecasts FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.stores
        WHERE stores.id = demand_forecasts.store_id
        AND stores.owner_id = auth.uid()
      )
    );

    CREATE POLICY "Store owners can manage their forecasts"
    ON public.demand_forecasts FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM public.stores
        WHERE stores.id = demand_forecasts.store_id
        AND stores.owner_id = auth.uid()
      )
    );

    CREATE POLICY "Store owners can view their forecast history"
    ON public.demand_forecast_history FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.demand_forecasts df
        INNER JOIN public.stores s ON s.id = df.store_id
        WHERE df.id = demand_forecast_history.forecast_id
        AND s.owner_id = auth.uid()
      )
    );

    CREATE POLICY "Store owners can view their reorder suggestions"
    ON public.reorder_suggestions FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.stores
        WHERE stores.id = reorder_suggestions.store_id
        AND stores.owner_id = auth.uid()
      )
    );

    CREATE POLICY "Store owners can manage their reorder suggestions"
    ON public.reorder_suggestions FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM public.stores
        WHERE stores.id = reorder_suggestions.store_id
        AND stores.owner_id = auth.uid()
      )
    );
  END IF;
END $$;

-- =====================================================
-- 6. COMMENTS
-- =====================================================

COMMENT ON TABLE public.demand_forecasts IS 'Prévisions de demande pour produits';
COMMENT ON TABLE public.demand_forecast_history IS 'Historique des prévisions et résultats réels';
COMMENT ON TABLE public.reorder_suggestions IS 'Suggestions de réapprovisionnement automatiques';

