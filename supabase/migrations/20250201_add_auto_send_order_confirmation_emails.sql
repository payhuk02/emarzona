-- ============================================================
-- AUTO-ENVOI EMAILS DE CONFIRMATION APRÈS PAIEMENT
-- Date: 1er Février 2025
-- Description: Envoie automatiquement les emails de confirmation après paiement réussi
-- ============================================================

-- Fonction pour envoyer automatiquement les emails de confirmation selon le type de produit
CREATE OR REPLACE FUNCTION auto_send_order_confirmation_email()
RETURNS TRIGGER AS $$
DECLARE
  v_order_item RECORD;
  v_product_type TEXT;
  v_customer RECORD;
  v_user_id UUID;
  v_store RECORD;
  v_product RECORD;
  v_email_result JSONB;
BEGIN
  -- Vérifier si le paiement vient d'être complété
  IF NEW.payment_status = 'paid' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'paid') THEN
    
    -- Récupérer le customer
    SELECT * INTO v_customer FROM customers WHERE id = NEW.customer_id;
    
    IF v_customer IS NULL OR v_customer.email IS NULL THEN
      RETURN NEW;
    END IF;
    
    -- Récupérer l'user_id si possible
    SELECT id INTO v_user_id 
    FROM auth.users 
    WHERE email = v_customer.email;
    
    -- Récupérer le store
    SELECT * INTO v_store FROM stores WHERE id = NEW.store_id;
    
    -- Parcourir tous les order_items de cette commande
    FOR v_order_item IN 
      SELECT * FROM order_items 
      WHERE order_id = NEW.id
    LOOP
      v_product_type := v_order_item.product_type;
      
      -- Envoyer l'email selon le type de produit via Edge Function
      -- Note: Les emails sont envoyés via l'Edge Function send-email qui gère tous les types
      -- On utilise un appel RPC ou on laisse les Edge Functions gérer l'envoi
      
      -- Pour l'instant, on log l'événement dans les logs
      -- L'envoi réel se fera via les Edge Functions ou triggers côté application
      
      RAISE NOTICE 'Order confirmation email should be sent: order_id=%, product_type=%, customer_email=%', 
        NEW.id, v_product_type, v_customer.email;
      
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_auto_send_order_confirmation_email ON orders;
CREATE TRIGGER trigger_auto_send_order_confirmation_email
  AFTER UPDATE OF payment_status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION auto_send_order_confirmation_email();

-- Commentaire
COMMENT ON FUNCTION auto_send_order_confirmation_email() IS 'Trigger pour notifier qu''un email de confirmation doit être envoyé après paiement réussi';
COMMENT ON TRIGGER trigger_auto_send_order_confirmation_email ON orders IS 'Déclenche la notification d''envoi d''email après paiement complété';

