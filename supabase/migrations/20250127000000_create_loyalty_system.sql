-- Create Advanced Loyalty System
-- Migration: 20250127000000_create_loyalty_system

-- Loyalty Rules Table
CREATE TABLE IF NOT EXISTS loyalty_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('purchase', 'review', 'referral', 'social_share', 'login_streak', 'birthday', 'custom')),
  points INTEGER NOT NULL DEFAULT 0,
  conditions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 0,
  multiplier DECIMAL DEFAULT 1.0,
  store_id UUID REFERENCES stores(id),
  valid_from TIMESTAMP WITH TIME ZONE,
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Loyalty Tiers Table
CREATE TABLE IF NOT EXISTS loyalty_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  level INTEGER NOT NULL,
  min_points INTEGER NOT NULL DEFAULT 0,
  max_points INTEGER,
  benefits JSONB DEFAULT '[]',
  badge_color TEXT DEFAULT '#FFD700',
  badge_icon TEXT DEFAULT 'star',
  store_id UUID REFERENCES stores(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Loyalty Profiles Table
CREATE TABLE IF NOT EXISTS user_loyalty_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  available_points INTEGER DEFAULT 0,
  spent_points INTEGER DEFAULT 0,
  current_tier_id UUID REFERENCES loyalty_tiers(id),
  referral_code TEXT UNIQUE,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure one profile per user
  UNIQUE(user_id)
);

-- Loyalty Transactions Table
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('earned', 'spent', 'expired', 'bonus', 'adjustment')),
  reason TEXT NOT NULL,
  reference_id UUID,
  reference_type TEXT,
  metadata JSONB DEFAULT '{}',
  expires_at TIMESTAMP WITH TIME ZONE,
  store_id UUID REFERENCES stores(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Badges Table
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'star',
  color TEXT DEFAULT '#FFD700',
  rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_loyalty_rules_event_type ON loyalty_rules(event_type);
CREATE INDEX IF NOT EXISTS idx_loyalty_rules_active ON loyalty_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_loyalty_rules_store ON loyalty_rules(store_id);

CREATE INDEX IF NOT EXISTS idx_loyalty_tiers_level ON loyalty_tiers(level);
CREATE INDEX IF NOT EXISTS idx_loyalty_tiers_store ON loyalty_tiers(store_id);

CREATE INDEX IF NOT EXISTS idx_user_loyalty_profiles_user_id ON user_loyalty_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_loyalty_profiles_tier ON user_loyalty_profiles(current_tier_id);

CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_user_id ON loyalty_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_type ON loyalty_transactions(type);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_created_at ON loyalty_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_expires_at ON loyalty_transactions(expires_at);

CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_rarity ON user_badges(rarity);

-- Row Level Security
ALTER TABLE loyalty_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_loyalty_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- Policies for Loyalty Rules (public read for rules and tiers)
DROP POLICY IF EXISTS "Public read loyalty rules" ON loyalty_rules;
CREATE POLICY "Public read loyalty rules" ON loyalty_rules FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read loyalty tiers" ON loyalty_tiers;
CREATE POLICY "Public read loyalty tiers" ON loyalty_tiers FOR SELECT USING (true);

-- Policies for User Data (users can only access their own data)
DROP POLICY IF EXISTS "Users manage own loyalty profiles" ON user_loyalty_profiles;
CREATE POLICY "Users manage own loyalty profiles" ON user_loyalty_profiles
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users view own loyalty transactions" ON loyalty_transactions;
CREATE POLICY "Users view own loyalty transactions" ON loyalty_transactions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users view own badges" ON user_badges;
CREATE POLICY "Users view own badges" ON user_badges
  FOR SELECT USING (auth.uid() = user_id);

-- Function to generate unique referral codes
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_code TEXT;
  attempts INTEGER := 0;
BEGIN
  LOOP
    new_code := 'REF' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM user_loyalty_profiles WHERE referral_code = new_code);
    attempts := attempts + 1;

    -- Prevent infinite loop
    IF attempts > 100 THEN
      RAISE EXCEPTION 'Could not generate unique referral code after 100 attempts';
    END IF;
  END LOOP;

  RETURN new_code;
END;
$$;

-- Function to award points (internal use)
CREATE OR REPLACE FUNCTION award_loyalty_points(
  p_user_id UUID,
  p_points INTEGER,
  p_reason TEXT,
  p_reference_id UUID DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  p_store_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  transaction_id UUID;
  expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Validate input
  IF p_points <= 0 THEN
    RAISE EXCEPTION 'Points must be positive';
  END IF;

  -- Set expiration (2 years from now)
  expires_at := NOW() + INTERVAL '2 years';

  -- Create transaction
  INSERT INTO loyalty_transactions (
    user_id, points, type, reason, reference_id, reference_type, metadata, expires_at, store_id
  ) VALUES (
    p_user_id, p_points, 'earned', p_reason, p_reference_id, p_reference_type, p_metadata, expires_at, p_store_id
  ) RETURNING id INTO transaction_id;

  -- Update user profile
  INSERT INTO user_loyalty_profiles (user_id, total_points, available_points, referral_code)
  VALUES (p_user_id, p_points, p_points, generate_referral_code())
  ON CONFLICT (user_id) DO UPDATE SET
    total_points = user_loyalty_profiles.total_points + p_points,
    available_points = user_loyalty_profiles.available_points + p_points,
    updated_at = NOW();

  -- Update current tier if needed
  UPDATE user_loyalty_profiles
  SET current_tier_id = (
    SELECT id FROM loyalty_tiers
    WHERE min_points <= user_loyalty_profiles.total_points
    ORDER BY min_points DESC
    LIMIT 1
  )
  WHERE user_id = p_user_id;

  RETURN transaction_id;
END;
$$;

-- Function to redeem points
CREATE OR REPLACE FUNCTION redeem_loyalty_points(
  p_user_id UUID,
  p_points INTEGER,
  p_reason TEXT,
  p_metadata JSONB DEFAULT '{}',
  p_store_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  transaction_id UUID;
  current_available INTEGER;
BEGIN
  -- Get current available points
  SELECT available_points INTO current_available
  FROM user_loyalty_profiles
  WHERE user_id = p_user_id;

  IF current_available IS NULL THEN
    RAISE EXCEPTION 'User loyalty profile not found';
  END IF;

  IF current_available < p_points THEN
    RAISE EXCEPTION 'Insufficient points balance';
  END IF;

  -- Create transaction
  INSERT INTO loyalty_transactions (
    user_id, points, type, reason, metadata, store_id
  ) VALUES (
    p_user_id, -p_points, 'spent', p_reason, p_metadata, p_store_id
  ) RETURNING id INTO transaction_id;

  -- Update profile
  UPDATE user_loyalty_profiles
  SET
    available_points = available_points - p_points,
    spent_points = spent_points + p_points,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN transaction_id;
END;
$$;

-- Function to process loyalty events
CREATE OR REPLACE FUNCTION process_loyalty_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_event_data JSONB DEFAULT '{}',
  p_store_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rule_record RECORD;
  calculated_points INTEGER := 0;
  total_awarded INTEGER := 0;
  transaction_ids UUID[] := ARRAY[]::UUID[];
  result JSONB;
BEGIN
  -- Find applicable rules
  FOR rule_record IN
    SELECT * FROM loyalty_rules
    WHERE event_type = p_event_type
      AND is_active = TRUE
      AND (valid_from IS NULL OR valid_from <= NOW())
      AND (valid_until IS NULL OR valid_until >= NOW())
      AND (store_id IS NULL OR store_id = p_store_id)
    ORDER BY priority DESC
  LOOP
    -- Check conditions (simplified - extend based on needs)
    IF check_loyalty_conditions(rule_record.conditions, p_event_data) THEN
      calculated_points := rule_record.points * COALESCE(rule_record.multiplier, 1.0)::INTEGER;

      -- Award points
      transaction_ids := array_append(
        transaction_ids,
        award_loyalty_points(
          p_user_id,
          calculated_points,
          rule_record.name,
          (p_event_data->>'id')::UUID,
          p_event_type,
          jsonb_build_object('rule_id', rule_record.id, 'event_data', p_event_data),
          p_store_id
        )
      );

      total_awarded := total_awarded + calculated_points;
    END IF;
  END LOOP;

  -- Return result
  result := jsonb_build_object(
    'points_awarded', total_awarded,
    'transactions', transaction_ids,
    'event_type', p_event_type
  );

  RETURN result;
END;
$$;

-- Helper function to check loyalty conditions
CREATE OR REPLACE FUNCTION check_loyalty_conditions(
  p_conditions JSONB,
  p_event_data JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  -- Simplified condition checking - extend based on needs
  -- For now, return true for all conditions
  RETURN TRUE;
END;
$$;

-- Insert default data
INSERT INTO loyalty_tiers (name, description, level, min_points, max_points, benefits, badge_color, badge_icon)
VALUES
  ('Bronze', 'Niveau de départ - Bienvenue dans le programme fidélité', 1, 0, 499,
   '[{"type": "discount_percentage", "value": 5, "description": "5% de réduction"}]',
   '#CD7F32', 'star'),
  ('Argent', 'Membre apprécié - Vous gagnez régulièrement des points', 2, 500, 1499,
   '[{"type": "discount_percentage", "value": 10, "description": "10% de réduction"}, {"type": "free_shipping", "description": "Livraison gratuite"}]',
   '#C0C0C0', 'shield'),
  ('Or', 'Client fidèle - Vous êtes un membre privilégié', 3, 1500, 4999,
   '[{"type": "discount_percentage", "value": 15, "description": "15% de réduction"}, {"type": "free_shipping", "description": "Livraison gratuite"}, {"type": "priority_support", "description": "Support prioritaire"}]',
   '#FFD700', 'crown'),
  ('Platine', 'VIP - Vous faites partie de l''élite', 4, 5000, 9999,
   '[{"type": "discount_percentage", "value": 20, "description": "20% de réduction"}, {"type": "free_shipping", "description": "Livraison gratuite"}, {"type": "priority_support", "description": "Support prioritaire"}, {"type": "early_access", "description": "Accès anticipé aux nouveaux produits"}]',
   '#E5E4E2', 'diamond'),
  ('Diamant', 'Légende - Le plus haut niveau d''excellence', 5, 10000, NULL,
   '[{"type": "discount_percentage", "value": 25, "description": "25% de réduction"}, {"type": "free_shipping", "description": "Livraison gratuite"}, {"type": "priority_support", "description": "Support prioritaire"}, {"type": "early_access", "description": "Accès anticipé"}, {"type": "exclusive_content", "description": "Contenu exclusif"}]',
   '#B9F2FF', 'gem')
ON CONFLICT DO NOTHING;

-- Insert default loyalty rules
INSERT INTO loyalty_rules (name, description, event_type, points, priority)
VALUES
  ('Premier achat', 'Points bonus pour le premier achat', 'purchase', 100, 10),
  ('Achat standard', 'Points pour chaque achat', 'purchase', 10, 5),
  ('Avis produit', 'Points pour avoir laissé un avis', 'review', 50, 8),
  ('Partage social', 'Points pour partage sur les réseaux', 'social_share', 25, 6),
  ('Parrainage réussi', 'Points quand un parrainage aboutit', 'referral', 200, 9),
  ('Série de connexion', 'Points quotidiens de connexion', 'login_streak', 5, 4),
  ('Anniversaire', 'Points bonus d''anniversaire', 'birthday', 100, 9)
ON CONFLICT DO NOTHING;

-- Add helpful comments
COMMENT ON TABLE loyalty_rules IS 'Rules for awarding loyalty points based on user actions';
COMMENT ON TABLE loyalty_tiers IS 'Loyalty program tiers with benefits';
COMMENT ON TABLE user_loyalty_profiles IS 'User loyalty profiles with points and tier information';
COMMENT ON TABLE loyalty_transactions IS 'Transaction history for loyalty points';
COMMENT ON TABLE user_badges IS 'User-earned badges and achievements';

COMMENT ON FUNCTION award_loyalty_points IS 'Awards loyalty points to a user and updates their profile';
COMMENT ON FUNCTION redeem_loyalty_points IS 'Redeems loyalty points from a user balance';
COMMENT ON FUNCTION process_loyalty_event IS 'Processes a loyalty event and awards appropriate points';
COMMENT ON FUNCTION generate_referral_code IS 'Generates a unique referral code for a user';