-- ============================================================
-- AMÉLIORATION DES FONCTIONS SQL DE SEGMENTATION
-- Date: 1er Février 2025
-- Description: Implémentation complète de la logique de segmentation dynamique
-- ============================================================

-- ============================================================
-- 1. FUNCTION: calculate_dynamic_segment_members (AMÉLIORÉE)
-- Calcule les membres d'un segment dynamique avec critères avancés
-- ============================================================

CREATE OR REPLACE FUNCTION public.calculate_dynamic_segment_members(
  p_segment_id UUID
)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  calculated_at TIMESTAMPTZ
) AS $$
DECLARE
  v_criteria JSONB;
  v_type TEXT;
  v_store_id UUID;
  v_sql TEXT;
  v_conditions TEXT := '';
  v_filter_type TEXT;
  v_filter_value JSONB;
BEGIN
  -- Récupérer les critères du segment
  SELECT criteria, type, store_id
  INTO v_criteria, v_type, v_store_id
  FROM public.email_segments
  WHERE id = p_segment_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Segment not found: %', p_segment_id;
  END IF;

  -- Si segment statique, retourner vide (les segments statiques ne sont pas calculés)
  IF v_type = 'static' THEN
    RETURN;
  END IF;

  -- Construire la requête SQL dynamique selon les critères
  v_sql := '
    WITH user_base AS (
      SELECT DISTINCT
        u.id AS user_id,
        u.email::TEXT AS email
      FROM auth.users u
      WHERE u.email IS NOT NULL
        AND u.email != ''''
  ';

  -- Critères de segmentation basés sur les commandes
  IF v_criteria ? 'has_orders' THEN
    v_filter_value := v_criteria->'has_orders';
    IF (v_filter_value->>'value')::boolean THEN
      v_conditions := v_conditions || ' AND EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.customer_id IN (
          SELECT id FROM public.customers WHERE email = u.email
        )
        AND o.store_id = ''' || v_store_id::TEXT || '''
      )';
    END IF;
  END IF;

  -- Critères: Montant total des commandes
  IF v_criteria ? 'total_spent' THEN
    v_filter_value := v_criteria->'total_spent';
    v_filter_type := v_filter_value->>'operator'; -- 'greater_than', 'less_than', 'equals', 'between'
    
    IF v_filter_type = 'greater_than' THEN
      v_conditions := v_conditions || ' AND (
        SELECT COALESCE(SUM(total_amount), 0)
        FROM public.orders o
        JOIN public.customers c ON c.id = o.customer_id
        WHERE c.email = u.email
        AND o.store_id = ''' || v_store_id::TEXT || '''
        AND o.status = ''completed''
      ) > ' || (v_filter_value->>'value')::NUMERIC;
    ELSIF v_filter_type = 'less_than' THEN
      v_conditions := v_conditions || ' AND (
        SELECT COALESCE(SUM(total_amount), 0)
        FROM public.orders o
        JOIN public.customers c ON c.id = o.customer_id
        WHERE c.email = u.email
        AND o.store_id = ''' || v_store_id::TEXT || '''
        AND o.status = ''completed''
      ) < ' || (v_filter_value->>'value')::NUMERIC;
    ELSIF v_filter_type = 'equals' THEN
      v_conditions := v_conditions || ' AND (
        SELECT COALESCE(SUM(total_amount), 0)
        FROM public.orders o
        JOIN public.customers c ON c.id = o.customer_id
        WHERE c.email = u.email
        AND o.store_id = ''' || v_store_id::TEXT || '''
        AND o.status = ''completed''
      ) = ' || (v_filter_value->>'value')::NUMERIC;
    END IF;
  END IF;

  -- Critères: Nombre de commandes
  IF v_criteria ? 'order_count' THEN
    v_filter_value := v_criteria->'order_count';
    v_filter_type := v_filter_value->>'operator';
    
    IF v_filter_type = 'greater_than' THEN
      v_conditions := v_conditions || ' AND (
        SELECT COUNT(*)
        FROM public.orders o
        JOIN public.customers c ON c.id = o.customer_id
        WHERE c.email = u.email
        AND o.store_id = ''' || v_store_id::TEXT || '''
        AND o.status = ''completed''
      ) >= ' || (v_filter_value->>'value')::INTEGER;
    END IF;
  END IF;

  -- Critères: Date de dernière commande
  IF v_criteria ? 'last_order_date' THEN
    v_filter_value := v_criteria->'last_order_date';
    v_filter_type := v_filter_value->>'operator';
    
    IF v_filter_type = 'last_days' THEN
      v_conditions := v_conditions || ' AND EXISTS (
        SELECT 1
        FROM public.orders o
        JOIN public.customers c ON c.id = o.customer_id
        WHERE c.email = u.email
        AND o.store_id = ''' || v_store_id::TEXT || '''
        AND o.status = ''completed''
        AND o.created_at >= NOW() - INTERVAL ''' || (v_filter_value->>'value')::INTEGER || ' days''
      )';
    ELSIF v_filter_type = 'older_than' THEN
      v_conditions := v_conditions || ' AND NOT EXISTS (
        SELECT 1
        FROM public.orders o
        JOIN public.customers c ON c.id = o.customer_id
        WHERE c.email = u.email
        AND o.store_id = ''' || v_store_id::TEXT || '''
        AND o.status = ''completed''
        AND o.created_at >= NOW() - INTERVAL ''' || (v_filter_value->>'value')::INTEGER || ' days''
      )';
    END IF;
  END IF;

  -- Critères: Panier abandonné
  IF v_criteria ? 'has_abandoned_cart' THEN
    v_filter_value := v_criteria->'has_abandoned_cart';
    IF (v_filter_value->>'value')::boolean THEN
      v_conditions := v_conditions || ' AND EXISTS (
        SELECT 1
        FROM public.abandoned_carts ac
        WHERE ac.email = u.email
        AND ac.store_id = ''' || v_store_id::TEXT || '''
        AND ac.abandoned_at >= NOW() - INTERVAL ''7 days''
      )';
    END IF;
  END IF;

  -- Critères: Localisation (pays)
  IF v_criteria ? 'country' THEN
    v_filter_value := v_criteria->'country';
    IF v_filter_value ? 'values' THEN
      v_conditions := v_conditions || ' AND EXISTS (
        SELECT 1
        FROM public.customers c
        WHERE c.email = u.email
        AND c.store_id = ''' || v_store_id::TEXT || '''
        AND c.country = ANY(ARRAY[' || (
          SELECT string_agg('''' || value::TEXT || '''', ',')
          FROM jsonb_array_elements_text(v_filter_value->'values') AS value
        ) || '])
      )';
    END IF;
  END IF;

  -- Finaliser la requête
  v_sql := v_sql || v_conditions || '
    )
    SELECT 
      ub.user_id,
      ub.email,
      NOW() AS calculated_at
    FROM user_base ub
  ';

  -- Exécuter la requête dynamique
  RETURN QUERY EXECUTE v_sql;
  
EXCEPTION
  WHEN OTHERS THEN
    -- En cas d'erreur, retourner un résultat vide et logger
    RAISE WARNING 'Error calculating segment members: %', SQLERRM;
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.calculate_dynamic_segment_members IS 'Calcule les membres d''un segment dynamique basé sur des critères avancés (commandes, montant, comportement, localisation)';

-- ============================================================
-- 2. FUNCTION: update_segment_member_count (AMÉLIORÉE)
-- Met à jour le nombre de membres d'un segment
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_segment_member_count(
  p_segment_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
  v_type TEXT;
BEGIN
  -- Vérifier le type de segment
  SELECT type INTO v_type
  FROM public.email_segments
  WHERE id = p_segment_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Segment not found: %', p_segment_id;
  END IF;
  
  -- Pour les segments dynamiques, calculer le nombre réel
  IF v_type = 'dynamic' THEN
    SELECT COUNT(*)::INTEGER INTO v_count
    FROM public.calculate_dynamic_segment_members(p_segment_id);
  ELSE
    -- Pour les segments statiques, utiliser le count existant
    -- (les segments statiques sont gérés manuellement)
    SELECT member_count INTO v_count
    FROM public.email_segments
    WHERE id = p_segment_id;
  END IF;
  
  -- Mettre à jour le segment
  UPDATE public.email_segments
  SET 
    member_count = COALESCE(v_count, 0),
    last_calculated_at = NOW()
  WHERE id = p_segment_id;
  
  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.update_segment_member_count IS 'Met à jour le nombre de membres d''un segment (calcul dynamique pour segments dynamiques)';

