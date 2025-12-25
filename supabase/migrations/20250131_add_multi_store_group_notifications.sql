-- Migration: Notifications groupées pour commandes multi-stores
-- Date: 2025-01-31
-- Description: Ajoute une fonction pour vérifier si toutes les commandes d'un groupe multi-stores sont payées
--              et créer une notification groupée

-- Fonction pour vérifier si toutes les commandes d'un groupe multi-stores sont payées
-- et créer une notification groupée si c'est le cas
CREATE OR REPLACE FUNCTION check_and_notify_multi_store_group_completion(
  p_order_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order RECORD;
  v_group_id TEXT;
  v_group_orders JSONB[];
  v_all_paid BOOLEAN := false;
  v_total_amount NUMERIC := 0;
  v_order_count INTEGER := 0;
  v_paid_count INTEGER := 0;
  v_order_numbers TEXT[];
  v_first_store_id UUID;
BEGIN
  -- Récupérer la commande et ses metadata
  SELECT 
    o.id,
    o.customer_id,
    o.metadata,
    o.total_amount,
    o.order_number
  INTO v_order
  FROM orders o
  WHERE o.id = p_order_id;

  -- Si la commande n'existe pas ou n'est pas payée, sortir
  IF v_order IS NULL OR v_order.metadata IS NULL THEN
    RETURN;
  END IF;

  -- Extraire le group_id des metadata
  -- Les metadata peuvent être JSONB ou TEXT
  IF v_order.metadata ? 'multi_store' AND (v_order.metadata->>'multi_store')::boolean = true THEN
    IF v_order.metadata ? 'group_id' THEN
      v_group_id := v_order.metadata->>'group_id';
    ELSE
      -- Pas de group_id, pas de groupe multi-stores
      RETURN;
    END IF;
  ELSE
    -- Pas une commande multi-stores
    RETURN;
  END IF;

  -- Vérifier que la commande est payée
  IF NOT EXISTS (
    SELECT 1 
    FROM orders 
    WHERE id = p_order_id 
      AND payment_status = 'paid'
  ) THEN
    -- La commande n'est pas encore payée, sortir
    RETURN;
  END IF;

  -- Récupérer les statistiques du groupe
  SELECT 
    COUNT(*) as total_count,
    COALESCE(SUM(total_amount) FILTER (WHERE payment_status = 'paid'), 0) as paid_total
  INTO 
    v_order_count,
    v_total_amount
  FROM orders
  WHERE metadata->>'group_id' = v_group_id
    AND customer_id = v_order.customer_id;

  -- Vérifier si toutes les commandes sont payées
  SELECT 
    (COUNT(*) = COUNT(*) FILTER (WHERE payment_status = 'paid'))
  INTO v_all_paid
  FROM orders
  WHERE metadata->>'group_id' = v_group_id
    AND customer_id = v_order.customer_id;

  -- Récupérer les commandes pour les metadata
  SELECT array_agg(
    jsonb_build_object(
      'id', id,
      'order_number', order_number,
      'total_amount', total_amount,
      'payment_status', payment_status
    )
  )
  INTO v_group_orders
  FROM orders
  WHERE metadata->>'group_id' = v_group_id
    AND customer_id = v_order.customer_id;

  -- Si toutes les commandes sont payées, créer une notification groupée
  IF v_all_paid AND v_order_count > 1 THEN
    -- Récupérer les numéros de commande
    SELECT array_agg(order_number ORDER BY created_at)
    INTO v_order_numbers
    FROM orders
    WHERE metadata->>'group_id' = v_group_id
      AND customer_id = v_order.customer_id
      AND payment_status = 'paid';

    -- Vérifier si une notification groupée n'existe pas déjà pour ce groupe
    IF NOT EXISTS (
      SELECT 1 
      FROM notifications 
      WHERE user_id = v_order.customer_id
        AND type = 'multi_store_group_completed'
        AND metadata->>'group_id' = v_group_id
        AND created_at > NOW() - INTERVAL '1 minute'
    ) THEN
      -- Créer la notification groupée
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        metadata,
        is_read
      ) VALUES (
        v_order.customer_id,
        'multi_store_group_completed',
        '🎉 Toutes vos commandes multi-stores ont été payées !',
        format(
          'Toutes vos %s commande(s) du groupe multi-stores ont été payées avec succès. Montant total : %s XOF',
          v_order_count,
          v_total_amount::text
        ),
        jsonb_build_object(
          'group_id', v_group_id,
          'order_count', v_order_count,
          'total_amount', v_total_amount,
          'order_numbers', v_order_numbers,
          'orders', v_group_orders
        ),
        false
      );

      -- 🆕 Déclencher le webhook multi_store_group.completed
      -- Récupérer le premier store_id du groupe pour le webhook
      BEGIN
        SELECT store_id INTO v_first_store_id
        FROM orders
        WHERE metadata->>'group_id' = v_group_id
          AND customer_id = v_order.customer_id
        LIMIT 1;

        IF v_first_store_id IS NOT NULL THEN
          -- Utiliser order.completed comme type d'événement (le nouveau type sera ajouté via migration)
          -- Les métadonnées indiqueront qu'il s'agit d'un groupe multi-stores
          BEGIN
            PERFORM public.trigger_webhook(
              'multi_store_group.completed'::webhook_event_type,
              v_group_id,
              jsonb_build_object(
                'group_id', v_group_id,
                'customer_id', v_order.customer_id,
                'order_count', v_order_count,
                'total_amount', v_total_amount,
                'order_numbers', v_order_numbers,
                'orders', v_group_orders,
                'completed_at', NOW(),
                'multi_store', true
              ),
              v_first_store_id
            );
          EXCEPTION
            WHEN invalid_parameter_value THEN
              -- Si le type d'événement n'existe pas encore, utiliser order.completed comme fallback
              PERFORM public.trigger_webhook(
                'order.completed'::webhook_event_type,
                v_group_id,
                jsonb_build_object(
                  'event_type', 'multi_store_group.completed',
                  'group_id', v_group_id,
                  'customer_id', v_order.customer_id,
                  'order_count', v_order_count,
                  'total_amount', v_total_amount,
                  'order_numbers', v_order_numbers,
                  'orders', v_group_orders,
                  'completed_at', NOW(),
                  'multi_store', true
                ),
                v_first_store_id
              );
          END;
        END IF;
      EXCEPTION
        WHEN OTHERS THEN
          -- Logger l'erreur mais ne pas bloquer
          RAISE WARNING 'Error triggering multi_store_group.completed webhook: %', SQLERRM;
      END;
    END IF;
  END IF;
END;
$$;

-- Commentaire sur la fonction
COMMENT ON FUNCTION check_and_notify_multi_store_group_completion IS 
'Vérifie si toutes les commandes d''un groupe multi-stores sont payées et crée une notification groupée si c''est le cas';

-- Créer un trigger pour appeler cette fonction après mise à jour d'une commande
-- Ce trigger sera appelé après chaque mise à jour du payment_status d'une commande
CREATE OR REPLACE FUNCTION trigger_multi_store_group_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Appeler la fonction de vérification si la commande est payée
  IF NEW.payment_status = 'paid' AND OLD.payment_status != 'paid' THEN
    PERFORM check_and_notify_multi_store_group_completion(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS check_multi_store_group_completion_trigger ON orders;

-- Créer le trigger
CREATE TRIGGER check_multi_store_group_completion_trigger
AFTER UPDATE OF payment_status ON orders
FOR EACH ROW
WHEN (NEW.payment_status = 'paid' AND OLD.payment_status != 'paid')
EXECUTE FUNCTION trigger_multi_store_group_notification();

COMMENT ON TRIGGER check_multi_store_group_completion_trigger ON orders IS 
'Déclenche la vérification de complétion du groupe multi-stores après paiement d''une commande';

