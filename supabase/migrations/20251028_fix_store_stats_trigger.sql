-- ============================================================
-- FIX: Corriger le trigger update_store_stats
-- Date: 28 octobre 2025
-- Problème: Le trigger vérifie NEW.status même sur la table customers
-- ============================================================

-- 1. Supprimer les anciens triggers s'ils existent
DROP TRIGGER IF EXISTS update_store_stats_on_customers ON public.customers;
DROP TRIGGER IF EXISTS update_store_stats_on_orders ON public.orders;
DROP TRIGGER IF EXISTS update_store_stats_on_products ON public.products;

-- 2. Supprimer l'ancienne fonction
DROP FUNCTION IF EXISTS public.update_store_stats() CASCADE;

-- 3. Créer une nouvelle fonction corrigée
CREATE OR REPLACE FUNCTION public.update_store_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Ne mettre à jour les stats que si c'est la table orders avec status completed
  IF TG_TABLE_NAME = 'orders' THEN
    -- Vérifier si la colonne status existe et est 'completed'
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.status = 'completed' THEN
      -- Mettre à jour les statistiques du store
      UPDATE stores 
      SET 
        total_orders = total_orders + 1,
        total_revenue = total_revenue + NEW.total_amount,
        updated_at = NOW()
      WHERE id = NEW.store_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Recréer uniquement le trigger sur la table orders
CREATE TRIGGER update_store_stats_on_orders
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_store_stats();

-- 5. Vérification
DO $$
BEGIN
  RAISE NOTICE '✅ Trigger update_store_stats corrigé et réactivé sur orders uniquement';
END $$;

