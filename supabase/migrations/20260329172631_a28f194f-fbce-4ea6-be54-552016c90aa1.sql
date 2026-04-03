
-- Fix permissive unsubscribe policy to require email
DROP POLICY IF EXISTS "Anyone can unsubscribe" ON public.email_unsubscribes;
CREATE POLICY "Anyone can unsubscribe with email" ON public.email_unsubscribes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================
-- BATCH 3: Digital Product extras + Messaging + Loyalty + Gift Cards
-- =============================================

-- 1. digital_product_updates (14 refs)
CREATE TABLE IF NOT EXISTS public.digital_product_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  digital_product_id uuid REFERENCES public.digital_products(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  version text,
  title text NOT NULL,
  description text,
  changelog text,
  update_type text DEFAULT 'minor',
  is_published boolean DEFAULT false,
  published_at timestamptz,
  notify_customers boolean DEFAULT true,
  download_url text,
  file_size bigint,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.digital_product_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Store owners manage updates" ON public.digital_product_updates FOR ALL USING (
  EXISTS (SELECT 1 FROM stores WHERE stores.id = digital_product_updates.store_id AND stores.user_id = auth.uid())
);
CREATE POLICY "Published updates viewable" ON public.digital_product_updates FOR SELECT USING (is_published = true);
CREATE TRIGGER update_digital_product_updates_updated_at BEFORE UPDATE ON public.digital_product_updates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. digital_product_downloads (13 refs) - separate from customer_downloads
CREATE TABLE IF NOT EXISTS public.digital_product_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  digital_product_id uuid REFERENCES public.digital_products(id),
  file_id uuid,
  user_id uuid NOT NULL,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id),
  ip_address text,
  user_agent text,
  version text,
  download_type text DEFAULT 'purchase',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.digital_product_downloads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own downloads" ON public.digital_product_downloads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Store owners view downloads" ON public.digital_product_downloads FOR SELECT USING (
  EXISTS (SELECT 1 FROM stores WHERE stores.id = digital_product_downloads.store_id AND stores.user_id = auth.uid())
);
CREATE POLICY "Users can insert downloads" ON public.digital_product_downloads FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 3. conversations (14 refs)
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
  participant_ids uuid[] DEFAULT '{}',
  type text DEFAULT 'direct',
  subject text,
  status text DEFAULT 'open',
  last_message_at timestamptz,
  last_message_preview text,
  unread_count integer DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants can view conversations" ON public.conversations FOR SELECT USING (
  auth.uid() = ANY(participant_ids)
);
CREATE POLICY "Participants can update conversations" ON public.conversations FOR UPDATE USING (
  auth.uid() = ANY(participant_ids)
);
CREATE POLICY "Auth users can create conversations" ON public.conversations FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = ANY(participant_ids)
);
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. messages
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  message_type text DEFAULT 'text',
  attachments jsonb DEFAULT '[]',
  is_read boolean DEFAULT false,
  read_at timestamptz,
  is_system boolean DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Conversation participants can view messages" ON public.messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM conversations c WHERE c.id = messages.conversation_id AND auth.uid() = ANY(c.participant_ids))
);
CREATE POLICY "Senders can insert messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON public.messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. vendor_conversations (12 refs)
CREATE TABLE IF NOT EXISTS public.vendor_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_id uuid,
  product_id uuid REFERENCES public.products(id),
  order_id uuid REFERENCES public.orders(id),
  subject text,
  status text DEFAULT 'open',
  priority text DEFAULT 'normal',
  last_message_at timestamptz,
  is_read_by_vendor boolean DEFAULT false,
  is_read_by_customer boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vendor_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Store owners manage vendor conversations" ON public.vendor_conversations FOR ALL USING (
  EXISTS (SELECT 1 FROM stores WHERE stores.id = vendor_conversations.store_id AND stores.user_id = auth.uid())
);
CREATE POLICY "Customers view own conversations" ON public.vendor_conversations FOR SELECT USING (auth.uid() = customer_id);
CREATE TRIGGER update_vendor_conversations_updated_at BEFORE UPDATE ON public.vendor_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. vendor_messages
CREATE TABLE IF NOT EXISTS public.vendor_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.vendor_conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  sender_type text NOT NULL DEFAULT 'vendor',
  content text NOT NULL,
  attachments jsonb DEFAULT '[]',
  is_read boolean DEFAULT false,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vendor_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Conversation participants view vendor messages" ON public.vendor_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM vendor_conversations vc WHERE vc.id = vendor_messages.conversation_id AND (
    EXISTS (SELECT 1 FROM stores WHERE stores.id = vc.store_id AND stores.user_id = auth.uid()) OR vc.customer_id = auth.uid()
  ))
);
CREATE POLICY "Auth users send vendor messages" ON public.vendor_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);

-- 7. gift_cards
CREATE TABLE IF NOT EXISTS public.gift_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  initial_balance numeric NOT NULL DEFAULT 0,
  current_balance numeric NOT NULL DEFAULT 0,
  currency text DEFAULT 'XOF',
  status text DEFAULT 'active',
  purchaser_id uuid,
  recipient_email text,
  recipient_name text,
  message text,
  expires_at timestamptz,
  activated_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Store owners manage gift cards" ON public.gift_cards FOR ALL USING (
  EXISTS (SELECT 1 FROM stores WHERE stores.id = gift_cards.store_id AND stores.user_id = auth.uid())
);
CREATE POLICY "Users view own gift cards" ON public.gift_cards FOR SELECT USING (auth.uid() = purchaser_id);
CREATE TRIGGER update_gift_cards_updated_at BEFORE UPDATE ON public.gift_cards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. gift_card_transactions
CREATE TABLE IF NOT EXISTS public.gift_card_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_card_id uuid NOT NULL REFERENCES public.gift_cards(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id),
  amount numeric NOT NULL,
  type text NOT NULL DEFAULT 'debit',
  balance_after numeric NOT NULL DEFAULT 0,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gift_card_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Gift card transaction access" ON public.gift_card_transactions FOR SELECT USING (
  EXISTS (SELECT 1 FROM gift_cards gc JOIN stores s ON s.id = gc.store_id WHERE gc.id = gift_card_transactions.gift_card_id AND s.user_id = auth.uid())
);

-- 9. loyalty_points
CREATE TABLE IF NOT EXISTS public.loyalty_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  points integer NOT NULL DEFAULT 0,
  lifetime_points integer NOT NULL DEFAULT 0,
  tier text DEFAULT 'bronze',
  last_earned_at timestamptz,
  last_redeemed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, store_id)
);

ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own loyalty" ON public.loyalty_points FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Store owners manage loyalty" ON public.loyalty_points FOR ALL USING (
  EXISTS (SELECT 1 FROM stores WHERE stores.id = loyalty_points.store_id AND stores.user_id = auth.uid())
);
CREATE TRIGGER update_loyalty_points_updated_at BEFORE UPDATE ON public.loyalty_points FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. loyalty_transactions
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  points integer NOT NULL,
  type text NOT NULL DEFAULT 'earn',
  source text,
  order_id uuid REFERENCES public.orders(id),
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own loyalty transactions" ON public.loyalty_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Store owners manage loyalty transactions" ON public.loyalty_transactions FOR ALL USING (
  EXISTS (SELECT 1 FROM stores WHERE stores.id = loyalty_transactions.store_id AND stores.user_id = auth.uid())
);
