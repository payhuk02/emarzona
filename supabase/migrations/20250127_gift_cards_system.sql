-- ============================================================================
-- GIFT CARDS SYSTEM - Système complet de cartes cadeaux
-- Date: 27 Janvier 2025
-- Description: Gestion complète des cartes cadeaux (génération, rédemption, balance)
-- ============================================================================

-- Supprimer les objets existants (pour mise à jour propre)
DROP TYPE IF EXISTS gift_card_status CASCADE;
DROP TYPE IF EXISTS gift_card_transaction_type CASCADE;
DROP FUNCTION IF EXISTS public.generate_gift_card_code() CASCADE;
DROP FUNCTION IF EXISTS public.validate_gift_card(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.redeem_gift_card(UUID, UUID, NUMERIC) CASCADE;
DROP FUNCTION IF EXISTS public.get_gift_card_balance(UUID, TEXT) CASCADE;
DROP TRIGGER IF EXISTS update_gift_card_updated_at ON public.gift_cards CASCADE;
DROP TABLE IF EXISTS public.gift_card_transactions CASCADE;
DROP TABLE IF EXISTS public.gift_cards CASCADE;

-- ============================================================================
-- 1. TYPES ENUM
-- ============================================================================

CREATE TYPE gift_card_status AS ENUM (
  'active',      -- Carte active et utilisable
  'redeemed',    -- Carte totalement utilisée
  'expired',     -- Carte expirée
  'cancelled',   -- Carte annulée par admin
  'pending'      -- Carte en attente d'activation
);

CREATE TYPE gift_card_transaction_type AS ENUM (
  'purchase',    -- Achat de la carte
  'redemption',  -- Utilisation de la carte
  'refund',      -- Remboursement partiel
  'expiration',  -- Expiration de la carte
  'adjustment'   -- Ajustement manuel (admin)
);

-- ============================================================================
-- 2. TABLE: gift_cards (Cartes cadeaux)
-- ============================================================================

-- Vérifier et créer la table gift_cards si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'gift_cards'
  ) THEN
    CREATE TABLE public.gift_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  -- Code de la carte (unique)
  code TEXT NOT NULL UNIQUE,
  
  -- Montant et solde
  initial_amount NUMERIC(10, 2) NOT NULL CHECK (initial_amount > 0),
  current_balance NUMERIC(10, 2) NOT NULL CHECK (current_balance >= 0),
  
  -- Statut
  status gift_card_status NOT NULL DEFAULT 'active',
  
  -- Dates
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ, -- NULL = jamais d'expiration
  redeemed_at TIMESTAMPTZ, -- Date de première rédemption
  
  -- Propriétaire initial (celui qui a acheté la carte)
  purchased_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  purchased_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  
  -- Bénéficiaire (celui qui recevra/utilise la carte)
  recipient_email TEXT, -- Email du bénéficiaire
  recipient_name TEXT,  -- Nom du bénéficiaire
  recipient_message TEXT, -- Message personnalisé
  
  -- Restrictions
  min_purchase_amount NUMERIC(10, 2) DEFAULT 0, -- Montant minimum d'achat pour utiliser
  applicable_to_product_types TEXT[], -- Types de produits applicables (digital, physical, service, course)
  applicable_to_products UUID[], -- Produits spécifiques (si NULL, applicable à tous)
  applicable_to_stores UUID[], -- Stores spécifiques (si NULL, applicable à tous les stores)
  
  -- Configuration
  can_be_partially_used BOOLEAN DEFAULT true, -- Peut être utilisé partiellement
  auto_activate BOOLEAN DEFAULT true, -- Activation automatique après achat
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}'::jsonb,
  notes TEXT, -- Notes internes (admin)
  
  -- Tracking
  times_used INTEGER DEFAULT 0, -- Nombre de fois utilisé
  last_used_at TIMESTAMPTZ, -- Dernière utilisation
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Contraintes
  CONSTRAINT check_balance_not_exceeds_initial CHECK (current_balance <= initial_amount),
  CONSTRAINT check_recipient_info CHECK (
    (recipient_email IS NOT NULL AND recipient_email != '') OR
    (recipient_email IS NULL AND recipient_name IS NULL)
  )
);
    END IF;
END $$;

-- ============================================================================
-- 3. TABLE: gift_card_transactions (Historique des transactions)
-- ============================================================================

-- Vérifier et créer la table gift_card_transactions si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'gift_card_transactions'
  ) THEN
    CREATE TABLE public.gift_card_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_card_id UUID NOT NULL REFERENCES public.gift_cards(id) ON DELETE CASCADE,
  
  -- Type de transaction
  transaction_type gift_card_transaction_type NOT NULL,
  
  -- Montant (positif pour achat/ajustement, négatif pour rédemption)
  amount NUMERIC(10, 2) NOT NULL,
  
  -- Balance avant et après
  balance_before NUMERIC(10, 2) NOT NULL,
  balance_after NUMERIC(10, 2) NOT NULL,
  
  -- Référence (commande, transaction, etc.)
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  
  -- Détails
  description TEXT,
  reference_number TEXT, -- Numéro de référence (order_number, etc.)
  
  -- Utilisateur qui a effectué l'action
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
    END IF;
END $$;

-- ============================================================================
-- 4. INDEXES (créés conditionnellement)
-- ============================================================================

-- Indexes pour gift_cards
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'gift_cards'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_gift_cards_store_id ON public.gift_cards(store_id);
    CREATE INDEX IF NOT EXISTS idx_gift_cards_code ON public.gift_cards(code);
    CREATE INDEX IF NOT EXISTS idx_gift_cards_status ON public.gift_cards(status);
    CREATE INDEX IF NOT EXISTS idx_gift_cards_purchased_by ON public.gift_cards(purchased_by);
    CREATE INDEX IF NOT EXISTS idx_gift_cards_recipient_email ON public.gift_cards(recipient_email);
    CREATE INDEX IF NOT EXISTS idx_gift_cards_expires_at ON public.gift_cards(expires_at) WHERE expires_at IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_gift_cards_issued_at ON public.gift_cards(issued_at);
  END IF;
END $$;

-- Indexes pour gift_card_transactions
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'gift_card_transactions'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_gift_card_transactions_gift_card_id ON public.gift_card_transactions(gift_card_id);
    CREATE INDEX IF NOT EXISTS idx_gift_card_transactions_order_id ON public.gift_card_transactions(order_id);
    CREATE INDEX IF NOT EXISTS idx_gift_card_transactions_type ON public.gift_card_transactions(transaction_type);
    CREATE INDEX IF NOT EXISTS idx_gift_card_transactions_created_at ON public.gift_card_transactions(created_at DESC);
  END IF;
END $$;

-- ============================================================================
-- 5. FONCTIONS UTILITAIRES
-- ============================================================================

-- Fonction pour générer un code de carte cadeau unique
CREATE OR REPLACE FUNCTION public.generate_gift_card_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Générer un code aléatoire : 4 groupes de 4 caractères (ex: ABCD-EFGH-IJKL-MNOP)
    new_code := upper(
      substring(md5(random()::text || clock_timestamp()::text) from 1 for 4) || '-' ||
      substring(md5(random()::text || clock_timestamp()::text) from 5 for 4) || '-' ||
      substring(md5(random()::text || clock_timestamp()::text) from 9 for 4) || '-' ||
      substring(md5(random()::text || clock_timestamp()::text) from 13 for 4)
    );
    
    -- Vérifier si le code existe déjà
    SELECT EXISTS(SELECT 1 FROM public.gift_cards WHERE code = new_code) INTO code_exists;
    
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour valider une carte cadeau
CREATE OR REPLACE FUNCTION public.validate_gift_card(
  p_store_id UUID,
  p_code TEXT
)
RETURNS TABLE (
  is_valid BOOLEAN,
  gift_card_id UUID,
  current_balance NUMERIC,
  status gift_card_status,
  message TEXT
) AS $$
DECLARE
  v_gift_card RECORD;
BEGIN
  -- Récupérer la carte cadeau
  SELECT 
    gc.id,
    gc.current_balance,
    gc.status,
    gc.expires_at,
    gc.min_purchase_amount,
    gc.applicable_to_product_types,
    gc.applicable_to_products,
    gc.applicable_to_stores,
    gc.can_be_partially_used
  INTO v_gift_card
  FROM public.gift_cards gc
  WHERE gc.code = upper(trim(p_code))
    AND gc.store_id = p_store_id;
  
  -- Vérifier si la carte existe
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::UUID, 0::NUMERIC, 'active'::gift_card_status, 'Code de carte cadeau invalide'::TEXT;
    RETURN;
  END IF;
  
  -- Vérifier le statut
  IF v_gift_card.status != 'active' THEN
    RETURN QUERY SELECT 
      false, 
      v_gift_card.id, 
      v_gift_card.current_balance, 
      v_gift_card.status,
      CASE 
        WHEN v_gift_card.status = 'redeemed' THEN 'Cette carte cadeau a déjà été entièrement utilisée'
        WHEN v_gift_card.status = 'expired' THEN 'Cette carte cadeau a expiré'
        WHEN v_gift_card.status = 'cancelled' THEN 'Cette carte cadeau a été annulée'
        WHEN v_gift_card.status = 'pending' THEN 'Cette carte cadeau est en attente d''activation'
        ELSE 'Cette carte cadeau n''est pas active'
      END::TEXT;
    RETURN;
  END IF;
  
  -- Vérifier l'expiration
  IF v_gift_card.expires_at IS NOT NULL AND v_gift_card.expires_at < now() THEN
    -- Mettre à jour le statut
    UPDATE public.gift_cards SET status = 'expired' WHERE id = v_gift_card.id;
    
    RETURN QUERY SELECT 
      false, 
      v_gift_card.id, 
      v_gift_card.current_balance, 
      'expired'::gift_card_status,
      'Cette carte cadeau a expiré'::TEXT;
    RETURN;
  END IF;
  
  -- Vérifier le solde
  IF v_gift_card.current_balance <= 0 THEN
    UPDATE public.gift_cards SET status = 'redeemed' WHERE id = v_gift_card.id;
    
    RETURN QUERY SELECT 
      false, 
      v_gift_card.id, 
      v_gift_card.current_balance, 
      'redeemed'::gift_card_status,
      'Cette carte cadeau n''a plus de solde disponible'::TEXT;
    RETURN;
  END IF;
  
  -- Carte valide
  RETURN QUERY SELECT 
    true, 
    v_gift_card.id, 
    v_gift_card.current_balance, 
    v_gift_card.status,
    'Carte cadeau valide'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour rédimer une carte cadeau
CREATE OR REPLACE FUNCTION public.redeem_gift_card(
  p_gift_card_id UUID,
  p_order_id UUID,
  p_amount NUMERIC
)
RETURNS TABLE (
  success BOOLEAN,
  amount_used NUMERIC,
  remaining_balance NUMERIC,
  message TEXT
) AS $$
DECLARE
  v_gift_card RECORD;
  v_amount_to_use NUMERIC;
BEGIN
  -- Récupérer la carte cadeau avec verrouillage
  SELECT 
    id,
    current_balance,
    status,
    initial_amount,
    can_be_partially_used,
    store_id
  INTO v_gift_card
  FROM public.gift_cards
  WHERE id = p_gift_card_id
  FOR UPDATE; -- Verrouillage pour éviter les race conditions
  
  -- Vérifier si la carte existe
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0::NUMERIC, 0::NUMERIC, 'Carte cadeau introuvable'::TEXT;
    RETURN;
  END IF;
  
  -- Vérifier le statut
  IF v_gift_card.status != 'active' THEN
    RETURN QUERY SELECT 
      false, 
      0::NUMERIC, 
      v_gift_card.current_balance, 
      'Cette carte cadeau n''est pas active'::TEXT;
    RETURN;
  END IF;
  
  -- Vérifier l'expiration
  IF EXISTS (
    SELECT 1 FROM public.gift_cards 
    WHERE id = p_gift_card_id 
    AND expires_at IS NOT NULL 
    AND expires_at < now()
  ) THEN
    UPDATE public.gift_cards SET status = 'expired' WHERE id = p_gift_card_id;
    
    RETURN QUERY SELECT 
      false, 
      0::NUMERIC, 
      v_gift_card.current_balance, 
      'Cette carte cadeau a expiré'::TEXT;
    RETURN;
  END IF;
  
  -- Déterminer le montant à utiliser
  IF p_amount <= 0 THEN
    RETURN QUERY SELECT false, 0::NUMERIC, v_gift_card.current_balance, 'Montant invalide'::TEXT;
    RETURN;
  END IF;
  
  -- Si le montant demandé est supérieur au solde
  IF p_amount > v_gift_card.current_balance THEN
    IF NOT v_gift_card.can_be_partially_used THEN
      RETURN QUERY SELECT 
        false, 
        0::NUMERIC, 
        v_gift_card.current_balance, 
        'Solde insuffisant et utilisation partielle non autorisée'::TEXT;
      RETURN;
    END IF;
    -- Utiliser tout le solde disponible
    v_amount_to_use := v_gift_card.current_balance;
  ELSE
    v_amount_to_use := p_amount;
  END IF;
  
  -- Mettre à jour le solde
  UPDATE public.gift_cards
  SET 
    current_balance = current_balance - v_amount_to_use,
    status = CASE 
      WHEN current_balance - v_amount_to_use <= 0 THEN 'redeemed'
      ELSE 'active'
    END,
    times_used = times_used + 1,
    last_used_at = now(),
    redeemed_at = COALESCE(redeemed_at, now()),
    updated_at = now()
  WHERE id = p_gift_card_id;
  
  -- Créer la transaction
  INSERT INTO public.gift_card_transactions (
    gift_card_id,
    transaction_type,
    amount,
    balance_before,
    balance_after,
    order_id,
    description,
    reference_number,
    metadata
  )
  VALUES (
    p_gift_card_id,
    'redemption',
    -v_amount_to_use,
    v_gift_card.current_balance,
    v_gift_card.current_balance - v_amount_to_use,
    p_order_id,
    'Rédemption de carte cadeau',
    (SELECT order_number FROM public.orders WHERE id = p_order_id),
    jsonb_build_object('order_id', p_order_id)
  );
  
  -- Retourner le résultat
  RETURN QUERY SELECT 
    true,
    v_amount_to_use,
    v_gift_card.current_balance - v_amount_to_use,
    'Carte cadeau utilisée avec succès'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir le solde d'une carte cadeau
CREATE OR REPLACE FUNCTION public.get_gift_card_balance(
  p_store_id UUID,
  p_code TEXT
)
RETURNS NUMERIC AS $$
DECLARE
  v_balance NUMERIC;
BEGIN
  SELECT current_balance
  INTO v_balance
  FROM public.gift_cards
  WHERE code = upper(trim(p_code))
    AND store_id = p_store_id
    AND status = 'active'
    AND (expires_at IS NULL OR expires_at >= now());
  
  RETURN COALESCE(v_balance, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_gift_card_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger conditionnellement
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'gift_cards'
  ) THEN
    DROP TRIGGER IF EXISTS update_gift_card_updated_at ON public.gift_cards;
    CREATE TRIGGER update_gift_card_updated_at
      BEFORE UPDATE ON public.gift_cards
      FOR EACH ROW
      EXECUTE FUNCTION public.update_gift_card_updated_at();
  END IF;
END $$;

-- ============================================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Activer RLS conditionnellement
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'gift_cards'
  ) THEN
    ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'gift_card_transactions'
  ) THEN
    ALTER TABLE public.gift_card_transactions ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Policies pour gift_cards

-- Store owners peuvent gérer leurs cartes cadeaux
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'gift_cards'
  ) THEN
    DROP POLICY IF EXISTS "Store owners can manage their gift cards" ON public.gift_cards;
    CREATE POLICY "Store owners can manage their gift cards"
  ON public.gift_cards FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = gift_cards.store_id
      AND stores.user_id = auth.uid()
    )
  );

    DROP POLICY IF EXISTS "Customers can view their gift cards" ON public.gift_cards;
    -- Clients peuvent voir leurs propres cartes cadeaux (par email ou achat)
    CREATE POLICY "Customers can view their gift cards"
      ON public.gift_cards FOR SELECT
      USING (
        purchased_by = auth.uid()
        OR recipient_email = (SELECT email FROM auth.users WHERE id = auth.uid())
      );
  END IF;
END $$;

-- Policies pour gift_card_transactions

-- Store owners peuvent voir toutes les transactions de leurs cartes
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'gift_card_transactions'
  ) THEN
    DROP POLICY IF EXISTS "Store owners can view gift card transactions" ON public.gift_card_transactions;
    CREATE POLICY "Store owners can view gift card transactions"
      ON public.gift_card_transactions FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.gift_cards gc
          JOIN public.stores s ON s.id = gc.store_id
          WHERE gc.id = gift_card_transactions.gift_card_id
          AND s.user_id = auth.uid()
        )
      );

    DROP POLICY IF EXISTS "Customers can view their gift card transactions" ON public.gift_card_transactions;
    -- Clients peuvent voir leurs propres transactions
    CREATE POLICY "Customers can view their gift card transactions"
      ON public.gift_card_transactions FOR SELECT
      USING (
        user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.gift_cards gc
          WHERE gc.id = gift_card_transactions.gift_card_id
          AND (gc.purchased_by = auth.uid() OR gc.recipient_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
        )
      );
  END IF;
END $$;

-- ============================================================================
-- 7. COMMENTS (exécutés seulement si les tables existent)
-- ============================================================================

DO $$
BEGIN
  -- Vérifier si la table gift_cards existe avant d'ajouter les commentaires
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'gift_cards'
  ) THEN
    COMMENT ON TABLE public.gift_cards IS 'Cartes cadeaux générées et gérées par les stores';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'gift_card_transactions'
  ) THEN
    COMMENT ON TABLE public.gift_card_transactions IS 'Historique de toutes les transactions sur les cartes cadeaux';
  END IF;

  -- Commentaires sur les fonctions (vérification de l'existence)
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND p.proname = 'generate_gift_card_code'
    AND p.pronargs = 0
  ) THEN
    COMMENT ON FUNCTION public.generate_gift_card_code() IS 'Génère un code de carte cadeau unique';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND p.proname = 'validate_gift_card'
    AND p.pronargs = 2
  ) THEN
    COMMENT ON FUNCTION public.validate_gift_card(UUID, TEXT) IS 'Valide une carte cadeau et retourne son statut';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND p.proname = 'redeem_gift_card'
    AND p.pronargs = 3
  ) THEN
    COMMENT ON FUNCTION public.redeem_gift_card(UUID, UUID, NUMERIC) IS 'Rédime une carte cadeau pour une commande';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND p.proname = 'get_gift_card_balance'
    AND p.pronargs = 2
  ) THEN
    COMMENT ON FUNCTION public.get_gift_card_balance(UUID, TEXT) IS 'Retourne le solde disponible d''une carte cadeau';
  END IF;
END $$;

