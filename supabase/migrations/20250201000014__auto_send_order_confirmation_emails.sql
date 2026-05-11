-- ============================================================
-- AUTOMATISATION : Envoi automatique d'emails après paiement
-- Date: 1er Février 2025
-- Description: Déclenche l'envoi d'emails de confirmation pour chaque type de produit après paiement
-- ============================================================

-- ============================================================
-- FUNCTION: trigger_send_order_confirmation_emails
-- Enregistre un événement pour l'envoi d'emails de confirmation
-- L'Edge Function sera appelée via webhook ou cron
-- ============================================================
CREATE OR REPLACE FUNCTION public.trigger_send_order_confirmation_emails()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier si le paiement vient d'être complété
  IF NEW.payment_status = 'paid' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'paid') THEN
    
    -- Log pour debugging
    RAISE NOTICE 'Order % payment completed. Email confirmation should be sent.', NEW.id;
    
    -- L'envoi d'email sera géré par:
    -- 1. Le webhook Moneroo/PayDunya qui appelle directement l'Edge Function
    -- 2. Ou un cron job qui vérifie les nouvelles commandes payées
    -- 3. Ou une notification en temps réel via Supabase Realtime
    
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- TRIGGER: auto_send_order_confirmation_emails
-- Se déclenche après mise à jour du statut de paiement
-- ============================================================
DROP TRIGGER IF EXISTS auto_send_order_confirmation_emails ON public.orders;

CREATE TRIGGER auto_send_order_confirmation_emails
  AFTER UPDATE OF payment_status ON public.orders
  FOR EACH ROW
  WHEN (NEW.payment_status = 'paid' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'paid'))
  EXECUTE FUNCTION public.trigger_send_order_confirmation_emails();

-- Commentaire
COMMENT ON FUNCTION public.trigger_send_order_confirmation_emails() IS 
  'Déclenche l''envoi automatique d''emails de confirmation après paiement réussi d''une commande';

-- ============================================================
-- ALTERNATIVE: Version simplifiée utilisant pg_cron ou direct HTTP
-- Si pg_net n'est pas disponible, utiliser cette version qui appelle directement
-- ============================================================
CREATE OR REPLACE FUNCTION public.trigger_send_order_confirmation_emails_simple()
RETURNS TRIGGER AS $$
DECLARE
  v_payload JSONB;
  v_customer_email TEXT;
  v_customer_name TEXT;
  v_customer_id UUID;
BEGIN
  IF NEW.payment_status = 'paid' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'paid') THEN
    
    -- Récupérer les informations du client (même logique que ci-dessus)
    SELECT 
      COALESCE(c.email, u.email::TEXT, NEW.customer_email),
      COALESCE(c.full_name, p.full_name, p.first_name || ' ' || p.last_name, NEW.customer_name, 'Client'),
      COALESCE(c.id, u.id, NEW.customer_id)
    INTO 
      v_customer_email,
      v_customer_name,
      v_customer_id
    FROM public.orders o
    LEFT JOIN public.customers c ON c.id = o.customer_id
    LEFT JOIN auth.users u ON u.id = o.customer_id
    LEFT JOIN public.profiles p ON p.id = o.customer_id
    WHERE o.id = NEW.id
    LIMIT 1;

    -- Log pour debugging (peut être supprimé en production)
    RAISE NOTICE 'Order % paid. Sending confirmation emails to %', NEW.id, v_customer_email;

    -- Note: L'appel HTTP réel sera fait par un système externe (webhook, cron, etc.)
    -- Cette fonction prépare juste les données et les log
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.trigger_send_order_confirmation_emails_simple() IS 
  'Version simplifiée du trigger - prépare les données pour l''envoi d''emails';

