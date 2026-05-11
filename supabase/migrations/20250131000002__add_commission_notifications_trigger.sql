-- Migration: Triggers pour notifications automatiques de commissions
-- Date: 31 Janvier 2025
-- Description: Crée les triggers pour envoyer automatiquement des notifications lors d'événements de commissions

-- Fonction pour notifier la création d'une commission d'affiliation
CREATE OR REPLACE FUNCTION public.notify_affiliate_commission_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_affiliate_user_id UUID;
  v_product_name TEXT;
  v_order_number TEXT;
BEGIN
  -- Récupérer l'ID utilisateur de l'affilié
  SELECT user_id INTO v_affiliate_user_id
  FROM public.affiliates
  WHERE id = NEW.affiliate_id;

  -- Récupérer le nom du produit
  SELECT name INTO v_product_name
  FROM public.products
  WHERE id = NEW.product_id;

  -- Récupérer le numéro de commande
  SELECT order_number INTO v_order_number
  FROM public.orders
  WHERE id = NEW.order_id;

  -- Créer la notification (sera gérée par l'application via Edge Function)
  -- On insère simplement dans la table notifications
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    metadata,
    is_read
  ) VALUES (
    v_affiliate_user_id,
    'commission_created',
    '🎉 Nouvelle commission !',
    'Une commission de ' || NEW.commission_amount::TEXT || ' XOF a été créée pour la commande ' || COALESCE(v_order_number, 'N/A'),
    jsonb_build_object(
      'commission_id', NEW.id,
      'affiliate_id', NEW.affiliate_id,
      'amount', NEW.commission_amount,
      'currency', 'XOF',
      'order_id', NEW.order_id,
      'order_number', v_order_number,
      'product_name', v_product_name
    ),
    false
  );

  RETURN NEW;
END;
$$;

-- Trigger pour notifier la création d'une commission d'affiliation
DROP TRIGGER IF EXISTS trigger_notify_affiliate_commission_created ON public.affiliate_commissions;
CREATE TRIGGER trigger_notify_affiliate_commission_created
  AFTER INSERT ON public.affiliate_commissions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_affiliate_commission_created();

-- Fonction pour notifier l'approbation/rejet d'une commission d'affiliation
CREATE OR REPLACE FUNCTION public.notify_affiliate_commission_status_changed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_affiliate_user_id UUID;
  v_product_name TEXT;
  v_order_number TEXT;
  v_notification_type TEXT;
  v_title TEXT;
  v_message TEXT;
BEGIN
  -- Ne notifier que si le statut change vers 'approved' ou 'rejected'
  IF (OLD.status IS DISTINCT FROM NEW.status) AND NEW.status IN ('approved', 'rejected') THEN
    -- Récupérer l'ID utilisateur de l'affilié
    SELECT user_id INTO v_affiliate_user_id
    FROM public.affiliates
    WHERE id = NEW.affiliate_id;

    -- Récupérer le nom du produit
    SELECT name INTO v_product_name
    FROM public.products
    WHERE id = NEW.product_id;

    -- Récupérer le numéro de commande
    SELECT order_number INTO v_order_number
    FROM public.orders
    WHERE id = NEW.order_id;

    -- Déterminer le type de notification
    IF NEW.status = 'approved' THEN
      v_notification_type := 'commission_approved';
      v_title := '✅ Commission approuvée';
      v_message := 'Votre commission de ' || NEW.commission_amount::TEXT || ' XOF a été approuvée';
    ELSE
      v_notification_type := 'commission_rejected';
      v_title := '❌ Commission rejetée';
      v_message := 'Votre commission de ' || NEW.commission_amount::TEXT || ' XOF a été rejetée';
    END IF;

    -- Créer la notification
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      metadata,
      is_read
    ) VALUES (
      v_affiliate_user_id,
      v_notification_type,
      v_title,
      v_message,
      jsonb_build_object(
        'commission_id', NEW.id,
        'affiliate_id', NEW.affiliate_id,
        'amount', NEW.commission_amount,
        'currency', 'XOF',
        'order_id', NEW.order_id,
        'order_number', v_order_number,
        'product_name', v_product_name
      ),
      false
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger pour notifier les changements de statut des commissions d'affiliation
DROP TRIGGER IF EXISTS trigger_notify_affiliate_commission_status_changed ON public.affiliate_commissions;
CREATE TRIGGER trigger_notify_affiliate_commission_status_changed
  AFTER UPDATE OF status ON public.affiliate_commissions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_affiliate_commission_status_changed();

-- Fonction pour notifier la création d'une commission de parrainage
CREATE OR REPLACE FUNCTION public.notify_referral_commission_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_number TEXT;
BEGIN
  -- Récupérer le numéro de commande
  SELECT order_number INTO v_order_number
  FROM public.orders
  WHERE id = NEW.order_id;

  -- Créer la notification pour le parrain
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    metadata,
    is_read
  ) VALUES (
    NEW.referrer_id,
    'commission_created',
    '🎉 Nouvelle commission de parrainage !',
    'Une commission de ' || NEW.commission_amount::TEXT || ' XOF a été créée pour la commande ' || COALESCE(v_order_number, 'N/A'),
    jsonb_build_object(
      'commission_id', NEW.id,
      'referrer_id', NEW.referrer_id,
      'referred_id', NEW.referred_id,
      'amount', NEW.commission_amount,
      'currency', 'XOF',
      'order_id', NEW.order_id,
      'order_number', v_order_number
    ),
    false
  );

  RETURN NEW;
END;
$$;

-- Trigger pour notifier la création d'une commission de parrainage (seulement si la table existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'referral_commissions'
  ) THEN
    DROP TRIGGER IF EXISTS trigger_notify_referral_commission_created ON public.referral_commissions;
    CREATE TRIGGER trigger_notify_referral_commission_created
      AFTER INSERT ON public.referral_commissions
      FOR EACH ROW
      EXECUTE FUNCTION public.notify_referral_commission_created();
  END IF;
END $$;

-- Fonction pour notifier le traitement d'un paiement de commission
CREATE OR REPLACE FUNCTION public.notify_commission_payment_processed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_notification_type TEXT;
  v_title TEXT;
  v_message TEXT;
BEGIN
  -- Ne notifier que si le statut change vers 'completed'
  IF (OLD.status IS DISTINCT FROM NEW.status) AND NEW.status = 'completed' THEN
    -- Déterminer l'utilisateur selon le type de paiement
    IF NEW.affiliate_id IS NOT NULL THEN
      -- Paiement d'affiliation
      SELECT user_id INTO v_user_id
      FROM public.affiliates
      WHERE id = NEW.affiliate_id;
      
      v_notification_type := 'commission_paid';
      v_title := '💰 Commission payée !';
      v_message := 'Votre commission de ' || NEW.amount::TEXT || ' XOF a été payée';
      
      IF NEW.transaction_reference IS NOT NULL THEN
        v_message := v_message || '. Référence: ' || NEW.transaction_reference;
      END IF;
    ELSIF NEW.referrer_id IS NOT NULL THEN
      -- Paiement de parrainage
      v_user_id := NEW.referrer_id;
      v_notification_type := 'commission_paid';
      v_title := '💰 Commission de parrainage payée !';
      v_message := 'Votre commission de ' || NEW.amount::TEXT || ' XOF a été payée';
      
      IF NEW.transaction_reference IS NOT NULL THEN
        v_message := v_message || '. Référence: ' || NEW.transaction_reference;
      END IF;
    END IF;

    -- Créer la notification si on a un utilisateur
    IF v_user_id IS NOT NULL THEN
      INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        metadata,
        is_read
      ) VALUES (
        v_user_id,
        v_notification_type,
        v_title,
        v_message,
        jsonb_build_object(
          'payment_id', NEW.id,
          'amount', NEW.amount,
          'currency', NEW.currency,
          'transaction_reference', NEW.transaction_reference
        ),
        false
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger pour notifier le traitement des paiements d'affiliation
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'affiliate_withdrawals'
  ) THEN
    DROP TRIGGER IF EXISTS trigger_notify_affiliate_payment_processed ON public.affiliate_withdrawals;
    CREATE TRIGGER trigger_notify_affiliate_payment_processed
      AFTER UPDATE OF status ON public.affiliate_withdrawals
      FOR EACH ROW
      EXECUTE FUNCTION public.notify_commission_payment_processed();
  END IF;
END $$;

-- Trigger pour notifier le traitement des paiements de parrainage
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'commission_payments'
  ) THEN
    DROP TRIGGER IF EXISTS trigger_notify_referral_payment_processed ON public.commission_payments;
    CREATE TRIGGER trigger_notify_referral_payment_processed
      AFTER UPDATE OF status ON public.commission_payments
      FOR EACH ROW
      EXECUTE FUNCTION public.notify_commission_payment_processed();
  END IF;
END $$;

-- Commentaires (seulement si les fonctions existent)
DO $$
BEGIN
  -- Commentaire pour notify_affiliate_commission_created
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'notify_affiliate_commission_created'
  ) THEN
    COMMENT ON FUNCTION public.notify_affiliate_commission_created() IS 'Notifie l''affilié lorsqu''une commission est créée';
  END IF;

  -- Commentaire pour notify_affiliate_commission_status_changed
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'notify_affiliate_commission_status_changed'
  ) THEN
    COMMENT ON FUNCTION public.notify_affiliate_commission_status_changed() IS 'Notifie l''affilié lorsqu''une commission est approuvée ou rejetée';
  END IF;

  -- Commentaire pour notify_referral_commission_created
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'notify_referral_commission_created'
  ) THEN
    COMMENT ON FUNCTION public.notify_referral_commission_created() IS 'Notifie le parrain lorsqu''une commission de parrainage est créée';
  END IF;

  -- Commentaire pour notify_commission_payment_processed
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'notify_commission_payment_processed'
  ) THEN
    COMMENT ON FUNCTION public.notify_commission_payment_processed() IS 'Notifie l''utilisateur lorsqu''un paiement de commission est traité';
  END IF;
END $$;

