# 📝 Exemple de Migration RLS

**Date** : 30 Janvier 2025  
**Objectif** : Montrer comment utiliser le template pour créer une migration RLS

---

## 🎯 Exemple : Table `notifications`

### Étape 1 : Identifier le Pattern

**Table** : `notifications`  
**Structure** : Contient `user_id` (données utilisateur)  
**Pattern** : Pattern 1 (Table avec `user_id`)

---

### Étape 2 : Créer la Migration

**Fichier** : `supabase/migrations/20250130_rls_notifications.sql`

```sql
-- ============================================================
-- Migration RLS : notifications
-- Date: 2025-01-30
-- 
-- Objectif: Ajouter des politiques RLS pour notifications
-- Structure: Table avec user_id (données utilisateur)
-- Pattern: Pattern 1
-- ============================================================

DO $$
DECLARE
  v_table_name text := 'notifications';  -- Nom de la table
  v_user_id_column text := 'user_id';    -- Colonne user_id
  v_store_id_column text := 'store_id';  -- Non utilisé ici
  policy_count INTEGER;
BEGIN
-- ============================================================
-- VÉRIFICATIONS PRÉLIMINAIRES
-- ============================================================

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
'Policy for SELECT operations on notifications. Users can see their own notifications, admins can see all.';

COMMENT ON POLICY "notifications_insert_policy" ON notifications IS 
'Policy for INSERT operations on notifications. Users can create their own notifications.';

COMMENT ON POLICY "notifications_update_policy" ON notifications IS 
'Policy for UPDATE operations on notifications. Users can update their own notifications, admins can update all.';

COMMENT ON POLICY "notifications_delete_policy" ON notifications IS 
'Policy for DELETE operations on notifications. Users can delete their own notifications, admins can delete all.';
```

---

## 🎯 Exemple : Table `platform_settings` (Admin seulement)

### Étape 1 : Identifier le Pattern

**Table** : `platform_settings`  
**Structure** : Pas de `user_id` ni `store_id` (configuration plateforme)  
**Pattern** : Pattern 4 (Table admin seulement)

---

### Étape 2 : Créer la Migration

**Fichier** : `supabase/migrations/20250130_rls_platform_settings.sql`

```sql
-- ============================================================
-- Migration RLS : platform_settings
-- Date: 2025-01-30
-- 
-- Objectif: Ajouter des politiques RLS pour platform_settings
-- Structure: Table admin seulement (pas de user_id ni store_id)
-- Pattern: Pattern 4
-- ============================================================

DO $$
DECLARE
  v_table_name text := 'platform_settings';
  v_user_id_column text := 'user_id';  -- Non utilisé ici
  v_store_id_column text := 'store_id'; -- Non utilisé ici
  policy_count INTEGER;
BEGIN
-- ============================================================
-- VÉRIFICATIONS PRÉLIMINAIRES
-- ============================================================

  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = v_table_name 
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS must be enabled on %. Run: ALTER TABLE % ENABLE ROW LEVEL SECURITY;', v_table_name, v_table_name;
  END IF;

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
'Policy for SELECT operations on platform_settings. Only admins can read platform settings.';

COMMENT ON POLICY "platform_settings_insert_policy" ON platform_settings IS 
'Policy for INSERT operations on platform_settings. Only admins can create platform settings.';

COMMENT ON POLICY "platform_settings_update_policy" ON platform_settings IS 
'Policy for UPDATE operations on platform_settings. Only admins can update platform settings.';

COMMENT ON POLICY "platform_settings_delete_policy" ON platform_settings IS 
'Policy for DELETE operations on platform_settings. Only admins can delete platform settings.';
```

---

## 📋 Checklist de Création

Avant de créer une migration :

- [ ] Identifier le nom exact de la table
- [ ] Vérifier la structure (colonnes `user_id`, `store_id`, etc.)
- [ ] Choisir le pattern approprié (1, 2, 3 ou 4)
- [ ] Copier le template
- [ ] Remplacer `'YOUR_TABLE_NAME'` par le nom réel
- [ ] Adapter les noms de colonnes si nécessaire
- [ ] Décommenter le pattern choisi
- [ ] Commenter les autres patterns
- [ ] Ajouter les commentaires de documentation

Après création :

- [ ] Tester la migration en local/staging
- [ ] Vérifier que les politiques sont créées
- [ ] Tester avec différents rôles (user, vendor, admin)
- [ ] Vérifier que les données sont accessibles correctement

---

## 🔗 Ressources

- **Template** : `supabase/migrations/20250130_rls_critical_tables_template.sql`
- **Guide** : `docs/audits/GUIDE_MIGRATIONS_RLS.md`

---

**Prochaine étape** : Utiliser ces exemples comme référence pour créer les migrations des 40 tables critiques.
