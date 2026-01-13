
╔══════════════════════════════════════════════════════════════════════════════╗
║                    EXÉCUTION MIGRATION RLS - Pattern 3 - Public                            ║
╚══════════════════════════════════════════════════════════════════════════════╝

📋 INFORMATIONS
   Priorité: 🟡 MOYENNE
   Tables concernées: 3
   Description: Tables publiques

📝 TABLES CONCERNÉES:
   • reviews
   • community_posts
   • public_reviews

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
     AND tablename IN ('reviews', 'community_posts', 'public_reviews')
   ORDER BY tablename, cmd;

═══════════════════════════════════════════════════════════════════════════════
SQL À EXÉCUTER:
═══════════════════════════════════════════════════════════════════════════════

-- ============================================================
-- Migrations RLS - Pattern 3 (public)
-- Date: 2026-01-13
-- Total: 3 migration(s)
-- ============================================================

-- Migration 1/3: community_posts
-- Fichier: 20260113165235_rls_community_posts.sql

-- ============================================================
-- Migration RLS : community_posts
-- Date: 2026-01-13
-- 
-- Objectif: Ajouter des politiques RLS pour community_posts
-- Pattern: 3 (Table publique (marketplace))
-- ============================================================

DO $$
DECLARE
  v_table_name text := 'community_posts';
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
-- PATTERN 3 : TABLE PUBLIQUE (MARKETPLACE)
-- ============================================================

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

COMMENT ON POLICY "community_posts_select_policy" ON community_posts IS 
'Policy for SELECT operations on community_posts. Pattern 3: Table publique (marketplace)';

COMMENT ON POLICY "community_posts_insert_policy" ON community_posts IS 
'Policy for INSERT operations on community_posts. Pattern 3: Table publique (marketplace)';

COMMENT ON POLICY "community_posts_update_policy" ON community_posts IS 
'Policy for UPDATE operations on community_posts. Pattern 3: Table publique (marketplace)';

COMMENT ON POLICY "community_posts_delete_policy" ON community_posts IS 
'Policy for DELETE operations on community_posts. Pattern 3: Table publique (marketplace)';




-- Migration 2/3: public_reviews
-- Fichier: 20260113165235_rls_public_reviews.sql

-- ============================================================
-- Migration RLS : public_reviews
-- Date: 2026-01-13
-- 
-- Objectif: Ajouter des politiques RLS pour public_reviews
-- Pattern: 3 (Table publique (marketplace))
-- ============================================================

DO $$
DECLARE
  v_table_name text := 'public_reviews';
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
-- PATTERN 3 : TABLE PUBLIQUE (MARKETPLACE)
-- ============================================================

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

COMMENT ON POLICY "public_reviews_select_policy" ON public_reviews IS 
'Policy for SELECT operations on public_reviews. Pattern 3: Table publique (marketplace)';

COMMENT ON POLICY "public_reviews_insert_policy" ON public_reviews IS 
'Policy for INSERT operations on public_reviews. Pattern 3: Table publique (marketplace)';

COMMENT ON POLICY "public_reviews_update_policy" ON public_reviews IS 
'Policy for UPDATE operations on public_reviews. Pattern 3: Table publique (marketplace)';

COMMENT ON POLICY "public_reviews_delete_policy" ON public_reviews IS 
'Policy for DELETE operations on public_reviews. Pattern 3: Table publique (marketplace)';




-- Migration 3/3: reviews
-- Fichier: 20260113165235_rls_reviews.sql

-- ============================================================
-- Migration RLS : reviews
-- Date: 2026-01-13
-- 
-- Objectif: Ajouter des politiques RLS pour reviews
-- Pattern: 3 (Table publique (marketplace))
-- ============================================================

DO $$
DECLARE
  v_table_name text := 'reviews';
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
-- PATTERN 3 : TABLE PUBLIQUE (MARKETPLACE)
-- ============================================================

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

COMMENT ON POLICY "reviews_select_policy" ON reviews IS 
'Policy for SELECT operations on reviews. Pattern 3: Table publique (marketplace)';

COMMENT ON POLICY "reviews_insert_policy" ON reviews IS 
'Policy for INSERT operations on reviews. Pattern 3: Table publique (marketplace)';

COMMENT ON POLICY "reviews_update_policy" ON reviews IS 
'Policy for UPDATE operations on reviews. Pattern 3: Table publique (marketplace)';

COMMENT ON POLICY "reviews_delete_policy" ON reviews IS 
'Policy for DELETE operations on reviews. Pattern 3: Table publique (marketplace)';





═══════════════════════════════════════════════════════════════════════════════
