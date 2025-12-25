-- Migration: Assurer que toutes les colonnes nécessaires existent dans la table transactions
-- Date: 1 Février 2025
-- Description: Ajoute toutes les colonnes manquantes pour le support complet des paiements Moneroo et PayDunya

DO $$
BEGIN
  -- Vérifier si la table transactions existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'transactions'
  ) THEN
    RAISE EXCEPTION 'La table transactions n''existe pas. Veuillez d''abord exécuter la migration initiale.';
  END IF;

  -- Vérifier et ajouter la colonne currency si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'transactions' 
    AND column_name = 'currency'
  ) THEN
    -- Ajouter d'abord comme nullable avec valeur par défaut
    ALTER TABLE public.transactions 
    ADD COLUMN currency TEXT DEFAULT 'XOF';
    
    -- Mettre à jour les valeurs NULL existantes
    UPDATE public.transactions 
    SET currency = 'XOF' 
    WHERE currency IS NULL;
    
    -- Maintenant rendre la colonne NOT NULL
    ALTER TABLE public.transactions 
    ALTER COLUMN currency SET NOT NULL,
    ALTER COLUMN currency SET DEFAULT 'XOF';
    
    RAISE NOTICE 'Colonne currency ajoutée à la table transactions';
  ELSE
    -- Si la colonne existe mais peut être NULL, s'assurer qu'elle a une valeur par défaut
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
      
      -- Rendre NOT NULL si nécessaire
      ALTER TABLE public.transactions 
      ALTER COLUMN currency SET NOT NULL,
      ALTER COLUMN currency SET DEFAULT 'XOF';
      
      RAISE NOTICE 'Colonne currency mise à jour (NOT NULL avec DEFAULT)';
    END IF;
  END IF;

  -- Vérifier et ajouter la colonne payment_provider si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'transactions' 
    AND column_name = 'payment_provider'
  ) THEN
    ALTER TABLE public.transactions 
    ADD COLUMN payment_provider TEXT DEFAULT 'moneroo' CHECK (payment_provider IN ('moneroo'));
    RAISE NOTICE 'Colonne payment_provider ajoutée à la table transactions';
  END IF;

  -- Vérifier et ajouter les colonnes PayDunya si elles n'existent pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'transactions' 
    AND column_name = 'legacy_removed_provider_transaction_id'
  ) THEN
    ALTER TABLE public.transactions 
    -- Ancien provider supprimé du projet: aucune colonne ajoutée
    RAISE NOTICE 'Provider supprimé: aucune colonne legacy ajoutée';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'transactions' 
    AND column_name = 'legacy_removed_provider_checkout_url'
  ) THEN
    ALTER TABLE public.transactions 
    -- Ancien provider supprimé du projet: aucune colonne ajoutée
    RAISE NOTICE 'Provider supprimé: aucune colonne legacy ajoutée';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'transactions' 
    AND column_name = 'legacy_removed_provider_payment_method'
  ) THEN
    ALTER TABLE public.transactions 
    -- Ancien provider supprimé du projet: aucune colonne ajoutée
    RAISE NOTICE 'Provider supprimé: aucune colonne legacy ajoutée';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'transactions' 
    AND column_name = 'legacy_removed_provider_response'
  ) THEN
    ALTER TABLE public.transactions 
    -- Ancien provider supprimé du projet: aucune colonne ajoutée
    RAISE NOTICE 'Provider supprimé: aucune colonne legacy ajoutée';
  END IF;

  -- Vérifier et ajouter les colonnes Moneroo refund si elles n'existent pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'transactions' 
    AND column_name = 'moneroo_refund_id'
  ) THEN
    ALTER TABLE public.transactions 
    ADD COLUMN moneroo_refund_id TEXT;
    RAISE NOTICE 'Colonne moneroo_refund_id ajoutée à la table transactions';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'transactions' 
    AND column_name = 'moneroo_refund_amount'
  ) THEN
    ALTER TABLE public.transactions 
    ADD COLUMN moneroo_refund_amount NUMERIC;
    RAISE NOTICE 'Colonne moneroo_refund_amount ajoutée à la table transactions';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'transactions' 
    AND column_name = 'moneroo_refund_reason'
  ) THEN
    ALTER TABLE public.transactions 
    ADD COLUMN moneroo_refund_reason TEXT;
    RAISE NOTICE 'Colonne moneroo_refund_reason ajoutée à la table transactions';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'transactions' 
    AND column_name = 'refunded_at'
  ) THEN
    ALTER TABLE public.transactions 
    ADD COLUMN refunded_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'Colonne refunded_at ajoutée à la table transactions';
  END IF;

  -- Vérifier et ajouter les colonnes customer si elles n'existent pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'transactions' 
    AND column_name = 'customer_email'
  ) THEN
    ALTER TABLE public.transactions 
    ADD COLUMN customer_email TEXT;
    RAISE NOTICE 'Colonne customer_email ajoutée à la table transactions';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'transactions' 
    AND column_name = 'customer_name'
  ) THEN
    ALTER TABLE public.transactions 
    ADD COLUMN customer_name TEXT;
    RAISE NOTICE 'Colonne customer_name ajoutée à la table transactions';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'transactions' 
    AND column_name = 'customer_phone'
  ) THEN
    ALTER TABLE public.transactions 
    ADD COLUMN customer_phone TEXT;
    RAISE NOTICE 'Colonne customer_phone ajoutée à la table transactions';
  END IF;

  -- Vérifier et ajouter la colonne metadata si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'transactions' 
    AND column_name = 'metadata'
  ) THEN
    ALTER TABLE public.transactions 
    ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    RAISE NOTICE 'Colonne metadata ajoutée à la table transactions';
  END IF;

  -- Créer les index pour les nouvelles colonnes si nécessaire
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'transactions' 
    AND indexname = 'legacy_removed_idx_transactions_provider_id'
  ) THEN
    -- Ancien provider supprimé du projet: aucun index legacy créé
    RAISE NOTICE 'Provider supprimé: aucun index legacy créé';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'transactions' 
    AND indexname = 'idx_transactions_payment_provider'
  ) THEN
    CREATE INDEX idx_transactions_payment_provider ON public.transactions(payment_provider);
    RAISE NOTICE 'Index idx_transactions_payment_provider créé';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'transactions' 
    AND indexname = 'idx_transactions_currency'
  ) THEN
    CREATE INDEX idx_transactions_currency ON public.transactions(currency);
    RAISE NOTICE 'Index idx_transactions_currency créé';
  END IF;

END $$;

-- Commentaires pour documentation
COMMENT ON COLUMN public.transactions.currency IS 'Devise de la transaction (XOF par défaut)';
COMMENT ON COLUMN public.transactions.payment_provider IS 'Provider de paiement utilisé (moneroo)';
COMMENT ON COLUMN public.transactions.moneroo_refund_id IS 'ID de remboursement Moneroo';
COMMENT ON COLUMN public.transactions.moneroo_refund_amount IS 'Montant du remboursement Moneroo';
COMMENT ON COLUMN public.transactions.moneroo_refund_reason IS 'Raison du remboursement Moneroo';
COMMENT ON COLUMN public.transactions.refunded_at IS 'Date et heure du remboursement';
COMMENT ON COLUMN public.transactions.metadata IS 'Métadonnées JSONB de la transaction (inclut userId pour RLS)';

