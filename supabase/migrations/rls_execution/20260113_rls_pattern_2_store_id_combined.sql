-- ============================================================
-- Migrations RLS - Pattern 2 (store_id)
-- Date: 2026-01-13
-- Total: 8 migration(s)
-- ============================================================

-- Migration 1/8: disputes
-- Fichier: 20260113165233_rls_disputes.sql

-- ============================================================
-- Migration RLS : disputes
-- Date: 2026-01-13
-- 
-- Objectif: Ajouter des politiques RLS pour disputes
-- Pattern: 2 (Table avec store_id (données boutique))
-- ============================================================

DO $$
DECLARE
  v_table_name text := 'disputes';
  v_user_id_column text := 'user_id';
  v_store_id_column text := 'store_id';
  policy_count INTEGER;
BEGIN
-- ============================================================
-- VÉRIFICATIONS PRÉLIMINAIRES
-- ============================================================

  -- Vérifier que la table existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = v_table_name
  ) THEN
    RAISE EXCEPTION 'Table "%" does not exist in schema "public". Vérifiez le nom de la table.', v_table_name;
  END IF;

  -- Vérifier que RLS est activé
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = v_table_name 
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS must be enabled on %. Run: ALTER TABLE % ENABLE ROW LEVEL SECURITY;', v_table_name, v_table_name;
  END IF;

  -- Vérifier qu'il n'y a pas déjà de politiques
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = v_table_name
  ) THEN
    RAISE NOTICE 'Table % already has policies. Review existing policies before adding new ones.', v_table_name;
    RETURN;
  END IF;

-- ============================================================
-- PATTERN 2 : TABLE AVEC STORE_ID (DONNÉES BOUTIQUE)
-- ============================================================

  -- SELECT : Propriétaire de la boutique voit ses données + admins
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR SELECT USING (
      %I IN (SELECT id FROM stores WHERE user_id = auth.uid()) OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
    )',
    v_table_name || '_select_policy',
    v_table_name,
    v_store_id_column
  );

  -- INSERT : Propriétaire de la boutique peut créer
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR INSERT WITH CHECK (
      %I IN (SELECT id FROM stores WHERE user_id = auth.uid())
    )',
    v_table_name || '_insert_policy',
    v_table_name,
    v_store_id_column
  );

  -- UPDATE : Propriétaire de la boutique peut modifier + admins
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR UPDATE USING (
      %I IN (SELECT id FROM stores WHERE user_id = auth.uid()) OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
    )',
    v_table_name || '_update_policy',
    v_table_name,
    v_store_id_column
  );

  -- DELETE : Seulement admins (ou propriétaire selon contexte)
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR DELETE USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
    )',
    v_table_name || '_delete_policy',
    v_table_name
  );

-- ============================================================
-- VÉRIFICATION FINALE
-- ============================================================

  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = v_table_name;
  
  IF policy_count = 0 THEN
    RAISE WARNING 'No policies created for %. Review the migration.', v_table_name;
  ELSE
    RAISE NOTICE '✅ Created % policies for %', policy_count, v_table_name;
  END IF;

END $$;

-- ============================================================
-- COMMENTAIRES ET DOCUMENTATION
-- ============================================================

COMMENT ON POLICY "disputes_select_policy" ON disputes IS 
'Policy for SELECT operations on disputes. Pattern 2: Table avec store_id (données boutique)';

COMMENT ON POLICY "disputes_insert_policy" ON disputes IS 
'Policy for INSERT operations on disputes. Pattern 2: Table avec store_id (données boutique)';

COMMENT ON POLICY "disputes_update_policy" ON disputes IS 
'Policy for UPDATE operations on disputes. Pattern 2: Table avec store_id (données boutique)';

COMMENT ON POLICY "disputes_delete_policy" ON disputes IS 
'Policy for DELETE operations on disputes. Pattern 2: Table avec store_id (données boutique)';




-- Migration 2/8: invoices
-- Fichier: 20260113165233_rls_invoices.sql

-- ============================================================
-- Migration RLS : invoices
-- Date: 2026-01-13
-- 
-- Objectif: Ajouter des politiques RLS pour invoices
-- Pattern: 2 (Table avec store_id (données boutique))
-- ============================================================

DO $$
DECLARE
  v_table_name text := 'invoices';
  v_user_id_column text := 'user_id';
  v_store_id_column text := 'store_id';
  policy_count INTEGER;
BEGIN
-- ============================================================
-- VÉRIFICATIONS PRÉLIMINAIRES
-- ============================================================

  -- Vérifier que la table existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = v_table_name
  ) THEN
    RAISE EXCEPTION 'Table "%" does not exist in schema "public". Vérifiez le nom de la table.', v_table_name;
  END IF;

  -- Vérifier que RLS est activé
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = v_table_name 
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS must be enabled on %. Run: ALTER TABLE % ENABLE ROW LEVEL SECURITY;', v_table_name, v_table_name;
  END IF;

  -- Vérifier qu'il n'y a pas déjà de politiques
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = v_table_name
  ) THEN
    RAISE NOTICE 'Table % already has policies. Review existing policies before adding new ones.', v_table_name;
    RETURN;
  END IF;

-- ============================================================
-- PATTERN 2 : TABLE AVEC STORE_ID (DONNÉES BOUTIQUE)
-- ============================================================

  -- SELECT : Propriétaire de la boutique voit ses données + admins
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR SELECT USING (
      %I IN (SELECT id FROM stores WHERE user_id = auth.uid()) OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
    )',
    v_table_name || '_select_policy',
    v_table_name,
    v_store_id_column
  );

  -- INSERT : Propriétaire de la boutique peut créer
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR INSERT WITH CHECK (
      %I IN (SELECT id FROM stores WHERE user_id = auth.uid())
    )',
    v_table_name || '_insert_policy',
    v_table_name,
    v_store_id_column
  );

  -- UPDATE : Propriétaire de la boutique peut modifier + admins
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR UPDATE USING (
      %I IN (SELECT id FROM stores WHERE user_id = auth.uid()) OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
    )',
    v_table_name || '_update_policy',
    v_table_name,
    v_store_id_column
  );

  -- DELETE : Seulement admins (ou propriétaire selon contexte)
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR DELETE USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
    )',
    v_table_name || '_delete_policy',
    v_table_name
  );

-- ============================================================
-- VÉRIFICATION FINALE
-- ============================================================

  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = v_table_name;
  
  IF policy_count = 0 THEN
    RAISE WARNING 'No policies created for %. Review the migration.', v_table_name;
  ELSE
    RAISE NOTICE '✅ Created % policies for %', policy_count, v_table_name;
  END IF;

END $$;

-- ============================================================
-- COMMENTAIRES ET DOCUMENTATION
-- ============================================================

COMMENT ON POLICY "invoices_select_policy" ON invoices IS 
'Policy for SELECT operations on invoices. Pattern 2: Table avec store_id (données boutique)';

COMMENT ON POLICY "invoices_insert_policy" ON invoices IS 
'Policy for INSERT operations on invoices. Pattern 2: Table avec store_id (données boutique)';

COMMENT ON POLICY "invoices_update_policy" ON invoices IS 
'Policy for UPDATE operations on invoices. Pattern 2: Table avec store_id (données boutique)';

COMMENT ON POLICY "invoices_delete_policy" ON invoices IS 
'Policy for DELETE operations on invoices. Pattern 2: Table avec store_id (données boutique)';




-- Migration 3/8: subscriptions
-- Fichier: 20260113165233_rls_subscriptions.sql

-- ============================================================
-- Migration RLS : subscriptions
-- Date: 2026-01-13
-- 
-- Objectif: Ajouter des politiques RLS pour subscriptions
-- Pattern: 2 (Table avec store_id (données boutique))
-- ============================================================

DO $$
DECLARE
  v_table_name text := 'subscriptions';
  v_user_id_column text := 'user_id';
  v_store_id_column text := 'store_id';
  policy_count INTEGER;
BEGIN
-- ============================================================
-- VÉRIFICATIONS PRÉLIMINAIRES
-- ============================================================

  -- Vérifier que la table existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = v_table_name
  ) THEN
    RAISE EXCEPTION 'Table "%" does not exist in schema "public". Vérifiez le nom de la table.', v_table_name;
  END IF;

  -- Vérifier que RLS est activé
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = v_table_name 
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS must be enabled on %. Run: ALTER TABLE % ENABLE ROW LEVEL SECURITY;', v_table_name, v_table_name;
  END IF;

  -- Vérifier qu'il n'y a pas déjà de politiques
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = v_table_name
  ) THEN
    RAISE NOTICE 'Table % already has policies. Review existing policies before adding new ones.', v_table_name;
    RETURN;
  END IF;

-- ============================================================
-- PATTERN 2 : TABLE AVEC STORE_ID (DONNÉES BOUTIQUE)
-- ============================================================

  -- SELECT : Propriétaire de la boutique voit ses données + admins
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR SELECT USING (
      %I IN (SELECT id FROM stores WHERE user_id = auth.uid()) OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
    )',
    v_table_name || '_select_policy',
    v_table_name,
    v_store_id_column
  );

  -- INSERT : Propriétaire de la boutique peut créer
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR INSERT WITH CHECK (
      %I IN (SELECT id FROM stores WHERE user_id = auth.uid())
    )',
    v_table_name || '_insert_policy',
    v_table_name,
    v_store_id_column
  );

  -- UPDATE : Propriétaire de la boutique peut modifier + admins
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR UPDATE USING (
      %I IN (SELECT id FROM stores WHERE user_id = auth.uid()) OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
    )',
    v_table_name || '_update_policy',
    v_table_name,
    v_store_id_column
  );

  -- DELETE : Seulement admins (ou propriétaire selon contexte)
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR DELETE USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
    )',
    v_table_name || '_delete_policy',
    v_table_name
  );

-- ============================================================
-- VÉRIFICATION FINALE
-- ============================================================

  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = v_table_name;
  
  IF policy_count = 0 THEN
    RAISE WARNING 'No policies created for %. Review the migration.', v_table_name;
  ELSE
    RAISE NOTICE '✅ Created % policies for %', policy_count, v_table_name;
  END IF;

END $$;

-- ============================================================
-- COMMENTAIRES ET DOCUMENTATION
-- ============================================================

COMMENT ON POLICY "subscriptions_select_policy" ON subscriptions IS 
'Policy for SELECT operations on subscriptions. Pattern 2: Table avec store_id (données boutique)';

COMMENT ON POLICY "subscriptions_insert_policy" ON subscriptions IS 
'Policy for INSERT operations on subscriptions. Pattern 2: Table avec store_id (données boutique)';

COMMENT ON POLICY "subscriptions_update_policy" ON subscriptions IS 
'Policy for UPDATE operations on subscriptions. Pattern 2: Table avec store_id (données boutique)';

COMMENT ON POLICY "subscriptions_delete_policy" ON subscriptions IS 
'Policy for DELETE operations on subscriptions. Pattern 2: Table avec store_id (données boutique)';




-- Migration 4/8: product_analytics
-- Fichier: 20260113165234_rls_product_analytics.sql

-- ============================================================
-- Migration RLS : product_analytics
-- Date: 2026-01-13
-- 
-- Objectif: Ajouter des politiques RLS pour product_analytics
-- Pattern: 2 (Table avec store_id (données boutique))
-- ============================================================

DO $$
DECLARE
  v_table_name text := 'product_analytics';
  v_user_id_column text := 'user_id';
  v_store_id_column text := 'store_id';
  policy_count INTEGER;
BEGIN
-- ============================================================
-- VÉRIFICATIONS PRÉLIMINAIRES
-- ============================================================

  -- Vérifier que la table existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = v_table_name
  ) THEN
    RAISE EXCEPTION 'Table "%" does not exist in schema "public". Vérifiez le nom de la table.', v_table_name;
  END IF;

  -- Vérifier que RLS est activé
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = v_table_name 
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS must be enabled on %. Run: ALTER TABLE % ENABLE ROW LEVEL SECURITY;', v_table_name, v_table_name;
  END IF;

  -- Vérifier qu'il n'y a pas déjà de politiques
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = v_table_name
  ) THEN
    RAISE NOTICE 'Table % already has policies. Review existing policies before adding new ones.', v_table_name;
    RETURN;
  END IF;

-- ============================================================
-- PATTERN 2 : TABLE AVEC STORE_ID (DONNÉES BOUTIQUE)
-- ============================================================

  -- SELECT : Propriétaire de la boutique voit ses données + admins
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR SELECT USING (
      %I IN (SELECT id FROM stores WHERE user_id = auth.uid()) OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
    )',
    v_table_name || '_select_policy',
    v_table_name,
    v_store_id_column
  );

  -- INSERT : Propriétaire de la boutique peut créer
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR INSERT WITH CHECK (
      %I IN (SELECT id FROM stores WHERE user_id = auth.uid())
    )',
    v_table_name || '_insert_policy',
    v_table_name,
    v_store_id_column
  );

  -- UPDATE : Propriétaire de la boutique peut modifier + admins
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR UPDATE USING (
      %I IN (SELECT id FROM stores WHERE user_id = auth.uid()) OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
    )',
    v_table_name || '_update_policy',
    v_table_name,
    v_store_id_column
  );

  -- DELETE : Seulement admins (ou propriétaire selon contexte)
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR DELETE USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
    )',
    v_table_name || '_delete_policy',
    v_table_name
  );

-- ============================================================
-- VÉRIFICATION FINALE
-- ============================================================

  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = v_table_name;
  
  IF policy_count = 0 THEN
    RAISE WARNING 'No policies created for %. Review the migration.', v_table_name;
  ELSE
    RAISE NOTICE '✅ Created % policies for %', policy_count, v_table_name;
  END IF;

END $$;

-- ============================================================
-- COMMENTAIRES ET DOCUMENTATION
-- ============================================================

COMMENT ON POLICY "product_analytics_select_policy" ON product_analytics IS 
'Policy for SELECT operations on product_analytics. Pattern 2: Table avec store_id (données boutique)';

COMMENT ON POLICY "product_analytics_insert_policy" ON product_analytics IS 
'Policy for INSERT operations on product_analytics. Pattern 2: Table avec store_id (données boutique)';

COMMENT ON POLICY "product_analytics_update_policy" ON product_analytics IS 
'Policy for UPDATE operations on product_analytics. Pattern 2: Table avec store_id (données boutique)';

COMMENT ON POLICY "product_analytics_delete_policy" ON product_analytics IS 
'Policy for DELETE operations on product_analytics. Pattern 2: Table avec store_id (données boutique)';




-- Migration 5/8: recurring_bookings
-- Fichier: 20260113165234_rls_recurring_bookings.sql

-- ============================================================
-- Migration RLS : recurring_bookings
-- Date: 2026-01-13
-- 
-- Objectif: Ajouter des politiques RLS pour recurring_bookings
-- Pattern: 2 (Table avec store_id (données boutique))
-- ============================================================

DO $$
DECLARE
  v_table_name text := 'recurring_bookings';
  v_user_id_column text := 'user_id';
  v_store_id_column text := 'store_id';
  policy_count INTEGER;
BEGIN
-- ============================================================
-- VÉRIFICATIONS PRÉLIMINAIRES
-- ============================================================

  -- Vérifier que la table existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = v_table_name
  ) THEN
    RAISE EXCEPTION 'Table "%" does not exist in schema "public". Vérifiez le nom de la table.', v_table_name;
  END IF;

  -- Vérifier que RLS est activé
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = v_table_name 
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS must be enabled on %. Run: ALTER TABLE % ENABLE ROW LEVEL SECURITY;', v_table_name, v_table_name;
  END IF;

  -- Vérifier qu'il n'y a pas déjà de politiques
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = v_table_name
  ) THEN
    RAISE NOTICE 'Table % already has policies. Review existing policies before adding new ones.', v_table_name;
    RETURN;
  END IF;

-- ============================================================
-- PATTERN 2 : TABLE AVEC STORE_ID (DONNÉES BOUTIQUE)
-- ============================================================

  -- SELECT : Propriétaire de la boutique voit ses données + admins
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR SELECT USING (
      %I IN (SELECT id FROM stores WHERE user_id = auth.uid()) OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
    )',
    v_table_name || '_select_policy',
    v_table_name,
    v_store_id_column
  );

  -- INSERT : Propriétaire de la boutique peut créer
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR INSERT WITH CHECK (
      %I IN (SELECT id FROM stores WHERE user_id = auth.uid())
    )',
    v_table_name || '_insert_policy',
    v_table_name,
    v_store_id_column
  );

  -- UPDATE : Propriétaire de la boutique peut modifier + admins
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR UPDATE USING (
      %I IN (SELECT id FROM stores WHERE user_id = auth.uid()) OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
    )',
    v_table_name || '_update_policy',
    v_table_name,
    v_store_id_column
  );

  -- DELETE : Seulement admins (ou propriétaire selon contexte)
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR DELETE USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
    )',
    v_table_name || '_delete_policy',
    v_table_name
  );

-- ============================================================
-- VÉRIFICATION FINALE
-- ============================================================

  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = v_table_name;
  
  IF policy_count = 0 THEN
    RAISE WARNING 'No policies created for %. Review the migration.', v_table_name;
  ELSE
    RAISE NOTICE '✅ Created % policies for %', policy_count, v_table_name;
  END IF;

END $$;

-- ============================================================
-- COMMENTAIRES ET DOCUMENTATION
-- ============================================================

COMMENT ON POLICY "recurring_bookings_select_policy" ON recurring_bookings IS 
'Policy for SELECT operations on recurring_bookings. Pattern 2: Table avec store_id (données boutique)';

COMMENT ON POLICY "recurring_bookings_insert_policy" ON recurring_bookings IS 
'Policy for INSERT operations on recurring_bookings. Pattern 2: Table avec store_id (données boutique)';

COMMENT ON POLICY "recurring_bookings_update_policy" ON recurring_bookings IS 
'Policy for UPDATE operations on recurring_bookings. Pattern 2: Table avec store_id (données boutique)';

COMMENT ON POLICY "recurring_bookings_delete_policy" ON recurring_bookings IS 
'Policy for DELETE operations on recurring_bookings. Pattern 2: Table avec store_id (données boutique)';




-- Migration 6/8: service_availability
-- Fichier: 20260113165234_rls_service_availability.sql

-- ============================================================
-- Migration RLS : service_availability
-- Date: 2026-01-13
-- 
-- Objectif: Ajouter des politiques RLS pour service_availability
-- Pattern: 2 (Table avec store_id (données boutique))
-- ============================================================

DO $$
DECLARE
  v_table_name text := 'service_availability';
  v_user_id_column text := 'user_id';
  v_store_id_column text := 'store_id';
  policy_count INTEGER;
BEGIN
-- ============================================================
-- VÉRIFICATIONS PRÉLIMINAIRES
-- ============================================================

  -- Vérifier que la table existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = v_table_name
  ) THEN
    RAISE EXCEPTION 'Table "%" does not exist in schema "public". Vérifiez le nom de la table.', v_table_name;
  END IF;

  -- Vérifier que RLS est activé
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = v_table_name 
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS must be enabled on %. Run: ALTER TABLE % ENABLE ROW LEVEL SECURITY;', v_table_name, v_table_name;
  END IF;

  -- Vérifier qu'il n'y a pas déjà de politiques
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = v_table_name
  ) THEN
    RAISE NOTICE 'Table % already has policies. Review existing policies before adding new ones.', v_table_name;
    RETURN;
  END IF;

-- ============================================================
-- PATTERN 2 : TABLE AVEC STORE_ID (DONNÉES BOUTIQUE)
-- ============================================================

  -- SELECT : Propriétaire de la boutique voit ses données + admins
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR SELECT USING (
      %I IN (SELECT id FROM stores WHERE user_id = auth.uid()) OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
    )',
    v_table_name || '_select_policy',
    v_table_name,
    v_store_id_column
  );

  -- INSERT : Propriétaire de la boutique peut créer
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR INSERT WITH CHECK (
      %I IN (SELECT id FROM stores WHERE user_id = auth.uid())
    )',
    v_table_name || '_insert_policy',
    v_table_name,
    v_store_id_column
  );

  -- UPDATE : Propriétaire de la boutique peut modifier + admins
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR UPDATE USING (
      %I IN (SELECT id FROM stores WHERE user_id = auth.uid()) OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
    )',
    v_table_name || '_update_policy',
    v_table_name,
    v_store_id_column
  );

  -- DELETE : Seulement admins (ou propriétaire selon contexte)
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR DELETE USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
    )',
    v_table_name || '_delete_policy',
    v_table_name
  );

-- ============================================================
-- VÉRIFICATION FINALE
-- ============================================================

  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = v_table_name;
  
  IF policy_count = 0 THEN
    RAISE WARNING 'No policies created for %. Review the migration.', v_table_name;
  ELSE
    RAISE NOTICE '✅ Created % policies for %', policy_count, v_table_name;
  END IF;

END $$;

-- ============================================================
-- COMMENTAIRES ET DOCUMENTATION
-- ============================================================

COMMENT ON POLICY "service_availability_select_policy" ON service_availability IS 
'Policy for SELECT operations on service_availability. Pattern 2: Table avec store_id (données boutique)';

COMMENT ON POLICY "service_availability_insert_policy" ON service_availability IS 
'Policy for INSERT operations on service_availability. Pattern 2: Table avec store_id (données boutique)';

COMMENT ON POLICY "service_availability_update_policy" ON service_availability IS 
'Policy for UPDATE operations on service_availability. Pattern 2: Table avec store_id (données boutique)';

COMMENT ON POLICY "service_availability_delete_policy" ON service_availability IS 
'Policy for DELETE operations on service_availability. Pattern 2: Table avec store_id (données boutique)';




-- Migration 7/8: warranty_claims
-- Fichier: 20260113165234_rls_warranty_claims.sql

-- ============================================================
-- Migration RLS : warranty_claims
-- Date: 2026-01-13
-- 
-- Objectif: Ajouter des politiques RLS pour warranty_claims
-- Pattern: 2 (Table avec store_id (données boutique))
-- ============================================================

DO $$
DECLARE
  v_table_name text := 'warranty_claims';
  v_user_id_column text := 'user_id';
  v_store_id_column text := 'store_id';
  policy_count INTEGER;
BEGIN
-- ============================================================
-- VÉRIFICATIONS PRÉLIMINAIRES
-- ============================================================

  -- Vérifier que la table existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = v_table_name
  ) THEN
    RAISE EXCEPTION 'Table "%" does not exist in schema "public". Vérifiez le nom de la table.', v_table_name;
  END IF;

  -- Vérifier que RLS est activé
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = v_table_name 
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS must be enabled on %. Run: ALTER TABLE % ENABLE ROW LEVEL SECURITY;', v_table_name, v_table_name;
  END IF;

  -- Vérifier qu'il n'y a pas déjà de politiques
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = v_table_name
  ) THEN
    RAISE NOTICE 'Table % already has policies. Review existing policies before adding new ones.', v_table_name;
    RETURN;
  END IF;

-- ============================================================
-- PATTERN 2 : TABLE AVEC STORE_ID (DONNÉES BOUTIQUE)
-- ============================================================

  -- SELECT : Propriétaire de la boutique voit ses données + admins
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR SELECT USING (
      %I IN (SELECT id FROM stores WHERE user_id = auth.uid()) OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
    )',
    v_table_name || '_select_policy',
    v_table_name,
    v_store_id_column
  );

  -- INSERT : Propriétaire de la boutique peut créer
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR INSERT WITH CHECK (
      %I IN (SELECT id FROM stores WHERE user_id = auth.uid())
    )',
    v_table_name || '_insert_policy',
    v_table_name,
    v_store_id_column
  );

  -- UPDATE : Propriétaire de la boutique peut modifier + admins
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR UPDATE USING (
      %I IN (SELECT id FROM stores WHERE user_id = auth.uid()) OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
    )',
    v_table_name || '_update_policy',
    v_table_name,
    v_store_id_column
  );

  -- DELETE : Seulement admins (ou propriétaire selon contexte)
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR DELETE USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
    )',
    v_table_name || '_delete_policy',
    v_table_name
  );

-- ============================================================
-- VÉRIFICATION FINALE
-- ============================================================

  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = v_table_name;
  
  IF policy_count = 0 THEN
    RAISE WARNING 'No policies created for %. Review the migration.', v_table_name;
  ELSE
    RAISE NOTICE '✅ Created % policies for %', policy_count, v_table_name;
  END IF;

END $$;

-- ============================================================
-- COMMENTAIRES ET DOCUMENTATION
-- ============================================================

COMMENT ON POLICY "warranty_claims_select_policy" ON warranty_claims IS 
'Policy for SELECT operations on warranty_claims. Pattern 2: Table avec store_id (données boutique)';

COMMENT ON POLICY "warranty_claims_insert_policy" ON warranty_claims IS 
'Policy for INSERT operations on warranty_claims. Pattern 2: Table avec store_id (données boutique)';

COMMENT ON POLICY "warranty_claims_update_policy" ON warranty_claims IS 
'Policy for UPDATE operations on warranty_claims. Pattern 2: Table avec store_id (données boutique)';

COMMENT ON POLICY "warranty_claims_delete_policy" ON warranty_claims IS 
'Policy for DELETE operations on warranty_claims. Pattern 2: Table avec store_id (données boutique)';




-- Migration 8/8: store_analytics
-- Fichier: 20260113165235_rls_store_analytics.sql

-- ============================================================
-- Migration RLS : store_analytics
-- Date: 2026-01-13
-- 
-- Objectif: Ajouter des politiques RLS pour store_analytics
-- Pattern: 2 (Table avec store_id (données boutique))
-- ============================================================

DO $$
DECLARE
  v_table_name text := 'store_analytics';
  v_user_id_column text := 'user_id';
  v_store_id_column text := 'store_id';
  policy_count INTEGER;
BEGIN
-- ============================================================
-- VÉRIFICATIONS PRÉLIMINAIRES
-- ============================================================

  -- Vérifier que la table existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = v_table_name
  ) THEN
    RAISE EXCEPTION 'Table "%" does not exist in schema "public". Vérifiez le nom de la table.', v_table_name;
  END IF;

  -- Vérifier que RLS est activé
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = v_table_name 
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS must be enabled on %. Run: ALTER TABLE % ENABLE ROW LEVEL SECURITY;', v_table_name, v_table_name;
  END IF;

  -- Vérifier qu'il n'y a pas déjà de politiques
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = v_table_name
  ) THEN
    RAISE NOTICE 'Table % already has policies. Review existing policies before adding new ones.', v_table_name;
    RETURN;
  END IF;

-- ============================================================
-- PATTERN 2 : TABLE AVEC STORE_ID (DONNÉES BOUTIQUE)
-- ============================================================

  -- SELECT : Propriétaire de la boutique voit ses données + admins
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR SELECT USING (
      %I IN (SELECT id FROM stores WHERE user_id = auth.uid()) OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
    )',
    v_table_name || '_select_policy',
    v_table_name,
    v_store_id_column
  );

  -- INSERT : Propriétaire de la boutique peut créer
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR INSERT WITH CHECK (
      %I IN (SELECT id FROM stores WHERE user_id = auth.uid())
    )',
    v_table_name || '_insert_policy',
    v_table_name,
    v_store_id_column
  );

  -- UPDATE : Propriétaire de la boutique peut modifier + admins
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR UPDATE USING (
      %I IN (SELECT id FROM stores WHERE user_id = auth.uid()) OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
    )',
    v_table_name || '_update_policy',
    v_table_name,
    v_store_id_column
  );

  -- DELETE : Seulement admins (ou propriétaire selon contexte)
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR DELETE USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
    )',
    v_table_name || '_delete_policy',
    v_table_name
  );

-- ============================================================
-- VÉRIFICATION FINALE
-- ============================================================

  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = v_table_name;
  
  IF policy_count = 0 THEN
    RAISE WARNING 'No policies created for %. Review the migration.', v_table_name;
  ELSE
    RAISE NOTICE '✅ Created % policies for %', policy_count, v_table_name;
  END IF;

END $$;

-- ============================================================
-- COMMENTAIRES ET DOCUMENTATION
-- ============================================================

COMMENT ON POLICY "store_analytics_select_policy" ON store_analytics IS 
'Policy for SELECT operations on store_analytics. Pattern 2: Table avec store_id (données boutique)';

COMMENT ON POLICY "store_analytics_insert_policy" ON store_analytics IS 
'Policy for INSERT operations on store_analytics. Pattern 2: Table avec store_id (données boutique)';

COMMENT ON POLICY "store_analytics_update_policy" ON store_analytics IS 
'Policy for UPDATE operations on store_analytics. Pattern 2: Table avec store_id (données boutique)';

COMMENT ON POLICY "store_analytics_delete_policy" ON store_analytics IS 
'Policy for DELETE operations on store_analytics. Pattern 2: Table avec store_id (données boutique)';



