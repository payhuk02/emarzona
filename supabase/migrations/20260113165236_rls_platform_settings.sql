-- ============================================================
-- Migration RLS : platform_settings
-- Date: 2026-01-13
-- 
-- Objectif: Ajouter des politiques RLS pour platform_settings
-- Pattern: 4 (Table admin seulement)
-- ============================================================

DO $$
DECLARE
  v_table_name text := 'platform_settings';
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
-- PATTERN 4 : TABLE ADMIN SEULEMENT
-- ============================================================

  -- SELECT : Seulement admins
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR SELECT USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
    )',
    v_table_name || '_select_policy',
    v_table_name
  );

  -- INSERT : Seulement admins
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
    )',
    v_table_name || '_insert_policy',
    v_table_name
  );

  -- UPDATE : Seulement admins
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR UPDATE USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
    )',
    v_table_name || '_update_policy',
    v_table_name
  );

  -- DELETE : Seulement admins
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

COMMENT ON POLICY "platform_settings_select_policy" ON platform_settings IS 
'Policy for SELECT operations on platform_settings. Pattern 4: Table admin seulement';

COMMENT ON POLICY "platform_settings_insert_policy" ON platform_settings IS 
'Policy for INSERT operations on platform_settings. Pattern 4: Table admin seulement';

COMMENT ON POLICY "platform_settings_update_policy" ON platform_settings IS 
'Policy for UPDATE operations on platform_settings. Pattern 4: Table admin seulement';

COMMENT ON POLICY "platform_settings_delete_policy" ON platform_settings IS 
'Policy for DELETE operations on platform_settings. Pattern 4: Table admin seulement';
