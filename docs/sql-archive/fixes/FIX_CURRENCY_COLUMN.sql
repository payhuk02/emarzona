-- ============================================================
-- SOLUTION COMPLÈTE : Ajouter TOUTES les colonnes nécessaires
-- ============================================================
-- INSTRUCTIONS:
-- 1. Ouvrez Supabase Dashboard → SQL Editor
-- 2. Copiez TOUT ce fichier
-- 3. Collez dans l'éditeur SQL
-- 4. Cliquez sur "Run" (ou Ctrl+Enter)
-- ============================================================

-- Étape 1: Ajouter la colonne currency (si elle n'existe pas)
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'XOF';

-- Mettre à jour les valeurs NULL (si la table contient déjà des données)
UPDATE public.transactions 
SET currency = 'XOF' 
WHERE currency IS NULL;

-- Rendre la colonne NOT NULL
ALTER TABLE public.transactions 
ALTER COLUMN currency SET NOT NULL,
ALTER COLUMN currency SET DEFAULT 'XOF';

-- Étape 2: Ajouter les colonnes de base (si elles n'existent pas)
-- Ces colonnes sont ESSENTIELLES pour le fonctionnement des transactions
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS store_id UUID,
ADD COLUMN IF NOT EXISTS product_id UUID,
ADD COLUMN IF NOT EXISTS order_id UUID,
ADD COLUMN IF NOT EXISTS customer_id UUID,
ADD COLUMN IF NOT EXISTS amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_provider TEXT DEFAULT 'moneroo',
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS customer_email TEXT,
ADD COLUMN IF NOT EXISTS customer_name TEXT,
ADD COLUMN IF NOT EXISTS customer_phone TEXT;

-- Étape 3: Ajouter les colonnes Moneroo (si elles n'existent pas)
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS moneroo_transaction_id TEXT,
ADD COLUMN IF NOT EXISTS moneroo_checkout_url TEXT,
ADD COLUMN IF NOT EXISTS moneroo_payment_method TEXT,
ADD COLUMN IF NOT EXISTS moneroo_response JSONB;

-- Étape 4: Ajouter les colonnes PayDunya (si elles n'existent pas)
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS paydunya_transaction_id TEXT,
ADD COLUMN IF NOT EXISTS paydunya_checkout_url TEXT,
ADD COLUMN IF NOT EXISTS paydunya_payment_method TEXT,
ADD COLUMN IF NOT EXISTS paydunya_response JSONB;

-- Étape 5: Ajouter les colonnes de timestamps (si elles n'existent pas)
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS failed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP WITH TIME ZONE;

-- Étape 6: Ajouter les colonnes de suivi d'erreurs (si elles n'existent pas)
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS error_message TEXT,
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;

-- Étape 7: Ajouter les colonnes de remboursement Moneroo (si elles n'existent pas)
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS moneroo_refund_id TEXT,
ADD COLUMN IF NOT EXISTS moneroo_refund_amount NUMERIC,
ADD COLUMN IF NOT EXISTS moneroo_refund_reason TEXT;

-- Étape 8: Vérifier que toutes les colonnes essentielles existent
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
    'amount', 
    'status', 
    'payment_provider',
    'metadata',
    'customer_email'
  )
ORDER BY column_name;

-- ============================================================
-- IMPORTANT: Après avoir exécuté ce script
-- ============================================================
-- 1. Rafraîchissez le cache du schéma dans Supabase Dashboard:
--    Settings → API → "Refresh schema cache"
-- 
-- 2. Videz le cache de votre navigateur (Ctrl+Shift+R)
--
-- 3. Testez à nouveau le paiement sur le marketplace
-- ============================================================

