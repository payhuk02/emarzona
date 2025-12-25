-- Migration: Correction des tables price_alerts et stock_alerts
-- Date: 31 Janvier 2025
-- Description: S'assure que les tables existent avec les bonnes colonnes

-- ============================================================
-- VÉRIFIER ET CRÉER/CORRIGER TABLE PRICE_ALERTS
-- ============================================================
DO $$
BEGIN
  -- Vérifier si la table existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'price_alerts'
  ) THEN
    -- Créer la table
    CREATE TABLE public.price_alerts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
      target_price NUMERIC NOT NULL,
      current_price NUMERIC NOT NULL,
      currency TEXT NOT NULL DEFAULT 'XOF',
      notified BOOLEAN DEFAULT false,
      notification_sent_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, product_id)
    );
  ELSE
    -- Vérifier si la colonne user_id existe
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'price_alerts'
      AND column_name = 'user_id'
    ) THEN
      -- Ajouter la colonne user_id
      ALTER TABLE public.price_alerts
      ADD COLUMN user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- ============================================================
-- VÉRIFIER ET CRÉER/CORRIGER TABLE STOCK_ALERTS
-- ============================================================
DO $$
BEGIN
  -- Vérifier si la table existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'stock_alerts'
  ) THEN
    -- Créer la table
    CREATE TABLE public.stock_alerts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
      notified BOOLEAN DEFAULT false,
      notification_sent_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, product_id)
    );
  ELSE
    -- Vérifier si la colonne user_id existe
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'stock_alerts'
      AND column_name = 'user_id'
    ) THEN
      -- Ajouter la colonne user_id
      ALTER TABLE public.stock_alerts
      ADD COLUMN user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- ============================================================
-- CRÉER LES INDEX S'ILS N'EXISTENT PAS
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_price_alerts_user_id ON public.price_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_product_id ON public.price_alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_notified ON public.price_alerts(notified) WHERE notified = false;
CREATE INDEX IF NOT EXISTS idx_price_alerts_created_at ON public.price_alerts(created_at);

CREATE INDEX IF NOT EXISTS idx_stock_alerts_user_id ON public.stock_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_product_id ON public.stock_alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_notified ON public.stock_alerts(notified) WHERE notified = false;
CREATE INDEX IF NOT EXISTS idx_stock_alerts_created_at ON public.stock_alerts(created_at);







