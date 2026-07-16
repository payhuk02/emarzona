-- Fix transactions.payment_provider check constraint to allow geniuspay

BEGIN;

DO $$
DECLARE
  c RECORD;
BEGIN
  -- 1. Transactions table
  -- Supprimer toutes contraintes CHECK sur payment_provider pour transactions
  FOR c IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.transactions'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%payment_provider%'
  LOOP
    EXECUTE format('ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS %I', c.conname);
  END LOOP;

  -- Mettre à jour l'existant
  UPDATE public.transactions
  SET payment_provider = 'geniuspay'
  WHERE payment_provider IN ('moneroo', 'moneroo_platform');

  -- Modifier la valeur par défaut
  ALTER TABLE public.transactions ALTER COLUMN payment_provider SET DEFAULT 'geniuspay';

  -- Ajouter la nouvelle contrainte
  ALTER TABLE public.transactions
    ADD CONSTRAINT transactions_payment_provider_check
    CHECK (payment_provider IN ('geniuspay', 'geniuspay_platform', 'stripe', 'paypal'));

  -- 2. profiles table
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'payment_provider_preference'
  ) THEN
    -- Mettre à jour l'existant
    UPDATE public.profiles
    SET payment_provider_preference = 'geniuspay'
    WHERE payment_provider_preference IN ('moneroo', 'moneroo_platform');
    
    -- Changer le default
    ALTER TABLE public.profiles ALTER COLUMN payment_provider_preference SET DEFAULT 'geniuspay';
  END IF;

END $$;

COMMIT;
