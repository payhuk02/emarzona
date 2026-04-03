-- Migration: Correction de la fonction generate_price_optimization_recommendations
-- Date: 2 Février 2025
-- Description: Corrige l'erreur "column pv.product_id does not exist" en utilisant la bonne hiérarchie de tables
--              products -> physical_products -> product_variants

-- ============================================================
-- 1. AJOUTER CONTRAINTE UNIQUE SI NÉCESSAIRE
-- ============================================================

-- Ajouter une contrainte unique sur (store_id, product_id, variant_id) si elle n'existe pas
-- Note: PostgreSQL permet NULL dans les contraintes uniques, donc on peut avoir plusieurs recommandations
-- avec variant_id = NULL pour le même produit. On va donc supprimer les anciennes recommandations
-- en attente avant d'insérer de nouvelles.

-- ============================================================
-- 2. CORRIGER FONCTION generate_price_optimization_recommendations
-- ============================================================

-- Supprimer l'ancienne fonction
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'generate_price_optimization_recommendations'
  ) THEN
    DROP FUNCTION public.generate_price_optimization_recommendations(UUID);
  END IF;
END $$;

-- Recréer la fonction avec la bonne structure de tables
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
  v_price_change_percentage NUMERIC;
  v_expected_profit_change NUMERIC;
  v_confidence_level NUMERIC;
BEGIN
  -- Supprimer les anciennes recommandations en attente pour ce store
  DELETE FROM public.price_optimization_recommendations
  WHERE store_id = p_store_id
    AND status = 'pending';
  
  -- Parcourir tous les produits physiques actifs avec leurs variants
  FOR v_product IN
    SELECT DISTINCT
      p.id as product_id,
      pp.id as physical_product_id,
      pv.id as variant_id,
      COALESCE(pv.price, p.price) as current_price
    FROM public.products p
    INNER JOIN public.physical_products pp ON pp.product_id = p.id
    LEFT JOIN public.product_variants pv ON pv.physical_product_id = pp.id
    WHERE p.store_id = p_store_id
      AND p.product_type = 'physical'
      AND p.is_active = true
      AND (pv.id IS NULL OR pv.is_available = true)
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
    IF v_cost_per_unit = 0 OR v_cost_per_unit IS NULL THEN
      CONTINUE;
    END IF;
    
    -- Calculer marge actuelle
    BEGIN
      SELECT * INTO v_margin
      FROM public.calculate_product_margin(
        p_store_id,
        v_product.product_id,
        v_product.variant_id,
        CURRENT_DATE - INTERVAL '30 days',
        CURRENT_DATE
      );
    EXCEPTION WHEN OTHERS THEN
      -- Si erreur dans le calcul de marge, passer au suivant
      CONTINUE;
    END;
    
    -- Vérifier que la marge a été calculée
    IF v_margin IS NULL OR v_margin.net_margin_percentage IS NULL THEN
      CONTINUE;
    END IF;
    
    -- Générer recommandation basée sur la marge
    IF v_margin.net_margin_percentage < 10 THEN
      -- Marge trop faible, augmenter prix
      v_recommendation_type := 'increase_price';
      v_recommended_price := v_product.current_price * 1.15; -- Augmenter de 15%
      v_price_change_percentage := 15.0;
      v_confidence_level := 0.8; -- Haute confiance pour marge faible
    ELSIF v_margin.net_margin_percentage > 50 THEN
      -- Marge très élevée, possible réduction pour augmenter volume
      v_recommendation_type := 'decrease_price';
      v_recommended_price := v_product.current_price * 0.95; -- Réduire de 5%
      v_price_change_percentage := -5.0;
      v_confidence_level := 0.6; -- Confiance moyenne pour optimisation de volume
    ELSE
      -- Marge acceptable, maintenir
      v_recommendation_type := 'maintain_price';
      v_recommended_price := v_product.current_price;
      v_price_change_percentage := 0.0;
      v_confidence_level := 0.7;
    END IF;
    
    -- Calculer changement de profit attendu (approximatif)
    IF v_margin.total_units_sold > 0 THEN
      v_expected_profit_change := (v_recommended_price - v_product.current_price) * v_margin.total_units_sold;
    ELSE
      v_expected_profit_change := NULL;
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
      price_change_percentage,
      expected_revenue_change,
      expected_profit_change,
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
      v_price_change_percentage,
      NULL, -- À calculer selon besoins
      v_expected_profit_change,
      v_margin.net_margin_percentage,
      v_confidence_level,
      'pending',
      jsonb_build_object(
        'current_margin', v_margin.net_margin_percentage,
        'current_cost', v_cost_per_unit,
        'current_revenue', v_margin.total_revenue,
        'units_sold', v_margin.total_units_sold,
        'analysis', 'Basé sur marge nette des 30 derniers jours'
      )
    );
    
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$;

-- ============================================================
-- COMMENTAIRES
-- ============================================================

COMMENT ON FUNCTION public.generate_price_optimization_recommendations(UUID) IS 
'Génère des recommandations d''optimisation de prix pour tous les produits physiques actifs d''un store. 
Utilise la hiérarchie correcte: products -> physical_products -> product_variants.';

