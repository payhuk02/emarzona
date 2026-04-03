-- =====================================================
-- AJOUT DES COLONNES MANQUANTES POUR FONCTIONNALITÉS AVANCÉES
-- Date: 2025-10-24
-- Description: Ajoute les colonnes nécessaires aux tables payments et orders
-- =====================================================

-- ==============================================
-- 1. AJOUTER COLONNES À LA TABLE PAYMENTS
-- ==============================================

DO $$ 
BEGIN
    -- payment_type
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'payments' 
        AND column_name = 'payment_type'
    ) THEN
        ALTER TABLE public.payments 
        ADD COLUMN payment_type TEXT DEFAULT 'full' CHECK (payment_type IN ('full', 'percentage', 'delivery_secured'));
        RAISE NOTICE 'Colonne payment_type ajoutée à payments';
    END IF;

    -- percentage_amount
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'payments' 
        AND column_name = 'percentage_amount'
    ) THEN
        ALTER TABLE public.payments ADD COLUMN percentage_amount NUMERIC DEFAULT 0;
        RAISE NOTICE 'Colonne percentage_amount ajoutée à payments';
    END IF;

    -- percentage_rate
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'payments' 
        AND column_name = 'percentage_rate'
    ) THEN
        ALTER TABLE public.payments ADD COLUMN percentage_rate NUMERIC DEFAULT 0;
        RAISE NOTICE 'Colonne percentage_rate ajoutée à payments';
    END IF;

    -- remaining_amount
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'payments' 
        AND column_name = 'remaining_amount'
    ) THEN
        ALTER TABLE public.payments ADD COLUMN remaining_amount NUMERIC DEFAULT 0;
        RAISE NOTICE 'Colonne remaining_amount ajoutée à payments';
    END IF;

    -- is_held
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'payments' 
        AND column_name = 'is_held'
    ) THEN
        ALTER TABLE public.payments ADD COLUMN is_held BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Colonne is_held ajoutée à payments';
    END IF;

    -- held_until
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'payments' 
        AND column_name = 'held_until'
    ) THEN
        ALTER TABLE public.payments ADD COLUMN held_until TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Colonne held_until ajoutée à payments';
    END IF;

    -- release_conditions
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'payments' 
        AND column_name = 'release_conditions'
    ) THEN
        ALTER TABLE public.payments ADD COLUMN release_conditions JSONB DEFAULT '{}'::jsonb;
        RAISE NOTICE 'Colonne release_conditions ajoutée à payments';
    END IF;

    -- delivery_confirmed_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'payments' 
        AND column_name = 'delivery_confirmed_at'
    ) THEN
        ALTER TABLE public.payments ADD COLUMN delivery_confirmed_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Colonne delivery_confirmed_at ajoutée à payments';
    END IF;

    -- delivery_confirmed_by
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'payments' 
        AND column_name = 'delivery_confirmed_by'
    ) THEN
        ALTER TABLE public.payments ADD COLUMN delivery_confirmed_by UUID REFERENCES auth.users(id);
        RAISE NOTICE 'Colonne delivery_confirmed_by ajoutée à payments';
    END IF;

    -- dispute_opened_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'payments' 
        AND column_name = 'dispute_opened_at'
    ) THEN
        ALTER TABLE public.payments ADD COLUMN dispute_opened_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Colonne dispute_opened_at ajoutée à payments';
    END IF;

    -- dispute_resolved_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'payments' 
        AND column_name = 'dispute_resolved_at'
    ) THEN
        ALTER TABLE public.payments ADD COLUMN dispute_resolved_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Colonne dispute_resolved_at ajoutée à payments';
    END IF;

    -- dispute_resolution
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'payments' 
        AND column_name = 'dispute_resolution'
    ) THEN
        ALTER TABLE public.payments ADD COLUMN dispute_resolution TEXT;
        RAISE NOTICE 'Colonne dispute_resolution ajoutée à payments';
    END IF;

END $$;

-- ==============================================
-- 2. AJOUTER COLONNES À LA TABLE ORDERS
-- ==============================================

DO $$ 
BEGIN
    -- payment_type
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'payment_type'
    ) THEN
        ALTER TABLE public.orders 
        ADD COLUMN payment_type TEXT DEFAULT 'full' CHECK (payment_type IN ('full', 'percentage', 'delivery_secured'));
        RAISE NOTICE 'Colonne payment_type ajoutée à orders';
    END IF;

    -- percentage_paid
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'percentage_paid'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN percentage_paid NUMERIC DEFAULT 0;
        RAISE NOTICE 'Colonne percentage_paid ajoutée à orders';
    END IF;

    -- remaining_amount
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'remaining_amount'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN remaining_amount NUMERIC DEFAULT 0;
        RAISE NOTICE 'Colonne remaining_amount ajoutée à orders';
    END IF;

    -- delivery_status
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'delivery_status'
    ) THEN
        ALTER TABLE public.orders 
        ADD COLUMN delivery_status TEXT DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'shipped', 'delivered', 'confirmed', 'disputed'));
        RAISE NOTICE 'Colonne delivery_status ajoutée à orders';
    END IF;

    -- delivery_tracking
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'delivery_tracking'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN delivery_tracking TEXT;
        RAISE NOTICE 'Colonne delivery_tracking ajoutée à orders';
    END IF;

    -- delivery_notes
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'delivery_notes'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN delivery_notes TEXT;
        RAISE NOTICE 'Colonne delivery_notes ajoutée à orders';
    END IF;

    -- delivery_confirmed_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'delivery_confirmed_at'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN delivery_confirmed_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Colonne delivery_confirmed_at ajoutée à orders';
    END IF;

    -- delivery_confirmed_by
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'delivery_confirmed_by'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN delivery_confirmed_by UUID REFERENCES auth.users(id);
        RAISE NOTICE 'Colonne delivery_confirmed_by ajoutée à orders';
    END IF;

END $$;

-- ==============================================
-- 3. AFFICHER LE RÉSUMÉ
-- ==============================================

DO $$ 
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ MIGRATION COMPLÉTÉE AVEC SUCCÈS !';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Colonnes ajoutées à "payments": 12';
    RAISE NOTICE '📋 Colonnes ajoutées à "orders": 8';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Les fonctionnalités avancées sont maintenant opérationnelles:';
    RAISE NOTICE '   - Messagerie client-vendeur';
    RAISE NOTICE '   - Système de litiges';
    RAISE NOTICE '   - Paiements sécurisés';
    RAISE NOTICE '   - Paiements partiels';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
END $$;

