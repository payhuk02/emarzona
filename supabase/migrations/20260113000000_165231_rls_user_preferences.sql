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
