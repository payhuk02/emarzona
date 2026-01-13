-- ============================================================
-- FIX RLS - Phase 1 : Tables Critiques Sans Politiques
-- Date: 2025-01-31
-- 
-- Objectif: Ajouter des politiques RLS pour les tables critiques
-- qui ont RLS activé mais aucune politique (accès bloqué)
-- ============================================================

-- ============================================================
-- 1. Fonction pour identifier les tables sans politiques
-- ============================================================

CREATE OR REPLACE FUNCTION get_tables_without_policies()
RETURNS TABLE (
  table_name text,
  rls_enabled boolean,
  policy_count bigint,
  priority text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.tablename::text as table_name,
    t.rowsecurity as rls_enabled,
    COUNT(p.policyname)::bigint as policy_count,
    CASE
      -- Tables critiques (données sensibles)
      WHEN t.tablename IN (
        'platform_settings', 'admin_config', 'commissions', 
        'subscriptions', 'disputes', 'invoices', 'transactions',
        'payments', 'store_withdrawals', 'affiliate_commissions'
      ) THEN 'CRITIQUE'
      -- Tables haute priorité (données utilisateurs importantes)
      WHEN t.tablename IN (
        'lessons', 'quizzes', 'assignments', 'certificates',
        'service_availability', 'recurring_bookings', 'warranty_claims'
      ) THEN 'HAUTE'
      -- Tables moyenne priorité (analytics, logs)
      WHEN t.tablename LIKE '%analytics%' OR t.tablename LIKE '%log%' OR t.tablename LIKE '%stats%' THEN 'MOYENNE'
      -- Autres tables
      ELSE 'BASSE'
    END as priority
  FROM pg_tables t
  LEFT JOIN pg_policies p ON t.tablename = p.tablename AND p.schemaname = 'public'
  WHERE t.schemaname = 'public'
    AND t.rowsecurity = true  -- RLS activé
    AND (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = t.tablename) = 0
  GROUP BY t.tablename, t.rowsecurity
  ORDER BY 
    CASE priority
      WHEN 'CRITIQUE' THEN 1
      WHEN 'HAUTE' THEN 2
      WHEN 'MOYENNE' THEN 3
      ELSE 4
    END,
    t.tablename;
END;
$$;

-- ============================================================
-- 2. Fonction pour créer des politiques génériques sécurisées
-- ============================================================

CREATE OR REPLACE FUNCTION create_safe_rls_policies_for_table(
  p_table_name text,
  p_has_user_id boolean DEFAULT false,
  p_user_id_column text DEFAULT 'user_id',
  p_has_store_id boolean DEFAULT false,
  p_store_id_column text DEFAULT 'store_id'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_policy_name text;
BEGIN
  -- Vérifier que la table existe et a RLS activé
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = p_table_name AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'Table % does not exist or RLS is not enabled', p_table_name;
  END IF;

  -- Vérifier qu'il n'y a pas déjà de politiques
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = p_table_name
  ) THEN
    RAISE NOTICE 'Table % already has policies, skipping', p_table_name;
    RETURN;
  END IF;

  -- Politique SELECT : Basée sur la structure de la table
  IF p_has_user_id THEN
    -- Tables avec user_id : utilisateur voit ses propres données
    v_policy_name := p_table_name || '_select_policy';
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR SELECT USING (
        %I = auth.uid() OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
      )',
      v_policy_name, p_table_name, p_user_id_column
    );
  ELSIF p_has_store_id THEN
    -- Tables avec store_id : propriétaire de la boutique voit ses données
    v_policy_name := p_table_name || '_select_policy';
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR SELECT USING (
        %I IN (SELECT id FROM stores WHERE user_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
      )',
      v_policy_name, p_table_name, p_store_id_column
    );
  ELSE
    -- Tables publiques : tous les utilisateurs authentifiés peuvent lire
    v_policy_name := p_table_name || '_select_policy';
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR SELECT USING (
        auth.uid() IS NOT NULL OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
      )',
      v_policy_name, p_table_name
    );
  END IF;

  -- Politique INSERT : Utilisateurs authentifiés peuvent créer
  v_policy_name := p_table_name || '_insert_policy';
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR INSERT WITH CHECK (auth.uid() IS NOT NULL)',
    v_policy_name, p_table_name
  );

  -- Politique UPDATE : Basée sur la structure de la table
  IF p_has_user_id THEN
    v_policy_name := p_table_name || '_update_policy';
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR UPDATE USING (
        %I = auth.uid() OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
      )',
      v_policy_name, p_table_name, p_user_id_column
    );
  ELSIF p_has_store_id THEN
    v_policy_name := p_table_name || '_update_policy';
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR UPDATE USING (
        %I IN (SELECT id FROM stores WHERE user_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
      )',
      v_policy_name, p_table_name, p_store_id_column
    );
  ELSE
    -- Par défaut : seulement admins peuvent modifier
    v_policy_name := p_table_name || '_update_policy';
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR UPDATE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
      )',
      v_policy_name, p_table_name
    );
  END IF;

  -- Politique DELETE : Seulement admins par défaut (peut être ajustée)
  v_policy_name := p_table_name || '_delete_policy';
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR DELETE USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
    )',
    v_policy_name, p_table_name
  );

  RAISE NOTICE 'Created RLS policies for table %', p_table_name;
END;
$$;

-- ============================================================
-- 3. Tables Critiques - Politiques Spécifiques
-- ============================================================

-- platform_settings : Configuration plateforme (admin seulement)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'platform_settings') THEN
    CREATE POLICY "platform_settings_select_policy" ON platform_settings FOR SELECT
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
    
    CREATE POLICY "platform_settings_insert_policy" ON platform_settings FOR INSERT
      WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
    
    CREATE POLICY "platform_settings_update_policy" ON platform_settings FOR UPDATE
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
    
    CREATE POLICY "platform_settings_delete_policy" ON platform_settings FOR DELETE
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
    
    RAISE NOTICE 'Created policies for platform_settings';
  END IF;
END $$;

-- admin_config : Configuration admin (admin seulement)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'admin_config') THEN
    CREATE POLICY "admin_config_select_policy" ON admin_config FOR SELECT
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
    
    CREATE POLICY "admin_config_insert_policy" ON admin_config FOR INSERT
      WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
    
    CREATE POLICY "admin_config_update_policy" ON admin_config FOR UPDATE
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
    
    CREATE POLICY "admin_config_delete_policy" ON admin_config FOR DELETE
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
    
    RAISE NOTICE 'Created policies for admin_config';
  END IF;
END $$;

-- commissions : Commissions (propriétaires de boutiques + admin)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'commissions') THEN
    CREATE POLICY "commissions_select_policy" ON commissions FOR SELECT
      USING (
        store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
      );
    
    CREATE POLICY "commissions_insert_policy" ON commissions FOR INSERT
      WITH CHECK (auth.uid() IS NOT NULL);
    
    CREATE POLICY "commissions_update_policy" ON commissions FOR UPDATE
      USING (
        store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
      );
    
    CREATE POLICY "commissions_delete_policy" ON commissions FOR DELETE
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
    
    RAISE NOTICE 'Created policies for commissions';
  END IF;
END $$;

-- subscriptions : Abonnements (utilisateurs voient leurs propres abonnements)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'subscriptions') THEN
    CREATE POLICY "subscriptions_select_policy" ON subscriptions FOR SELECT
      USING (
        user_id = auth.uid() OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
      );
    
    CREATE POLICY "subscriptions_insert_policy" ON subscriptions FOR INSERT
      WITH CHECK (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
    
    CREATE POLICY "subscriptions_update_policy" ON subscriptions FOR UPDATE
      USING (
        user_id = auth.uid() OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
      );
    
    CREATE POLICY "subscriptions_delete_policy" ON subscriptions FOR DELETE
      USING (
        user_id = auth.uid() OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
      );
    
    RAISE NOTICE 'Created policies for subscriptions';
  END IF;
END $$;

-- disputes : Litiges (propriétaires de boutiques + clients concernés + admin)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'disputes') THEN
    CREATE POLICY "disputes_select_policy" ON disputes FOR SELECT
      USING (
        store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()) OR
        customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
      );
    
    CREATE POLICY "disputes_insert_policy" ON disputes FOR INSERT
      WITH CHECK (auth.uid() IS NOT NULL);
    
    CREATE POLICY "disputes_update_policy" ON disputes FOR UPDATE
      USING (
        store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()) OR
        customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
      );
    
    CREATE POLICY "disputes_delete_policy" ON disputes FOR DELETE
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
    
    RAISE NOTICE 'Created policies for disputes';
  END IF;
END $$;

-- ============================================================
-- 4. Identifier et créer des politiques pour les autres tables critiques
-- ============================================================

-- Utiliser la fonction pour créer des politiques génériques pour les tables restantes
DO $$
DECLARE
  table_record RECORD;
BEGIN
  -- Parcourir les tables critiques sans politiques
  FOR table_record IN 
    SELECT table_name 
    FROM get_tables_without_policies() 
    WHERE priority = 'CRITIQUE'
    AND table_name NOT IN ('platform_settings', 'admin_config', 'commissions', 'subscriptions', 'disputes')
  LOOP
    -- Essayer de détecter la structure de la table
    BEGIN
      -- Vérifier si la table a une colonne user_id
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = table_record.table_name 
        AND column_name = 'user_id'
      ) THEN
        PERFORM create_safe_rls_policies_for_table(table_record.table_name, true, 'user_id');
      -- Vérifier si la table a une colonne store_id
      ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = table_record.table_name 
        AND column_name = 'store_id'
      ) THEN
        PERFORM create_safe_rls_policies_for_table(table_record.table_name, false, NULL, true, 'store_id');
      ELSE
        -- Table sans user_id ni store_id : politique générique
        PERFORM create_safe_rls_policies_for_table(table_record.table_name);
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to create policies for table %: %', table_record.table_name, SQLERRM;
    END;
  END LOOP;
END $$;

-- ============================================================
-- 5. Vérification finale
-- ============================================================

DO $$
DECLARE
  remaining_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining_count
  FROM get_tables_without_policies()
  WHERE priority = 'CRITIQUE';
  
  IF remaining_count > 0 THEN
    RAISE WARNING 'Il reste % tables critiques sans politiques', remaining_count;
  ELSE
    RAISE NOTICE '✅ Toutes les tables critiques ont maintenant des politiques RLS';
  END IF;
END $$;

-- ============================================================
-- 6. Commentaires et documentation
-- ============================================================

COMMENT ON FUNCTION get_tables_without_policies() IS 
'Identifie les tables avec RLS activé mais sans politiques. Retourne le nom de la table, l''état RLS, le nombre de politiques et la priorité.';

COMMENT ON FUNCTION create_safe_rls_policies_for_table(text, boolean, text, boolean, text) IS 
'Crée des politiques RLS sécurisées pour une table donnée. Paramètres: nom_table, has_user_id, user_id_column, has_store_id, store_id_column.';
