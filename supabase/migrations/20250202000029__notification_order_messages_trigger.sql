-- ================================================================
-- Notification System - Order Messages Trigger
-- Date: 2 Février 2025
-- Description: Trigger pour envoyer automatiquement des notifications
--              quand un message de commande est envoyé
-- ================================================================

-- Fonction pour envoyer une notification quand un message de commande est créé
CREATE OR REPLACE FUNCTION notify_order_message_sent()
RETURNS TRIGGER AS $$
DECLARE
  v_conversation RECORD;
  v_recipient_id UUID;
  v_sender_type TEXT;
  v_recipient_type TEXT;
  v_order_number TEXT;
  v_store_id UUID;
  v_store_name TEXT;
  v_message_preview TEXT;
BEGIN
  -- Récupérer les informations de la conversation
  SELECT 
    store_user_id,
    customer_user_id,
    order_id,
    store_id
  INTO v_conversation
  FROM public.conversations
  WHERE id = NEW.conversation_id;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- Récupérer le numéro de commande
  SELECT order_number INTO v_order_number
  FROM public.orders
  WHERE id = v_conversation.order_id;

  -- Récupérer le nom du store
  IF v_conversation.store_id IS NOT NULL THEN
    SELECT name INTO v_store_name
    FROM public.stores
    WHERE id = v_conversation.store_id;
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
    'order_message_received',
    CASE 
      WHEN v_recipient_type = 'store' THEN '💬 Nouveau message - Commande #' || COALESCE(v_order_number, '')
      ELSE '💬 Nouvelle réponse - Commande #' || COALESCE(v_order_number, '')
    END,
    CASE 
      WHEN v_recipient_type = 'store' THEN 
        'Vous avez reçu un nouveau message concernant la commande #' || COALESCE(v_order_number, '') || '.'
      ELSE 
        COALESCE(v_store_name || ' vous a répondu concernant votre commande #' || COALESCE(v_order_number, '') || '.', 
          'Le vendeur vous a répondu.')
    END,
    jsonb_build_object(
      'conversation_id', NEW.conversation_id,
      'message_id', NEW.id,
      'sender_id', NEW.sender_id,
      'sender_type', NEW.sender_type,
      'order_id', v_conversation.order_id,
      'order_number', v_order_number,
      'store_id', v_conversation.store_id,
      'store_name', v_store_name,
      'message_preview', v_message_preview
    ),
    '/orders/' || v_conversation.order_id || '/messages?conversation=' || NEW.conversation_id,
    'Voir le message',
    'high',
    false,
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger seulement si la table messages existe
DO $$
BEGIN
  -- Vérifier si la table messages existe
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'messages'
  ) THEN
    -- Supprimer le trigger s'il existe déjà
    DROP TRIGGER IF EXISTS order_message_notification_trigger ON public.messages;
    
    -- Créer le trigger
    CREATE TRIGGER order_message_notification_trigger
      AFTER INSERT ON public.messages
      FOR EACH ROW
      EXECUTE FUNCTION notify_order_message_sent();
    
    RAISE NOTICE 'Trigger order_message_notification_trigger créé avec succès';
  ELSE
    RAISE WARNING 'La table public.messages n''existe pas. Le trigger ne sera pas créé.';
    RAISE WARNING 'Assurez-vous d''appliquer la migration 20250122_advanced_payment_and_messaging.sql d''abord.';
  END IF;
END $$;

-- Note: Les notifications email et push seront gérées par les Edge Functions
-- qui écouteront les changements dans la table notifications

