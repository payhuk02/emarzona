-- =========================================================
-- Migration : Correction mise à jour store_earnings lors de remboursements
-- Date : 30 Janvier 2025
-- Description : Modifie le trigger pour mettre à jour store_earnings quand une order est remboursée
-- 
-- INSTRUCTIONS :
-- 1. Copier ce fichier dans le Supabase SQL Editor
-- 2. Exécuter la requête
-- 3. Vérifier que la fonction a été mise à jour
-- =========================================================

-- Modifier le trigger pour aussi gérer les remboursements
CREATE OR REPLACE FUNCTION public.trigger_update_store_earnings_on_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Mettre à jour les revenus si la commande est complétée et payée
  IF NEW.status = 'completed' AND NEW.payment_status = 'paid' THEN
    PERFORM public.update_store_earnings(NEW.store_id);
  END IF;
  
  -- 🆕 Mettre à jour les revenus si la commande est remboursée
  -- Cela permet de recalculer store_earnings et d'exclure les orders remboursées du total_revenue
  IF NEW.payment_status = 'refunded' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'refunded') THEN
    PERFORM public.update_store_earnings(NEW.store_id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Commentaires
COMMENT ON FUNCTION public.trigger_update_store_earnings_on_order() IS 'Met à jour automatiquement store_earnings quand une commande est complétée et payée, ou quand elle est remboursée.';

-- Vérification (optionnel)
-- Décommenter pour vérifier que la fonction a été mise à jour
-- SELECT pg_get_functiondef(oid)
-- FROM pg_proc
-- WHERE proname = 'trigger_update_store_earnings_on_order';


