-- =====================================================
-- Migration: Auto-award gamification points on order completion
-- Date: 28 Février 2025
-- Description: Trigger pour attribuer automatiquement des points de gamification
--              lors de la completion d'une commande pour tous les types de produits
-- =====================================================

-- Fonction pour attribuer des points de gamification lors de la completion d'une commande
CREATE OR REPLACE FUNCTION public.trigger_award_gamification_points_on_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_id UUID;
  v_order_items RECORD;
  v_points_to_award INTEGER;
  v_product_type TEXT;
  v_source_description TEXT;
  v_total_points INTEGER := 0;
BEGIN
  -- Vérifier si la commande vient d'être complétée et payée
  -- Pour INSERT: vérifier seulement NEW
  -- Pour UPDATE: vérifier que le statut a changé
  IF NEW.status = 'completed' 
     AND NEW.payment_status = 'paid' 
     AND (
       TG_OP = 'INSERT' 
       OR (TG_OP = 'UPDATE' AND (OLD.status IS NULL OR OLD.status != 'completed' OR OLD.payment_status != 'paid'))
     ) THEN
    
    -- Récupérer le customer_id
    v_customer_id := NEW.customer_id;
    
    -- Si pas de customer_id, ne rien faire
    IF v_customer_id IS NULL THEN
      RETURN NEW;
    END IF;
    
    -- Parcourir tous les items de la commande
    FOR v_order_items IN
      SELECT 
        oi.id,
        oi.product_id,
        oi.product_type,
        oi.quantity,
        oi.price,
        oi.total_price,
        p.name as product_name
      FROM public.order_items oi
      LEFT JOIN public.products p ON p.id = oi.product_id
      WHERE oi.order_id = NEW.id
    LOOP
      -- Calculer les points selon le type de produit
      -- Base: 10 points par produit, avec bonus selon le type
      v_points_to_award := 10 * COALESCE(v_order_items.quantity, 1);
      
      -- Bonus selon le type de produit (tous les 5 types sont pris en compte)
      CASE v_order_items.product_type
        WHEN 'digital' THEN
          -- Produits digitaux: bonus de 5 points
          v_points_to_award := v_points_to_award + (5 * COALESCE(v_order_items.quantity, 1));
          v_source_description := 'Achat produit digital: ' || COALESCE(v_order_items.product_name, 'Produit digital');
        WHEN 'physical' THEN
          -- Produits physiques: bonus de 10 points (plus complexe à gérer)
          v_points_to_award := v_points_to_award + (10 * COALESCE(v_order_items.quantity, 1));
          v_source_description := 'Achat produit physique: ' || COALESCE(v_order_items.product_name, 'Produit physique');
        WHEN 'service' THEN
          -- Services: bonus de 15 points (engagement client)
          v_points_to_award := v_points_to_award + (15 * COALESCE(v_order_items.quantity, 1));
          v_source_description := 'Achat service: ' || COALESCE(v_order_items.product_name, 'Service');
        WHEN 'course' THEN
          -- Cours: bonus de 20 points (apprentissage)
          v_points_to_award := v_points_to_award + (20 * COALESCE(v_order_items.quantity, 1));
          v_source_description := 'Achat cours: ' || COALESCE(v_order_items.product_name, 'Cours');
        WHEN 'artist' THEN
          -- Oeuvres d'artiste: bonus de 25 points (création unique)
          v_points_to_award := v_points_to_award + (25 * COALESCE(v_order_items.quantity, 1));
          v_source_description := 'Achat oeuvre d''artiste: ' || COALESCE(v_order_items.product_name, 'Oeuvre d''artiste');
        ELSE
          -- Type inconnu: points de base uniquement
          v_source_description := 'Achat produit: ' || COALESCE(v_order_items.product_name, 'Produit');
      END CASE;
      
      -- Ajouter les points au total
      v_total_points := v_total_points + v_points_to_award;
      
      -- Attribuer les points via la fonction RPC
      PERFORM public.award_global_points(
        p_user_id := v_customer_id,
        p_points := v_points_to_award,
        p_source_type := 'purchase',
        p_source_id := NEW.id,
        p_source_description := v_source_description
      );
    END LOOP;
    
    -- Si des points ont été attribués, mettre à jour total_products_purchased et total_orders_completed
    IF v_total_points > 0 THEN
      UPDATE public.user_gamification
      SET
        total_products_purchased = total_products_purchased + (
          SELECT COUNT(*) FROM public.order_items WHERE order_id = NEW.id
        ),
        total_orders_completed = total_orders_completed + 1
      WHERE user_id = v_customer_id;
    END IF;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Logger l'erreur mais ne pas bloquer la commande
    RAISE WARNING 'Error awarding gamification points for order %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Créer le trigger sur la table orders pour INSERT
DROP TRIGGER IF EXISTS award_gamification_points_on_order_inserted ON public.orders;
CREATE TRIGGER award_gamification_points_on_order_inserted
  AFTER INSERT ON public.orders
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND NEW.payment_status = 'paid')
  EXECUTE FUNCTION public.trigger_award_gamification_points_on_order();

-- Créer le trigger sur la table orders pour UPDATE
DROP TRIGGER IF EXISTS award_gamification_points_on_order_updated ON public.orders;
CREATE TRIGGER award_gamification_points_on_order_updated
  AFTER UPDATE OF status, payment_status ON public.orders
  FOR EACH ROW
  WHEN (
    NEW.status = 'completed' 
    AND NEW.payment_status = 'paid'
    AND (OLD.status IS NULL OR OLD.status != 'completed' OR OLD.payment_status != 'paid')
  )
  EXECUTE FUNCTION public.trigger_award_gamification_points_on_order();

-- Commentaires
COMMENT ON FUNCTION public.trigger_award_gamification_points_on_order() IS 
  'Trigger automatique pour attribuer des points de gamification lors de la completion d''une commande pour tous les types de produits (digital, physical, service, course, artist)';

COMMENT ON TRIGGER award_gamification_points_on_order_inserted ON public.orders IS 
  'Déclenche l''attribution automatique de points de gamification lors de la création d''une commande complétée et payée';

COMMENT ON TRIGGER award_gamification_points_on_order_updated ON public.orders IS 
  'Déclenche l''attribution automatique de points de gamification lors de la mise à jour d''une commande vers le statut complété et payé';

