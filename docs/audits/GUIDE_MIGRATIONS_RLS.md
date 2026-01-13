# 🔒 Guide de Création des Migrations RLS

**Date** : 30 Janvier 2025  
**Objectif** : Créer des politiques RLS pour les 40 tables sans politiques

---

## 📋 Processus en 3 Étapes

### Étape 1 : Identifier les Tables Exactes

**Action** : Exécuter l'audit RLS dans Supabase SQL Editor

```sql
-- Exécuter dans Supabase Dashboard → SQL Editor
-- Fichier : supabase/FINAL_RLS_AUDIT.sql

-- Ou directement :
SELECT * FROM get_tables_without_policies() ORDER BY table_name;
```

**Résultat attendu** : Liste des 40 tables sans politiques

---

### Étape 2 : Analyser la Structure des Tables

Pour chaque table, identifier :

1. **Colonnes de sécurité** :
   - `user_id` : Données utilisateur (ex: `profiles`, `notifications`)
   - `store_id` : Données boutique (ex: `products`, `orders`)
   - `customer_id` : Données client (ex: `customers`, `cart_items`)
   - Aucune : Données publiques ou admin seulement

2. **Type de données** :
   - **Publiques** : Lecture pour tous (ex: `products` en marketplace)
   - **Privées** : Lecture pour propriétaire seulement (ex: `orders`)
   - **Admin** : Lecture/écriture admin seulement (ex: `platform_settings`)

3. **Opérations nécessaires** :
   - `SELECT` : Lecture (toujours nécessaire)
   - `INSERT` : Création (si utilisateurs peuvent créer)
   - `UPDATE` : Modification (si utilisateurs peuvent modifier)
   - `DELETE` : Suppression (généralement admin seulement)

---

### Étape 3 : Créer les Politiques

#### Pattern 1 : Table avec `user_id` (Données utilisateur)

```sql
-- SELECT : Utilisateur voit ses propres données + admins voient tout
CREATE POLICY "{table_name}_select_policy" ON {table_name}
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- INSERT : Utilisateur peut créer ses propres données
CREATE POLICY "{table_name}_insert_policy" ON {table_name}
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE : Utilisateur peut modifier ses propres données + admins
CREATE POLICY "{table_name}_update_policy" ON {table_name}
  FOR UPDATE
  USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- DELETE : Utilisateur peut supprimer ses propres données + admins
CREATE POLICY "{table_name}_delete_policy" ON {table_name}
  FOR DELETE
  USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
```

**Exemples** : `notifications`, `user_preferences`, `saved_addresses`

---

#### Pattern 2 : Table avec `store_id` (Données boutique)

```sql
-- SELECT : Propriétaire de la boutique voit ses données + admins
CREATE POLICY "{table_name}_select_policy" ON {table_name}
  FOR SELECT
  USING (
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- INSERT : Propriétaire de la boutique peut créer
CREATE POLICY "{table_name}_insert_policy" ON {table_name}
  FOR INSERT
  WITH CHECK (
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
  );

-- UPDATE : Propriétaire de la boutique peut modifier + admins
CREATE POLICY "{table_name}_update_policy" ON {table_name}
  FOR UPDATE
  USING (
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- DELETE : Seulement admins (ou propriétaire selon contexte)
CREATE POLICY "{table_name}_delete_policy" ON {table_name}
  FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
```

**Exemples** : `products`, `orders`, `customers`, `inventory`

---

#### Pattern 3 : Table Publique (Marketplace)

```sql
-- SELECT : Tous les utilisateurs authentifiés peuvent lire
CREATE POLICY "{table_name}_select_policy" ON {table_name}
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- INSERT : Utilisateurs authentifiés peuvent créer
CREATE POLICY "{table_name}_insert_policy" ON {table_name}
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE : Seulement propriétaire ou admin
CREATE POLICY "{table_name}_update_policy" ON {table_name}
  FOR UPDATE
  USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- DELETE : Seulement propriétaire ou admin
CREATE POLICY "{table_name}_delete_policy" ON {table_name}
  FOR DELETE
  USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
```

**Exemples** : `reviews` (avis publics), `community_posts`

---

#### Pattern 4 : Table Admin Seulement

```sql
-- SELECT : Seulement admins
CREATE POLICY "{table_name}_select_policy" ON {table_name}
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- INSERT : Seulement admins
CREATE POLICY "{table_name}_insert_policy" ON {table_name}
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- UPDATE : Seulement admins
CREATE POLICY "{table_name}_update_policy" ON {table_name}
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- DELETE : Seulement admins
CREATE POLICY "{table_name}_delete_policy" ON {table_name}
  FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
```

**Exemples** : `platform_settings`, `admin_config`, `system_logs`

---

## 📝 Template de Migration

```sql
-- ============================================================
-- Migration RLS : {Nom de la Table}
-- Date: {Date}
-- 
-- Objectif: Ajouter des politiques RLS pour {table_name}
-- ============================================================

-- Vérifier que RLS est activé
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = '{table_name}' 
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS must be enabled on {table_name}';
  END IF;
END $$;

-- Vérifier qu'il n'y a pas déjà de politiques
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = '{table_name}'
  ) THEN
    RAISE NOTICE 'Table {table_name} already has policies, skipping';
    RETURN;
  END IF;
END $$;

-- {Pattern approprié selon le type de table}
-- Copier le pattern 1, 2, 3 ou 4 ci-dessus

-- Vérification finale
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = '{table_name}';
  
  IF policy_count = 0 THEN
    RAISE WARNING 'No policies created for {table_name}';
  ELSE
    RAISE NOTICE '✅ Created % policies for {table_name}', policy_count;
  END IF;
END $$;
```

---

## 🎯 Checklist de Validation

Avant de créer une migration, vérifier :

- [ ] Table identifiée dans l'audit RLS
- [ ] Structure de la table analysée (colonnes `user_id`, `store_id`, etc.)
- [ ] Pattern approprié sélectionné (1, 2, 3 ou 4)
- [ ] Politiques adaptées au contexte métier
- [ ] Tests prévus après migration

Après création de la migration :

- [ ] Migration testée en local/staging
- [ ] Vérification que les politiques fonctionnent
- [ ] Test avec différents rôles (user, vendor, admin)
- [ ] Documentation mise à jour

---

## ⚠️ Points d'Attention

### 1. Tables avec Relations Complexes

Certaines tables peuvent avoir des relations complexes :
- `order_items` : Lié à `orders` (store_id) ET `products` (store_id)
- `service_bookings` : Lié à `service_products` (store_id) ET `customers` (store_id)

**Solution** : Utiliser des sous-requêtes pour vérifier les permissions

### 2. Tables de Jointure

Tables comme `course_enrollments`, `bundle_items` :
- Vérifier permissions sur les tables liées
- Utiliser `EXISTS` pour vérifier les relations

### 3. Tables avec Données Sensibles

Tables comme `payments`, `transactions`, `commissions` :
- **Toujours** restreindre l'accès
- Utiliser Pattern 4 (Admin seulement) ou Pattern 2 avec restrictions strictes

---

## 📊 Exemple Complet : Table `notifications`

```sql
-- ============================================================
-- Migration RLS : notifications
-- Date: 2025-01-30
-- 
-- Objectif: Ajouter des politiques RLS pour notifications
-- Structure: Table avec user_id (données utilisateur)
-- ============================================================

-- Vérifier que RLS est activé
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'notifications' 
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS must be enabled on notifications';
  END IF;
END $$;

-- SELECT : Utilisateur voit ses propres notifications + admins voient tout
CREATE POLICY "notifications_select_policy" ON notifications
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- INSERT : Système peut créer (pas de restriction user_id car peut être NULL pour notifications système)
CREATE POLICY "notifications_insert_policy" ON notifications
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE : Utilisateur peut marquer ses notifications comme lues + admins
CREATE POLICY "notifications_update_policy" ON notifications
  FOR UPDATE
  USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- DELETE : Utilisateur peut supprimer ses notifications + admins
CREATE POLICY "notifications_delete_policy" ON notifications
  FOR DELETE
  USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Vérification finale
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'notifications';
  
  IF policy_count = 0 THEN
    RAISE WARNING 'No policies created for notifications';
  ELSE
    RAISE NOTICE '✅ Created % policies for notifications', policy_count;
  END IF;
END $$;
```

---

## 🔗 Ressources

- **Script d'audit** : `supabase/FINAL_RLS_AUDIT.sql`
- **Migration exemple** : `supabase/migrations/20250131_fix_rls_missing_policies_phase1.sql`
- **Documentation Supabase RLS** : https://supabase.com/docs/guides/auth/row-level-security

---

**Prochaine étape** : Exécuter l'audit RLS pour identifier les 40 tables exactes, puis créer les migrations une par une.
