-- Add MoneyFusion (FusionPay) as an allowed payment provider
-- Rail plateforme (lien API unique) — option sélectionnable au checkout, GeniusPay reste le fallback.

BEGIN;

DO $$
DECLARE
  c RECORD;
BEGIN
  -- 1. transactions.payment_provider : recréer la contrainte avec 'moneyfusion'
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
    CHECK (payment_provider IN (
      'geniuspay',
      'geniuspay_platform',
      'moneyfusion',
      'stripe',
      'stripe_connect',
      'paypal',
      'paypal_commerce',
      'flutterwave',
      'flutterwave_connect'
    ));

  -- 2. profiles.payment_provider_preference : recréer la contrainte avec 'moneyfusion'
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'payment_provider_preference'
  ) THEN
    FOR c IN
      SELECT conname
      FROM pg_constraint
      WHERE conrelid = 'public.profiles'::regclass
        AND contype = 'c'
        AND pg_get_constraintdef(oid) ILIKE '%payment_provider_preference%'
    LOOP
      EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS %I', c.conname);
    END LOOP;

    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_payment_provider_preference_check
      CHECK (payment_provider_preference IN (
        'geniuspay',
        'geniuspay_platform',
        'moneyfusion',
        'stripe',
        'stripe_connect',
        'paypal',
        'paypal_commerce',
        'flutterwave',
        'flutterwave_connect'
      ));
  END IF;

  -- 3. store_payment_connections.provider : autoriser 'moneyfusion'
  --    (connexion optionnelle — le rail plateforme fonctionne sans connexion boutique)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'store_payment_connections'
  ) THEN
    ALTER TABLE public.store_payment_connections
      DROP CONSTRAINT IF EXISTS store_payment_connections_provider_check;
    ALTER TABLE public.store_payment_connections
      ADD CONSTRAINT store_payment_connections_provider_check
      CHECK (provider IN (
        'geniuspay_platform',
        'moneyfusion',
        'moneroo_platform',
        'stripe_connect',
        'paypal_commerce',
        'flutterwave_connect'
      ));
  END IF;
END $$;

COMMIT;
