-- Advanced orders: payments RLS sans auth.users + affiliates.store_id
-- Exécution : supabase db execute -f tests/financial/advanced-orders-rls-alignment.test.sql

DO $$
BEGIN
  ASSERT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'affiliates'
      AND column_name = 'store_id'
  ), 'affiliates.store_id column must exist';

  ASSERT NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'payments'
      AND policyname = 'payments_select_policy'
      AND qual LIKE '%auth.users%'
  ), 'payments_select_policy must not reference auth.users';

  ASSERT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'payments'
      AND policyname = 'payments_select_policy'
  ), 'payments_select_policy must exist';

  ASSERT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'transactions'
      AND policyname = 'transactions_select_policy'
  ), 'transactions_select_policy must exist';

  RAISE NOTICE '✓ Advanced orders RLS alignment OK';
END $$;
