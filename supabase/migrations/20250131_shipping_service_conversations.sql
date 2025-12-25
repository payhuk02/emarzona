-- =====================================================
-- SHIPPING SERVICE CONVERSATIONS
-- Date: 31 Janvier 2025
-- Description: Système de communication entre vendeurs et services de livraison
-- =====================================================

-- Table: shipping_service_conversations
CREATE TABLE IF NOT EXISTS public.shipping_service_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- === RELATIONS ===
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  shipping_service_id UUID NOT NULL REFERENCES public.global_shipping_services(id) ON DELETE CASCADE,
  store_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- === CONVERSATION INFO ===
  subject TEXT, -- Sujet de la conversation
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
  
  -- === METADATA ===
  metadata JSONB DEFAULT '{}', -- Informations supplémentaires
  
  -- === TIMESTAMPS ===
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_shipping_conversations_store_id ON public.shipping_service_conversations(store_id);
CREATE INDEX IF NOT EXISTS idx_shipping_conversations_service_id ON public.shipping_service_conversations(shipping_service_id);
CREATE INDEX IF NOT EXISTS idx_shipping_conversations_store_user_id ON public.shipping_service_conversations(store_user_id);
CREATE INDEX IF NOT EXISTS idx_shipping_conversations_status ON public.shipping_service_conversations(status);
CREATE INDEX IF NOT EXISTS idx_shipping_conversations_last_message ON public.shipping_service_conversations(last_message_at DESC);

-- Table: shipping_service_messages
CREATE TABLE IF NOT EXISTS public.shipping_service_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- === RELATIONS ===
  conversation_id UUID NOT NULL REFERENCES public.shipping_service_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- === MESSAGE INFO ===
  sender_type TEXT NOT NULL CHECK (sender_type IN ('store', 'shipping_service', 'admin')),
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'file', 'system')),
  
  -- === METADATA ===
  metadata JSONB DEFAULT '{}',
  
  -- === READ STATUS ===
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  
  -- === TIMESTAMPS ===
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_shipping_messages_conversation_id ON public.shipping_service_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_shipping_messages_sender_id ON public.shipping_service_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_shipping_messages_created_at ON public.shipping_service_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shipping_messages_is_read ON public.shipping_service_messages(is_read) WHERE is_read = FALSE;

-- Table: shipping_service_message_attachments
CREATE TABLE IF NOT EXISTS public.shipping_service_message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.shipping_service_messages(id) ON DELETE CASCADE,
  
  -- === FILE INFO ===
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  
  -- === TIMESTAMPS ===
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_shipping_attachments_message_id ON public.shipping_service_message_attachments(message_id);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_shipping_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer le trigger s'il existe avant de le recréer
DROP TRIGGER IF EXISTS update_shipping_conversation_updated_at ON public.shipping_service_conversations;

CREATE TRIGGER update_shipping_conversation_updated_at
  BEFORE UPDATE ON public.shipping_service_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_shipping_conversation_updated_at();

-- Trigger pour mettre à jour last_message_at
CREATE OR REPLACE FUNCTION update_shipping_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.shipping_service_conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer le trigger s'il existe avant de le recréer
DROP TRIGGER IF EXISTS update_shipping_conversation_last_message_trigger ON public.shipping_service_messages;

CREATE TRIGGER update_shipping_conversation_last_message_trigger
  AFTER INSERT ON public.shipping_service_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_shipping_conversation_last_message();

-- RLS Policies
ALTER TABLE public.shipping_service_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_service_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_service_message_attachments ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes avant de les recréer
DROP POLICY IF EXISTS "Store users can view their shipping conversations" ON public.shipping_service_conversations;
DROP POLICY IF EXISTS "Store users can create shipping conversations" ON public.shipping_service_conversations;
DROP POLICY IF EXISTS "Store users can update their shipping conversations" ON public.shipping_service_conversations;
DROP POLICY IF EXISTS "Admins can view all shipping conversations" ON public.shipping_service_conversations;
DROP POLICY IF EXISTS "Admins can update all shipping conversations" ON public.shipping_service_conversations;
DROP POLICY IF EXISTS "Participants can view messages" ON public.shipping_service_messages;
DROP POLICY IF EXISTS "Participants can send messages" ON public.shipping_service_messages;
DROP POLICY IF EXISTS "Participants can update messages" ON public.shipping_service_messages;
DROP POLICY IF EXISTS "Participants can view attachments" ON public.shipping_service_message_attachments;

-- Policy: Les vendeurs peuvent voir leurs conversations
CREATE POLICY "Store users can view their shipping conversations"
  ON public.shipping_service_conversations
  FOR SELECT
  USING (
    store_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = shipping_service_conversations.store_id
      AND stores.user_id = auth.uid()
    )
  );

-- Policy: Les vendeurs peuvent créer des conversations
CREATE POLICY "Store users can create shipping conversations"
  ON public.shipping_service_conversations
  FOR INSERT
  WITH CHECK (
    store_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = shipping_service_conversations.store_id
      AND stores.user_id = auth.uid()
    )
  );

-- Policy: Les vendeurs peuvent mettre à jour leurs conversations
CREATE POLICY "Store users can update their shipping conversations"
  ON public.shipping_service_conversations
  FOR UPDATE
  USING (
    store_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = shipping_service_conversations.store_id
      AND stores.user_id = auth.uid()
    )
  );

-- Policy: Les admins peuvent tout voir
CREATE POLICY "Admins can view all shipping conversations"
  ON public.shipping_service_conversations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Les admins peuvent mettre à jour toutes les conversations
CREATE POLICY "Admins can update all shipping conversations"
  ON public.shipping_service_conversations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Les messages peuvent être lus par les participants
CREATE POLICY "Participants can view messages"
  ON public.shipping_service_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.shipping_service_conversations
      WHERE shipping_service_conversations.id = shipping_service_messages.conversation_id
      AND (
        shipping_service_conversations.store_user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.user_id = auth.uid()
          AND profiles.role = 'admin'
        )
      )
    )
  );

-- Policy: Les participants peuvent envoyer des messages
CREATE POLICY "Participants can send messages"
  ON public.shipping_service_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.shipping_service_conversations
      WHERE shipping_service_conversations.id = shipping_service_messages.conversation_id
      AND (
        shipping_service_conversations.store_user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.user_id = auth.uid()
          AND profiles.role = 'admin'
        )
      )
    )
  );

-- Policy: Les participants peuvent mettre à jour leurs messages (marquer comme lu)
CREATE POLICY "Participants can update messages"
  ON public.shipping_service_messages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.shipping_service_conversations
      WHERE shipping_service_conversations.id = shipping_service_messages.conversation_id
      AND (
        shipping_service_conversations.store_user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.user_id = auth.uid()
          AND profiles.role = 'admin'
        )
      )
    )
  );

-- Policy: Les attachments peuvent être lus par les participants
CREATE POLICY "Participants can view attachments"
  ON public.shipping_service_message_attachments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.shipping_service_messages
      JOIN public.shipping_service_conversations ON shipping_service_conversations.id = shipping_service_messages.conversation_id
      WHERE shipping_service_messages.id = shipping_service_message_attachments.message_id
      AND (
        shipping_service_conversations.store_user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.user_id = auth.uid()
          AND profiles.role = 'admin'
        )
      )
    )
  );

-- Commentaires
COMMENT ON TABLE public.shipping_service_conversations IS 'Conversations entre vendeurs et services de livraison';
COMMENT ON TABLE public.shipping_service_messages IS 'Messages échangés dans les conversations avec les services de livraison';
COMMENT ON TABLE public.shipping_service_message_attachments IS 'Fichiers attachés aux messages avec les services de livraison';

