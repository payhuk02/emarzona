# 🚀 Guide d'Exécution des Migrations RLS

**Date** : 13 Janvier 2026  
**Objectif** : Exécuter et tester les migrations RLS générées

---

## 📋 Prérequis

### 1. Vérifier les Migrations Générées

```bash
# Lister toutes les migrations RLS
npm run list:rls-migrations

# Filtrer par pattern
npm run list:rls-migrations -- --pattern=1

# Filtrer par table
npm run list:rls-migrations -- --table=notifications
```

### 2. Vérifier la Structure des Tables

Avant d'exécuter une migration, vérifier dans Supabase Dashboard :
- ✅ La table existe
- ✅ RLS est activé sur la table
- ✅ Les colonnes `user_id` ou `store_id` existent (selon le pattern)
- ✅ Pas de politiques RLS existantes (ou intention de les remplacer)

---

## 🔧 Exécution des Migrations

### Option 1 : Via Supabase Dashboard (Recommandé pour tests)

#### Étape 1 : Ouvrir SQL Editor
1. Aller sur Supabase Dashboard
2. Cliquer sur **SQL Editor** dans le menu de gauche
3. Cliquer sur **New Query**

#### Étape 2 : Copier la Migration
1. Ouvrir le fichier de migration dans `supabase/migrations/`
2. Copier tout le contenu (Ctrl+A, Ctrl+C)

#### Étape 3 : Exécuter
1. Coller dans SQL Editor (Ctrl+V)
2. Cliquer sur **Run** ou appuyer sur Ctrl+Enter
3. Vérifier les messages de succès

#### Étape 4 : Vérifier les Résultats
```sql
-- Vérifier que les politiques sont créées
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  permissive
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'notifications'  -- Remplacer par votre table
ORDER BY policyname;
```

**Résultat attendu** : 4 politiques (SELECT, INSERT, UPDATE, DELETE)

---

### Option 2 : Via Supabase CLI

```bash
# Exécuter une migration spécifique
supabase db execute --file supabase/migrations/20260113165047_rls_notifications.sql

# Exécuter toutes les migrations RLS (attention : exécute toutes les migrations)
supabase db push
```

---

## ✅ Tests des Politiques

### Test 1 : Vérifier les Politiques Créées

```sql
-- Pour une table spécifique
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'notifications'
ORDER BY cmd, policyname;
```

### Test 2 : Tester avec Utilisateur Normal

```sql
-- Se connecter en tant qu'utilisateur normal (non-admin)
-- Via Supabase Dashboard → Authentication → Users → Créer un utilisateur de test

-- Tester SELECT
SELECT * FROM notifications WHERE user_id = auth.uid();

-- Tester INSERT
INSERT INTO notifications (user_id, title, message)
VALUES (auth.uid(), 'Test', 'Message de test');

-- Tester UPDATE
UPDATE notifications 
SET read = true 
WHERE id = 'ID_DU_NOTIFICATION' AND user_id = auth.uid();

-- Tester DELETE
DELETE FROM notifications 
WHERE id = 'ID_DU_NOTIFICATION' AND user_id = auth.uid();
```

### Test 3 : Tester avec Propriétaire de Boutique (Pattern 2)

```sql
-- Se connecter en tant que propriétaire de boutique

-- Tester SELECT
SELECT * FROM subscriptions 
WHERE store_id IN (SELECT id FROM stores WHERE user_id = auth.uid());

-- Tester INSERT
INSERT INTO subscriptions (store_id, plan_id, status)
VALUES (
  (SELECT id FROM stores WHERE user_id = auth.uid() LIMIT 1),
  'plan_id',
  'active'
);
```

### Test 4 : Tester avec Admin

```sql
-- Se connecter en tant qu'admin (role = 'admin' dans profiles)

-- Tester SELECT (devrait voir toutes les données)
SELECT * FROM notifications;  -- Devrait retourner toutes les notifications

-- Tester UPDATE (devrait pouvoir modifier toutes les données)
UPDATE notifications SET read = true WHERE id = 'ANY_ID';

-- Tester DELETE (devrait pouvoir supprimer toutes les données)
DELETE FROM notifications WHERE id = 'ANY_ID';
```

### Test 5 : Tester l'Isolation des Données

```sql
-- Créer deux utilisateurs de test
-- User A et User B

-- User A ne devrait PAS voir les données de User B
-- Se connecter en tant que User A
SELECT * FROM notifications;  
-- Devrait retourner seulement les notifications de User A

-- Se connecter en tant que User B
SELECT * FROM notifications;
-- Devrait retourner seulement les notifications de User B
```

---

## 🔍 Dépannage

### Erreur : "Table does not exist"

**Cause** : La table n'existe pas dans la base de données

**Solution** :
1. Vérifier le nom de la table dans Supabase Dashboard → Table Editor
2. Vérifier que vous êtes dans le bon schéma (`public`)

---

### Erreur : "RLS must be enabled"

**Cause** : RLS n'est pas activé sur la table

**Solution** :
```sql
ALTER TABLE nom_table ENABLE ROW LEVEL SECURITY;
```

---

### Erreur : "Table already has policies"

**Cause** : Des politiques RLS existent déjà

**Solution** :
1. Vérifier les politiques existantes :
   ```sql
   SELECT * FROM pg_policies 
   WHERE schemaname = 'public' AND tablename = 'nom_table';
   ```

2. Soit supprimer les anciennes politiques :
   ```sql
   DROP POLICY IF EXISTS "nom_table_select_policy" ON nom_table;
   DROP POLICY IF EXISTS "nom_table_insert_policy" ON nom_table;
   DROP POLICY IF EXISTS "nom_table_update_policy" ON nom_table;
   DROP POLICY IF EXISTS "nom_table_delete_policy" ON nom_table;
   ```

3. Soit modifier la migration pour adapter les politiques existantes

---

### Erreur : "Column does not exist"

**Cause** : La colonne `user_id` ou `store_id` n'existe pas dans la table

**Solution** :
1. Vérifier la structure de la table dans Supabase Dashboard
2. Régénérer la migration avec les bonnes colonnes :
   ```bash
   npm run generate:rls-migration -- --table=TABLE_NAME --pattern=X --user-id-column=COLUMN_NAME
   ```

---

## 📊 Checklist d'Exécution

Pour chaque migration :

- [ ] Migration vérifiée avec `npm run list:rls-migrations`
- [ ] Structure de la table vérifiée dans Supabase Dashboard
- [ ] Colonnes `user_id`/`store_id` vérifiées
- [ ] RLS activé sur la table
- [ ] Migration exécutée sans erreur
- [ ] 4 politiques créées (SELECT, INSERT, UPDATE, DELETE)
- [ ] Testé avec utilisateur normal
- [ ] Testé avec propriétaire boutique (si Pattern 2)
- [ ] Testé avec admin
- [ ] Isolation des données vérifiée
- [ ] Documentation mise à jour

---

## 🎯 Workflow Recommandé

### Phase 1 : Préparation (30 min)
1. Lister les migrations : `npm run list:rls-migrations`
2. Vérifier la structure des tables dans Supabase Dashboard
3. Identifier les tables qui nécessitent des adaptations

### Phase 2 : Exécution (2-3 heures)
1. Exécuter les migrations Pattern 4 (Admin Only) - 4 tables
2. Exécuter les migrations Pattern 1 (user_id) - 6 tables
3. Exécuter les migrations Pattern 2 (store_id) - 8 tables
4. Exécuter les migrations Pattern 3 (Public) - 3 tables

### Phase 3 : Tests (2-3 heures)
1. Tester chaque migration avec différents rôles
2. Vérifier l'isolation des données
3. Documenter les résultats

---

## 📈 Statistiques

- **Total migrations à exécuter** : 21
- **Temps estimé** : 4-6 heures
- **Priorité** : 🔴 CRITIQUE

---

## 🔗 Ressources

- **Liste migrations** : `npm run list:rls-migrations`
- **Génération** : `npm run generate:rls-migration`
- **Guide génération** : `docs/audits/GUIDE_GENERATION_MIGRATIONS.md`
- **Résumé batch** : `docs/audits/RESUME_GENERATION_BATCH.md`

---

**Prochaine étape** : Exécuter les migrations Pattern 4 (Admin Only) en premier, puis tester avec un compte admin.
