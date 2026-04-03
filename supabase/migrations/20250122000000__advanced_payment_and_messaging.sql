-- Migration pour les fonctionnalités avancées de paiement et messagerie
-- Date: 2025-01-22
-- Description: Ajoute le support pour les paiements par pourcentage, paiement à la livraison sécurisé, et système de messagerie

-- ==============================================
-- 1. AMÉLIORATION DU SYSTÈME DE PAIEMENT
-- ==============================================

-- Ajouter de nouvelles colonnes à la table payments pour les paiements avancés
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'full' CHECK (payment_type IN ('full', 'percentage', 'delivery_secured')),
ADD COLUMN IF NOT EXISTS percentage_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS percentage_rate NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS remaining_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_held BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS held_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS release_conditions JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS delivery_confirmed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS delivery_confirmed_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS dispute_opened_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS dispute_resolved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS dispute_resolution TEXT;

-- Ajouter de nouvelles colonnes à la table orders pour les commandes avancées
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'full' CHECK (payment_type IN ('full', 'percentage', 'delivery_secured')),
ADD COLUMN IF NOT EXISTS percentage_paid NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS remaining_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'shipped', 'delivered', 'confirmed', 'disputed')),
ADD COLUMN IF NOT EXISTS delivery_tracking TEXT,
ADD COLUMN IF NOT EXISTS delivery_notes TEXT,
ADD COLUMN IF NOT EXISTS delivery_confirmed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS delivery_confirmed_by UUID REFERENCES auth.users(id);

-- Créer une table pour les paiements partiels
CREATE TABLE IF NOT EXISTS public.partial_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  percentage NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method TEXT NOT NULL,
  transaction_id TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Créer une table pour les paiements sécurisés (à la livraison)
CREATE TABLE IF NOT EXISTS public.secured_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  total_amount NUMERIC NOT NULL,
  held_amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'held' CHECK (status IN ('held', 'released', 'refunded', 'disputed')),
  hold_reason TEXT NOT NULL DEFAULT 'delivery_confirmation',
  release_conditions JSONB DEFAULT '{}'::jsonb,
  held_until TIMESTAMP WITH TIME ZONE,
  released_at TIMESTAMP WITH TIME ZONE,
  released_by UUID REFERENCES auth.users(id),
  dispute_opened_at TIMESTAMP WITH TIME ZONE,
  dispute_resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ==============================================
-- 2. SYSTÈME DE MESSAGERIE
-- ==============================================

-- Créer la table des conversations
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  store_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'disputed')),
  last_message_at TIMESTAMP WITH TIME ZONE,
  admin_intervention BOOLEAN DEFAULT FALSE,
  admin_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Créer la table des messages
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'store', 'admin')),
  content TEXT,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'file', 'system')),
  metadata JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Créer la table des fichiers attachés
CREATE TABLE IF NOT EXISTS public.message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ==============================================
-- 3. SYSTÈME DE LITIGES ET MODÉRATION
-- ==============================================

-- Créer la table des litiges
CREATE TABLE IF NOT EXISTS public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  initiator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  initiator_type TEXT NOT NULL CHECK (initiator_type IN ('customer', 'store')),
  reason TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
  resolution TEXT,
  admin_notes TEXT,
  assigned_admin_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- ==============================================
-- 4. INDEX POUR LES PERFORMANCES
-- ==============================================

-- Index pour les paiements avancés
CREATE INDEX IF NOT EXISTS idx_payments_payment_type ON public.payments(payment_type);
CREATE INDEX IF NOT EXISTS idx_payments_is_held ON public.payments(is_held);
CREATE INDEX IF NOT EXISTS idx_payments_held_until ON public.payments(held_until);
CREATE INDEX IF NOT EXISTS idx_orders_payment_type ON public.orders(payment_type);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_status ON public.orders(delivery_status);

-- Index pour les paiements partiels
CREATE INDEX IF NOT EXISTS idx_partial_payments_order_id ON public.partial_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_partial_payments_status ON public.partial_payments(status);

-- Index pour les paiements sécurisés
CREATE INDEX IF NOT EXISTS idx_secured_payments_order_id ON public.secured_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_secured_payments_status ON public.secured_payments(status);

-- Index pour la messagerie
CREATE INDEX IF NOT EXISTS idx_conversations_order_id ON public.conversations(order_id);
CREATE INDEX IF NOT EXISTS idx_conversations_store_id ON public.conversations(store_id);
CREATE INDEX IF NOT EXISTS idx_conversations_customer_id ON public.conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON public.conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON public.conversations(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON public.messages(is_read);

CREATE INDEX IF NOT EXISTS idx_message_attachments_message_id ON public.message_attachments(message_id);

-- Index pour les litiges
CREATE INDEX IF NOT EXISTS idx_disputes_order_id ON public.disputes(order_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON public.disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_initiator_id ON public.disputes(initiator_id);

-- ==============================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ==============================================

-- Activer RLS sur toutes les nouvelles tables
ALTER TABLE public.partial_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secured_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

-- Politiques pour partial_payments
CREATE POLICY "Store owners can view their partial payments"
  ON public.partial_payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = partial_payments.order_id
      AND EXISTS (
        SELECT 1 FROM public.stores
        WHERE stores.id = orders.store_id
        AND stores.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Customers can view their partial payments"
  ON public.partial_payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = partial_payments.order_id
      AND orders.customer_id IN (
        SELECT id FROM public.customers WHERE user_id = auth.uid()
      )
    )
  );

-- Politiques pour secured_payments
CREATE POLICY "Store owners can view their secured payments"
  ON public.secured_payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = secured_payments.order_id
      AND EXISTS (
        SELECT 1 FROM public.stores
        WHERE stores.id = orders.store_id
        AND stores.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Customers can view their secured payments"
  ON public.secured_payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = secured_payments.order_id
      AND orders.customer_id IN (
        SELECT id FROM public.customers WHERE user_id = auth.uid()
      )
    )
  );

-- Politiques pour conversations
CREATE POLICY "Store owners can view their conversations"
  ON public.conversations FOR SELECT
  USING (store_user_id = auth.uid());

CREATE POLICY "Customers can view their conversations"
  ON public.conversations FOR SELECT
  USING (customer_user_id = auth.uid());

CREATE POLICY "Admins can view all conversations"
  ON public.conversations FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Store owners can create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (store_user_id = auth.uid());

CREATE POLICY "Customers can create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (customer_user_id = auth.uid());

-- Politiques pour messages
CREATE POLICY "Conversation participants can view messages"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
      AND (
        conversations.store_user_id = auth.uid()
        OR conversations.customer_user_id = auth.uid()
        OR public.has_role(auth.uid(), 'admin')
      )
    )
  );

CREATE POLICY "Conversation participants can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
      AND (
        conversations.store_user_id = auth.uid()
        OR conversations.customer_user_id = auth.uid()
        OR public.has_role(auth.uid(), 'admin')
      )
    )
  );

CREATE POLICY "Message senders can update their messages"
  ON public.messages FOR UPDATE
  USING (sender_id = auth.uid());

-- Politiques pour message_attachments
CREATE POLICY "Message participants can view attachments"
  ON public.message_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.messages
      JOIN public.conversations ON conversations.id = messages.conversation_id
      WHERE messages.id = message_attachments.message_id
      AND (
        conversations.store_user_id = auth.uid()
        OR conversations.customer_user_id = auth.uid()
        OR public.has_role(auth.uid(), 'admin')
      )
    )
  );

-- Politiques pour disputes
CREATE POLICY "Dispute participants can view disputes"
  ON public.disputes FOR SELECT
  USING (
    initiator_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = disputes.order_id
      AND EXISTS (
        SELECT 1 FROM public.stores
        WHERE stores.id = orders.store_id
        AND stores.user_id = auth.uid()
      )
    )
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can create disputes for their orders"
  ON public.disputes FOR INSERT
  WITH CHECK (
    initiator_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = disputes.order_id
      AND (
        orders.customer_id IN (
          SELECT id FROM public.customers WHERE user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM public.stores
          WHERE stores.id = orders.store_id
          AND stores.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Admins can manage disputes"
  ON public.disputes FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- ==============================================
-- 6. FONCTIONS UTILITAIRES
-- ==============================================

-- Fonction pour créer une conversation automatiquement
CREATE OR REPLACE FUNCTION public.create_order_conversation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_user_id UUID;
  v_store_user_id UUID;
BEGIN
  -- Récupérer l'ID utilisateur du client
  SELECT user_id INTO v_customer_user_id
  FROM public.customers
  WHERE id = NEW.customer_id;
  
  -- Récupérer l'ID utilisateur du vendeur
  SELECT user_id INTO v_store_user_id
  FROM public.stores
  WHERE id = NEW.store_id;
  
  -- Créer la conversation si les deux utilisateurs existent
  IF v_customer_user_id IS NOT NULL AND v_store_user_id IS NOT NULL THEN
    INSERT INTO public.conversations (
      order_id,
      store_id,
      customer_id,
      customer_user_id,
      store_user_id
    ) VALUES (
      NEW.id,
      NEW.store_id,
      NEW.customer_id,
      v_customer_user_id,
      v_store_user_id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger pour créer automatiquement une conversation lors de la création d'une commande
CREATE TRIGGER create_conversation_on_order_creation
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.create_order_conversation();

-- Fonction pour mettre à jour last_message_at
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$;

-- Trigger pour mettre à jour last_message_at
CREATE TRIGGER update_conversation_last_message_trigger
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_last_message();

-- Fonction pour calculer les montants restants
CREATE OR REPLACE FUNCTION public.calculate_remaining_amount()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Calculer le montant restant pour les paiements par pourcentage
  IF NEW.payment_type = 'percentage' THEN
    NEW.remaining_amount = NEW.total_amount - NEW.percentage_paid;
  ELSE
    NEW.remaining_amount = 0;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger pour calculer automatiquement les montants restants
CREATE TRIGGER calculate_remaining_amount_trigger
  BEFORE INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_remaining_amount();

-- ==============================================
-- 7. TRIGGERS POUR UPDATED_AT
-- ==============================================

-- Triggers pour mettre à jour automatiquement updated_at
CREATE TRIGGER update_partial_payments_updated_at
  BEFORE UPDATE ON public.partial_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_secured_payments_updated_at
  BEFORE UPDATE ON public.secured_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_disputes_updated_at
  BEFORE UPDATE ON public.disputes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ==============================================
-- 8. COMMENTAIRES POUR LA DOCUMENTATION
-- ==============================================

COMMENT ON TABLE public.partial_payments IS 'Paiements partiels pour les commandes avec paiement par pourcentage';
COMMENT ON TABLE public.secured_payments IS 'Paiements sécurisés retenus jusqu''à confirmation de livraison';
COMMENT ON TABLE public.conversations IS 'Conversations entre vendeurs et clients pour chaque commande';
COMMENT ON TABLE public.messages IS 'Messages dans les conversations avec support des médias';
COMMENT ON TABLE public.message_attachments IS 'Fichiers attachés aux messages (images, vidéos, documents)';
COMMENT ON TABLE public.disputes IS 'Litiges entre vendeurs et clients avec intervention admin';

COMMENT ON COLUMN public.payments.payment_type IS 'Type de paiement: full, percentage, delivery_secured';
COMMENT ON COLUMN public.payments.is_held IS 'Indique si le paiement est retenu par la plateforme';
COMMENT ON COLUMN public.payments.held_until IS 'Date limite de rétention du paiement';
COMMENT ON COLUMN public.orders.payment_type IS 'Type de paiement de la commande';
COMMENT ON COLUMN public.orders.delivery_status IS 'Statut de livraison de la commande';
COMMENT ON COLUMN public.conversations.admin_intervention IS 'Indique si un admin intervient dans la conversation';
COMMENT ON COLUMN public.messages.sender_type IS 'Type d''expéditeur: customer, store, admin';
COMMENT ON COLUMN public.messages.message_type IS 'Type de message: text, image, video, file, system';
