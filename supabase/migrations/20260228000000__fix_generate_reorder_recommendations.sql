-- =====================================================
-- FIX: generate_reorder_recommendations RPC
-- Date: 2025-02-28
-- Description: Corrige la référence à la table product_variants pour l'inventaire
-- =====================================================

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
    LEFT JOIN public.product_variants pv ON pv.physical_product_id = p.id
    WHERE p.store_id = p_store_id
      AND p.product_type = 'physical'
  LOOP
    -- Récupérer stock actuel depuis physical_product_inventory au lieu de product_variants
    SELECT COALESCE(SUM(quantity_available), 0) INTO v_current_stock
    FROM public.physical_product_inventory
    WHERE product_id = v_product.product_id
      AND (v_product.variant_id IS NULL OR variant_id = v_product.variant_id);
    
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
      
      -- Insérer ou mettre à jour recommandation (évite les doublons)
      IF NOT EXISTS (
        SELECT 1 FROM public.reorder_recommendations
        WHERE store_id = p_store_id
          AND product_id = v_product.product_id
          AND ((variant_id IS NULL AND v_product.variant_id IS NULL) OR variant_id = v_product.variant_id)
          AND status = 'pending'
      ) THEN
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
        );
        
        v_count := v_count + 1;
      END IF;
    END IF;
  END LOOP;
  
  RETURN v_count;
END;
$$;
