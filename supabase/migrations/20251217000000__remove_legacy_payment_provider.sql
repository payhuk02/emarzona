-- Migration: Nettoyage complet d'un ancien provider de paiement
-- Date: 17 Décembre 2025
-- Description: Supprime les colonnes/index/contraintes d'un ancien provider et force l'usage de Moneroo.

DO $$
DECLARE
  c RECORD;
BEGIN
  -- 1) transactions: supprimer colonnes legacy (si présentes)
  ALTER TABLE public.transactions
    DROP COLUMN IF EXISTS legacy_checkout_url,
    DROP COLUMN IF EXISTS legacy_invoice_token,
    DROP COLUMN IF EXISTS legacy_payment_method,
    DROP COLUMN IF EXISTS legacy_response,
    DROP COLUMN IF EXISTS legacy_transaction_id;

  -- 2) transactions: supprimer toutes contraintes CHECK sur payment_provider, puis réajouter une contrainte stricte
  FOR c IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.transactions'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%payment_provider%'
  LOOP
    EXECUTE format('ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS %I', c.conname);
  END LOOP;

  ALTER TABLE public.transactions
    ADD CONSTRAINT transactions_payment_provider_check
    CHECK (payment_provider IN ('moneroo'));

  -- 3) stores: forcer enabled_payment_providers à ['moneroo'] si la colonne existe
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'stores' AND column_name = 'enabled_payment_providers'
  ) THEN
    UPDATE public.stores
    SET enabled_payment_providers = ARRAY['moneroo']::TEXT[];
  END IF;

  -- 4) profiles: forcer payment_provider_preference à 'moneroo' si la colonne existe
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'payment_provider_preference'
  ) THEN
    UPDATE public.profiles
    SET payment_provider_preference = 'moneroo';
  END IF;
END $$;


