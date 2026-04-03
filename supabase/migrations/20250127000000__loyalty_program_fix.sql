-- ============================================================================
-- MIGRATION DE CORRECTION: Loyalty Program - Fix tier_type column
-- Date: 2025-01-27
-- Description: Vérifie et corrige la colonne tier_type si elle manque
-- ============================================================================

-- Vérifier si la colonne tier_type existe dans loyalty_tiers
DO $$
BEGIN
    -- Vérifier si la table existe
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'loyalty_tiers'
    ) THEN
        -- Vérifier si la colonne tier_type existe
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'loyalty_tiers'
            AND column_name = 'tier_type'
        ) THEN
            -- Créer le type s'il n'existe pas
            IF NOT EXISTS (
                SELECT 1 FROM pg_type WHERE typname = 'loyalty_tier_type'
            ) THEN
                CREATE TYPE loyalty_tier_type AS ENUM (
                    'bronze',
                    'silver',
                    'gold',
                    'platinum'
                );
            END IF;
            
            -- Ajouter la colonne tier_type
            ALTER TABLE public.loyalty_tiers 
            ADD COLUMN tier_type loyalty_tier_type NOT NULL DEFAULT 'bronze';
            
            RAISE NOTICE 'Colonne tier_type ajoutée à loyalty_tiers';
        ELSE
            RAISE NOTICE 'Colonne tier_type existe déjà dans loyalty_tiers';
        END IF;
    ELSE
        RAISE NOTICE 'Table loyalty_tiers n''existe pas encore';
    END IF;
END $$;

-- Vérifier si current_tier_type existe dans loyalty_points
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'loyalty_points'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'loyalty_points'
            AND column_name = 'current_tier_type'
        ) THEN
            IF NOT EXISTS (
                SELECT 1 FROM pg_type WHERE typname = 'loyalty_tier_type'
            ) THEN
                CREATE TYPE loyalty_tier_type AS ENUM (
                    'bronze',
                    'silver',
                    'gold',
                    'platinum'
                );
            END IF;
            
            ALTER TABLE public.loyalty_points 
            ADD COLUMN current_tier_type loyalty_tier_type DEFAULT 'bronze';
            
            RAISE NOTICE 'Colonne current_tier_type ajoutée à loyalty_points';
        END IF;
    END IF;
END $$;

-- Vérifier si min_tier existe dans loyalty_rewards
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'loyalty_rewards'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'loyalty_rewards'
            AND column_name = 'min_tier'
        ) THEN
            IF NOT EXISTS (
                SELECT 1 FROM pg_type WHERE typname = 'loyalty_tier_type'
            ) THEN
                CREATE TYPE loyalty_tier_type AS ENUM (
                    'bronze',
                    'silver',
                    'gold',
                    'platinum'
                );
            END IF;
            
            ALTER TABLE public.loyalty_rewards 
            ADD COLUMN min_tier loyalty_tier_type;
            
            RAISE NOTICE 'Colonne min_tier ajoutée à loyalty_rewards';
        END IF;
    END IF;
END $$;

SELECT 'Migration de correction terminée' AS status;

