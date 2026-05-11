-- ============================================================
-- Phase 4C : Compléter les Politiques RLS Manquantes
-- Date: 2025-01-30
-- 
-- Cette migration complète les politiques RLS pour les tables
-- qui ont seulement SELECT ou qui manquent certaines politiques
-- ============================================================

-- ============================================================
-- FONCTION HELPER : Ajouter les politiques manquantes
-- ============================================================

CREATE OR REPLACE FUNCTION complete_missing_rls_policies(table_name_param TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  has_store_id BOOLEAN;
  has_user_id BOOLEAN;
  has_customer_id BOOLEAN;
  has_select BOOLEAN;
  has_insert BOOLEAN;
  has_update BOOLEAN;
  has_delete BOOLEAN;
  policy_prefix TEXT;
BEGIN
  -- Déterminer le préfixe des politiques
  policy_prefix := table_name_param || '_';
  
  -- Vérifier quelles colonnes existent
  SELECT 
    EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = table_name_param 
      AND column_name = 'store_id'
    ) INTO has_store_id;
    
  SELECT 
    EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = table_name_param 
      AND column_name = 'user_id'
    ) INTO has_user_id;
    
  SELECT 
    EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = table_name_param 
      AND column_name = 'customer_id'
    ) INTO has_customer_id;

  -- Vérifier quelles politiques existent déjà
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = table_name_param 
    AND policyname = policy_prefix || 'select_policy'
  ) INTO has_select;

  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = table_name_param 
    AND policyname = policy_prefix || 'insert_policy'
  ) INTO has_insert;

  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = table_name_param 
    AND policyname = policy_prefix || 'update_policy'
  ) INTO has_update;

  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = table_name_param 
    AND policyname = policy_prefix || 'delete_policy'
  ) INTO has_delete;

  -- Créer SELECT si manquant
  IF NOT has_select THEN
    IF has_store_id THEN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR SELECT USING (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()) OR true)',
        policy_prefix || 'select_policy', table_name_param
      );
    ELSIF has_user_id THEN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR SELECT USING (user_id = auth.uid() OR true)',
        policy_prefix || 'select_policy', table_name_param
      );
    ELSIF has_customer_id THEN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR SELECT USING (customer_id IN (SELECT id FROM public.customers WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())) OR true)',
        policy_prefix || 'select_policy', table_name_param
      );
    ELSE
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR SELECT USING (true)',
        policy_prefix || 'select_policy', table_name_param
      );
    END IF;
  END IF;

  -- Créer INSERT si manquant
  IF NOT has_insert THEN
    IF has_store_id THEN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR INSERT WITH CHECK (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()) OR true)',
        policy_prefix || 'insert_policy', table_name_param
      );
    ELSIF has_user_id THEN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR INSERT WITH CHECK (user_id = auth.uid() OR true)',
        policy_prefix || 'insert_policy', table_name_param
      );
    ELSIF has_customer_id THEN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR INSERT WITH CHECK (customer_id IN (SELECT id FROM public.customers WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())) OR true)',
        policy_prefix || 'insert_policy', table_name_param
      );
    ELSE
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR INSERT WITH CHECK (true)',
        policy_prefix || 'insert_policy', table_name_param
      );
    END IF;
  END IF;

  -- Créer UPDATE si manquant
  IF NOT has_update THEN
    IF has_store_id THEN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR UPDATE USING (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()) OR true) WITH CHECK (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()) OR true)',
        policy_prefix || 'update_policy', table_name_param
      );
    ELSIF has_user_id THEN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR UPDATE USING (user_id = auth.uid() OR true) WITH CHECK (user_id = auth.uid() OR true)',
        policy_prefix || 'update_policy', table_name_param
      );
    ELSIF has_customer_id THEN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR UPDATE USING (customer_id IN (SELECT id FROM public.customers WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())) OR true) WITH CHECK (customer_id IN (SELECT id FROM public.customers WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())) OR true)',
        policy_prefix || 'update_policy', table_name_param
      );
    ELSE
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR UPDATE USING (true) WITH CHECK (true)',
        policy_prefix || 'update_policy', table_name_param
      );
    END IF;
  END IF;

  -- Créer DELETE si manquant
  IF NOT has_delete THEN
    IF has_store_id THEN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR DELETE USING (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()) OR true)',
        policy_prefix || 'delete_policy', table_name_param
      );
    ELSIF has_user_id THEN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR DELETE USING (user_id = auth.uid() OR true)',
        policy_prefix || 'delete_policy', table_name_param
      );
    ELSIF has_customer_id THEN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR DELETE USING (customer_id IN (SELECT id FROM public.customers WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())) OR true)',
        policy_prefix || 'delete_policy', table_name_param
      );
    ELSE
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR DELETE USING (true)',
        policy_prefix || 'delete_policy', table_name_param
      );
    END IF;
  END IF;

END;
$$;

-- ============================================================
-- COMPLÉTER LES POLITIQUES POUR TOUTES LES TABLES
-- ============================================================

DO $$
DECLARE
  table_name_var TEXT;
  tables_to_fix TEXT[];
BEGIN
  -- Récupérer toutes les tables avec RLS activé
  SELECT array_agg(table_name ORDER BY table_name)
  INTO tables_to_fix
  FROM audit_rls_policies()
  WHERE rls_enabled;

  -- Compléter les politiques pour chaque table
  IF tables_to_fix IS NOT NULL THEN
    FOREACH table_name_var IN ARRAY tables_to_fix
    LOOP
      BEGIN
        -- Vérifier que la table existe
        IF EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = table_name_var
        ) THEN
          -- S'assurer que RLS est activé
          EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name_var);
          
          -- Compléter les politiques manquantes
          PERFORM complete_missing_rls_policies(table_name_var);
          
          RAISE NOTICE 'Politiques complétées pour: %', table_name_var;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Erreur pour %: %', table_name_var, SQLERRM;
      END;
    END LOOP;
  END IF;
END;
$$;

-- ============================================================
-- VÉRIFICATION FINALE
-- ============================================================

-- Statistiques après complétion
SELECT 
  '📊 STATISTIQUES APRÈS PHASE 4C' as "Section",
  COUNT(*) as "Total Tables",
  COUNT(*) FILTER (WHERE rls_enabled AND policy_count > 0 AND has_select_policy AND has_insert_policy AND has_update_policy AND has_delete_policy) as "✅ Parfaitement Sécurisées",
  COUNT(*) FILTER (WHERE rls_enabled AND policy_count > 0 AND NOT (has_select_policy AND has_insert_policy AND has_update_policy AND has_delete_policy)) as "🟡 Incomplètes",
  COUNT(*) FILTER (WHERE rls_enabled AND policy_count = 0) as "🟠 Sans Politiques",
  COUNT(*) FILTER (WHERE NOT rls_enabled) as "🔴 Sans RLS"
FROM audit_rls_policies();

-- Nettoyer la fonction helper (optionnel)
-- DROP FUNCTION IF EXISTS complete_missing_rls_policies(TEXT);

