-- ================================================================
-- Notification System - Vendor Messages Trigger
-- Date: 2 Février 2025
-- Description: Trigger pour envoyer automatiquement des notifications
--              quand un message vendeur est envoyé
-- ================================================================

-- Fonction pour envoyer une notification quand un message vendeur est créé
CREATE OR REPLACE FUNCTION notify_vendor_message_sent()
RETURNS TRIGGER AS $$
DECLARE
  v_conversation RECORD;
  v_recipient_id UUID;
  v_sender_type TEXT;
  v_recipient_type TEXT;
  v_store_id UUID;
  v_product_id UUID;
  v_message_preview TEXT;
BEGIN
  -- Récupérer les informations de la conversation
  SELECT 
    store_user_id,
    customer_user_id,
    store_id,
    product_id
  INTO v_conversation
  FROM public.vendor_conversations
  WHERE id = NEW.conversation_id;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- Déterminer le destinataire et les types
  IF NEW.sender_type = 'customer' THEN
    v_recipient_id := v_conversation.store_user_id;
    v_recipient_type := 'store';
  ELSIF NEW.sender_type = 'store' THEN
    v_recipient_id := v_conversation.customer_user_id;
    v_recipient_type := 'customer';
  ELSE
    -- Pour admin, déterminer selon le contexte
    IF NEW.sender_id = v_conversation.store_user_id THEN
      v_recipient_id := v_conversation.customer_user_id;
      v_recipient_type := 'customer';
    ELSE
      v_recipient_id := v_conversation.store_user_id;
      v_recipient_type := 'store';
    END IF;
  END IF;

  -- Extraire un aperçu du message (premiers 100 caractères)
  v_message_preview := LEFT(NEW.content, 100);

  -- Créer la notification in-app
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    metadata,
    action_url,
    action_label,
    priority,
    is_read,
    created_at
  ) VALUES (
    v_recipient_id,
    CASE 
      WHEN v_recipient_type = 'store' THEN 'vendor_message_received'
      ELSE 'customer_message_received'
    END,
    CASE 
      WHEN v_recipient_type = 'store' THEN '💬 Nouveau message client'
      ELSE '💬 Nouvelle réponse du vendeur'
    END,
    CASE 
      WHEN v_recipient_type = 'store' THEN 
        COALESCE('Vous avez reçu un nouveau message de ' || 
          CASE WHEN NEW.sender_type = 'customer' THEN 'un client' ELSE 'l''administrateur' END || '.', 
          'Nouveau message')
      ELSE 
        COALESCE('Le vendeur vous a répondu.', 'Nouvelle réponse')
    END,
    jsonb_build_object(
      'conversation_id', NEW.conversation_id,
      'message_id', NEW.id,
      'sender_id', NEW.sender_id,
      'sender_type', NEW.sender_type,
      'store_id', v_conversation.store_id,
      'product_id', v_conversation.product_id,
      'message_preview', v_message_preview
    ),
    '/vendor/messaging?conversation=' || NEW.conversation_id,
    'Voir le message',
    'high',
    false,
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger
DROP TRIGGER IF EXISTS vendor_message_notification_trigger ON public.vendor_messages;
CREATE TRIGGER vendor_message_notification_trigger
  AFTER INSERT ON public.vendor_messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_vendor_message_sent();

-- Fonction pour notifier quand une nouvelle conversation est créée
CREATE OR REPLACE FUNCTION notify_vendor_conversation_started()
RETURNS TRIGGER AS $$
DECLARE
  v_product_name TEXT;
  v_store_name TEXT;
BEGIN
  -- Récupérer le nom du produit si disponible
  IF NEW.product_id IS NOT NULL THEN
    SELECT name INTO v_product_name
    FROM public.products
    WHERE id = NEW.product_id;
  END IF;

  -- Récupérer le nom du store
  SELECT name INTO v_store_name
  FROM public.stores
  WHERE id = NEW.store_id;

  -- Notifier le vendeur
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    metadata,
    action_url,
    action_label,
    priority,
    is_read,
    created_at
  ) VALUES (
    NEW.store_user_id,
    'vendor_conversation_started',
    '💬 Nouvelle conversation client',
    COALESCE(
      'Un client a démarré une conversation' || 
      CASE WHEN v_product_name IS NOT NULL THEN ' concernant "' || v_product_name || '".' ELSE '.' END,
      'Nouvelle conversation'
    ),
    jsonb_build_object(
      'conversation_id', NEW.id,
      'customer_id', NEW.customer_user_id,
      'store_id', NEW.store_id,
      'product_id', NEW.product_id,
      'product_name', v_product_name,
      'store_name', v_store_name,
      'subject', NEW.subject
    ),
    '/vendor/messaging?conversation=' || NEW.id,
    'Voir la conversation',
    'high',
    false,
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger pour nouvelle conversation
DROP TRIGGER IF EXISTS vendor_conversation_started_notification_trigger ON public.vendor_conversations;
CREATE TRIGGER vendor_conversation_started_notification_trigger
  AFTER INSERT ON public.vendor_conversations
  FOR EACH ROW
  EXECUTE FUNCTION notify_vendor_conversation_started();

-- Note: Les notifications email et push seront gérées par les Edge Functions
-- qui écouteront les changements dans la table notifications

