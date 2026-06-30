-- Phase 0 — Audit RLS portails client (/account/*)
-- Vérifie que les tables lues par le portail acheteur ont RLS + politique SELECT acheteur.
-- Usage: npx supabase db query --linked -f supabase/scripts/audit-client-portal-rls.sql

DO $$
DECLARE
  v_row RECORD;
  v_fail INT := 0;
  v_select_count INT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'AUDIT RLS — PORTAILS CLIENT (/account/*)';
  RAISE NOTICE '============================================================';

  FOR v_row IN
    SELECT unnest(ARRAY[
      'orders',
      'order_items',
      'customers',
      'digital_licenses',
      'customer_downloads',
      'course_enrollments',
      'service_bookings',
      'product_returns',
      'product_warranties',
      'warranty_claims',
      'shipping_labels',
      'invoices',
      'order_protect_enrollments',
      'artist_product_certificates'
    ]) AS tablename
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_tables
      WHERE schemaname = 'public' AND tablename = v_row.tablename
    ) THEN
      RAISE WARNING '⚠ table % does not exist — skipped', v_row.tablename;
      CONTINUE;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename = v_row.tablename
        AND rowsecurity = true
    ) THEN
      RAISE WARNING '❌ % — RLS disabled', v_row.tablename;
      v_fail := v_fail + 1;
      CONTINUE;
    END IF;

    SELECT COUNT(*) INTO v_select_count
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = v_row.tablename
      AND cmd IN ('SELECT', '*', 'ALL');

    IF v_select_count = 0 THEN
      RAISE WARNING '❌ % — RLS on but no SELECT policy', v_row.tablename;
      v_fail := v_fail + 1;
    ELSE
      RAISE NOTICE '✓ % — RLS + % SELECT policy/policies', v_row.tablename, v_select_count;
    END IF;
  END LOOP;

  RAISE NOTICE '';
  IF v_fail > 0 THEN
    RAISE EXCEPTION 'audit-client-portal-rls failed: % table(s) missing buyer SELECT RLS', v_fail;
  END IF;

  RAISE NOTICE '✓ audit-client-portal-rls: all client portal tables pass';
END $$;
