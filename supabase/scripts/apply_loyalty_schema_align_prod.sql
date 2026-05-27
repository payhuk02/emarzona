-- Alignement schéma fidélité prod (idempotent) — tiers legacy + colonnes programme 20250127
-- Versionné : supabase/migrations/20260527100000__loyalty_schema_align_prod.sql
-- Exécution manuelle : npx supabase db query --linked -f supabase/scripts/apply_loyalty_schema_align_prod.sql

-- ---------------------------------------------------------------------------
-- 1. loyalty_tiers : ajouter colonnes programme sans supprimer level/min_points
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'loyalty_tier_type') THEN
    CREATE TYPE loyalty_tier_type AS ENUM ('bronze', 'silver', 'gold', 'platinum');
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'loyalty_tiers'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'loyalty_tiers' AND column_name = 'tier_type'
    ) THEN
      ALTER TABLE public.loyalty_tiers
        ADD COLUMN tier_type loyalty_tier_type NOT NULL DEFAULT 'bronze';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'loyalty_tiers' AND column_name = 'min_points_required'
    ) THEN
      ALTER TABLE public.loyalty_tiers ADD COLUMN min_points_required INTEGER NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'loyalty_tiers' AND column_name = 'is_active'
    ) THEN
      ALTER TABLE public.loyalty_tiers ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'loyalty_tiers' AND column_name = 'display_order'
    ) THEN
      ALTER TABLE public.loyalty_tiers ADD COLUMN display_order INTEGER NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'loyalty_tiers' AND column_name = 'is_default'
    ) THEN
      ALTER TABLE public.loyalty_tiers ADD COLUMN is_default BOOLEAN NOT NULL DEFAULT false;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'loyalty_tiers' AND column_name = 'points_multiplier'
    ) THEN
      ALTER TABLE public.loyalty_tiers ADD COLUMN points_multiplier NUMERIC NOT NULL DEFAULT 1.0;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'loyalty_tiers' AND column_name = 'discount_percentage'
    ) THEN
      ALTER TABLE public.loyalty_tiers ADD COLUMN discount_percentage NUMERIC NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'loyalty_tiers' AND column_name = 'free_shipping'
    ) THEN
      ALTER TABLE public.loyalty_tiers ADD COLUMN free_shipping BOOLEAN NOT NULL DEFAULT false;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'loyalty_tiers' AND column_name = 'exclusive_access'
    ) THEN
      ALTER TABLE public.loyalty_tiers ADD COLUMN exclusive_access BOOLEAN NOT NULL DEFAULT false;
    END IF;
  END IF;
END $$;

-- Backfill depuis colonnes legacy (level, min_points)
UPDATE public.loyalty_tiers
SET
  min_points_required = COALESCE(min_points_required, min_points, 0),
  display_order = CASE WHEN display_order = 0 AND level IS NOT NULL THEN level ELSE display_order END,
  is_default = CASE WHEN level = 1 THEN true ELSE COALESCE(is_default, false) END,
  tier_type = CASE COALESCE(level, 1)
    WHEN 1 THEN 'bronze'::loyalty_tier_type
    WHEN 2 THEN 'silver'::loyalty_tier_type
    WHEN 3 THEN 'gold'::loyalty_tier_type
    WHEN 4 THEN 'platinum'::loyalty_tier_type
    ELSE 'platinum'::loyalty_tier_type
  END
WHERE EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'loyalty_tiers' AND column_name = 'level'
);

-- ---------------------------------------------------------------------------
-- 2. loyalty_points : s'assurer que current_tier_type existe (déjà OK en prod)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'loyalty_points'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'loyalty_points' AND column_name = 'current_tier_type'
  ) THEN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'loyalty_tier_type') THEN
    CREATE TYPE loyalty_tier_type AS ENUM ('bronze', 'silver', 'gold', 'platinum');
  END IF;
    ALTER TABLE public.loyalty_points
      ADD COLUMN current_tier_type loyalty_tier_type DEFAULT 'bronze';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3. loyalty_reward_redemptions : customer_id si seulement user_id (schéma 20260329)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'loyalty_reward_redemptions'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'loyalty_reward_redemptions' AND column_name = 'customer_id'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'loyalty_reward_redemptions' AND column_name = 'user_id'
    ) THEN
      ALTER TABLE public.loyalty_reward_redemptions ADD COLUMN customer_id UUID;
      UPDATE public.loyalty_reward_redemptions SET customer_id = user_id WHERE customer_id IS NULL;
    END IF;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 4. Index utiles (idempotent)
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_loyalty_points_customer_id ON public.loyalty_points(customer_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_tiers_store_id ON public.loyalty_tiers(store_id);

SELECT 'loyalty_schema_align_prod OK' AS status;
