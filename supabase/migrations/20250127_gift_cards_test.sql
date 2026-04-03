-- ============================================================================
-- TEST MINIMAL : Création des tables Gift Cards
-- Exécutez ce script d'abord pour vérifier que les tables peuvent être créées
-- ============================================================================

-- 1. Créer les types ENUM
DROP TYPE IF EXISTS gift_card_status CASCADE;
DROP TYPE IF EXISTS gift_card_transaction_type CASCADE;

CREATE TYPE gift_card_status AS ENUM (
  'active',
  'redeemed',
  'expired',
  'cancelled',
  'pending'
);

CREATE TYPE gift_card_transaction_type AS ENUM (
  'purchase',
  'redemption',
  'refund',
  'expiration',
  'adjustment'
);

-- 2. Créer la table gift_cards
DROP TABLE IF EXISTS public.gift_card_transactions CASCADE;
DROP TABLE IF EXISTS public.gift_cards CASCADE;

CREATE TABLE public.gift_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  initial_amount NUMERIC(10, 2) NOT NULL CHECK (initial_amount > 0),
  current_balance NUMERIC(10, 2) NOT NULL CHECK (current_balance >= 0),
  status gift_card_status NOT NULL DEFAULT 'active',
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  redeemed_at TIMESTAMPTZ,
  purchased_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  purchased_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  recipient_email TEXT,
  recipient_name TEXT,
  recipient_message TEXT,
  min_purchase_amount NUMERIC(10, 2) DEFAULT 0,
  applicable_to_product_types TEXT[],
  applicable_to_products UUID[],
  applicable_to_stores UUID[],
  can_be_partially_used BOOLEAN DEFAULT true,
  auto_activate BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  times_used INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT check_balance_not_exceeds_initial CHECK (current_balance <= initial_amount)
);

-- 3. Créer la table gift_card_transactions
CREATE TABLE public.gift_card_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_card_id UUID NOT NULL REFERENCES public.gift_cards(id) ON DELETE CASCADE,
  transaction_type gift_card_transaction_type NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  balance_before NUMERIC(10, 2) NOT NULL,
  balance_after NUMERIC(10, 2) NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  description TEXT,
  reference_number TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Créer quelques index essentiels
CREATE INDEX idx_gift_cards_code ON public.gift_cards(code);
CREATE INDEX idx_gift_cards_store_id ON public.gift_cards(store_id);
CREATE INDEX idx_gift_card_transactions_gift_card_id ON public.gift_card_transactions(gift_card_id);

-- Message de succès
DO $$
BEGIN
  RAISE NOTICE 'Tables gift_cards et gift_card_transactions créées avec succès!';
END $$;

