-- ============================================================
-- SOLUTION COMPLÈTE : Ajouter TOUTES les colonnes manquantes
-- ============================================================
-- Ce script ajoute toutes les colonnes nécessaires pour les transactions
-- INSTRUCTIONS:
-- 1. Ouvrez Supabase Dashboard → SQL Editor
-- 2. Copiez TOUT ce fichier
-- 3. Collez dans l'éditeur SQL
-- 4. Cliquez sur "Run" (ou Ctrl+Enter)
-- ============================================================

-- Vérifier si la table existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'transactions'
  ) THEN
    RAISE EXCEPTION 'La table transactions n''existe pas. Veuillez d''abord créer la table.';
  END IF;
END $$;

-- ============================================================
-- COLONNES DE BASE (ESSENTIELLES)
-- ============================================================

-- store_id (UUID, peut être NULL si pas de contrainte)
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS store_id UUID;

-- product_id (UUID, nullable)
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS product_id UUID;

-- order_id (UUID, nullable) - C'EST LA COLONNE MANQUANTE ACTUELLEMENT
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS order_id UUID;

-- customer_id (UUID, nullable)
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS customer_id UUID;

-- amount (NUMERIC, avec valeur par défaut)
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS amount NUMERIC DEFAULT 0;

-- currency (TEXT, NOT NULL avec valeur par défaut)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'transactions' 
    AND column_name = 'currency'
  ) THEN
    ALTER TABLE public.transactions 
    ADD COLUMN currency TEXT DEFAULT 'XOF';
    
    UPDATE public.transactions 
    SET currency = 'XOF' 
    WHERE currency IS NULL;
    
    ALTER TABLE public.transactions 
    ALTER COLUMN currency SET NOT NULL,
    ALTER COLUMN currency SET DEFAULT 'XOF';
  END IF;
END $$;

-- status (TEXT, avec valeur par défaut)
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- payment_provider (TEXT, avec valeur par défaut)
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS payment_provider TEXT DEFAULT 'moneroo';

-- metadata (JSONB, avec valeur par défaut)
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- ============================================================
-- COLONNES CUSTOMER (INFO CLIENT)
-- ============================================================

ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS customer_email TEXT,
ADD COLUMN IF NOT EXISTS customer_name TEXT,
ADD COLUMN IF NOT EXISTS customer_phone TEXT;

-- ============================================================
-- COLONNES MONEROO
-- ============================================================

ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS moneroo_transaction_id TEXT,
ADD COLUMN IF NOT EXISTS moneroo_checkout_url TEXT,
ADD COLUMN IF NOT EXISTS moneroo_payment_method TEXT,
ADD COLUMN IF NOT EXISTS moneroo_response JSONB;

-- ============================================================
-- COLONNES PAYDUNYA
-- ============================================================

ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS paydunya_transaction_id TEXT,
ADD COLUMN IF NOT EXISTS paydunya_checkout_url TEXT,
ADD COLUMN IF NOT EXISTS paydunya_payment_method TEXT,
ADD COLUMN IF NOT EXISTS paydunya_response JSONB;

-- ============================================================
-- COLONNES TIMESTAMPS
-- ============================================================

ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS failed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP WITH TIME ZONE;

-- ============================================================
-- COLONNES ERREURS ET SUIVI
-- ============================================================

ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS error_message TEXT,
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;

-- ============================================================
-- COLONNES REMBOURSEMENT MONEROO
-- ============================================================

ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS moneroo_refund_id TEXT,
ADD COLUMN IF NOT EXISTS moneroo_refund_amount NUMERIC,
ADD COLUMN IF NOT EXISTS moneroo_refund_reason TEXT;

-- ============================================================
-- COLONNES OPTIONNELLES (si elles n'existent pas)
-- ============================================================

ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS payment_id UUID;

-- ============================================================
-- CRÉER LES INDEX SI NÉCESSAIRES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_transactions_store_id 
ON public.transactions(store_id) 
WHERE store_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_order_id 
ON public.transactions(order_id) 
WHERE order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_product_id 
ON public.transactions(product_id) 
WHERE product_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_customer_id 
ON public.transactions(customer_id) 
WHERE customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_status 
ON public.transactions(status);

CREATE INDEX IF NOT EXISTS idx_transactions_currency 
ON public.transactions(currency);

CREATE INDEX IF NOT EXISTS idx_transactions_payment_provider 
ON public.transactions(payment_provider);

CREATE INDEX IF NOT EXISTS idx_transactions_created_at 
ON public.transactions(created_at DESC);

-- ============================================================
-- VÉRIFICATION: Afficher toutes les colonnes créées
-- ============================================================

SELECT 
  '✅ Colonnes créées avec succès!' as result,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'transactions'
  AND column_name IN (
    'currency', 
    'store_id', 
    'product_id', 
    'order_id', 
    'customer_id',
    'amount', 
    'status', 
    'payment_provider',
    'metadata',
    'customer_email',
    'customer_name',
    'customer_phone'
  )
ORDER BY column_name;

-- ============================================================
-- MESSAGE DE CONFIRMATION
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration terminée avec succès!';
  RAISE NOTICE '✅ Toutes les colonnes nécessaires ont été ajoutées';
  RAISE NOTICE '';
  RAISE NOTICE '📝 PROCHAINES ÉTAPES:';
  RAISE NOTICE '1. Rafraîchissez le cache du schéma dans Supabase Dashboard';
  RAISE NOTICE '   Settings → API → Refresh schema cache';
  RAISE NOTICE '2. Videz le cache de votre navigateur (Ctrl+Shift+R)';
  RAISE NOTICE '3. Testez à nouveau le paiement sur le marketplace';
END $$;






