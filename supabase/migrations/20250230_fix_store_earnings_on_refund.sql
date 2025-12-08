-- =========================================================
-- Migration : Correction mise à jour store_earnings lors de remboursements
-- Date : 30 Janvier 2025
-- Description : Modifie le trigger pour mettre à jour store_earnings quand une order est remboursée
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

-- Le trigger existant sera automatiquement mis à jour car il utilise la fonction ci-dessus
-- Pas besoin de recréer le trigger, il utilisera la nouvelle version de la fonction

-- Commentaires
COMMENT ON FUNCTION public.trigger_update_store_earnings_on_order() IS 'Met à jour automatiquement store_earnings quand une commande est complétée et payée, ou quand elle est remboursée.';

