-- ============================================================
-- Audit RLS (Row Level Security) - Toutes les Tables
-- Date: 2025-01-30
-- 
-- Ce script vérifie que toutes les tables sensibles ont des politiques RLS
-- et identifie les tables qui pourraient nécessiter des politiques supplémentaires
-- ============================================================

-- Fonction pour générer un rapport RLS
CREATE OR REPLACE FUNCTION audit_rls_policies()
RETURNS TABLE (
  schema_name text,
  table_name text,
  rls_enabled boolean,
  policy_count bigint,
  policies text[],
  has_select_policy boolean,
  has_insert_policy boolean,
  has_update_policy boolean,
  has_delete_policy boolean,
  recommendation text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.nspname::text as schema_name,
    c.relname::text as table_name,
    c.relrowsecurity as rls_enabled,
    COUNT(p.polname)::bigint as policy_count,
    COALESCE(array_agg(DISTINCT p.polname::text) FILTER (WHERE p.polname IS NOT NULL), ARRAY[]::text[]) as policies,
    BOOL_OR(p.polcmd = 'r') as has_select_policy,
    BOOL_OR(p.polcmd = 'a') as has_insert_policy,
    BOOL_OR(p.polcmd = 'w') as has_update_policy,
    BOOL_OR(p.polcmd = 'd') as has_delete_policy,
    CASE
      WHEN NOT c.relrowsecurity THEN '⚠️ RLS non activé - Activer RLS pour cette table'
      WHEN COUNT(p.polname) = 0 THEN '⚠️ Aucune politique RLS - Ajouter des politiques'
      WHEN NOT BOOL_OR(p.polcmd = 'r') AND c.relkind = 'r' THEN '⚠️ Pas de politique SELECT - Ajouter une politique de lecture'
      WHEN NOT BOOL_OR(p.polcmd = 'a') AND c.relkind = 'r' THEN 'ℹ️ Pas de politique INSERT - Vérifier si nécessaire'
      WHEN NOT BOOL_OR(p.polcmd = 'w') AND c.relkind = 'r' THEN 'ℹ️ Pas de politique UPDATE - Vérifier si nécessaire'
      WHEN NOT BOOL_OR(p.polcmd = 'd') AND c.relkind = 'r' THEN 'ℹ️ Pas de politique DELETE - Vérifier si nécessaire'
      ELSE '✅ RLS configuré correctement'
    END as recommendation
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  LEFT JOIN pg_policy p ON p.polrelid = c.oid
  WHERE n.nspname = 'public'
    AND c.relkind = 'r' -- Seulement les tables
    AND c.relname NOT LIKE 'pg_%' -- Exclure les tables système
    AND c.relname NOT LIKE '_prisma%' -- Exclure les tables Prisma si présentes
  GROUP BY n.nspname, c.relname, c.relrowsecurity, c.relkind
  ORDER BY 
    CASE WHEN NOT c.relrowsecurity THEN 0 ELSE 1 END,
    CASE WHEN COUNT(p.polname) = 0 THEN 0 ELSE 1 END,
    c.relname;
END;
$$;

-- Vue pour faciliter l'audit
CREATE OR REPLACE VIEW rls_audit_report AS
SELECT * FROM audit_rls_policies();

-- Fonction pour obtenir les tables sans RLS
CREATE OR REPLACE FUNCTION get_tables_without_rls()
RETURNS TABLE (
  table_name text,
  recommendation text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    table_name,
    'Activer RLS et ajouter des politiques appropriées' as recommendation
  FROM audit_rls_policies()
  WHERE NOT rls_enabled
  ORDER BY table_name;
$$;

-- Fonction pour obtenir les tables avec RLS mais sans politiques
CREATE OR REPLACE FUNCTION get_tables_without_policies()
RETURNS TABLE (
  table_name text,
  recommendation text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    table_name,
    'Ajouter des politiques RLS (SELECT, INSERT, UPDATE, DELETE selon les besoins)' as recommendation
  FROM audit_rls_policies()
  WHERE rls_enabled AND policy_count = 0
  ORDER BY table_name;
$$;

-- Commentaires pour documentation
COMMENT ON FUNCTION audit_rls_policies() IS 'Audit complet des politiques RLS sur toutes les tables publiques';
COMMENT ON VIEW rls_audit_report IS 'Vue pour consulter facilement le rapport d''audit RLS';
COMMENT ON FUNCTION get_tables_without_rls() IS 'Liste les tables sans RLS activé';
COMMENT ON FUNCTION get_tables_without_policies() IS 'Liste les tables avec RLS activé mais sans politiques';

