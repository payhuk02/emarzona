-- Correction étape par étape du système de fidélisation
-- Exécutez chaque section une par une dans Supabase SQL Editor

-- ÉTAPE 1: Diagnostic - Vérifier les tables existantes
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name LIKE '%loyalty%'
ORDER BY table_name, ordinal_position;

-- ÉTAPE 2: Supprimer les tables problématiques (si elles existent)
-- ATTENTION: Cette étape supprime les données existantes
DROP TABLE IF EXISTS loyalty_transactions CASCADE;
DROP TABLE IF EXISTS user_badges CASCADE;
DROP TABLE IF EXISTS user_loyalty_profiles CASCADE;
DROP TABLE IF EXISTS loyalty_tiers CASCADE;
DROP TABLE IF EXISTS loyalty_rules CASCADE;

-- ÉTAPE 3: Créer la table loyalty_rules
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

-- ÉTAPE 4: Créer la table loyalty_tiers
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

-- ÉTAPE 5: Créer la table user_loyalty_profiles
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

-- ÉTAPE 6: Créer la table loyalty_transactions (avec colonne user_id correcte)
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

-- ÉTAPE 7: Créer la table user_badges
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

-- ÉTAPE 8: Créer les indexes
CREATE INDEX IF NOT EXISTS idx_loyalty_rules_event_type ON loyalty_rules(event_type);
CREATE INDEX IF NOT EXISTS idx_loyalty_rules_active ON loyalty_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_loyalty_tiers_level ON loyalty_tiers(level);
CREATE INDEX IF NOT EXISTS idx_user_loyalty_profiles_user_id ON user_loyalty_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_user_id ON loyalty_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_type ON loyalty_transactions(type);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);

-- ÉTAPE 9: Activer RLS sur toutes les tables
ALTER TABLE loyalty_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_loyalty_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- ÉTAPE 10: Créer les policies
DROP POLICY IF EXISTS "Public read loyalty rules" ON loyalty_rules;
CREATE POLICY "Public read loyalty rules" ON loyalty_rules FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read loyalty tiers" ON loyalty_tiers;
CREATE POLICY "Public read loyalty tiers" ON loyalty_tiers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users manage own loyalty profiles" ON user_loyalty_profiles;
CREATE POLICY "Users manage own loyalty profiles" ON user_loyalty_profiles
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users view own loyalty transactions" ON loyalty_transactions;
CREATE POLICY "Users view own loyalty transactions" ON loyalty_transactions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users view own badges" ON user_badges;
CREATE POLICY "Users view own badges" ON user_badges
  FOR SELECT USING (auth.uid() = user_id);

-- ÉTAPE 11: Insérer les données par défaut
INSERT INTO loyalty_tiers (name, description, level, min_points, max_points, benefits, badge_color, badge_icon)
VALUES
  ('Bronze', 'Niveau de départ', 1, 0, 499, '[{"type": "discount_percentage", "value": 5}]', '#CD7F32', 'star'),
  ('Argent', 'Membre apprécié', 2, 500, 1499, '[{"type": "discount_percentage", "value": 10}]', '#C0C0C0', 'shield'),
  ('Or', 'Client fidèle', 3, 1500, 4999, '[{"type": "discount_percentage", "value": 15}]', '#FFD700', 'crown'),
  ('Platine', 'VIP', 4, 5000, 9999, '[{"type": "discount_percentage", "value": 20}]', '#E5E4E2', 'diamond'),
  ('Diamant', 'Légende', 5, 10000, NULL, '[{"type": "discount_percentage", "value": 25}]', '#B9F2FF', 'gem')
ON CONFLICT DO NOTHING;

INSERT INTO loyalty_rules (name, description, event_type, points, priority)
VALUES
  ('Premier achat', 'Bonus premier achat', 'purchase', 100, 10),
  ('Achat standard', 'Points par achat', 'purchase', 10, 5),
  ('Avis produit', 'Points pour avis', 'review', 50, 8),
  ('Partage social', 'Points partage', 'social_share', 25, 6),
  ('Parrainage', 'Points parrainage', 'referral', 200, 9)
ON CONFLICT DO NOTHING;

-- ÉTAPE 12: Vérification finale
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name LIKE '%loyalty%'
ORDER BY table_name, ordinal_position;

-- Résultat attendu: Toutes les tables loyalty_* avec colonne user_id dans loyalty_transactions