-- ==============================================
-- Migration: Conversations Vendeur-Client
-- Date: 2025-01-31
-- Description: Permet aux clients de contacter les vendeurs directement depuis les cartes produits
-- ==============================================

-- Créer la table des conversations vendeur-client (sans order_id requis)
CREATE TABLE IF NOT EXISTS public.vendor_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  customer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'disputed')),
  last_message_at TIMESTAMP WITH TIME ZONE,
  admin_intervention BOOLEAN DEFAULT FALSE,
  admin_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Créer la table des messages vendeur-client
CREATE TABLE IF NOT EXISTS public.vendor_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.vendor_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'store', 'admin')),
  content TEXT,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'file', 'system')),
  metadata JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT vendor_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.vendor_conversations(id) ON DELETE CASCADE,
  CONSTRAINT vendor_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Créer la table des fichiers attachés pour les messages vendeur
CREATE TABLE IF NOT EXISTS public.vendor_message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.vendor_messages(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_vendor_conversations_store_id ON public.vendor_conversations(store_id);
CREATE INDEX IF NOT EXISTS idx_vendor_conversations_product_id ON public.vendor_conversations(product_id);
CREATE INDEX IF NOT EXISTS idx_vendor_conversations_customer_user_id ON public.vendor_conversations(customer_user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_conversations_store_user_id ON public.vendor_conversations(store_user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_conversations_status ON public.vendor_conversations(status);
CREATE INDEX IF NOT EXISTS idx_vendor_conversations_last_message_at ON public.vendor_conversations(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_vendor_messages_conversation_id ON public.vendor_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_vendor_messages_sender_id ON public.vendor_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_vendor_messages_created_at ON public.vendor_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vendor_messages_is_read ON public.vendor_messages(is_read);

CREATE INDEX IF NOT EXISTS idx_vendor_message_attachments_message_id ON public.vendor_message_attachments(message_id);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_vendor_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_vendor_conversation_updated_at_trigger ON public.vendor_conversations;
CREATE TRIGGER update_vendor_conversation_updated_at_trigger
  BEFORE UPDATE ON public.vendor_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_conversation_updated_at();

-- Trigger pour mettre à jour last_message_at automatiquement
CREATE OR REPLACE FUNCTION update_vendor_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.vendor_conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_vendor_conversation_last_message_trigger ON public.vendor_messages;
CREATE TRIGGER update_vendor_conversation_last_message_trigger
  AFTER INSERT ON public.vendor_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_conversation_last_message();

-- ==============================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================

-- Activer RLS sur les tables
ALTER TABLE public.vendor_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_message_attachments ENABLE ROW LEVEL SECURITY;

-- Politiques pour vendor_conversations
-- Les clients peuvent voir leurs propres conversations
DROP POLICY IF EXISTS "Customers can view their own vendor conversations" ON public.vendor_conversations;
CREATE POLICY "Customers can view their own vendor conversations"
  ON public.vendor_conversations
  FOR SELECT
  USING (customer_user_id = auth.uid());

-- Les vendeurs peuvent voir les conversations de leur boutique
DROP POLICY IF EXISTS "Store users can view their store vendor conversations" ON public.vendor_conversations;
CREATE POLICY "Store users can view their store vendor conversations"
  ON public.vendor_conversations
  FOR SELECT
  USING (
    store_user_id = auth.uid() OR
    store_id IN (
      SELECT id FROM public.stores WHERE user_id = auth.uid()
    )
  );

-- Les admins peuvent voir toutes les conversations
DROP POLICY IF EXISTS "Admins can view all vendor conversations" ON public.vendor_conversations;
CREATE POLICY "Admins can view all vendor conversations"
  ON public.vendor_conversations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Les clients peuvent créer des conversations
DROP POLICY IF EXISTS "Customers can create vendor conversations" ON public.vendor_conversations;
CREATE POLICY "Customers can create vendor conversations"
  ON public.vendor_conversations
  FOR INSERT
  WITH CHECK (customer_user_id = auth.uid());

-- Les vendeurs et admins peuvent mettre à jour les conversations
DROP POLICY IF EXISTS "Store users and admins can update vendor conversations" ON public.vendor_conversations;
CREATE POLICY "Store users and admins can update vendor conversations"
  ON public.vendor_conversations
  FOR UPDATE
  USING (
    store_user_id = auth.uid() OR
    store_id IN (
      SELECT id FROM public.stores WHERE user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Politiques pour vendor_messages
-- Les clients peuvent voir les messages de leurs conversations
DROP POLICY IF EXISTS "Customers can view their vendor messages" ON public.vendor_messages;
CREATE POLICY "Customers can view their vendor messages"
  ON public.vendor_messages
  FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM public.vendor_conversations WHERE customer_user_id = auth.uid()
    )
  );

-- Les vendeurs peuvent voir les messages de leurs conversations
DROP POLICY IF EXISTS "Store users can view their vendor messages" ON public.vendor_messages;
CREATE POLICY "Store users can view their vendor messages"
  ON public.vendor_messages
  FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM public.vendor_conversations
      WHERE store_user_id = auth.uid() OR
      store_id IN (
        SELECT id FROM public.stores WHERE user_id = auth.uid()
      )
    )
  );

-- Les admins peuvent voir tous les messages
DROP POLICY IF EXISTS "Admins can view all vendor messages" ON public.vendor_messages;
CREATE POLICY "Admins can view all vendor messages"
  ON public.vendor_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Les utilisateurs authentifiés peuvent envoyer des messages dans leurs conversations
DROP POLICY IF EXISTS "Users can send vendor messages" ON public.vendor_messages;
CREATE POLICY "Users can send vendor messages"
  ON public.vendor_messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    (
      conversation_id IN (
        SELECT id FROM public.vendor_conversations WHERE customer_user_id = auth.uid()
      ) OR
      conversation_id IN (
        SELECT id FROM public.vendor_conversations
        WHERE store_user_id = auth.uid() OR
        store_id IN (
          SELECT id FROM public.stores WHERE user_id = auth.uid()
        )
      ) OR
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
      )
    )
  );

-- Les utilisateurs peuvent mettre à jour leurs propres messages (pour marquer comme lu, etc.)
DROP POLICY IF EXISTS "Users can update vendor messages" ON public.vendor_messages;
CREATE POLICY "Users can update vendor messages"
  ON public.vendor_messages
  FOR UPDATE
  USING (
    sender_id = auth.uid() OR
    conversation_id IN (
      SELECT id FROM public.vendor_conversations
      WHERE customer_user_id = auth.uid() OR
      store_user_id = auth.uid() OR
      store_id IN (
        SELECT id FROM public.stores WHERE user_id = auth.uid()
      )
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Politiques pour vendor_message_attachments
-- Même logique que pour les messages
DROP POLICY IF EXISTS "Users can view vendor message attachments" ON public.vendor_message_attachments;
CREATE POLICY "Users can view vendor message attachments"
  ON public.vendor_message_attachments
  FOR SELECT
  USING (
    message_id IN (
      SELECT id FROM public.vendor_messages
      WHERE conversation_id IN (
        SELECT id FROM public.vendor_conversations
        WHERE customer_user_id = auth.uid() OR
        store_user_id = auth.uid() OR
        store_id IN (
          SELECT id FROM public.stores WHERE user_id = auth.uid()
        )
      )
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can insert vendor message attachments" ON public.vendor_message_attachments;
CREATE POLICY "Users can insert vendor message attachments"
  ON public.vendor_message_attachments
  FOR INSERT
  WITH CHECK (
    message_id IN (
      SELECT id FROM public.vendor_messages WHERE sender_id = auth.uid()
    )
  );

