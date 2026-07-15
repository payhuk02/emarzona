-- =====================================================
-- FIX: get_admin_sales_stats RPC and payments FK
-- Date: 2026-07-15
-- Description: Corrige la colonne percentage_amount et ajoute la foreign key manquante vers stores
-- =====================================================

-- 1. Create missing foreign key for payments to stores
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'payments_store_id_fkey'
  ) THEN
    ALTER TABLE public.payments 
      ADD CONSTRAINT payments_store_id_fkey 
      FOREIGN KEY (store_id) 
      REFERENCES public.stores(id) 
      ON DELETE CASCADE;
  END IF;
END $$;

-- 2. Update the RPC to use percentage_amount instead of commission_amount
CREATE OR REPLACE FUNCTION public.get_admin_sales_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_revenue numeric;
  v_total_commissions numeric;
  v_total_count integer;
BEGIN
  -- Calcul des totaux sur les paiements complétés
  SELECT 
    COALESCE(SUM(amount), 0),
    COALESCE(SUM(percentage_amount), 0),
    COUNT(*)
  INTO 
    v_total_revenue,
    v_total_commissions,
    v_total_count
  FROM public.payments
  WHERE status = 'completed';

  RETURN json_build_object(
    'total_revenue', v_total_revenue,
    'total_commissions', v_total_commissions,
    'total_count', v_total_count
  );
END;
$$;
