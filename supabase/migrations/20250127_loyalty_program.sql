-- ============================================================================
-- MIGRATION: Loyalty Program System
-- Date: 2025-01-27
-- Author: Payhula Team
-- Description: Système complet de fidélité avec points, tiers, et récompenses
--              Permet aux stores de fidéliser leurs clients
-- ============================================================================

-- ============================================================================
-- 1. TYPES ENUMS
-- ============================================================================

DROP TYPE IF EXISTS loyalty_tier_type CASCADE;
DROP TYPE IF EXISTS loyalty_transaction_type CASCADE;
DROP TYPE IF EXISTS loyalty_reward_type CASCADE;
DROP TYPE IF EXISTS loyalty_reward_status CASCADE;

-- Types de tiers (Bronze, Silver, Gold, Platinum)
CREATE TYPE loyalty_tier_type AS ENUM (
  'bronze',
  'silver',
  'gold',
  'platinum'
);

-- Types de transactions de points
CREATE TYPE loyalty_transaction_type AS ENUM (
  'earned',      -- Points gagnés (achat, action)
  'redeemed',    -- Points échangés (récompense)
  'expired',     -- Points expirés
  'adjusted',    -- Ajustement manuel (admin)
  'bonus',       -- Bonus spécial
  'refunded'     -- Points remboursés (retour produit)
);

-- Types de récompenses
CREATE TYPE loyalty_reward_type AS ENUM (
  'discount',        -- Réduction (pourcentage ou montant fixe)
  'free_product',    -- Produit gratuit
  'free_shipping',   -- Livraison gratuite
  'gift_card',       -- Carte cadeau
  'cash_back',       -- Cashback
  'custom'           -- Récompense personnalisée
);

-- Statut des récompenses
CREATE TYPE loyalty_reward_status AS ENUM (
  'active',
  'inactive',
  'expired'
);

-- ============================================================================
-- 2. TABLE: loyalty_tiers (Configuration des tiers par store)
-- ============================================================================

-- Créer la table si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.loyalty_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  -- Configuration du tier
  tier_type loyalty_tier_type NOT NULL,
  name TEXT NOT NULL, -- Ex: "Membre Bronze", "Silver VIP"
  description TEXT,
  
  -- Conditions pour atteindre ce tier
  min_points_required INTEGER NOT NULL DEFAULT 0,
  min_orders_required INTEGER DEFAULT 0, -- Optionnel: nombre min de commandes
  min_spent_amount NUMERIC DEFAULT 0,    -- Optionnel: montant minimum dépensé
  
  -- Avantages du tier
  points_multiplier NUMERIC DEFAULT 1.0, -- Multiplicateur de points (ex: 1.5 = 50% bonus)
  discount_percentage NUMERIC DEFAULT 0, -- Remise automatique (ex: 5% sur tous les achats)
  free_shipping BOOLEAN DEFAULT false,
  exclusive_access BOOLEAN DEFAULT false, -- Accès produits exclusifs
  
  -- Badge et visuel
  badge_color TEXT DEFAULT '#808080', -- Couleur du badge
  badge_icon TEXT, -- Icône (emoji ou URL)
  
  -- Configuration
  is_default BOOLEAN DEFAULT false, -- Tier par défaut (nouveaux clients)
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ajouter la colonne tier_type si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'loyalty_tiers'
    AND column_name = 'tier_type'
  ) THEN
    ALTER TABLE public.loyalty_tiers 
    ADD COLUMN tier_type loyalty_tier_type NOT NULL DEFAULT 'bronze';
  END IF;
END $$;

-- Créer la contrainte UNIQUE si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'loyalty_tiers_store_id_tier_type_key'
  ) THEN
    ALTER TABLE public.loyalty_tiers 
    ADD CONSTRAINT loyalty_tiers_store_id_tier_type_key UNIQUE(store_id, tier_type);
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_loyalty_tiers_store_id ON public.loyalty_tiers(store_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_tiers_tier_type ON public.loyalty_tiers(tier_type);
CREATE INDEX IF NOT EXISTS idx_loyalty_tiers_points ON public.loyalty_tiers(min_points_required);

-- ============================================================================
-- 3. TABLE: loyalty_points (Points de fidélité par client/store)
-- ============================================================================

-- Créer la table si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.loyalty_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Points
  total_points INTEGER NOT NULL DEFAULT 0,
  available_points INTEGER NOT NULL DEFAULT 0, -- Points disponibles (non utilisés)
  lifetime_points INTEGER NOT NULL DEFAULT 0, -- Total points jamais gagnés (historique)
  
  -- Tier actuel
  current_tier_id UUID REFERENCES public.loyalty_tiers(id) ON DELETE SET NULL,
  
  -- Statistiques
  total_orders INTEGER DEFAULT 0,
  total_spent NUMERIC DEFAULT 0,
  last_activity_at TIMESTAMPTZ,
  
  -- Points qui expirent
  points_expiring_soon INTEGER DEFAULT 0, -- Points expirant dans les 30 prochains jours
  next_expiration_date TIMESTAMPTZ, -- Date d'expiration des prochains points
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ajouter la colonne current_tier_type si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'loyalty_points'
    AND column_name = 'current_tier_type'
  ) THEN
    ALTER TABLE public.loyalty_points 
    ADD COLUMN current_tier_type loyalty_tier_type DEFAULT 'bronze';
  END IF;
END $$;

-- Créer la contrainte UNIQUE si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'loyalty_points_store_id_customer_id_key'
  ) THEN
    ALTER TABLE public.loyalty_points 
    ADD CONSTRAINT loyalty_points_store_id_customer_id_key UNIQUE(store_id, customer_id);
  END IF;
END $$;

-- Indexes (créés après l'ajout des colonnes conditionnelles)
CREATE INDEX IF NOT EXISTS idx_loyalty_points_store_id ON public.loyalty_points(store_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_points_customer_id ON public.loyalty_points(customer_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_points_available ON public.loyalty_points(available_points DESC);

-- Index pour current_tier_type (créé après vérification de la colonne)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'loyalty_points'
    AND column_name = 'current_tier_type'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_loyalty_points_tier ON public.loyalty_points(current_tier_type);
  END IF;
END $$;

-- ============================================================================
-- 4. TABLE: loyalty_rewards (Récompenses configurables par store)
-- ============================================================================

-- Créer la table si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.loyalty_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  -- Configuration
  name TEXT NOT NULL,
  description TEXT,
  
  -- Coût en points
  points_cost INTEGER NOT NULL,
  
  -- Valeur de la récompense
  discount_percentage NUMERIC, -- Pour type 'discount'
  discount_amount NUMERIC,     -- Pour type 'discount' (montant fixe)
  free_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL, -- Pour type 'free_product'
  gift_card_amount NUMERIC,     -- Pour type 'gift_card'
  cash_back_amount NUMERIC,     -- Pour type 'cash_back'
  custom_value JSONB,           -- Pour type 'custom'
  
  -- Limitations
  max_redemptions INTEGER,      -- Nombre max de rédactions total
  max_redemptions_per_customer INTEGER, -- Nombre max par client
  redemption_count INTEGER DEFAULT 0,    -- Nombre actuel de rédactions
  
  -- Disponibilité
  available_from TIMESTAMPTZ,
  available_until TIMESTAMPTZ,
  
  -- Conditions (min_tier sera ajouté après)
  applicable_to_product_types TEXT[], -- Types de produits applicables
  applicable_to_products UUID[], -- Produits spécifiques
  
  -- Visuel
  image_url TEXT,
  badge_text TEXT, -- Ex: "Exclusif", "Nouveau"
  
  -- Configuration
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ajouter la colonne reward_type si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'loyalty_rewards'
    AND column_name = 'reward_type'
  ) THEN
    ALTER TABLE public.loyalty_rewards 
    ADD COLUMN reward_type loyalty_reward_type NOT NULL DEFAULT 'discount';
  END IF;
END $$;

-- Ajouter la colonne status si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'loyalty_rewards'
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.loyalty_rewards 
    ADD COLUMN status loyalty_reward_status DEFAULT 'active';
  END IF;
END $$;

-- Ajouter la colonne min_tier si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'loyalty_rewards'
    AND column_name = 'min_tier'
  ) THEN
    ALTER TABLE public.loyalty_rewards 
    ADD COLUMN min_tier loyalty_tier_type;
  END IF;
END $$;

-- Indexes (créés après l'ajout des colonnes conditionnelles)
CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_store_id ON public.loyalty_rewards(store_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_points_cost ON public.loyalty_rewards(points_cost);

-- Index pour reward_type (créé après vérification de la colonne)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'loyalty_rewards'
    AND column_name = 'reward_type'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_type ON public.loyalty_rewards(reward_type);
  END IF;
END $$;

-- Index pour status (créé après vérification de la colonne)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'loyalty_rewards'
    AND column_name = 'status'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_status ON public.loyalty_rewards(status);
  END IF;
END $$;

-- Index pour min_tier (créé après vérification de la colonne)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'loyalty_rewards'
    AND column_name = 'min_tier'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_tier ON public.loyalty_rewards(min_tier);
  END IF;
END $$;

-- ============================================================================
-- 5. TABLE: loyalty_transactions (Historique des transactions de points)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loyalty_points_id UUID NOT NULL REFERENCES public.loyalty_points(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Transaction (transaction_type sera ajouté après)
  points_amount INTEGER NOT NULL, -- Peut être négatif pour les redemptions
  balance_before INTEGER NOT NULL, -- Balance avant transaction
  balance_after INTEGER NOT NULL,  -- Balance après transaction
  
  -- Référence
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  reward_id UUID REFERENCES public.loyalty_rewards(id) ON DELETE SET NULL,
  
  -- Détails
  description TEXT, -- Description de la transaction
  reference_number TEXT, -- Numéro de référence (order_number, etc.)
  
  -- Expiration (pour points gagnés)
  expires_at TIMESTAMPTZ, -- Date d'expiration des points (si applicable)
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL -- Admin si ajustement manuel
);

-- Ajouter la colonne transaction_type si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'loyalty_transactions'
    AND column_name = 'transaction_type'
  ) THEN
    ALTER TABLE public.loyalty_transactions 
    ADD COLUMN transaction_type loyalty_transaction_type NOT NULL DEFAULT 'earned';
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_loyalty_points_id ON public.loyalty_transactions(loyalty_points_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_store_id ON public.loyalty_transactions(store_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_customer_id ON public.loyalty_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_order_id ON public.loyalty_transactions(order_id);

-- Index pour transaction_type (créé après vérification de la colonne)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'loyalty_transactions'
    AND column_name = 'transaction_type'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_type ON public.loyalty_transactions(transaction_type);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_created_at ON public.loyalty_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_expires_at ON public.loyalty_transactions(expires_at) WHERE expires_at IS NOT NULL;

-- ============================================================================
-- 6. TABLE: loyalty_reward_redemptions (Historique des échanges)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.loyalty_reward_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_id UUID NOT NULL REFERENCES public.loyalty_rewards(id) ON DELETE CASCADE,
  loyalty_points_id UUID NOT NULL REFERENCES public.loyalty_points(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Échange
  points_used INTEGER NOT NULL,
  redemption_code TEXT UNIQUE, -- Code unique pour utiliser la récompense
  
  -- Statut
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'cancelled')),
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  
  -- Application
  applied_to_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  applied_at TIMESTAMPTZ,
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_loyalty_redemptions_reward_id ON public.loyalty_reward_redemptions(reward_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_redemptions_loyalty_points_id ON public.loyalty_reward_redemptions(loyalty_points_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_redemptions_store_id ON public.loyalty_reward_redemptions(store_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_redemptions_customer_id ON public.loyalty_reward_redemptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_redemptions_code ON public.loyalty_reward_redemptions(redemption_code);
CREATE INDEX IF NOT EXISTS idx_loyalty_redemptions_status ON public.loyalty_reward_redemptions(status);

-- ============================================================================
-- 7. RPC FUNCTIONS
-- ============================================================================
-- Note: Les fonctions sont créées APRÈS toutes les tables pour éviter les erreurs de dépendances

-- Supprimer les fonctions existantes si elles existent (pour éviter les conflits)
DROP FUNCTION IF EXISTS public.calculate_loyalty_points(UUID, UUID, UUID, NUMERIC) CASCADE;
DROP FUNCTION IF EXISTS public.update_customer_tier(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.redeem_loyalty_reward(UUID, UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.trigger_earn_loyalty_points_on_payment() CASCADE;
DROP TRIGGER IF EXISTS earn_loyalty_points_on_order_paid ON public.orders CASCADE;

-- Supprimer les triggers de mise à jour updated_at
DROP TRIGGER IF EXISTS update_loyalty_tiers_updated_at ON public.loyalty_tiers CASCADE;
DROP TRIGGER IF EXISTS update_loyalty_points_updated_at ON public.loyalty_points CASCADE;
DROP TRIGGER IF EXISTS update_loyalty_rewards_updated_at ON public.loyalty_rewards CASCADE;

-- Fonction pour calculer et attribuer des points lors d'un achat
CREATE OR REPLACE FUNCTION public.calculate_loyalty_points(
  p_order_id UUID,
  p_store_id UUID,
  p_customer_id UUID,
  p_order_amount NUMERIC
)
RETURNS INTEGER AS $$
DECLARE
  v_points INTEGER := 0;
  v_points_per_currency_unit NUMERIC := 1; -- 1 point par unité de devise (configurable)
  v_multiplier NUMERIC := 1.0;
  v_loyalty_points_id UUID;
  v_current_tier loyalty_tier_type;
  v_tier_record RECORD;
BEGIN
  -- Récupérer ou créer l'enregistrement loyalty_points
  SELECT lp.id, lp.current_tier_type INTO v_loyalty_points_id, v_current_tier
  FROM public.loyalty_points lp
  WHERE lp.store_id = p_store_id AND lp.customer_id = p_customer_id;
  
  IF v_loyalty_points_id IS NULL THEN
    -- Créer un nouvel enregistrement
    INSERT INTO public.loyalty_points (store_id, customer_id, total_points, available_points, lifetime_points)
    VALUES (p_store_id, p_customer_id, 0, 0, 0)
    RETURNING id INTO v_loyalty_points_id;
    
    v_current_tier := 'bronze';
  END IF;
  
  -- Trouver le tier actuel et son multiplicateur
  SELECT lt.points_multiplier INTO v_multiplier
  FROM public.loyalty_tiers lt
  WHERE lt.store_id = p_store_id 
    AND lt.tier_type = v_current_tier
    AND lt.is_active = true;
  
  IF v_multiplier IS NULL THEN
    v_multiplier := 1.0;
  END IF;
  
  -- Calculer les points (1 point par unité de devise, arrondi)
  v_points := ROUND((p_order_amount / v_points_per_currency_unit) * v_multiplier)::INTEGER;
  
  -- Créer la transaction
  INSERT INTO public.loyalty_transactions (
    loyalty_points_id,
    store_id,
    customer_id,
    transaction_type,
    points_amount,
    balance_before,
    balance_after,
    order_id,
    description,
    reference_number,
    expires_at
  )
  SELECT 
    v_loyalty_points_id,
    p_store_id,
    p_customer_id,
    'earned',
    v_points,
    lp.available_points,
    lp.available_points + v_points,
    p_order_id,
    'Points gagnés pour commande #' || COALESCE((SELECT o.order_number FROM public.orders o WHERE o.id = p_order_id), 'N/A'),
    COALESCE((SELECT o.order_number FROM public.orders o WHERE o.id = p_order_id), 'N/A'),
    now() + INTERVAL '1 year' -- Points expirent après 1 an
  FROM public.loyalty_points lp
  WHERE lp.id = v_loyalty_points_id;
  
  -- Mettre à jour les points
  UPDATE public.loyalty_points
  SET 
    total_points = total_points + v_points,
    available_points = available_points + v_points,
    lifetime_points = lifetime_points + v_points,
    total_orders = total_orders + 1,
    total_spent = total_spent + p_order_amount,
    last_activity_at = now(),
    updated_at = now()
  WHERE id = v_loyalty_points_id;
  
  -- Vérifier et mettre à jour le tier si nécessaire
  PERFORM public.update_customer_tier(p_store_id, p_customer_id);
  
  RETURN v_points;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour mettre à jour le tier d'un client
CREATE OR REPLACE FUNCTION public.update_customer_tier(
  p_store_id UUID,
  p_customer_id UUID
)
RETURNS loyalty_tier_type AS $$
DECLARE
  v_current_points INTEGER;
  v_new_tier_id UUID;
  v_new_tier_type loyalty_tier_type;
  v_tier_record RECORD;
BEGIN
  -- Récupérer les points actuels
  SELECT lp.available_points INTO v_current_points
  FROM public.loyalty_points lp
  WHERE lp.store_id = p_store_id AND lp.customer_id = p_customer_id;
  
  IF v_current_points IS NULL THEN
    RETURN 'bronze';
  END IF;
  
  -- Trouver le tier le plus élevé que le client peut atteindre
  SELECT lt.id, lt.tier_type INTO v_new_tier_id, v_new_tier_type
  FROM public.loyalty_tiers lt
  WHERE lt.store_id = p_store_id
    AND lt.min_points_required <= v_current_points
    AND lt.is_active = true
  ORDER BY lt.min_points_required DESC
  LIMIT 1;
  
  -- Si aucun tier trouvé, utiliser le tier par défaut
  IF v_new_tier_id IS NULL THEN
    SELECT lt.id, lt.tier_type INTO v_new_tier_id, v_new_tier_type
    FROM public.loyalty_tiers lt
    WHERE lt.store_id = p_store_id
      AND lt.is_default = true
      AND lt.is_active = true
    LIMIT 1;
    
    IF v_new_tier_id IS NULL THEN
      v_new_tier_type := 'bronze';
    END IF;
  END IF;
  
  -- Mettre à jour le tier du client
  UPDATE public.loyalty_points
  SET 
    current_tier_id = v_new_tier_id,
    current_tier_type = v_new_tier_type,
    updated_at = now()
  WHERE store_id = p_store_id AND customer_id = p_customer_id;
  
  RETURN v_new_tier_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour échanger une récompense
CREATE OR REPLACE FUNCTION public.redeem_loyalty_reward(
  p_reward_id UUID,
  p_customer_id UUID,
  p_store_id UUID
)
RETURNS TEXT AS $$
DECLARE
  v_reward RECORD;
  v_loyalty_points_id UUID;
  v_available_points INTEGER;
  v_redemption_code TEXT;
BEGIN
  -- Récupérer la récompense
  SELECT * INTO v_reward
  FROM public.loyalty_rewards lr
  WHERE lr.id = p_reward_id AND lr.store_id = p_store_id AND lr.status = 'active';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Récompense non trouvée ou inactive';
  END IF;
  
  -- Vérifier la disponibilité
  IF v_reward.available_from IS NOT NULL AND v_reward.available_from > now() THEN
    RAISE EXCEPTION 'Récompense pas encore disponible';
  END IF;
  
  IF v_reward.available_until IS NOT NULL AND v_reward.available_until < now() THEN
    RAISE EXCEPTION 'Récompense expirée';
  END IF;
  
  IF v_reward.max_redemptions IS NOT NULL AND v_reward.redemption_count >= v_reward.max_redemptions THEN
    RAISE EXCEPTION 'Récompense épuisée';
  END IF;
  
  -- Récupérer les points du client
  SELECT lp.id, lp.available_points INTO v_loyalty_points_id, v_available_points
  FROM public.loyalty_points lp
  WHERE lp.store_id = p_store_id AND lp.customer_id = p_customer_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Aucun compte de fidélité trouvé';
  END IF;
  
  -- Vérifier si le client a assez de points
  IF v_available_points < v_reward.points_cost THEN
    RAISE EXCEPTION 'Points insuffisants';
  END IF;
  
  -- Vérifier le tier minimum
  IF v_reward.min_tier IS NOT NULL THEN
    DECLARE
      v_customer_tier loyalty_tier_type;
      v_tier_order INTEGER;
      v_min_tier_order INTEGER;
    BEGIN
      SELECT lp.current_tier_type INTO v_customer_tier
      FROM public.loyalty_points lp
      WHERE lp.id = v_loyalty_points_id;
      
      -- Convertir tiers en ordre numérique pour comparaison
      v_tier_order := CASE v_customer_tier
        WHEN 'bronze' THEN 1
        WHEN 'silver' THEN 2
        WHEN 'gold' THEN 3
        WHEN 'platinum' THEN 4
        ELSE 0
      END;
      
      v_min_tier_order := CASE v_reward.min_tier
        WHEN 'bronze' THEN 1
        WHEN 'silver' THEN 2
        WHEN 'gold' THEN 3
        WHEN 'platinum' THEN 4
        ELSE 0
      END;
      
      IF v_tier_order < v_min_tier_order THEN
        RAISE EXCEPTION 'Tier insuffisant pour cette récompense';
      END IF;
    END;
  END IF;
  
  -- Générer un code d'échange unique
  v_redemption_code := 'REWARD-' || upper(substring(md5(random()::text || now()::text) from 1 for 12));
  
  -- Déduire les points
  UPDATE public.loyalty_points
  SET 
    total_points = total_points - v_reward.points_cost,
    available_points = available_points - v_reward.points_cost,
    updated_at = now()
  WHERE id = v_loyalty_points_id;
  
  -- Créer la transaction
  INSERT INTO public.loyalty_transactions (
    loyalty_points_id,
    store_id,
    customer_id,
    transaction_type,
    points_amount,
    balance_before,
    balance_after,
    reward_id,
    description
  )
  SELECT 
    v_loyalty_points_id,
    p_store_id,
    p_customer_id,
    'redeemed',
    -v_reward.points_cost,
    lp.available_points,
    lp.available_points - v_reward.points_cost,
    p_reward_id,
    'Échange: ' || v_reward.name
  FROM public.loyalty_points lp
  WHERE lp.id = v_loyalty_points_id;
  
  -- Créer l'enregistrement d'échange
  INSERT INTO public.loyalty_reward_redemptions (
    reward_id,
    loyalty_points_id,
    store_id,
    customer_id,
    points_used,
    redemption_code,
    expires_at
  )
  VALUES (
    p_reward_id,
    v_loyalty_points_id,
    p_store_id,
    p_customer_id,
    v_reward.points_cost,
    v_redemption_code,
    now() + INTERVAL '90 days' -- Code expire après 90 jours
  );
  
  -- Incrémenter le compteur de rédactions
  UPDATE public.loyalty_rewards
  SET redemption_count = redemption_count + 1
  WHERE id = p_reward_id;
  
  RETURN v_redemption_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 8. TRIGGERS
-- ============================================================================

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_loyalty_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_loyalty_tiers_updated_at
  BEFORE UPDATE ON public.loyalty_tiers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_loyalty_updated_at();

CREATE TRIGGER update_loyalty_points_updated_at
  BEFORE UPDATE ON public.loyalty_points
  FOR EACH ROW
  EXECUTE FUNCTION public.update_loyalty_updated_at();

CREATE TRIGGER update_loyalty_rewards_updated_at
  BEFORE UPDATE ON public.loyalty_rewards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_loyalty_updated_at();

-- ============================================================================
-- 9. RLS POLICIES
-- ============================================================================

-- Supprimer les politiques existantes pour les recréer proprement
DROP POLICY IF EXISTS "Anyone can view active loyalty tiers" ON public.loyalty_tiers;
DROP POLICY IF EXISTS "Store owners can manage their loyalty tiers" ON public.loyalty_tiers;
DROP POLICY IF EXISTS "Customers can view their own loyalty points" ON public.loyalty_points;
DROP POLICY IF EXISTS "Store owners can view customer loyalty points" ON public.loyalty_points;
DROP POLICY IF EXISTS "Customers can view their own transactions" ON public.loyalty_transactions;
DROP POLICY IF EXISTS "Store owners can view transactions" ON public.loyalty_transactions;
DROP POLICY IF EXISTS "Anyone can view active rewards" ON public.loyalty_rewards;
DROP POLICY IF EXISTS "Store owners can manage their rewards" ON public.loyalty_rewards;
DROP POLICY IF EXISTS "Customers can view their own redemptions" ON public.loyalty_reward_redemptions;
DROP POLICY IF EXISTS "Store owners can view redemptions" ON public.loyalty_reward_redemptions;

-- Loyalty Tiers: Lecture seule pour les clients, gestion complète pour les stores
ALTER TABLE public.loyalty_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active loyalty tiers"
  ON public.loyalty_tiers FOR SELECT
  USING (is_active = true);

CREATE POLICY "Store owners can manage their loyalty tiers"
  ON public.loyalty_tiers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = loyalty_tiers.store_id
      AND stores.user_id = auth.uid()
    )
  );

-- Loyalty Points: Les clients peuvent voir leurs propres points
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view their own loyalty points"
  ON public.loyalty_points FOR SELECT
  USING (customer_id = auth.uid());

CREATE POLICY "Store owners can view customer loyalty points"
  ON public.loyalty_points FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = loyalty_points.store_id
      AND stores.user_id = auth.uid()
    )
  );

-- Loyalty Transactions: Même logique
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view their own transactions"
  ON public.loyalty_transactions FOR SELECT
  USING (customer_id = auth.uid());

CREATE POLICY "Store owners can view transactions"
  ON public.loyalty_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = loyalty_transactions.store_id
      AND stores.user_id = auth.uid()
    )
  );

-- Loyalty Rewards: Lecture publique, gestion store
ALTER TABLE public.loyalty_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active rewards"
  ON public.loyalty_rewards FOR SELECT
  USING (status = 'active');

CREATE POLICY "Store owners can manage their rewards"
  ON public.loyalty_rewards FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = loyalty_rewards.store_id
      AND stores.user_id = auth.uid()
    )
  );

-- Loyalty Reward Redemptions
ALTER TABLE public.loyalty_reward_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view their own redemptions"
  ON public.loyalty_reward_redemptions FOR SELECT
  USING (customer_id = auth.uid());

CREATE POLICY "Store owners can view redemptions"
  ON public.loyalty_reward_redemptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = loyalty_reward_redemptions.store_id
      AND stores.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 9. TRIGGERS: Attribution automatique des points
-- ============================================================================

-- Trigger pour attribuer automatiquement les points de fidélité
-- lorsqu'une commande est payée
CREATE OR REPLACE FUNCTION public.trigger_earn_loyalty_points_on_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier si le paiement vient d'être complété
  IF NEW.payment_status = 'paid' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'paid') THEN
    -- Appeler la fonction d'attribution de points
    PERFORM public.calculate_loyalty_points(
      NEW.id,
      NEW.store_id,
      NEW.customer_id,
      NEW.total_amount
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger sur la table orders
CREATE TRIGGER earn_loyalty_points_on_order_paid
  AFTER UPDATE OF payment_status ON public.orders
  FOR EACH ROW
  WHEN (NEW.payment_status = 'paid' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'paid'))
  EXECUTE FUNCTION public.trigger_earn_loyalty_points_on_payment();

-- ============================================================================
-- 10. COMMENTS
-- ============================================================================

COMMENT ON TABLE public.loyalty_tiers IS 'Configuration des tiers de fidélité (Bronze, Silver, Gold, Platinum)';
COMMENT ON TABLE public.loyalty_points IS 'Points de fidélité par client et store';
COMMENT ON TABLE public.loyalty_transactions IS 'Historique de toutes les transactions de points';
COMMENT ON TABLE public.loyalty_rewards IS 'Récompenses configurables échangeables contre des points';
COMMENT ON TABLE public.loyalty_reward_redemptions IS 'Historique des échanges de récompenses';
COMMENT ON FUNCTION public.trigger_earn_loyalty_points_on_payment() IS 'Trigger automatique pour attribuer les points de fidélité lors du paiement d''une commande';

