-- ============================================================
-- Phase 4B : RLS Policies pour les 37 Tables Restantes
-- Date: 2025-01-30
-- 
-- Cette migration ajoute des politiques RLS de base pour toutes les tables
-- qui ont RLS activé mais aucune politique (bloquant l'accès)
-- 
-- Stratégie : Politiques génériques qui s'adaptent à la structure de chaque table
-- ============================================================

-- ============================================================
-- FONCTION HELPER : Créer des politiques RLS génériques
-- ============================================================

CREATE OR REPLACE FUNCTION create_generic_rls_policies(table_name_param TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  has_store_id BOOLEAN;
  has_user_id BOOLEAN;
  has_customer_id BOOLEAN;
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

  -- Supprimer les politiques existantes si elles existent
  EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_prefix || 'select_policy', table_name_param);
  EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_prefix || 'insert_policy', table_name_param);
  EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_prefix || 'update_policy', table_name_param);
  EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_prefix || 'delete_policy', table_name_param);

  -- Créer la politique SELECT
  IF has_store_id THEN
    -- Table avec store_id : propriétaires voient leurs données
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT USING (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()))',
      policy_prefix || 'select_policy', table_name_param
    );
  ELSIF has_user_id THEN
    -- Table avec user_id : utilisateurs voient leurs données
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT USING (user_id = auth.uid())',
      policy_prefix || 'select_policy', table_name_param
    );
  ELSIF has_customer_id THEN
    -- Table avec customer_id : clients voient leurs données
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT USING (customer_id IN (SELECT id FROM public.customers WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())))',
      policy_prefix || 'select_policy', table_name_param
    );
  ELSE
    -- Table sans colonne d'identification : lecture publique (pour tables système/config)
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT USING (true)',
      policy_prefix || 'select_policy', table_name_param
    );
  END IF;

  -- Créer la politique INSERT
  IF has_store_id THEN
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT WITH CHECK (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()))',
      policy_prefix || 'insert_policy', table_name_param
    );
  ELSIF has_user_id THEN
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT WITH CHECK (user_id = auth.uid())',
      policy_prefix || 'insert_policy', table_name_param
    );
  ELSIF has_customer_id THEN
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT WITH CHECK (customer_id IN (SELECT id FROM public.customers WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())))',
      policy_prefix || 'insert_policy', table_name_param
    );
  ELSE
    -- Table sans colonne d'identification : insertion publique (pour tables système/config)
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT WITH CHECK (true)',
      policy_prefix || 'insert_policy', table_name_param
    );
  END IF;

  -- Créer la politique UPDATE
  IF has_store_id THEN
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE USING (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())) WITH CHECK (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()))',
      policy_prefix || 'update_policy', table_name_param
    );
  ELSIF has_user_id THEN
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())',
      policy_prefix || 'update_policy', table_name_param
    );
  ELSIF has_customer_id THEN
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE USING (customer_id IN (SELECT id FROM public.customers WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))) WITH CHECK (customer_id IN (SELECT id FROM public.customers WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())))',
      policy_prefix || 'update_policy', table_name_param
    );
  ELSE
    -- Table sans colonne d'identification : mise à jour publique (pour tables système/config)
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE USING (true) WITH CHECK (true)',
      policy_prefix || 'update_policy', table_name_param
    );
  END IF;

  -- Créer la politique DELETE
  IF has_store_id THEN
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE USING (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()))',
      policy_prefix || 'delete_policy', table_name_param
    );
  ELSIF has_user_id THEN
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE USING (user_id = auth.uid())',
      policy_prefix || 'delete_policy', table_name_param
    );
  ELSIF has_customer_id THEN
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE USING (customer_id IN (SELECT id FROM public.customers WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())))',
      policy_prefix || 'delete_policy', table_name_param
    );
  ELSE
    -- Table sans colonne d'identification : suppression publique (pour tables système/config)
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE USING (true)',
      policy_prefix || 'delete_policy', table_name_param
    );
  END IF;

END;
$$;

-- ============================================================
-- CRÉER LES POLITIQUES POUR TOUTES LES TABLES SANS POLITIQUES
-- ============================================================

DO $$
DECLARE
  table_record RECORD;
  tables_without_policies TEXT[];
BEGIN
  -- Récupérer la liste des tables sans politiques
  SELECT array_agg(table_name ORDER BY table_name)
  INTO tables_without_policies
  FROM audit_rls_policies()
  WHERE rls_enabled AND policy_count = 0;

  -- Créer les politiques pour chaque table
  IF tables_without_policies IS NOT NULL THEN
    FOR table_record IN 
      SELECT unnest(tables_without_policies) as table_name
    LOOP
      BEGIN
        -- Vérifier que la table existe
        IF EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = table_record.table_name
        ) THEN
          -- S'assurer que RLS est activé
          EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_record.table_name);
          
          -- Créer les politiques
          PERFORM create_generic_rls_policies(table_record.table_name);
          
          RAISE NOTICE 'Politiques créées pour la table: %', table_record.table_name;
        ELSE
          RAISE NOTICE 'Table non trouvée (ignorée): %', table_record.table_name;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Erreur lors de la création des politiques pour %: %', table_record.table_name, SQLERRM;
      END;
    END LOOP;
  END IF;
END;
$$;

-- ============================================================
-- VÉRIFICATION
-- ============================================================

-- Afficher le nombre de tables sécurisées
SELECT 
  '✅ Vérification Phase 4B' as status,
  COUNT(*) as tables_securisees,
  STRING_AGG(table_name, ', ' ORDER BY table_name) as tables
FROM audit_rls_policies()
WHERE rls_enabled AND policy_count > 0;

-- Afficher les tables restantes sans politiques (devrait être 0 ou très peu)
SELECT 
  '⚠️ Tables restantes sans politiques' as status,
  COUNT(*) as nombre_tables,
  STRING_AGG(table_name, ', ' ORDER BY table_name) as tables
FROM audit_rls_policies()
WHERE rls_enabled AND policy_count = 0;

-- Afficher un résumé des politiques créées
SELECT 
  schemaname,
  tablename,
  COUNT(*) as nombre_politiques,
  STRING_AGG(policyname, ', ' ORDER BY policyname) as politiques
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    SELECT table_name 
    FROM audit_rls_policies()
    WHERE rls_enabled AND policy_count > 0
  )
GROUP BY schemaname, tablename
ORDER BY tablename;

-- Nettoyer la fonction helper (optionnel)
-- DROP FUNCTION IF EXISTS create_generic_rls_policies(TEXT);

