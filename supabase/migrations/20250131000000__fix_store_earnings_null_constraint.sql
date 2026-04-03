-- =========================================================
-- MIGRATION : Correction de la contrainte NOT NULL pour store_earnings
-- Date : 2025-01-31
-- Description : Corrige la fonction update_store_earnings pour éviter les valeurs NULL
-- =========================================================

-- Corriger la fonction update_store_earnings pour gérer les valeurs NULL
CREATE OR REPLACE FUNCTION public.update_store_earnings(p_store_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_earnings RECORD;
  v_total_revenue NUMERIC := 0;
  v_total_platform_commission NUMERIC := 0;
  v_total_withdrawn NUMERIC := 0;
  v_available_balance NUMERIC := 0;
BEGIN
  -- Calculer les revenus
  SELECT * INTO v_earnings
  FROM public.calculate_store_earnings(p_store_id);
  
  -- S'assurer que les valeurs ne sont pas NULL
  v_total_revenue := COALESCE(v_earnings.total_revenue, 0);
  v_total_platform_commission := COALESCE(v_earnings.total_platform_commission, 0);
  v_total_withdrawn := COALESCE(v_earnings.total_withdrawn, 0);
  v_available_balance := COALESCE(v_earnings.available_balance, 0);
  
  -- S'assurer que le solde n'est pas négatif
  IF v_available_balance < 0 THEN
    v_available_balance := 0;
  END IF;
  
  -- Insérer ou mettre à jour store_earnings
  INSERT INTO public.store_earnings (
    store_id,
    total_revenue,
    total_platform_commission,
    total_withdrawn,
    available_balance,
    platform_commission_rate,
    last_calculated_at,
    updated_at
  )
  VALUES (
    p_store_id,
    v_total_revenue,
    v_total_platform_commission,
    v_total_withdrawn,
    v_available_balance,
    0.10, -- Taux par défaut
    now(),
    now()
  )
  ON CONFLICT (store_id)
  DO UPDATE SET
    total_revenue = v_total_revenue,
    total_platform_commission = v_total_platform_commission,
    total_withdrawn = v_total_withdrawn,
    available_balance = v_available_balance,
    last_calculated_at = now(),
    updated_at = now();
END;
$$;

COMMENT ON FUNCTION public.update_store_earnings IS 'Met à jour automatiquement les revenus et le solde disponible d''un store (version corrigée avec gestion des NULL)';

