-- =====================================================
-- PAYHUK DEMAND FORECASTING SYSTEM
-- Date: 27 Janvier 2025
-- Description: Système de prévisions de demande basé sur l'historique des ventes
--              Analyse des tendances, saisonnalité et prédictions
-- Version: 1.0
-- =====================================================

-- =====================================================
-- 1. TABLE: sales_history
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sales_history'
  ) THEN
    CREATE TABLE public.sales_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
      product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
      variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
      
      -- Vente
      order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
      order_item_id UUID REFERENCES public.order_items(id) ON DELETE SET NULL,
      
      -- Quantité et prix
      quantity_sold INTEGER NOT NULL,
      unit_price NUMERIC NOT NULL,
      total_amount NUMERIC NOT NULL,
      
      -- Date
      sale_date DATE NOT NULL,
      sale_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
      
      -- Métadonnées
      customer_segment TEXT, -- 'new', 'returning', 'vip', etc.
      channel TEXT, -- 'web', 'mobile', 'pos', etc.
      promotion_applied BOOLEAN DEFAULT false,
      discount_amount NUMERIC DEFAULT 0,
      
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  END IF;
END $$;

-- Indexes pour sales_history
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_sales_history_store_id'
  ) THEN
    CREATE INDEX idx_sales_history_store_id ON public.sales_history(store_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_sales_history_product_id'
  ) THEN
    CREATE INDEX idx_sales_history_product_id ON public.sales_history(product_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_sales_history_sale_date'
  ) THEN
    CREATE INDEX idx_sales_history_sale_date ON public.sales_history(sale_date);
  END IF;
END $$;

-- =====================================================
-- 2. TABLE: demand_forecasts
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'demand_forecasts'
  ) THEN
    CREATE TABLE public.demand_forecasts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
      product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
      variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
      
      -- Prévision
      forecast_date DATE NOT NULL, -- Date pour laquelle la prévision est faite
      forecast_period_start DATE NOT NULL, -- Début période prévision
      forecast_period_end DATE NOT NULL, -- Fin période prévision
      forecast_type TEXT NOT NULL CHECK (forecast_type IN (
        'daily',      -- Prévision journalière
        'weekly',     -- Prévision hebdomadaire
        'monthly',    -- Prévision mensuelle
        'quarterly',  -- Prévision trimestrielle
        'yearly'      -- Prévision annuelle
      )),
      
      -- Prévisions
      forecasted_quantity INTEGER NOT NULL, -- Quantité prévue
      forecasted_revenue NUMERIC NOT NULL, -- Revenu prévu
      confidence_level NUMERIC DEFAULT 0.8, -- Niveau de confiance (0-1)
      
      -- Intervalles de confiance
      min_quantity INTEGER, -- Minimum prévu
      max_quantity INTEGER, -- Maximum prévu
      
      -- Méthode utilisée
      forecast_method TEXT NOT NULL CHECK (forecast_method IN (
        'moving_average',    -- Moyenne mobile
        'exponential_smoothing', -- Lissage exponentiel
        'linear_regression', -- Régression linéaire
        'seasonal_decomposition', -- Décomposition saisonnière
        'arima',            -- ARIMA
        'machine_learning'  -- Machine Learning
      )),
      
      -- Paramètres de calcul
      calculation_params JSONB DEFAULT '{}', -- Paramètres utilisés
      historical_data_points INTEGER, -- Nombre de points de données historiques utilisés
      
      -- Métadonnées
      calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      calculated_by UUID REFERENCES auth.users(id),
      notes TEXT,
      
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      
      UNIQUE(store_id, product_id, variant_id, forecast_date, forecast_type)
    );
  END IF;
END $$;

-- Indexes pour demand_forecasts
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_demand_forecasts_store_id'
  ) THEN
    CREATE INDEX idx_demand_forecasts_store_id ON public.demand_forecasts(store_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_demand_forecasts_product_id'
  ) THEN
    CREATE INDEX idx_demand_forecasts_product_id ON public.demand_forecasts(product_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_demand_forecasts_forecast_date'
  ) THEN
    CREATE INDEX idx_demand_forecasts_forecast_date ON public.demand_forecasts(forecast_date);
  END IF;
END $$;

-- Trigger updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_demand_forecasts_updated_at'
  ) THEN
    CREATE TRIGGER update_demand_forecasts_updated_at
      BEFORE UPDATE ON public.demand_forecasts
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- =====================================================
-- 3. TABLE: forecast_accuracy
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'forecast_accuracy'
  ) THEN
    CREATE TABLE public.forecast_accuracy (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      forecast_id UUID NOT NULL REFERENCES public.demand_forecasts(id) ON DELETE CASCADE,
      
      -- Réalité vs Prévision
      actual_quantity INTEGER NOT NULL, -- Quantité réellement vendue
      forecasted_quantity INTEGER NOT NULL, -- Quantité prévue
      actual_revenue NUMERIC NOT NULL, -- Revenu réel
      forecasted_revenue NUMERIC NOT NULL, -- Revenu prévu
      
      -- Métriques d'erreur (calculées via trigger)
      quantity_error INTEGER,
      revenue_error NUMERIC,
      quantity_error_percentage NUMERIC,
      revenue_error_percentage NUMERIC,
      
      -- Métriques avancées
      mape NUMERIC, -- Mean Absolute Percentage Error
      mae NUMERIC, -- Mean Absolute Error
      rmse NUMERIC, -- Root Mean Square Error
      
      -- Période
      period_start DATE NOT NULL,
      period_end DATE NOT NULL,
      
      -- Métadonnées
      evaluated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      notes TEXT,
      
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  END IF;
END $$;

-- Indexes pour forecast_accuracy
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_forecast_accuracy_forecast_id'
  ) THEN
    CREATE INDEX idx_forecast_accuracy_forecast_id ON public.forecast_accuracy(forecast_id);
  END IF;
END $$;

-- Fonction pour calculer les métriques d'erreur
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'calculate_forecast_accuracy_metrics'
  ) THEN
    DROP FUNCTION public.calculate_forecast_accuracy_metrics();
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.calculate_forecast_accuracy_metrics()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.quantity_error := NEW.actual_quantity - NEW.forecasted_quantity;
  NEW.revenue_error := NEW.actual_revenue - NEW.forecasted_revenue;
  
  NEW.quantity_error_percentage := 
    CASE 
      WHEN NEW.forecasted_quantity > 0 
      THEN ((NEW.actual_quantity - NEW.forecasted_quantity)::NUMERIC / NEW.forecasted_quantity) * 100
      ELSE NULL
    END;
    
  NEW.revenue_error_percentage := 
    CASE 
      WHEN NEW.forecasted_revenue > 0 
      THEN ((NEW.actual_revenue - NEW.forecasted_revenue) / NEW.forecasted_revenue) * 100
      ELSE NULL
    END;
    
  RETURN NEW;
END;
$$;

-- Trigger pour calculer les métriques
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'calculate_forecast_accuracy_metrics_trigger'
  ) THEN
    CREATE TRIGGER calculate_forecast_accuracy_metrics_trigger
      BEFORE INSERT OR UPDATE ON public.forecast_accuracy
      FOR EACH ROW
      EXECUTE FUNCTION public.calculate_forecast_accuracy_metrics();
  END IF;
END $$;

-- =====================================================
-- 4. TABLE: reorder_recommendations
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reorder_recommendations'
  ) THEN
    CREATE TABLE public.reorder_recommendations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
      product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
      variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
      
      -- Recommandation
      recommendation_type TEXT NOT NULL CHECK (recommendation_type IN (
        'low_stock',        -- Stock bas
        'reorder_point',   -- Point de réapprovisionnement atteint
        'demand_forecast', -- Basé sur prévision
        'seasonal_peak',   -- Pic saisonnier prévu
        'trending_up'      -- Tendance à la hausse
      )),
      priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
      
      -- Calculs
      current_stock INTEGER NOT NULL,
      forecasted_demand INTEGER NOT NULL, -- Demande prévue pour la période
      days_until_stockout INTEGER, -- Jours avant rupture de stock
      recommended_quantity INTEGER NOT NULL, -- Quantité recommandée
      recommended_order_date DATE, -- Date recommandée pour commander
      
      -- Fournisseur recommandé
      recommended_supplier_id UUID REFERENCES public.suppliers(id),
      estimated_cost NUMERIC, -- Coût estimé
      estimated_delivery_days INTEGER, -- Délai de livraison estimé
      
      -- Statut
      status TEXT NOT NULL CHECK (status IN (
        'pending',      -- En attente
        'approved',    -- Approuvé
        'ordered',     -- Commandé
        'received',    -- Reçu
        'dismissed'    -- Ignoré
      )) DEFAULT 'pending',
      
      -- Métadonnées
      calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      calculated_by UUID REFERENCES auth.users(id),
      notes TEXT,
      
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  END IF;
END $$;

-- Indexes pour reorder_recommendations
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_reorder_recommendations_store_id'
  ) THEN
    CREATE INDEX idx_reorder_recommendations_store_id ON public.reorder_recommendations(store_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_reorder_recommendations_status'
  ) THEN
    CREATE INDEX idx_reorder_recommendations_status ON public.reorder_recommendations(status);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_reorder_recommendations_priority'
  ) THEN
    CREATE INDEX idx_reorder_recommendations_priority ON public.reorder_recommendations(priority);
  END IF;
END $$;

-- Trigger updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_reorder_recommendations_updated_at'
  ) THEN
    CREATE TRIGGER update_reorder_recommendations_updated_at
      BEFORE UPDATE ON public.reorder_recommendations
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- =====================================================
-- 5. FUNCTIONS
-- =====================================================

-- Fonction pour calculer prévision moyenne mobile
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'calculate_moving_average_forecast'
  ) THEN
    DROP FUNCTION public.calculate_moving_average_forecast(UUID, UUID, UUID, INTEGER, DATE);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.calculate_moving_average_forecast(
  p_store_id UUID,
  p_product_id UUID,
  p_variant_id UUID DEFAULT NULL,
  p_periods INTEGER DEFAULT 30,
  p_forecast_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  forecasted_quantity INTEGER,
  forecasted_revenue NUMERIC,
  confidence_level NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_avg_quantity NUMERIC;
  v_avg_revenue NUMERIC;
  v_std_dev NUMERIC;
  v_confidence NUMERIC;
BEGIN
  -- Calculer moyenne mobile
  SELECT 
    AVG(quantity_sold)::INTEGER,
    AVG(total_amount),
    STDDEV(quantity_sold)
  INTO v_avg_quantity, v_avg_revenue, v_std_dev
  FROM public.sales_history
  WHERE store_id = p_store_id
    AND product_id = p_product_id
    AND (p_variant_id IS NULL OR variant_id = p_variant_id)
    AND sale_date >= p_forecast_date - (p_periods || ' days')::INTERVAL
    AND sale_date < p_forecast_date;
  
  -- Calculer niveau de confiance basé sur l'écart-type
  v_confidence := GREATEST(0.5, LEAST(0.95, 1.0 - (COALESCE(v_std_dev, 0) / NULLIF(v_avg_quantity, 0))));
  
  RETURN QUERY SELECT 
    COALESCE(v_avg_quantity::INTEGER, 0),
    COALESCE(v_avg_revenue, 0),
    COALESCE(v_confidence, 0.7);
END;
$$;

-- Fonction pour calculer prévision lissage exponentiel
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'calculate_exponential_smoothing_forecast'
  ) THEN
    DROP FUNCTION public.calculate_exponential_smoothing_forecast(UUID, UUID, UUID, NUMERIC, DATE);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.calculate_exponential_smoothing_forecast(
  p_store_id UUID,
  p_product_id UUID,
  p_variant_id UUID DEFAULT NULL,
  p_alpha NUMERIC DEFAULT 0.3,
  p_forecast_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  forecasted_quantity INTEGER,
  forecasted_revenue NUMERIC,
  confidence_level NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_forecast_qty NUMERIC;
  v_forecast_rev NUMERIC;
  v_prev_value NUMERIC;
  v_rec RECORD;
BEGIN
  -- Initialiser avec la première valeur
  SELECT quantity_sold, total_amount
  INTO v_forecast_qty, v_forecast_rev
  FROM public.sales_history
  WHERE store_id = p_store_id
    AND product_id = p_product_id
    AND (p_variant_id IS NULL OR variant_id = p_variant_id)
    AND sale_date < p_forecast_date
  ORDER BY sale_date ASC
  LIMIT 1;
  
  -- Si pas de données, retourner 0
  IF v_forecast_qty IS NULL THEN
    RETURN QUERY SELECT 0::INTEGER, 0::NUMERIC, 0.5::NUMERIC;
    RETURN;
  END IF;
  
  v_prev_value := v_forecast_qty;
  
  -- Appliquer lissage exponentiel sur les données récentes
  FOR v_rec IN
    SELECT quantity_sold, total_amount
    FROM public.sales_history
    WHERE store_id = p_store_id
      AND product_id = p_product_id
      AND (p_variant_id IS NULL OR variant_id = p_variant_id)
      AND sale_date < p_forecast_date
      AND sale_date >= p_forecast_date - INTERVAL '90 days'
    ORDER BY sale_date ASC
    OFFSET 1
  LOOP
    v_forecast_qty := p_alpha * v_rec.quantity_sold + (1 - p_alpha) * v_forecast_qty;
    v_forecast_rev := p_alpha * v_rec.total_amount + (1 - p_alpha) * v_forecast_rev;
  END LOOP;
  
  RETURN QUERY SELECT 
    v_forecast_qty::INTEGER,
    v_forecast_rev,
    0.75::NUMERIC; -- Confiance moyenne pour lissage exponentiel
END;
$$;

-- Fonction pour générer recommandations de réapprovisionnement
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'generate_reorder_recommendations'
  ) THEN
    DROP FUNCTION public.generate_reorder_recommendations(UUID);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.generate_reorder_recommendations(p_store_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_product RECORD;
  v_forecast RECORD;
  v_current_stock INTEGER;
  v_days_until_stockout INTEGER;
  v_recommended_qty INTEGER;
  v_count INTEGER := 0;
BEGIN
  -- Parcourir tous les produits physiques du store
  FOR v_product IN
    SELECT DISTINCT
      p.id as product_id,
      pv.id as variant_id
    FROM public.products p
    LEFT JOIN public.product_variants pv ON pv.product_id = p.id
    WHERE p.store_id = p_store_id
      AND p.product_type = 'physical'
  LOOP
    -- Récupérer stock actuel (simplifié - à adapter selon votre structure)
    SELECT COALESCE(SUM(quantity), 0) INTO v_current_stock
    FROM public.product_variants
    WHERE product_id = v_product.product_id
      AND (v_product.variant_id IS NULL OR id = v_product.variant_id);
    
    -- Calculer prévision pour les 30 prochains jours
    SELECT * INTO v_forecast
    FROM public.calculate_moving_average_forecast(
      p_store_id,
      v_product.product_id,
      v_product.variant_id,
      30,
      CURRENT_DATE + 30
    );
    
    -- Calculer jours avant rupture de stock
    IF v_forecast.forecasted_quantity > 0 THEN
      v_days_until_stockout := (v_current_stock / v_forecast.forecasted_quantity)::INTEGER;
    ELSE
      v_days_until_stockout := NULL;
    END IF;
    
    -- Générer recommandation si nécessaire
    IF v_current_stock <= 10 OR (v_days_until_stockout IS NOT NULL AND v_days_until_stockout <= 7) THEN
      v_recommended_qty := GREATEST(
        v_forecast.forecasted_quantity * 2, -- 2x la demande prévue
        50 -- Minimum 50 unités
      );
      
      -- Insérer ou mettre à jour recommandation
      INSERT INTO public.reorder_recommendations (
        store_id,
        product_id,
        variant_id,
        recommendation_type,
        priority,
        current_stock,
        forecasted_demand,
        days_until_stockout,
        recommended_quantity,
        status
      )
      VALUES (
        p_store_id,
        v_product.product_id,
        v_product.variant_id,
        CASE 
          WHEN v_current_stock <= 5 THEN 'low_stock'
          WHEN v_days_until_stockout <= 7 THEN 'reorder_point'
          ELSE 'demand_forecast'
        END,
        CASE
          WHEN v_current_stock <= 5 THEN 'urgent'
          WHEN v_days_until_stockout <= 7 THEN 'high'
          ELSE 'normal'
        END,
        v_current_stock,
        v_forecast.forecasted_quantity,
        v_days_until_stockout,
        v_recommended_qty,
        'pending'
      )
      ON CONFLICT DO NOTHING;
      
      v_count := v_count + 1;
    END IF;
  END LOOP;
  
  RETURN v_count;
END;
$$;

-- =====================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Activer RLS
ALTER TABLE public.sales_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demand_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forecast_accuracy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reorder_recommendations ENABLE ROW LEVEL SECURITY;

-- Policies pour sales_history
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'sales_history' AND policyname = 'Store owners can manage sales history'
  ) THEN
    CREATE POLICY "Store owners can manage sales history" ON public.sales_history
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.stores s
          WHERE s.id = sales_history.store_id
          AND s.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Policies pour demand_forecasts
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'demand_forecasts' AND policyname = 'Store owners can manage forecasts'
  ) THEN
    CREATE POLICY "Store owners can manage forecasts" ON public.demand_forecasts
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.stores s
          WHERE s.id = demand_forecasts.store_id
          AND s.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Policies pour reorder_recommendations
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'reorder_recommendations' AND policyname = 'Store owners can manage recommendations'
  ) THEN
    CREATE POLICY "Store owners can manage recommendations" ON public.reorder_recommendations
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.stores s
          WHERE s.id = reorder_recommendations.store_id
          AND s.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================

