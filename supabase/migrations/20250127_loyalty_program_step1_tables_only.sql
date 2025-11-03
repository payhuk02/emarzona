-- ============================================================================
-- STEP 1: Types et Tables seulement (pour tester)
-- ============================================================================

-- Types ENUMS
DROP TYPE IF EXISTS loyalty_tier_type CASCADE;
DROP TYPE IF EXISTS loyalty_transaction_type CASCADE;
DROP TYPE IF EXISTS loyalty_reward_type CASCADE;
DROP TYPE IF EXISTS loyalty_reward_status CASCADE;

CREATE TYPE loyalty_tier_type AS ENUM (
  'bronze',
  'silver',
  'gold',
  'platinum'
);

CREATE TYPE loyalty_transaction_type AS ENUM (
  'earned',
  'redeemed',
  'expired',
  'adjusted',
  'bonus',
  'refunded'
);

CREATE TYPE loyalty_reward_type AS ENUM (
  'discount',
  'free_product',
  'free_shipping',
  'gift_card',
  'cash_back',
  'custom'
);

CREATE TYPE loyalty_reward_status AS ENUM (
  'active',
  'inactive',
  'expired'
);

-- Tables
CREATE TABLE IF NOT EXISTS public.loyalty_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  tier_type loyalty_tier_type NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  min_points_required INTEGER NOT NULL DEFAULT 0,
  min_orders_required INTEGER DEFAULT 0,
  min_spent_amount NUMERIC DEFAULT 0,
  points_multiplier NUMERIC DEFAULT 1.0,
  discount_percentage NUMERIC DEFAULT 0,
  free_shipping BOOLEAN DEFAULT false,
  exclusive_access BOOLEAN DEFAULT false,
  badge_color TEXT DEFAULT '#808080',
  badge_icon TEXT,
  is_default BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(store_id, tier_type)
);

CREATE INDEX IF NOT EXISTS idx_loyalty_tiers_store_id ON public.loyalty_tiers(store_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_tiers_tier_type ON public.loyalty_tiers(tier_type);
CREATE INDEX IF NOT EXISTS idx_loyalty_tiers_points ON public.loyalty_tiers(min_points_required);

-- Vérification
SELECT 'Tables créées avec succès' AS status;

