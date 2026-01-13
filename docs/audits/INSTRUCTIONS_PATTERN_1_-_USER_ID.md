
╔══════════════════════════════════════════════════════════════════════════════╗
║                    EXÉCUTION MIGRATION RLS - Pattern 1 - user_id                           ║
╚══════════════════════════════════════════════════════════════════════════════╝

📋 INFORMATIONS
   Priorité: 🟠 HAUTE
   Tables concernées: 6
   Description: Tables liées aux utilisateurs

📝 TABLES CONCERNÉES:
   • notifications
   • user_preferences
   • saved_addresses
   • certificates
   • user_sessions
   • user_activity_logs

🔧 ÉTAPES D'EXÉCUTION:

1. Ouvrir Supabase Dashboard
   → https://supabase.com/dashboard
   → Sélectionner votre projet
   → Cliquer sur "SQL Editor"

2. Créer une nouvelle requête

3. Copier le SQL ci-dessous et coller dans l'éditeur

4. Cliquer sur "Run" (ou Ctrl+Enter)

5. Vérifier qu'il n'y a pas d'erreurs

6. Vérifier les politiques créées avec:
   SELECT tablename, policyname, cmd 
   FROM pg_policies 
   WHERE schemaname = 'public' 
     AND tablename IN ('notifications', 'user_preferences', 'saved_addresses', 'certificates', 'user_sessions', 'user_activity_logs')
   ORDER BY tablename, cmd;

═══════════════════════════════════════════════════════════════════════════════
SQL À EXÉCUTER:
═══════════════════════════════════════════════════════════════════════════════

-- ============================================================
-- Migrations RLS - Pattern 1 (user_id)
-- Date: 2026-01-13
-- Total: 7 migration(s)
-- ============================================================

-- Migration 1/7: notifications
-- Fichier: 20260113165047_rls_notifications.sql

-- ============================================================
-- Migration RLS : notifications
-- Date: 2026-01-13
-- 
-- Objectif: Ajouter des politiques RLS pour notifications
-- Pattern: 1 (Table avec user_id (données utilisateur))
-- ============================================================

DO $$
DECLARE
  v_table_name text := 'notifications';
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
-- PATTERN 1 : TABLE AVEC USER_ID (DONNÉES UTILISATEUR)
-- ============================================================

  -- SELECT : Utilisateur voit ses propres données + admins voient tout
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR SELECT USING (
      %I = auth.uid() OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
    )',
    v_table_name || '_select_policy',
    v_table_name,
    v_user_id_column
  );

  -- INSERT : Utilisateur peut créer ses propres données
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR INSERT WITH CHECK (%I = auth.uid())',
    v_table_name || '_insert_policy',
    v_table_name,
    v_user_id_column
  );

  -- UPDATE : Utilisateur peut modifier ses propres données + admins
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR UPDATE USING (
      %I = auth.uid() OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
    )',
    v_table_name || '_update_policy',
    v_table_name,
    v_user_id_column
  );

  -- DELETE : Utilisateur peut supprimer ses propres données + admins
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR DELETE USING (
      %I = auth.uid() OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
    )',
    v_table_name || '_delete_policy',
    v_table_name,
    v_user_id_column
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

COMMENT ON POLICY "notifications_select_policy" ON notifications IS 
'Policy for SELECT operations on notifications. Pattern 1: Table avec user_id (données utilisateur)';

COMMENT ON POLICY "notifications_insert_policy" ON notifications IS 
'Policy for INSERT operations on notifications. Pattern 1: Table avec user_id (données utilisateur)';

COMMENT ON POLICY "notifications_update_policy" ON notifications IS 
'Policy for UPDATE operations on notifications. Pattern 1: Table avec user_id (données utilisateur)';

COMMENT ON POLICY "notifications_delete_policy" ON notifications IS 
'Policy for DELETE operations on notifications. Pattern 1: Table avec user_id (données utilisateur)';




-- Migration 2/7: notifications
-- Fichier: 20260113165231_rls_notifications.sql

-- ============================================================
-- Migration RLS : notifications
-- Date: 2026-01-13
-- 
-- Objectif: Ajouter des politiques RLS pour notifications
-- Pattern: 1 (Table avec user_id (données utilisateur))
-- ============================================================

DO $$
DECLARE
  v_table_name text := 'notifications';
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
-- PATTERN 1 : TABLE AVEC USER_ID (DONNÉES UTILISATEUR)
-- ============================================================

  -- SELECT : Utilisateur voit ses propres données + admins voient tout
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR SELECT USING (
      %I = auth.uid() OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
    )',
    v_table_name || '_select_policy',
    v_table_name,
    v_user_id_column
  );

  -- INSERT : Utilisateur peut créer ses propres données
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR INSERT WITH CHECK (%I = auth.uid())',
    v_table_name || '_insert_policy',
    v_table_name,
    v_user_id_column
  );

  -- UPDATE : Utilisateur peut modifier ses propres données + admins
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR UPDATE USING (
      %I = auth.uid() OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
    )',
    v_table_name || '_update_policy',
    v_table_name,
    v_user_id_column
  );

  -- DELETE : Utilisateur peut supprimer ses propres données + admins
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR DELETE USING (
      %I = auth.uid() OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
    )',
    v_table_name || '_delete_policy',
    v_table_name,
    v_user_id_column
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

COMMENT ON POLICY "notifications_select_policy" ON notifications IS 
'Policy for SELECT operations on notifications. Pattern 1: Table avec user_id (données utilisateur)';

COMMENT ON POLICY "notifications_insert_policy" ON notifications IS 
'Policy for INSERT operations on notifications. Pattern 1: Table avec user_id (données utilisateur)';

COMMENT ON POLICY "notifications_update_policy" ON notifications IS 
'Policy for UPDATE operations on notifications. Pattern 1: Table avec user_id (données utilisateur)';

COMMENT ON POLICY "notifications_delete_policy" ON notifications IS 
'Policy for DELETE operations on notifications. Pattern 1: Table avec user_id (données utilisateur)';




-- Migration 3/7: user_preferences
-- Fichier: 20260113165231_rls_user_preferences.sql

-- ============================================================
-- Migration RLS : user_preferences
-- Date: 2026-01-13
-- 
-- Objectif: Ajouter des politiques RLS pour user_preferences
-- Pattern: 1 (Table avec user_id (données utilisateur))
-- ============================================================

DO $$
DECLARE
  v_table_name text := 'user_preferences';
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
-- PATTERN 1 : TABLE AVEC USER_ID (DONNÉES UTILISATEUR)
-- ============================================================

  -- SELECT : Utilisateur voit ses propres données + admins voient tout
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR SELECT USING (
      %I = auth.uid() OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
    )',
    v_table_name || '_select_policy',
    v_table_name,
    v_user_id_column
  );

  -- INSERT : Utilisateur peut créer ses propres données
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR INSERT WITH CHECK (%I = auth.uid())',
    v_table_name || '_insert_policy',
    v_table_name,
    v_user_id_column
  );

  -- UPDATE : Utilisateur peut modifier ses propres données + admins
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR UPDATE USING (
      %I = auth.uid() OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
    )',
    v_table_name || '_update_policy',
    v_table_name,
    v_user_id_column
  );

  -- DELETE : Utilisateur peut supprimer ses propres données + admins
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR DELETE USING (
      %I = auth.uid() OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
    )',
    v_table_name || '_delete_policy',
    v_table_name,
    v_user_id_column
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

COMMENT ON POLICY "user_preferences_select_policy" ON user_preferences IS 
'Policy for SELECT operations on user_preferences. Pattern 1: Table avec user_id (données utilisateur)';

COMMENT ON POLICY "user_preferences_insert_policy" ON user_preferences IS 
'Policy for INSERT operations on user_preferences. Pattern 1: Table avec user_id (données utilisateur)';

COMMENT ON POLICY "user_preferences_update_policy" ON user_preferences IS 
'Policy for UPDATE operations on user_preferences. Pattern 1: Table avec user_id (données utilisateur)';

COMMENT ON POLICY "user_preferences_delete_policy" ON user_preferences IS 
'Policy for DELETE operations on user_preferences. Pattern 1: Table avec user_id (données utilisateur)';




-- Migration 4/7: certificates
-- Fichier: 20260113165232_rls_certificates.sql

-- ============================================================
-- Migration RLS : certificates
-- Date: 2026-01-13
-- 
-- Objectif: Ajouter des politiques RLS pour certificates
-- Pattern: 1 (Table avec user_id (données utilisateur))
-- ============================================================

DO $$
DECLARE
  v_table_name text := 'certificates';
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
-- PATTERN 1 : TABLE AVEC USER_ID (DONNÉES UTILISATEUR)
-- ============================================================

  -- SELECT : Utilisateur voit ses propres données + admins voient tout
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR SELECT USING (
      %I = auth.uid() OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
    )',
    v_table_name || '_select_policy',
    v_table_name,
    v_user_id_column
  );

  -- INSERT : Utilisateur peut créer ses propres données
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR INSERT WITH CHECK (%I = auth.uid())',
    v_table_name || '_insert_policy',
    v_table_name,
    v_user_id_column
  );

  -- UPDATE : Utilisateur peut modifier ses propres données + admins
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR UPDATE USING (
      %I = auth.uid() OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
    )',
    v_table_name || '_update_policy',
    v_table_name,
    v_user_id_column
  );

  -- DELETE : Utilisateur peut supprimer ses propres données + admins
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR DELETE USING (
      %I = auth.uid() OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
    )',
    v_table_name || '_delete_policy',
    v_table_name,
    v_user_id_column
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

COMMENT ON POLICY "certificates_select_policy" ON certificates IS 
'Policy for SELECT operations on certificates. Pattern 1: Table avec user_id (données utilisateur)';

COMMENT ON POLICY "certificates_insert_policy" ON certificates IS 
'Policy for INSERT operations on certificates. Pattern 1: Table avec user_id (données utilisateur)';

COMMENT ON POLICY "certificates_update_policy" ON certificates IS 
'Policy for UPDATE operations on certificates. Pattern 1: Table avec user_id (données utilisateur)';

COMMENT ON POLICY "certificates_delete_policy" ON certificates IS 
'Policy for DELETE operations on certificates. Pattern 1: Table avec user_id (données utilisateur)';




-- Migration 5/7: saved_addresses
-- Fichier: 20260113165232_rls_saved_addresses.sql

-- ============================================================
-- Migration RLS : saved_addresses
-- Date: 2026-01-13
-- 
-- Objectif: Ajouter des politiques RLS pour saved_addresses
-- Pattern: 1 (Table avec user_id (données utilisateur))
-- ============================================================

DO $$
DECLARE
  v_table_name text := 'saved_addresses';
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
-- PATTERN 1 : TABLE AVEC USER_ID (DONNÉES UTILISATEUR)
-- ============================================================

  -- SELECT : Utilisateur voit ses propres données + admins voient tout
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR SELECT USING (
      %I = auth.uid() OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
    )',
    v_table_name || '_select_policy',
    v_table_name,
    v_user_id_column
  );

  -- INSERT : Utilisateur peut créer ses propres données
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR INSERT WITH CHECK (%I = auth.uid())',
    v_table_name || '_insert_policy',
    v_table_name,
    v_user_id_column
  );

  -- UPDATE : Utilisateur peut modifier ses propres données + admins
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR UPDATE USING (
      %I = auth.uid() OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
    )',
    v_table_name || '_update_policy',
    v_table_name,
    v_user_id_column
  );

  -- DELETE : Utilisateur peut supprimer ses propres données + admins
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR DELETE USING (
      %I = auth.uid() OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
    )',
    v_table_name || '_delete_policy',
    v_table_name,
    v_user_id_column
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

COMMENT ON POLICY "saved_addresses_select_policy" ON saved_addresses IS 
'Policy for SELECT operations on saved_addresses. Pattern 1: Table avec user_id (données utilisateur)';

COMMENT ON POLICY "saved_addresses_insert_policy" ON saved_addresses IS 
'Policy for INSERT operations on saved_addresses. Pattern 1: Table avec user_id (données utilisateur)';

COMMENT ON POLICY "saved_addresses_update_policy" ON saved_addresses IS 
'Policy for UPDATE operations on saved_addresses. Pattern 1: Table avec user_id (données utilisateur)';

COMMENT ON POLICY "saved_addresses_delete_policy" ON saved_addresses IS 
'Policy for DELETE operations on saved_addresses. Pattern 1: Table avec user_id (données utilisateur)';




-- Migration 6/7: user_activity_logs
-- Fichier: 20260113165232_rls_user_activity_logs.sql

-- ============================================================
-- Migration RLS : user_activity_logs
-- Date: 2026-01-13
-- 
-- Objectif: Ajouter des politiques RLS pour user_activity_logs
-- Pattern: 1 (Table avec user_id (données utilisateur))
-- ============================================================

DO $$
DECLARE
  v_table_name text := 'user_activity_logs';
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
-- PATTERN 1 : TABLE AVEC USER_ID (DONNÉES UTILISATEUR)
-- ============================================================

  -- SELECT : Utilisateur voit ses propres données + admins voient tout
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR SELECT USING (
      %I = auth.uid() OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
    )',
    v_table_name || '_select_policy',
    v_table_name,
    v_user_id_column
  );

  -- INSERT : Utilisateur peut créer ses propres données
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR INSERT WITH CHECK (%I = auth.uid())',
    v_table_name || '_insert_policy',
    v_table_name,
    v_user_id_column
  );

  -- UPDATE : Utilisateur peut modifier ses propres données + admins
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR UPDATE USING (
      %I = auth.uid() OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
    )',
    v_table_name || '_update_policy',
    v_table_name,
    v_user_id_column
  );

  -- DELETE : Utilisateur peut supprimer ses propres données + admins
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR DELETE USING (
      %I = auth.uid() OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
    )',
    v_table_name || '_delete_policy',
    v_table_name,
    v_user_id_column
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

COMMENT ON POLICY "user_activity_logs_select_policy" ON user_activity_logs IS 
'Policy for SELECT operations on user_activity_logs. Pattern 1: Table avec user_id (données utilisateur)';

COMMENT ON POLICY "user_activity_logs_insert_policy" ON user_activity_logs IS 
'Policy for INSERT operations on user_activity_logs. Pattern 1: Table avec user_id (données utilisateur)';

COMMENT ON POLICY "user_activity_logs_update_policy" ON user_activity_logs IS 
'Policy for UPDATE operations on user_activity_logs. Pattern 1: Table avec user_id (données utilisateur)';

COMMENT ON POLICY "user_activity_logs_delete_policy" ON user_activity_logs IS 
'Policy for DELETE operations on user_activity_logs. Pattern 1: Table avec user_id (données utilisateur)';




-- Migration 7/7: user_sessions
-- Fichier: 20260113165232_rls_user_sessions.sql

-- ============================================================
-- Migration RLS : user_sessions
-- Date: 2026-01-13
-- 
-- Objectif: Ajouter des politiques RLS pour user_sessions
-- Pattern: 1 (Table avec user_id (données utilisateur))
-- ============================================================

DO $$
DECLARE
  v_table_name text := 'user_sessions';
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
-- PATTERN 1 : TABLE AVEC USER_ID (DONNÉES UTILISATEUR)
-- ============================================================

  -- SELECT : Utilisateur voit ses propres données + admins voient tout
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR SELECT USING (
      %I = auth.uid() OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
    )',
    v_table_name || '_select_policy',
    v_table_name,
    v_user_id_column
  );

  -- INSERT : Utilisateur peut créer ses propres données
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR INSERT WITH CHECK (%I = auth.uid())',
    v_table_name || '_insert_policy',
    v_table_name,
    v_user_id_column
  );

  -- UPDATE : Utilisateur peut modifier ses propres données + admins
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR UPDATE USING (
      %I = auth.uid() OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
    )',
    v_table_name || '_update_policy',
    v_table_name,
    v_user_id_column
  );

  -- DELETE : Utilisateur peut supprimer ses propres données + admins
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR DELETE USING (
      %I = auth.uid() OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
    )',
    v_table_name || '_delete_policy',
    v_table_name,
    v_user_id_column
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

COMMENT ON POLICY "user_sessions_select_policy" ON user_sessions IS 
'Policy for SELECT operations on user_sessions. Pattern 1: Table avec user_id (données utilisateur)';

COMMENT ON POLICY "user_sessions_insert_policy" ON user_sessions IS 
'Policy for INSERT operations on user_sessions. Pattern 1: Table avec user_id (données utilisateur)';

COMMENT ON POLICY "user_sessions_update_policy" ON user_sessions IS 
'Policy for UPDATE operations on user_sessions. Pattern 1: Table avec user_id (données utilisateur)';

COMMENT ON POLICY "user_sessions_delete_policy" ON user_sessions IS 
'Policy for DELETE operations on user_sessions. Pattern 1: Table avec user_id (données utilisateur)';





═══════════════════════════════════════════════════════════════════════════════
