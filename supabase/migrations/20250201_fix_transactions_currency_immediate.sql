-- Script SQL IMMÉDIAT pour corriger l'erreur "currency column does not exist"
-- Date: 1 Février 2025
-- Description: Ajoute la colonne currency et toutes les autres colonnes manquantes
-- INSTRUCTIONS: Copiez et exécutez ce script dans Supabase Dashboard → SQL Editor

-- ============================================================
-- ÉTAPE 1: Vérifier et créer la colonne currency
-- ============================================================

-- Si la colonne n'existe pas, l'ajouter
DO $$
BEGIN
  -- Vérifier si la table existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'transactions'
  ) THEN
    RAISE EXCEPTION 'ERREUR: La table transactions n''existe pas. Veuillez d''abord créer la table.';
  END IF;

  -- Ajouter la colonne currency si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'transactions' 
    AND column_name = 'currency'
  ) THEN
    -- Étape 1: Ajouter la colonne comme nullable avec valeur par défaut
    ALTER TABLE public.transactions 
    ADD COLUMN currency TEXT DEFAULT 'XOF';
    
    -- Étape 2: Mettre à jour toutes les valeurs NULL existantes
    UPDATE public.transactions 
    SET currency = 'XOF' 
    WHERE currency IS NULL;
    
    -- Étape 3: Rendre la colonne NOT NULL
    ALTER TABLE public.transactions 
    ALTER COLUMN currency SET NOT NULL,
    ALTER COLUMN currency SET DEFAULT 'XOF';
    
    RAISE NOTICE '✅ Colonne currency ajoutée avec succès';
  ELSE
    RAISE NOTICE 'ℹ️ Colonne currency existe déjà';
    
    -- Vérifier si elle est nullable et la corriger si nécessaire
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'transactions' 
      AND column_name = 'currency'
      AND is_nullable = 'YES'
    ) THEN
      -- Mettre à jour les valeurs NULL
      UPDATE public.transactions 
      SET currency = 'XOF' 
      WHERE currency IS NULL;
      
      -- Rendre NOT NULL
      ALTER TABLE public.transactions 
      ALTER COLUMN currency SET NOT NULL,
      ALTER COLUMN currency SET DEFAULT 'XOF';
      
      RAISE NOTICE '✅ Colonne currency mise à jour (maintenant NOT NULL)';
    END IF;
  END IF;
END $$;

-- ============================================================
-- ÉTAPE 2: Ajouter les autres colonnes essentielles
-- ============================================================

-- Ajouter payment_provider si elle n'existe pas
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS payment_provider TEXT DEFAULT 'moneroo';

-- Ajouter metadata si elle n'existe pas
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Ajouter les colonnes customer si elles n'existent pas
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS customer_email TEXT,
ADD COLUMN IF NOT EXISTS customer_name TEXT,
ADD COLUMN IF NOT EXISTS customer_phone TEXT;

-- Ajouter les colonnes PayDunya si elles n'existent pas
ALTER TABLE public.transactions
-- Ancien provider supprimé du projet: aucune colonne legacy n'est ajoutée.

-- ============================================================
-- ÉTAPE 3: Créer les index pour améliorer les performances
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_transactions_currency 
ON public.transactions(currency);

CREATE INDEX IF NOT EXISTS idx_transactions_payment_provider 
ON public.transactions(payment_provider);

-- Ancien provider supprimé du projet: aucun index legacy créé.

-- ============================================================
-- ÉTAPE 4: Vérifier le résultat
-- ============================================================

-- Afficher les colonnes de la table transactions
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'transactions'
ORDER BY ordinal_position;

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Migration terminée avec succès!';
  RAISE NOTICE '✅ La colonne currency est maintenant disponible';
  RAISE NOTICE '✅ Toutes les colonnes nécessaires ont été ajoutées';
  RAISE NOTICE '';
  RAISE NOTICE '📝 PROCHAINES ÉTAPES:';
  RAISE NOTICE '1. Rafraîchissez le cache du schéma dans Supabase Dashboard';
  RAISE NOTICE '2. Testez à nouveau le paiement sur le marketplace';
END $$;






