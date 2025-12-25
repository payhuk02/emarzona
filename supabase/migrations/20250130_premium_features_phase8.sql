-- =====================================================
-- PREMIUM FEATURES - Phase 8
-- Date: 2025-01-30
-- Description: Améliorations pour features premium (Live streaming, Subscriptions étendues, Bundles améliorés, Gamification)
-- =====================================================

-- =====================================================
-- 1. AMÉLIORATION LIVE STREAMING - Streaming natif avancé
-- =====================================================

-- Ajouter colonnes pour streaming natif avancé
DO $$
BEGIN
  -- Colonnes pour streaming natif
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'course_live_sessions' AND column_name = 'streaming_provider'
  ) THEN
    ALTER TABLE public.course_live_sessions
    ADD COLUMN streaming_provider TEXT CHECK (streaming_provider IN ('webrtc', 'hls', 'rtmp', 'mux', 'agora', 'custom'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'course_live_sessions' AND column_name = 'streaming_key'
  ) THEN
    ALTER TABLE public.course_live_sessions
    ADD COLUMN streaming_key TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'course_live_sessions' AND column_name = 'streaming_rtmp_url'
  ) THEN
    ALTER TABLE public.course_live_sessions
    ADD COLUMN streaming_rtmp_url TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'course_live_sessions' AND column_name = 'streaming_hls_url'
  ) THEN
    ALTER TABLE public.course_live_sessions
    ADD COLUMN streaming_hls_url TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'course_live_sessions' AND column_name = 'streaming_playback_url'
  ) THEN
    ALTER TABLE public.course_live_sessions
    ADD COLUMN streaming_playback_url TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'course_live_sessions' AND column_name = 'max_viewers'
  ) THEN
    ALTER TABLE public.course_live_sessions
    ADD COLUMN max_viewers INTEGER;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'course_live_sessions' AND column_name = 'current_viewers'
  ) THEN
    ALTER TABLE public.course_live_sessions
    ADD COLUMN current_viewers INTEGER DEFAULT 0;
  END IF;
END $$;

-- =====================================================
-- 2. EXTENSION SUBSCRIPTIONS - Abonnements pour tous types de produits
-- =====================================================

-- Table pour abonnements produits physiques
CREATE TABLE IF NOT EXISTS public.physical_product_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  physical_product_id UUID NOT NULL REFERENCES public.physical_products(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  -- Subscription info
  subscription_interval TEXT NOT NULL CHECK (subscription_interval IN ('monthly', 'yearly', 'quarterly', 'weekly', 'daily')),
  subscription_price NUMERIC(10, 2) NOT NULL CHECK (subscription_price >= 0),
  currency TEXT NOT NULL DEFAULT 'XOF',
  
  -- Status
  status TEXT NOT NULL CHECK (status IN (
    'active',
    'cancelled',
    'expired',
    'past_due',
    'trialing',
    'paused',
    'suspended'
  )) DEFAULT 'trialing',
  
  -- Billing periods
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  
  -- Cancellation
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  
  -- Renewal
  next_billing_date TIMESTAMPTZ,
  last_payment_date TIMESTAMPTZ,
  last_payment_amount NUMERIC(10, 2),
  
  -- Payment info
  payment_method_id TEXT,
  payment_provider TEXT,
  
  -- Shipping info (pour produits physiques)
  shipping_address JSONB,
  auto_ship BOOLEAN DEFAULT TRUE,
  
  -- Statistics
  total_payments INTEGER DEFAULT 0,
  total_amount_paid NUMERIC(10, 2) DEFAULT 0,
  failed_payment_attempts INTEGER DEFAULT 0,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_physical_subscriptions_product_id ON public.physical_product_subscriptions(physical_product_id);
CREATE INDEX IF NOT EXISTS idx_physical_subscriptions_customer_id ON public.physical_product_subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_physical_subscriptions_store_id ON public.physical_product_subscriptions(store_id);
CREATE INDEX IF NOT EXISTS idx_physical_subscriptions_status ON public.physical_product_subscriptions(status);

-- Table pour abonnements services
CREATE TABLE IF NOT EXISTS public.service_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_product_id UUID NOT NULL REFERENCES public.service_products(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  -- Subscription info
  subscription_interval TEXT NOT NULL CHECK (subscription_interval IN ('monthly', 'yearly', 'quarterly', 'weekly', 'daily')),
  subscription_price NUMERIC(10, 2) NOT NULL CHECK (subscription_price >= 0),
  currency TEXT NOT NULL DEFAULT 'XOF',
  
  -- Status
  status TEXT NOT NULL CHECK (status IN (
    'active',
    'cancelled',
    'expired',
    'past_due',
    'trialing',
    'paused',
    'suspended'
  )) DEFAULT 'trialing',
  
  -- Billing periods
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  
  -- Cancellation
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  
  -- Renewal
  next_billing_date TIMESTAMPTZ,
  last_payment_date TIMESTAMPTZ,
  last_payment_amount NUMERIC(10, 2),
  
  -- Payment info
  payment_method_id TEXT,
  payment_provider TEXT,
  
  -- Service info
  sessions_per_period INTEGER DEFAULT 1,
  sessions_used INTEGER DEFAULT 0,
  auto_book BOOLEAN DEFAULT FALSE,
  
  -- Statistics
  total_payments INTEGER DEFAULT 0,
  total_amount_paid NUMERIC(10, 2) DEFAULT 0,
  failed_payment_attempts INTEGER DEFAULT 0,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_service_subscriptions_product_id ON public.service_subscriptions(service_product_id);
CREATE INDEX IF NOT EXISTS idx_service_subscriptions_customer_id ON public.service_subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_service_subscriptions_store_id ON public.service_subscriptions(store_id);
CREATE INDEX IF NOT EXISTS idx_service_subscriptions_status ON public.service_subscriptions(status);

-- =====================================================
-- 3. AMÉLIORATION BUNDLES - Fonctionnalités avancées
-- =====================================================

-- Ajouter colonnes pour bundles avancés
DO $$
BEGIN
  -- Colonnes pour bundles flexibles
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_bundles' AND column_name = 'allow_customization'
  ) THEN
    ALTER TABLE public.product_bundles
    ADD COLUMN allow_customization BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_bundles' AND column_name = 'bundle_discount_type'
  ) THEN
    ALTER TABLE public.product_bundles
    ADD COLUMN bundle_discount_type TEXT CHECK (bundle_discount_type IN ('percentage', 'fixed', 'tiered')) DEFAULT 'percentage';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_bundles' AND column_name = 'tiered_discounts'
  ) THEN
    ALTER TABLE public.product_bundles
    ADD COLUMN tiered_discounts JSONB DEFAULT '[]'::jsonb;
  END IF;

  -- Colonnes pour bundles digitaux
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'digital_product_bundles'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'digital_product_bundles' AND column_name = 'allow_customization'
    ) THEN
      ALTER TABLE public.digital_product_bundles
      ADD COLUMN allow_customization BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'digital_product_bundles' AND column_name = 'bundle_discount_type'
    ) THEN
      ALTER TABLE public.digital_product_bundles
      ADD COLUMN bundle_discount_type TEXT CHECK (bundle_discount_type IN ('percentage', 'fixed', 'tiered')) DEFAULT 'percentage';
    END IF;
  END IF;
END $$;

-- =====================================================
-- 4. AMÉLIORATION GAMIFICATION - Système global
-- =====================================================

-- Table pour gamification globale (pas seulement cours)
CREATE TABLE IF NOT EXISTS public.user_gamification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Points globaux
  total_points INTEGER DEFAULT 0,
  points_earned_today INTEGER DEFAULT 0,
  points_earned_this_week INTEGER DEFAULT 0,
  points_earned_this_month INTEGER DEFAULT 0,
  
  -- Streaks
  current_streak_days INTEGER DEFAULT 0,
  longest_streak_days INTEGER DEFAULT 0,
  last_activity_date DATE,
  
  -- Levels
  current_level INTEGER DEFAULT 1,
  experience_points INTEGER DEFAULT 0,
  experience_points_to_next_level INTEGER DEFAULT 100,
  
  -- Statistics
  total_products_purchased INTEGER DEFAULT 0,
  total_orders_completed INTEGER DEFAULT 0,
  total_reviews_written INTEGER DEFAULT 0,
  total_referrals INTEGER DEFAULT 0,
  
  -- Achievements
  total_badges_earned INTEGER DEFAULT 0,
  total_achievements_unlocked INTEGER DEFAULT 0,
  
  -- Leaderboard
  global_rank INTEGER,
  monthly_rank INTEGER,
  weekly_rank INTEGER,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_gamification_user_id ON public.user_gamification(user_id);
CREATE INDEX IF NOT EXISTS idx_user_gamification_points ON public.user_gamification(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_user_gamification_level ON public.user_gamification(current_level DESC);

-- Table pour badges globaux
CREATE TABLE IF NOT EXISTS public.global_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  badge_type TEXT NOT NULL CHECK (badge_type IN (
    'purchase',
    'review',
    'referral',
    'streak',
    'level',
    'engagement',
    'custom'
  )),
  points_required INTEGER DEFAULT 0,
  criteria JSONB DEFAULT '{}'::jsonb,
  display_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table pour badges utilisateurs
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.global_badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notification_sent BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, badge_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON public.user_badges(badge_id);

-- Table pour achievements globaux
CREATE TABLE IF NOT EXISTS public.global_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  achievement_type TEXT NOT NULL CHECK (achievement_type IN (
    'milestone',
    'challenge',
    'special',
    'custom'
  )),
  criteria JSONB DEFAULT '{}'::jsonb,
  reward_points INTEGER DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table pour achievements utilisateurs
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.global_achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notification_sent BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, achievement_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON public.user_achievements(achievement_id);

-- Table pour historique des points globaux
CREATE TABLE IF NOT EXISTS public.user_points_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points_earned INTEGER NOT NULL,
  points_before INTEGER NOT NULL,
  points_after INTEGER NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN (
    'purchase',
    'review',
    'referral',
    'streak',
    'achievement',
    'badge',
    'engagement',
    'manual'
  )),
  source_id UUID,
  source_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_points_history_user_id ON public.user_points_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_points_history_created_at ON public.user_points_history(created_at DESC);

-- =====================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE public.physical_product_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_points_history ENABLE ROW LEVEL SECURITY;

-- Policies: physical_product_subscriptions
DROP POLICY IF EXISTS "customers_view_own_physical_subscriptions" ON public.physical_product_subscriptions;
CREATE POLICY "customers_view_own_physical_subscriptions" ON public.physical_product_subscriptions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.customers c
      WHERE c.id = physical_product_subscriptions.customer_id
        AND c.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "store_owners_manage_physical_subscriptions" ON public.physical_product_subscriptions;
CREATE POLICY "store_owners_manage_physical_subscriptions" ON public.physical_product_subscriptions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = physical_product_subscriptions.store_id
        AND s.user_id = auth.uid()
    )
  );

-- Policies: service_subscriptions
DROP POLICY IF EXISTS "customers_view_own_service_subscriptions" ON public.service_subscriptions;
CREATE POLICY "customers_view_own_service_subscriptions" ON public.service_subscriptions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.customers c
      WHERE c.id = service_subscriptions.customer_id
        AND c.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "store_owners_manage_service_subscriptions" ON public.service_subscriptions;
CREATE POLICY "store_owners_manage_service_subscriptions" ON public.service_subscriptions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = service_subscriptions.store_id
        AND s.user_id = auth.uid()
    )
  );

-- Policies: user_gamification
DROP POLICY IF EXISTS "users_view_own_gamification" ON public.user_gamification;
CREATE POLICY "users_view_own_gamification" ON public.user_gamification
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "public_view_gamification_leaderboard" ON public.user_gamification;
CREATE POLICY "public_view_gamification_leaderboard" ON public.user_gamification
  FOR SELECT
  USING (TRUE); -- Public pour leaderboard

-- Policies: global_badges
DROP POLICY IF EXISTS "public_view_global_badges" ON public.global_badges;
CREATE POLICY "public_view_global_badges" ON public.global_badges
  FOR SELECT
  USING (is_visible = TRUE);

-- Policies: user_badges
DROP POLICY IF EXISTS "users_view_own_badges" ON public.user_badges;
CREATE POLICY "users_view_own_badges" ON public.user_badges
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "public_view_user_badges" ON public.user_badges;
CREATE POLICY "public_view_user_badges" ON public.user_badges
  FOR SELECT
  USING (TRUE); -- Public pour affichage profil

-- Policies: global_achievements
DROP POLICY IF EXISTS "public_view_global_achievements" ON public.global_achievements;
CREATE POLICY "public_view_global_achievements" ON public.global_achievements
  FOR SELECT
  USING (is_visible = TRUE);

-- Policies: user_achievements
DROP POLICY IF EXISTS "users_view_own_achievements" ON public.user_achievements;
CREATE POLICY "users_view_own_achievements" ON public.user_achievements
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "public_view_user_achievements" ON public.user_achievements;
CREATE POLICY "public_view_user_achievements" ON public.user_achievements
  FOR SELECT
  USING (TRUE); -- Public pour affichage profil

-- Policies: user_points_history
DROP POLICY IF EXISTS "users_view_own_points_history" ON public.user_points_history;
CREATE POLICY "users_view_own_points_history" ON public.user_points_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- =====================================================
-- 6. FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction pour calculer le niveau d'un utilisateur
CREATE OR REPLACE FUNCTION public.calculate_user_level(
  p_experience_points INTEGER
)
RETURNS INTEGER AS $$
DECLARE
  v_level INTEGER := 1;
  v_xp_required INTEGER := 100;
  v_current_xp INTEGER := p_experience_points;
BEGIN
  -- Formule : niveau = floor(sqrt(xp / 100)) + 1
  -- Chaque niveau nécessite plus d'XP
  WHILE v_current_xp >= v_xp_required LOOP
    v_level := v_level + 1;
    v_xp_required := v_xp_required + (v_level * 50); -- Augmentation progressive
    v_current_xp := v_current_xp - v_xp_required;
  END LOOP;
  
  RETURN v_level;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Fonction pour calculer l'XP nécessaire pour le prochain niveau
CREATE OR REPLACE FUNCTION public.calculate_experience_to_next_level(
  p_current_level INTEGER,
  p_current_experience_points INTEGER
)
RETURNS INTEGER AS $$
DECLARE
  v_xp_required_for_current_level INTEGER := 0;
  v_xp_required_for_next_level INTEGER := 100;
  v_level INTEGER := 1;
BEGIN
  -- Calculer l'XP totale nécessaire pour atteindre le niveau actuel
  WHILE v_level < p_current_level LOOP
    v_xp_required_for_current_level := v_xp_required_for_current_level + v_xp_required_for_next_level;
    v_level := v_level + 1;
    v_xp_required_for_next_level := v_xp_required_for_next_level + (v_level * 50);
  END LOOP;
  
  -- L'XP nécessaire pour le prochain niveau est l'XP totale pour le prochain niveau
  -- moins l'XP actuelle de l'utilisateur
  RETURN (v_xp_required_for_current_level + v_xp_required_for_next_level) - p_current_experience_points;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Fonction pour attribuer des points globaux
CREATE OR REPLACE FUNCTION public.award_global_points(
  p_user_id UUID,
  p_points INTEGER,
  p_source_type TEXT,
  p_source_id UUID DEFAULT NULL,
  p_source_description TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_gamification RECORD;
  v_points_before INTEGER;
  v_points_after INTEGER;
  v_level_before INTEGER;
  v_level_after INTEGER;
  v_result JSON;
BEGIN
  -- Récupérer ou créer la gamification
  SELECT * INTO v_gamification
  FROM public.user_gamification
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    INSERT INTO public.user_gamification (user_id, total_points, experience_points)
    VALUES (p_user_id, p_points, p_points)
    RETURNING * INTO v_gamification;
    v_points_before := 0;
    v_points_after := p_points;
  ELSE
    v_points_before := v_gamification.total_points;
    v_points_after := v_gamification.total_points + p_points;
    v_level_before := v_gamification.current_level;
    
    -- Mettre à jour les points
    UPDATE public.user_gamification
    SET
      total_points = v_points_after,
      experience_points = experience_points + p_points,
      points_earned_today = CASE
        WHEN DATE(last_activity_date) = CURRENT_DATE THEN points_earned_today + p_points
        ELSE p_points
      END,
      points_earned_this_week = CASE
        WHEN DATE(last_activity_date) >= DATE_TRUNC('week', CURRENT_DATE) THEN points_earned_this_week + p_points
        ELSE p_points
      END,
      points_earned_this_month = CASE
        WHEN DATE(last_activity_date) >= DATE_TRUNC('month', CURRENT_DATE) THEN points_earned_this_month + p_points
        ELSE p_points
      END,
      last_activity_date = CURRENT_DATE,
      current_level = calculate_user_level(experience_points + p_points),
      experience_points_to_next_level = calculate_experience_to_next_level(
        calculate_user_level(experience_points + p_points),
        experience_points + p_points
      ),
      updated_at = now()
    WHERE user_id = p_user_id
    RETURNING * INTO v_gamification;
    
    v_level_after := v_gamification.current_level;
  END IF;
  
  -- Enregistrer dans l'historique
  INSERT INTO public.user_points_history (
    user_id,
    points_earned,
    points_before,
    points_after,
    source_type,
    source_id,
    source_description
  )
  VALUES (
    p_user_id,
    p_points,
    v_points_before,
    v_points_after,
    p_source_type,
    p_source_id,
    p_source_description
  );
  
  -- Construire le résultat
  SELECT json_build_object(
    'user_id', p_user_id,
    'points_earned', p_points,
    'points_before', v_points_before,
    'points_after', v_points_after,
    'level_before', COALESCE(v_level_before, 1),
    'level_after', v_gamification.current_level,
    'leveled_up', COALESCE(v_level_after, v_gamification.current_level) > COALESCE(v_level_before, 1)
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. TRIGGERS
-- =====================================================

-- Trigger updated_at pour user_gamification
DROP TRIGGER IF EXISTS update_user_gamification_updated_at ON public.user_gamification;
CREATE TRIGGER update_user_gamification_updated_at
  BEFORE UPDATE ON public.user_gamification
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 8. VÉRIFICATION
-- =====================================================

-- Afficher les tables créées
SELECT
  tablename,
  schemaname
FROM pg_tables
WHERE tablename IN (
  'physical_product_subscriptions',
  'service_subscriptions',
  'user_gamification',
  'global_badges',
  'user_badges',
  'global_achievements',
  'user_achievements',
  'user_points_history'
)
  AND schemaname = 'public';

