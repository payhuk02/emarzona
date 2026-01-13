# 🚀 Démarrage - Pattern 4 (Admin Only)

**Date** : 13 Janvier 2026  
**Priorité** : 🔴 CRITIQUE  
**Tables** : 4 tables (admin_config, platform_settings, system_logs, admin_actions)

---

## 📋 Étape 1 : Vérifications Préalables

### 1.1 Ouvrir Supabase Dashboard

1. Aller sur [https://app.supabase.com](https://app.supabase.com)
2. Se connecter avec vos identifiants
3. Sélectionner votre projet **Emarzona**
4. Cliquer sur **SQL Editor** dans le menu de gauche
5. Cliquer sur **New Query** (ou utiliser l'éditeur existant)

---

### 1.2 Exécuter les Requêtes de Vérification

**Fichier** : `supabase/migrations/rls_execution/verification_queries.sql`

1. Ouvrir le fichier `verification_queries.sql` dans votre éditeur
2. **Copier** la section "Vérification Pattern 4"
3. **Coller** dans SQL Editor
4. Cliquer sur **Run** (ou Ctrl+Enter)

**Résultat attendu** :
- ✅ Toutes les tables doivent avoir `rls_enabled = true`
- ✅ `policy_count` doit être `0` ou `NULL` (pas de politiques existantes)

**Si RLS n'est pas activé** sur une table, exécuter :
```sql
ALTER TABLE nom_de_la_table ENABLE ROW LEVEL SECURITY;
```

---

## 🎯 Étape 2 : Exécuter Pattern 4

### 2.1 Ouvrir le Fichier Combiné

**Fichier** : `supabase/migrations/rls_execution/20260113_rls_pattern_4_admin_only_combined.sql`

1. Ouvrir ce fichier dans votre éditeur de code
2. **LIRE** le contenu pour comprendre ce qui sera exécuté
3. Vérifier les 4 tables concernées :
   - `admin_config`
   - `platform_settings`
   - `system_logs`
   - `admin_actions`

---

### 2.2 Copier le Contenu

1. **Sélectionner TOUT** le contenu du fichier (Ctrl+A)
2. **Copier** (Ctrl+C)
3. **Aller** dans Supabase Dashboard → SQL Editor
4. **Coller** le contenu (Ctrl+V)

---

### 2.3 Exécuter la Migration

1. **Vérifier** que tout le contenu est bien collé
2. Cliquer sur **Run** (ou appuyer sur Ctrl+Enter)
3. **ATTENDRE** la fin de l'exécution (quelques secondes)
4. **Vérifier** les messages dans la console

**Messages attendus** :
- `✅ Created 4 policies for admin_config`
- `✅ Created 4 policies for platform_settings`
- `✅ Created 4 policies for system_logs`
- `✅ Created 4 policies for admin_actions`

**Total** : 16 politiques créées (4 par table)

---

## ✅ Étape 3 : Vérifier les Résultats

### 3.1 Vérifier les Politiques Créées

Exécuter cette requête dans SQL Editor :

```sql
-- Vérifier toutes les politiques Pattern 4
SELECT 
  tablename,
  policyname,
  cmd,
  permissive
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('admin_config', 'platform_settings', 'system_logs', 'admin_actions')
ORDER BY tablename, cmd, policyname;
```

**Résultat attendu** : 16 lignes (4 politiques × 4 tables)

**Politiques attendues par table** :
- `{table}_select_policy` (SELECT)
- `{table}_insert_policy` (INSERT)
- `{table}_update_policy` (UPDATE)
- `{table}_delete_policy` (DELETE)

---

### 3.2 Compter les Politiques

```sql
-- Compter les politiques par table
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('admin_config', 'platform_settings', 'system_logs', 'admin_actions')
GROUP BY tablename
ORDER BY tablename;
```

**Résultat attendu** :
- `admin_config` : 4
- `platform_settings` : 4
- `system_logs` : 4
- `admin_actions` : 4

---

## 🧪 Étape 4 : Tests

### 4.1 Test avec Compte Admin

**Prérequis** : Avoir un compte avec `role = 'admin'` dans la table `profiles`

1. **Se connecter** en tant qu'admin dans Supabase Dashboard
2. Exécuter ces requêtes :

```sql
-- Test SELECT (devrait fonctionner)
SELECT * FROM platform_settings LIMIT 1;
SELECT * FROM admin_config LIMIT 1;
SELECT * FROM system_logs LIMIT 1;
SELECT * FROM admin_actions LIMIT 1;
```

**Résultat attendu** : ✅ Toutes les requêtes doivent fonctionner

---

### 4.2 Test avec Utilisateur Normal

**Prérequis** : Avoir un compte utilisateur normal (non-admin)

1. **Se connecter** en tant qu'utilisateur normal
2. Exécuter ces requêtes :

```sql
-- Test SELECT (devrait être bloqué)
SELECT * FROM platform_settings LIMIT 1;
SELECT * FROM admin_config LIMIT 1;
```

**Résultat attendu** : ❌ Erreur "permission denied" ou résultat vide

---

## 📝 Étape 5 : Documenter les Résultats

### 5.1 Mettre à Jour le Suivi

Ouvrir : `docs/audits/SUIVI_EXECUTION_RLS.md`

**Cocher** :
- [x] Pattern 4 exécuté avec succès
- [x] 16 politiques créées (4 par table)
- [x] Tests admin réussis
- [x] Tests utilisateur normal réussis (blocage confirmé)

**Ajouter les notes** :
- Date d'exécution : ___________
- Durée : ___________
- Erreurs rencontrées : ___________
- Notes : ___________

---

## ⚠️ Dépannage

### Erreur : "Table does not exist"

**Solution** :
```sql
-- Vérifier que la table existe
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'nom_table';
```

Si la table n'existe pas, elle n'a peut-être pas encore été créée. Vérifier dans Supabase Dashboard → Table Editor.

---

### Erreur : "RLS must be enabled"

**Solution** :
```sql
ALTER TABLE nom_table ENABLE ROW LEVEL SECURITY;
```

Puis réexécuter la migration.

---

### Erreur : "Table already has policies"

**Solution** :

1. Vérifier les politiques existantes :
```sql
SELECT * FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'nom_table';
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

## ✅ Checklist Complète

- [ ] Supabase Dashboard ouvert
- [ ] Requêtes de vérification exécutées
- [ ] RLS activé sur toutes les tables Pattern 4
- [ ] Aucune politique existante (ou intention de les remplacer)
- [ ] Fichier combiné Pattern 4 ouvert
- [ ] Contenu copié dans SQL Editor
- [ ] Migration exécutée avec succès
- [ ] 16 politiques créées vérifiées
- [ ] Tests admin réussis
- [ ] Tests utilisateur normal réussis
- [ ] Suivi mis à jour

---

## 🎯 Prochaine Étape

Une fois Pattern 4 complété avec succès :

**Passer à Pattern 1** (user_id) :
- Guide : `docs/audits/GUIDE_EXECUTION_ETAPE_PAR_ETAPE.md` (Section Étape 2)
- Fichier : `supabase/migrations/rls_execution/20260113_rls_pattern_1_user_id_combined.sql`

---

**Temps estimé** : 15-20 minutes  
**Statut** : ⏳ Prêt à démarrer
