-- ============================================================
-- Template de Migration RLS pour Tables Critiques
-- Date: 2025-01-30
-- 
-- INSTRUCTIONS :
-- 1. Remplacer 'YOUR_TABLE_NAME' par le nom réel de la table (3 occurrences)
-- 2. Choisir le pattern approprié (1, 2, 3 ou 4)
-- 3. Adapter les colonnes selon la structure de la table
-- 4. Tester la migration avant de l'appliquer en production
-- ============================================================

-- ============================================================
-- CONFIGURATION : REMPLACER LE NOM DE LA TABLE ICI
-- ============================================================
DO $$
DECLARE
  v_table_name text := 'YOUR_TABLE_NAME';  -- ⚠️ REMPLACER PAR LE NOM RÉEL DE LA TABLE
  v_user_id_column text := 'user_id';      -- Adapter si différent
  v_store_id_column text := 'store_id';    -- Adapter si différent
  policy_count INTEGER;
BEGIN
-- ============================================================
-- VÉRIFICATIONS PRÉLIMINAIRES
-- ============================================================

  -- Vérifier que le nom de table a été remplacé
  IF v_table_name = 'YOUR_TABLE_NAME' THEN
    RAISE EXCEPTION '⚠️ ERREUR : Vous devez remplacer ''YOUR_TABLE_NAME'' par le nom réel de la table à la ligne 17. Exemple: v_table_name text := ''notifications'';';
  END IF;

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
-- PATTERN 1 : TABLE AVEC user_id (Données utilisateur)
-- ============================================================
-- Utiliser ce pattern pour : notifications, user_preferences, saved_addresses, etc.
-- DÉCOMMENTER CE PATTERN ET COMMENTER LES AUTRES SI NÉCESSAIRE
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
-- PATTERN 2 : TABLE AVEC store_id (Données boutique)
-- ============================================================
-- Utiliser ce pattern pour : products, orders, customers, inventory, etc.
-- DÉCOMMENTER CE PATTERN ET COMMENTER LE PATTERN 1 SI NÉCESSAIRE
-- ============================================================

/*
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
*/

-- ============================================================
-- PATTERN 3 : TABLE PUBLIQUE (Marketplace)
-- ============================================================
-- Utiliser ce pattern pour : reviews (avis publics), community_posts, etc.
-- DÉCOMMENTER CE PATTERN ET COMMENTER LES AUTRES SI NÉCESSAIRE
-- ============================================================

/*
  -- SELECT : Tous les utilisateurs authentifiés peuvent lire
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR SELECT USING (auth.uid() IS NOT NULL)',
    v_table_name || '_select_policy',
    v_table_name
  );

  -- INSERT : Utilisateurs authentifiés peuvent créer
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR INSERT WITH CHECK (auth.uid() IS NOT NULL)',
    v_table_name || '_insert_policy',
    v_table_name
  );

  -- UPDATE : Seulement propriétaire ou admin
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR UPDATE USING (
      %I = auth.uid() OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
    )',
    v_table_name || '_update_policy',
    v_table_name,
    v_user_id_column
  );

  -- DELETE : Seulement propriétaire ou admin
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR DELETE USING (
      %I = auth.uid() OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
    )',
    v_table_name || '_delete_policy',
    v_table_name,
    v_user_id_column
  );
*/

-- ============================================================
-- PATTERN 4 : TABLE ADMIN SEULEMENT
-- ============================================================
-- Utiliser ce pattern pour : platform_settings, admin_config, system_logs, etc.
-- DÉCOMMENTER CE PATTERN ET COMMENTER LES AUTRES SI NÉCESSAIRE
-- ============================================================

/*
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
*/

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
-- Les commentaires doivent être ajoutés après création des politiques
-- Exemple (adapter avec le nom réel de la table) :
-- COMMENT ON POLICY "YOUR_TABLE_NAME_select_policy" ON YOUR_TABLE_NAME IS 
-- 'Policy for SELECT operations. [ADAPTER SELON LE PATTERN UTILISÉ]';
