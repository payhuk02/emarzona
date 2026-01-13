# 🚀 Guide de Génération Automatique des Migrations RLS

**Date** : 30 Janvier 2025  
**Script** : `scripts/generate-rls-migrations.js`

---

## 🎯 Utilisation Simple

### Générer une Migration pour une Table

```bash
# Générer migration pour table "notifications" avec Pattern 1 (user_id)
npm run generate:rls-migration -- --table=notifications --pattern=1

# Générer migration pour table "platform_settings" avec Pattern 4 (admin seulement)
npm run generate:rls-migration -- --table=platform_settings --pattern=4

# Générer migration pour table "products" avec Pattern 2 (store_id)
npm run generate:rls-migration -- --table=products --pattern=2
```

---

## 📋 Patterns Disponibles

### Pattern 1 : Table avec `user_id` (Données utilisateur)

**Exemples** : `notifications`, `user_preferences`, `saved_addresses`

```bash
npm run generate:rls-migration -- --table=notifications --pattern=1
```

**Politiques créées** :
- SELECT : Utilisateur voit ses propres données + admins voient tout
- INSERT : Utilisateur peut créer ses propres données
- UPDATE : Utilisateur peut modifier ses propres données + admins
- DELETE : Utilisateur peut supprimer ses propres données + admins

---

### Pattern 2 : Table avec `store_id` (Données boutique)

**Exemples** : `products`, `orders`, `customers`, `inventory`

```bash
npm run generate:rls-migration -- --table=products --pattern=2
```

**Politiques créées** :
- SELECT : Propriétaire de la boutique voit ses données + admins
- INSERT : Propriétaire de la boutique peut créer
- UPDATE : Propriétaire de la boutique peut modifier + admins
- DELETE : Seulement admins

---

### Pattern 3 : Table Publique (Marketplace)

**Exemples** : `reviews`, `community_posts`

```bash
npm run generate:rls-migration -- --table=reviews --pattern=3
```

**Politiques créées** :
- SELECT : Tous les utilisateurs authentifiés peuvent lire
- INSERT : Utilisateurs authentifiés peuvent créer
- UPDATE : Seulement propriétaire ou admin
- DELETE : Seulement propriétaire ou admin

---

### Pattern 4 : Table Admin Seulement

**Exemples** : `platform_settings`, `admin_config`, `system_logs`

```bash
npm run generate:rls-migration -- --table=platform_settings --pattern=4
```

**Politiques créées** :
- SELECT : Seulement admins
- INSERT : Seulement admins
- UPDATE : Seulement admins
- DELETE : Seulement admins

---

## 🔧 Options Avancées

### Adapter les Noms de Colonnes

Si votre table utilise des noms de colonnes différents :

```bash
# Table avec colonne "owner_id" au lieu de "user_id"
npm run generate:rls-migration -- --table=my_table --pattern=1 --user-id-column=owner_id

# Table avec colonne "shop_id" au lieu de "store_id"
npm run generate:rls-migration -- --table=my_table --pattern=2 --store-id-column=shop_id
```

---

## 📝 Exemple Complet

### Générer Migration pour `notifications`

```bash
npm run generate:rls-migration -- --table=notifications --pattern=1
```

**Résultat** : Fichier créé `supabase/migrations/20250130HHMMSS_rls_notifications.sql`

**Contenu généré** :
- ✅ Vérifications préliminaires (table existe, RLS activé, pas de doublons)
- ✅ 4 politiques RLS (SELECT, INSERT, UPDATE, DELETE)
- ✅ Vérification finale (compte des politiques créées)
- ✅ Commentaires de documentation

---

## ✅ Après Génération

### 1. Vérifier le Fichier Généré

Ouvrir le fichier dans `supabase/migrations/` et vérifier :
- ✅ Nom de table correct
- ✅ Pattern approprié
- ✅ Colonnes adaptées si nécessaire

### 2. Exécuter la Migration

**Option 1 : Via Supabase Dashboard**
1. Ouvrir Supabase Dashboard → SQL Editor
2. Copier le contenu du fichier généré
3. Coller dans SQL Editor
4. Cliquer sur **Run**

**Option 2 : Via Supabase CLI**
```bash
supabase db execute --file supabase/migrations/20250130HHMMSS_rls_notifications.sql
```

### 3. Tester les Politiques

```sql
-- Vérifier que les politiques sont créées
SELECT * FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'notifications';

-- Tester avec différents rôles
-- (utiliser Supabase Dashboard → Authentication → Users)
```

---

## 🎯 Workflow Recommandé

### Étape 1 : Exécuter l'Audit RLS

```sql
-- Dans Supabase Dashboard → SQL Editor
-- Exécuter : supabase/FINAL_RLS_AUDIT.sql
```

### Étape 2 : Identifier les Tables

Copier la liste des tables sans politiques depuis les résultats de l'audit.

### Étape 3 : Générer les Migrations

Pour chaque table, générer la migration appropriée :

```bash
# Tables avec user_id (Pattern 1)
npm run generate:rls-migration -- --table=notifications --pattern=1
npm run generate:rls-migration -- --table=user_preferences --pattern=1

# Tables avec store_id (Pattern 2)
npm run generate:rls-migration -- --table=products --pattern=2
npm run generate:rls-migration -- --table=orders --pattern=2

# Tables admin seulement (Pattern 4)
npm run generate:rls-migration -- --table=platform_settings --pattern=4
npm run generate:rls-migration -- --table=admin_config --pattern=4
```

### Étape 4 : Exécuter et Tester

Exécuter chaque migration et tester avec différents rôles.

---

## 📊 Exemple : Générer Migrations pour 10 Tables

```bash
# Pattern 1 (user_id)
npm run generate:rls-migration -- --table=notifications --pattern=1
npm run generate:rls-migration -- --table=user_preferences --pattern=1
npm run generate:rls-migration -- --table=saved_addresses --pattern=1

# Pattern 2 (store_id)
npm run generate:rls-migration -- --table=products --pattern=2
npm run generate:rls-migration -- --table=orders --pattern=2
npm run generate:rls-migration -- --table=customers --pattern=2

# Pattern 4 (admin only)
npm run generate:rls-migration -- --table=platform_settings --pattern=4
npm run generate:rls-migration -- --table=admin_config --pattern=4
npm run generate:rls-migration -- --table=system_logs --pattern=4
```

---

## ⚠️ Points d'Attention

1. **Vérifier le Pattern** : Choisir le bon pattern selon la structure de la table
2. **Noms de Colonnes** : Adapter si la table utilise des noms différents
3. **RLS Activé** : La migration vérifie que RLS est activé, mais vous pouvez l'activer avant :
   ```sql
   ALTER TABLE nom_table ENABLE ROW LEVEL SECURITY;
   ```
4. **Politiques Existantes** : La migration s'arrête si des politiques existent déjà

---

## 🔗 Ressources

- **Script** : `scripts/generate-rls-migrations.js`
- **Template** : `supabase/migrations/20250130_rls_critical_tables_template.sql`
- **Guide** : `docs/audits/GUIDE_MIGRATIONS_RLS.md`
- **Exemples** : `docs/audits/EXEMPLE_MIGRATION_RLS.md`

---

**Avantage** : Le script génère automatiquement des migrations prêtes à utiliser, sans avoir à modifier manuellement le template !
