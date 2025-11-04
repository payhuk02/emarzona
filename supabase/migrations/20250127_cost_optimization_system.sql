-- =====================================================
-- PAYHUK COST OPTIMIZATION & MARGIN ANALYSIS SYSTEM
-- Date: 27 Janvier 2025
-- Description: Système d'analyse des coûts, marges et optimisation des prix
-- Version: 1.0
-- =====================================================

-- =====================================================
-- 1. TABLE: product_costs
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'product_costs'
  ) THEN
    CREATE TABLE public.product_costs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
      product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
      variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
      
      -- Coûts directs
      cost_of_goods_sold NUMERIC NOT NULL DEFAULT 0, -- Coût des marchandises vendues (COGS)
      manufacturing_cost NUMERIC DEFAULT 0, -- Coût de fabrication
      material_cost NUMERIC DEFAULT 0, -- Coût des matières premières
      labor_cost NUMERIC DEFAULT 0, -- Coût de la main d'œuvre
      packaging_cost NUMERIC DEFAULT 0, -- Coût d'emballage
      
      -- Coûts indirects
      overhead_cost NUMERIC DEFAULT 0, -- Frais généraux
      shipping_cost_per_unit NUMERIC DEFAULT 0, -- Coût d'expédition par unité
      storage_cost_per_unit NUMERIC DEFAULT 0, -- Coût de stockage par unité
      marketing_cost_per_unit NUMERIC DEFAULT 0, -- Coût marketing par unité
      
      -- Coûts variables
      platform_fees_percentage NUMERIC DEFAULT 0, -- Frais plateforme (%)
      payment_processing_fees_percentage NUMERIC DEFAULT 0, -- Frais paiement (%)
      tax_rate NUMERIC DEFAULT 0, -- Taux de taxe (%)
      
      -- Coûts totaux calculés (via trigger)
      total_cost_per_unit NUMERIC,
      
      -- Métadonnées
      cost_basis_date DATE NOT NULL DEFAULT CURRENT_DATE, -- Date de référence des coûts
      cost_source TEXT, -- Source des données (manual, supplier, import)
      notes TEXT,
      
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      
      UNIQUE(store_id, product_id, variant_id)
    );
  END IF;
END $$;

-- Indexes pour product_costs
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_product_costs_store_id'
  ) THEN
    CREATE INDEX idx_product_costs_store_id ON public.product_costs(store_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_product_costs_product_id'
  ) THEN
    CREATE INDEX idx_product_costs_product_id ON public.product_costs(product_id);
  END IF;
END $$;

-- Fonction pour calculer total_cost_per_unit
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'calculate_total_cost_per_unit'
  ) THEN
    DROP FUNCTION public.calculate_total_cost_per_unit();
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.calculate_total_cost_per_unit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.total_cost_per_unit := 
    COALESCE(NEW.cost_of_goods_sold, 0) +
    COALESCE(NEW.manufacturing_cost, 0) +
    COALESCE(NEW.material_cost, 0) +
    COALESCE(NEW.labor_cost, 0) +
    COALESCE(NEW.packaging_cost, 0) +
    COALESCE(NEW.overhead_cost, 0) +
    COALESCE(NEW.shipping_cost_per_unit, 0) +
    COALESCE(NEW.storage_cost_per_unit, 0) +
    COALESCE(NEW.marketing_cost_per_unit, 0);
  RETURN NEW;
END;
$$;

-- Trigger pour calculer total_cost_per_unit
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'calculate_total_cost_per_unit_trigger'
  ) THEN
    CREATE TRIGGER calculate_total_cost_per_unit_trigger
      BEFORE INSERT OR UPDATE ON public.product_costs
      FOR EACH ROW
      EXECUTE FUNCTION public.calculate_total_cost_per_unit();
  END IF;
END $$;

-- Trigger updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_product_costs_updated_at'
  ) THEN
    CREATE TRIGGER update_product_costs_updated_at
      BEFORE UPDATE ON public.product_costs
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- =====================================================
-- 2. TABLE: margin_analysis
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'margin_analysis'
  ) THEN
    CREATE TABLE public.margin_analysis (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
      product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
      variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
      
      -- Période d'analyse
      analysis_period_start DATE NOT NULL,
      analysis_period_end DATE NOT NULL,
      analysis_date DATE NOT NULL DEFAULT CURRENT_DATE,
      
      -- Prix et revenus
      average_selling_price NUMERIC NOT NULL,
      total_revenue NUMERIC NOT NULL DEFAULT 0,
      total_units_sold INTEGER NOT NULL DEFAULT 0,
      
      -- Coûts
      total_cost_of_goods NUMERIC NOT NULL DEFAULT 0,
      total_variable_costs NUMERIC NOT NULL DEFAULT 0,
      total_fixed_costs NUMERIC NOT NULL DEFAULT 0,
      total_costs NUMERIC NOT NULL DEFAULT 0,
      
      -- Marges calculées (via trigger)
      gross_profit NUMERIC,
      gross_margin_percentage NUMERIC,
      net_profit NUMERIC,
      net_margin_percentage NUMERIC,
      contribution_margin NUMERIC,
      contribution_margin_percentage NUMERIC,
      
      -- Métriques avancées
      profit_per_unit NUMERIC,
      break_even_units NUMERIC, -- Nombre d'unités à vendre pour atteindre le seuil de rentabilité
      break_even_revenue NUMERIC, -- Revenu nécessaire pour atteindre le seuil de rentabilité
      
      -- Comparaison
      previous_period_margin NUMERIC, -- Marge période précédente
      margin_change_percentage NUMERIC, -- Variation de marge (%)
      
      -- Métadonnées
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  END IF;
END $$;

-- Indexes pour margin_analysis
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_margin_analysis_store_id'
  ) THEN
    CREATE INDEX idx_margin_analysis_store_id ON public.margin_analysis(store_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_margin_analysis_product_id'
  ) THEN
    CREATE INDEX idx_margin_analysis_product_id ON public.margin_analysis(product_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_margin_analysis_period'
  ) THEN
    CREATE INDEX idx_margin_analysis_period ON public.margin_analysis(analysis_period_start, analysis_period_end);
  END IF;
END $$;

-- Fonction pour calculer les marges
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'calculate_margin_metrics'
  ) THEN
    DROP FUNCTION public.calculate_margin_metrics();
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.calculate_margin_metrics()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Calculer marges
  NEW.gross_profit := COALESCE(NEW.total_revenue, 0) - COALESCE(NEW.total_cost_of_goods, 0);
  NEW.gross_margin_percentage := 
    CASE 
      WHEN NEW.total_revenue > 0 
      THEN ((NEW.total_revenue - COALESCE(NEW.total_cost_of_goods, 0)) / NEW.total_revenue) * 100
      ELSE 0
    END;
  
  NEW.net_profit := COALESCE(NEW.total_revenue, 0) - COALESCE(NEW.total_costs, 0);
  NEW.net_margin_percentage := 
    CASE 
      WHEN NEW.total_revenue > 0 
      THEN ((NEW.total_revenue - COALESCE(NEW.total_costs, 0)) / NEW.total_revenue) * 100
      ELSE 0
    END;
  
  NEW.contribution_margin := COALESCE(NEW.total_revenue, 0) - COALESCE(NEW.total_variable_costs, 0);
  NEW.contribution_margin_percentage := 
    CASE 
      WHEN NEW.total_revenue > 0 
      THEN ((NEW.total_revenue - COALESCE(NEW.total_variable_costs, 0)) / NEW.total_revenue) * 100
      ELSE 0
    END;
  
  NEW.profit_per_unit := 
    CASE 
      WHEN NEW.total_units_sold > 0 
      THEN (COALESCE(NEW.total_revenue, 0) - COALESCE(NEW.total_costs, 0)) / NEW.total_units_sold
      ELSE 0
    END;
  
  RETURN NEW;
END;
$$;

-- Trigger pour calculer les marges
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'calculate_margin_metrics_trigger'
  ) THEN
    CREATE TRIGGER calculate_margin_metrics_trigger
      BEFORE INSERT OR UPDATE ON public.margin_analysis
      FOR EACH ROW
      EXECUTE FUNCTION public.calculate_margin_metrics();
  END IF;
END $$;

-- Trigger updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_margin_analysis_updated_at'
  ) THEN
    CREATE TRIGGER update_margin_analysis_updated_at
      BEFORE UPDATE ON public.margin_analysis
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- =====================================================
-- 3. TABLE: price_optimization_recommendations
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'price_optimization_recommendations'
  ) THEN
    CREATE TABLE public.price_optimization_recommendations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
      product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
      variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
      
      -- Recommandation
      recommendation_type TEXT NOT NULL CHECK (recommendation_type IN (
        'increase_price',      -- Augmenter le prix
        'decrease_price',      -- Diminuer le prix
        'maintain_price',      -- Maintenir le prix
        'promotional_price',   -- Prix promotionnel
        'bundle_pricing',     -- Prix bundle
        'volume_discount'      -- Remise volume
      )),
      priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
      
      -- Prix actuel vs recommandé
      current_price NUMERIC NOT NULL,
      recommended_price NUMERIC NOT NULL,
      price_change_percentage NUMERIC,
      
      -- Impact prévu
      expected_revenue_change NUMERIC, -- Changement de revenu prévu
      expected_margin_change NUMERIC, -- Changement de marge prévu
      expected_volume_change NUMERIC, -- Changement de volume prévu (%)
      expected_profit_change NUMERIC, -- Changement de profit prévu
      
      -- Raisons
      reasoning JSONB DEFAULT '{}', -- Raisons de la recommandation
      factors_considered JSONB DEFAULT '{}', -- Facteurs considérés
      confidence_level NUMERIC DEFAULT 0.7, -- Niveau de confiance (0-1)
      
      -- Statut
      status TEXT NOT NULL CHECK (status IN (
        'pending',      -- En attente
        'approved',     -- Approuvé
        'implemented',  -- Implémenté
        'dismissed'     -- Ignoré
      )) DEFAULT 'pending',
      
      -- Métadonnées
      calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      calculated_by UUID REFERENCES auth.users(id),
      implemented_at TIMESTAMPTZ,
      implemented_by UUID REFERENCES auth.users(id),
      notes TEXT,
      
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  END IF;
END $$;

-- Indexes pour price_optimization_recommendations
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_price_optimization_store_id'
  ) THEN
    CREATE INDEX idx_price_optimization_store_id ON public.price_optimization_recommendations(store_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_price_optimization_status'
  ) THEN
    CREATE INDEX idx_price_optimization_status ON public.price_optimization_recommendations(status);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_price_optimization_priority'
  ) THEN
    CREATE INDEX idx_price_optimization_priority ON public.price_optimization_recommendations(priority);
  END IF;
END $$;

-- Fonction pour calculer price_change_percentage
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'calculate_price_change_percentage'
  ) THEN
    DROP FUNCTION public.calculate_price_change_percentage();
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.calculate_price_change_percentage()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.price_change_percentage := 
    CASE 
      WHEN NEW.current_price > 0 
      THEN ((NEW.recommended_price - NEW.current_price) / NEW.current_price) * 100
      ELSE 0
    END;
  RETURN NEW;
END;
$$;

-- Trigger pour calculer price_change_percentage
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'calculate_price_change_percentage_trigger'
  ) THEN
    CREATE TRIGGER calculate_price_change_percentage_trigger
      BEFORE INSERT OR UPDATE ON public.price_optimization_recommendations
      FOR EACH ROW
      EXECUTE FUNCTION public.calculate_price_change_percentage();
  END IF;
END $$;

-- Trigger updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_price_optimization_updated_at'
  ) THEN
    CREATE TRIGGER update_price_optimization_updated_at
      BEFORE UPDATE ON public.price_optimization_recommendations
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- =====================================================
-- 4. FUNCTIONS
-- =====================================================

-- Fonction pour calculer les marges d'un produit
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'calculate_product_margin'
  ) THEN
    DROP FUNCTION public.calculate_product_margin(UUID, UUID, UUID, DATE, DATE);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.calculate_product_margin(
  p_store_id UUID,
  p_product_id UUID,
  p_variant_id UUID DEFAULT NULL,
  p_period_start DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_period_end DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  total_revenue NUMERIC,
  total_cost_of_goods NUMERIC,
  total_variable_costs NUMERIC,
  total_fixed_costs NUMERIC,
  total_costs NUMERIC,
  gross_profit NUMERIC,
  gross_margin_percentage NUMERIC,
  net_profit NUMERIC,
  net_margin_percentage NUMERIC,
  total_units_sold INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_revenue NUMERIC := 0;
  v_cogs NUMERIC := 0;
  v_variable_costs NUMERIC := 0;
  v_fixed_costs NUMERIC := 0;
  v_total_costs NUMERIC := 0;
  v_units_sold INTEGER := 0;
  v_cost_per_unit NUMERIC := 0;
  v_avg_price NUMERIC := 0;
BEGIN
  -- Calculer revenus et unités vendues
  SELECT 
    COALESCE(SUM(oi.total_price), 0),
    COALESCE(SUM(oi.quantity), 0),
    COALESCE(AVG(oi.unit_price), 0)
  INTO v_revenue, v_units_sold, v_avg_price
  FROM public.order_items oi
  INNER JOIN public.orders o ON o.id = oi.order_id
  WHERE o.store_id = p_store_id
    AND oi.product_id = p_product_id
    AND (p_variant_id IS NULL OR oi.variant_id = p_variant_id)
    AND o.status = 'completed'
    AND o.created_at::DATE >= p_period_start
    AND o.created_at::DATE <= p_period_end;
  
  -- Récupérer coûts
  SELECT COALESCE(total_cost_per_unit, 0)
  INTO v_cost_per_unit
  FROM public.product_costs
  WHERE store_id = p_store_id
    AND product_id = p_product_id
    AND (p_variant_id IS NULL OR variant_id = p_variant_id)
  LIMIT 1;
  
  -- Calculer coûts totaux
  v_cogs := v_cost_per_unit * COALESCE(v_units_sold, 0);
  
  -- Coûts variables (frais plateforme, paiement, etc.)
  v_variable_costs := v_revenue * 0.05; -- 5% par défaut (à adapter)
  
  -- Coûts fixes (simplifié - à adapter selon besoins)
  v_fixed_costs := 0;
  
  v_total_costs := v_cogs + v_variable_costs + v_fixed_costs;
  
  RETURN QUERY SELECT
    v_revenue,
    v_cogs,
    v_variable_costs,
    v_fixed_costs,
    v_total_costs,
    v_revenue - v_cogs,
    CASE WHEN v_revenue > 0 THEN ((v_revenue - v_cogs) / v_revenue) * 100 ELSE 0 END,
    v_revenue - v_total_costs,
    CASE WHEN v_revenue > 0 THEN ((v_revenue - v_total_costs) / v_revenue) * 100 ELSE 0 END,
    COALESCE(v_units_sold, 0);
END;
$$;

-- Fonction pour générer recommandations d'optimisation de prix
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'generate_price_optimization_recommendations'
  ) THEN
    DROP FUNCTION public.generate_price_optimization_recommendations(UUID);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.generate_price_optimization_recommendations(p_store_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_product RECORD;
  v_margin RECORD;
  v_current_price NUMERIC;
  v_cost_per_unit NUMERIC;
  v_recommended_price NUMERIC;
  v_recommendation_type TEXT;
  v_count INTEGER := 0;
BEGIN
  -- Parcourir tous les produits physiques actifs
  FOR v_product IN
    SELECT DISTINCT
      p.id as product_id,
      pv.id as variant_id,
      COALESCE(pv.price, p.price) as current_price
    FROM public.products p
    LEFT JOIN public.product_variants pv ON pv.product_id = p.id
    WHERE p.store_id = p_store_id
      AND p.product_type = 'physical'
      AND p.is_active = true
  LOOP
    -- Récupérer coûts
    SELECT COALESCE(total_cost_per_unit, 0)
    INTO v_cost_per_unit
    FROM public.product_costs
    WHERE store_id = p_store_id
      AND product_id = v_product.product_id
      AND (v_product.variant_id IS NULL OR variant_id = v_product.variant_id)
    LIMIT 1;
    
    -- Si pas de coûts, passer au suivant
    IF v_cost_per_unit = 0 THEN
      CONTINUE;
    END IF;
    
    -- Calculer marge actuelle
    SELECT * INTO v_margin
    FROM public.calculate_product_margin(
      p_store_id,
      v_product.product_id,
      v_product.variant_id,
      CURRENT_DATE - INTERVAL '30 days',
      CURRENT_DATE
    );
    
    -- Générer recommandation basée sur la marge
    IF v_margin.net_margin_percentage < 10 THEN
      -- Marge trop faible, augmenter prix
      v_recommendation_type := 'increase_price';
      v_recommended_price := v_product.current_price * 1.15; -- Augmenter de 15%
    ELSIF v_margin.net_margin_percentage > 50 THEN
      -- Marge très élevée, possible réduction pour augmenter volume
      v_recommendation_type := 'decrease_price';
      v_recommended_price := v_product.current_price * 0.95; -- Réduire de 5%
    ELSE
      -- Marge acceptable, maintenir
      v_recommendation_type := 'maintain_price';
      v_recommended_price := v_product.current_price;
    END IF;
    
    -- Insérer recommandation
    INSERT INTO public.price_optimization_recommendations (
      store_id,
      product_id,
      variant_id,
      recommendation_type,
      priority,
      current_price,
      recommended_price,
      expected_revenue_change,
      expected_margin_change,
      confidence_level,
      status,
      reasoning
    )
    VALUES (
      p_store_id,
      v_product.product_id,
      v_product.variant_id,
      v_recommendation_type,
      CASE 
        WHEN v_margin.net_margin_percentage < 5 THEN 'urgent'
        WHEN v_margin.net_margin_percentage < 10 THEN 'high'
        ELSE 'normal'
      END,
      v_product.current_price,
      v_recommended_price,
      NULL, -- À calculer selon besoins
      v_margin.net_margin_percentage,
      0.7,
      'pending',
      jsonb_build_object(
        'current_margin', v_margin.net_margin_percentage,
        'current_cost', v_cost_per_unit,
        'analysis', 'Basé sur marge nette des 30 derniers jours'
      )
    )
    ON CONFLICT DO NOTHING;
    
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$;

-- =====================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Activer RLS
ALTER TABLE public.product_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.margin_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_optimization_recommendations ENABLE ROW LEVEL SECURITY;

-- Policies pour product_costs
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'product_costs' AND policyname = 'Store owners can manage costs'
  ) THEN
    CREATE POLICY "Store owners can manage costs" ON public.product_costs
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.stores s
          WHERE s.id = product_costs.store_id
          AND s.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Policies pour margin_analysis
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'margin_analysis' AND policyname = 'Store owners can view analysis'
  ) THEN
    CREATE POLICY "Store owners can view analysis" ON public.margin_analysis
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.stores s
          WHERE s.id = margin_analysis.store_id
          AND s.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Policies pour price_optimization_recommendations
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'price_optimization_recommendations' AND policyname = 'Store owners can manage recommendations'
  ) THEN
    CREATE POLICY "Store owners can manage recommendations" ON public.price_optimization_recommendations
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.stores s
          WHERE s.id = price_optimization_recommendations.store_id
          AND s.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================

