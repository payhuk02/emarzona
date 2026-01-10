-- Fix Loyalty Program Policies
-- Execute this script in Supabase SQL Editor if migrations fail

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own style preferences" ON user_style_preferences;
DROP POLICY IF EXISTS "Users can insert their own style preferences" ON user_style_preferences;
DROP POLICY IF EXISTS "Users can update their own style preferences" ON user_style_preferences;
DROP POLICY IF EXISTS "Users can delete their own style preferences" ON user_style_preferences;

-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS loyalty_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL,
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
  UNIQUE(user_id)
);

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

-- Enable RLS
ALTER TABLE loyalty_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_loyalty_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for loyalty system
DROP POLICY IF EXISTS "Public read loyalty rules" ON loyalty_rules;
DROP POLICY IF EXISTS "Public read loyalty tiers" ON loyalty_tiers;
DROP POLICY IF EXISTS "Users manage own loyalty profiles" ON user_loyalty_profiles;
DROP POLICY IF EXISTS "Users view own loyalty transactions" ON loyalty_transactions;

CREATE POLICY "Public read loyalty rules" ON loyalty_rules FOR SELECT USING (true);
CREATE POLICY "Public read loyalty tiers" ON loyalty_tiers FOR SELECT USING (true);
CREATE POLICY "Users manage own loyalty profiles" ON user_loyalty_profiles
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users view own loyalty transactions" ON loyalty_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_loyalty_rules_event_type ON loyalty_rules(event_type);
CREATE INDEX IF NOT EXISTS idx_loyalty_rules_active ON loyalty_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_loyalty_tiers_level ON loyalty_tiers(level);
CREATE INDEX IF NOT EXISTS idx_user_loyalty_profiles_user_id ON user_loyalty_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_user_id ON loyalty_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_type ON loyalty_transactions(type);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_created_at ON loyalty_transactions(created_at);

-- Insert default loyalty tiers
INSERT INTO loyalty_tiers (name, description, level, min_points, max_points, benefits, badge_color, badge_icon)
VALUES
  ('Bronze', 'Niveau de départ - Bienvenue dans le programme fidélité', 1, 0, 499, '[{"type": "discount_percentage", "value": 5, "description": "5% de réduction"}]', '#CD7F32', 'star'),
  ('Argent', 'Membre apprécié - Vous gagnez régulièrement des points', 2, 500, 1499, '[{"type": "discount_percentage", "value": 10, "description": "10% de réduction"}, {"type": "free_shipping", "description": "Livraison gratuite"}]', '#C0C0C0', 'shield'),
  ('Or', 'Client fidèle - Vous êtes un membre privilégié', 3, 1500, 4999, '[{"type": "discount_percentage", "value": 15, "description": "15% de réduction"}, {"type": "free_shipping", "description": "Livraison gratuite"}, {"type": "priority_support", "description": "Support prioritaire"}]', '#FFD700', 'crown'),
  ('Platine', 'VIP - Vous faites partie de l''élite', 4, 5000, 9999, '[{"type": "discount_percentage", "value": 20, "description": "20% de réduction"}, {"type": "free_shipping", "description": "Livraison gratuite"}, {"type": "priority_support", "description": "Support prioritaire"}, {"type": "early_access", "description": "Accès anticipé aux nouveaux produits"}]', '#E5E4E2', 'diamond'),
  ('Diamant', 'Légende - Le plus haut niveau d''excellence', 5, 10000, NULL, '[{"type": "discount_percentage", "value": 25, "description": "25% de réduction"}, {"type": "free_shipping", "description": "Livraison gratuite"}, {"type": "priority_support", "description": "Support prioritaire"}, {"type": "early_access", "description": "Accès anticipé"}, {"type": "exclusive_content", "description": "Contenu exclusif"}]', '#B9F2FF', 'gem')
ON CONFLICT DO NOTHING;

-- Insert default loyalty rules
INSERT INTO loyalty_rules (name, description, event_type, points, priority)
VALUES
  ('Premier achat', 'Points bonus pour le premier achat', 'purchase', 100, 10),
  ('Achat standard', 'Points pour chaque achat', 'purchase', 10, 5),
  ('Avis produit', 'Points pour avoir laissé un avis', 'review', 50, 8),
  ('Partage social', 'Points pour partage sur les réseaux', 'social_share', 25, 6),
  ('Parrainage réussi', 'Points quand un parrainage aboutit', 'referral', 200, 9)
ON CONFLICT DO NOTHING;

-- Insert default loyalty rules with multipliers
INSERT INTO loyalty_rules (name, description, event_type, points, multiplier, conditions, priority)
VALUES
  ('Achat élevé', 'Points bonus pour achat > 100€', 'purchase', 20, 2.0, '{"min_amount": 100}', 7),
  ('Série de connexion', 'Points quotidiens de connexion', 'login_streak', 5, 1.0, '{}', 4),
  ('Anniversaire', 'Points bonus d''anniversaire', 'birthday', 100, 1.0, '{}', 9)
ON CONFLICT DO NOTHING;

COMMIT;