# 📋 Instructions d'Utilisation du Template RLS

**Date** : 30 Janvier 2025  
**Fichier** : `supabase/migrations/20250130_rls_critical_tables_template.sql`

---

## ⚠️ IMPORTANT : Ne PAS Exécuter le Template Tel Quel

Le template contient `YOUR_TABLE_NAME` comme placeholder. **Vous devez le remplacer** avant d'exécuter la migration.

---

## 📝 Étapes d'Utilisation

### Étape 1 : Copier le Template

```bash
# Copier le template vers un nouveau fichier de migration
cp supabase/migrations/20250130_rls_critical_tables_template.sql \
   supabase/migrations/20250130_rls_NOTIFICATIONS.sql
```

**Convention de nommage** :
- Format : `YYYYMMDD_rls_TABLE_NAME.sql`
- Exemple : `20250130_rls_notifications.sql`

---

### Étape 2 : Remplacer le Nom de la Table

**Ligne 17** : Remplacer `'YOUR_TABLE_NAME'` par le nom réel

```sql
-- ❌ AVANT (ne fonctionne pas)
v_table_name text := 'YOUR_TABLE_NAME';

-- ✅ APRÈS (exemple pour table notifications)
v_table_name text := 'notifications';
```

---

### Étape 3 : Choisir le Pattern

**Identifier le type de table** :

1. **Pattern 1** : Table avec `user_id` (données utilisateur)
   - Exemples : `notifications`, `user_preferences`, `saved_addresses`
   - ✅ Déjà actif dans le template

2. **Pattern 2** : Table avec `store_id` (données boutique)
   - Exemples : `products`, `orders`, `customers`, `inventory`
   - ⚠️ Décommenter Pattern 2 et commenter Pattern 1

3. **Pattern 3** : Table publique (marketplace)
   - Exemples : `reviews`, `community_posts`
   - ⚠️ Décommenter Pattern 3 et commenter Pattern 1

4. **Pattern 4** : Table admin seulement
   - Exemples : `platform_settings`, `admin_config`, `system_logs`
   - ⚠️ Décommenter Pattern 4 et commenter Pattern 1

---

### Étape 4 : Adapter les Colonnes (si nécessaire)

**Lignes 18-19** : Adapter si les colonnes ont des noms différents

```sql
-- Par défaut
v_user_id_column text := 'user_id';
v_store_id_column text := 'store_id';

-- Si votre table utilise d'autres noms
v_user_id_column text := 'owner_id';      -- Exemple
v_store_id_column text := 'shop_id';      -- Exemple
```

---

### Étape 5 : Exécuter la Migration

**Option 1 : Via Supabase Dashboard**
1. Ouvrir Supabase Dashboard → SQL Editor
2. Copier le contenu du fichier de migration
3. Coller dans SQL Editor
4. Cliquer sur **Run**

**Option 2 : Via Supabase CLI**
```bash
supabase db execute --file supabase/migrations/20250130_rls_notifications.sql
```

---

## ✅ Exemple Complet : Table `notifications`

### Fichier : `supabase/migrations/20250130_rls_notifications.sql`

```sql
-- ============================================================
-- Migration RLS : notifications
-- Date: 2025-01-30
-- ============================================================

DO $$
DECLARE
  v_table_name text := 'notifications';  -- ✅ Nom réel de la table
  v_user_id_column text := 'user_id';
  v_store_id_column text := 'store_id';
  policy_count INTEGER;
BEGIN
  -- Vérifications et création des politiques...
  -- (Pattern 1 déjà actif, pas besoin de modifier)
END $$;
```

---

## ❌ Erreurs Courantes

### Erreur 1 : "RLS must be enabled on YOUR_TABLE_NAME"

**Cause** : Vous n'avez pas remplacé `YOUR_TABLE_NAME`

**Solution** : Remplacer `'YOUR_TABLE_NAME'` par le nom réel de la table à la ligne 17

---

### Erreur 2 : "Table does not exist"

**Cause** : Nom de table incorrect ou table dans un autre schéma

**Solution** : Vérifier le nom exact de la table dans Supabase Dashboard → Table Editor

---

### Erreur 3 : "RLS must be enabled"

**Cause** : RLS n'est pas activé sur la table

**Solution** : Exécuter d'abord :
```sql
ALTER TABLE nom_de_la_table ENABLE ROW LEVEL SECURITY;
```

---

### Erreur 4 : "Table already has policies"

**Cause** : La table a déjà des politiques RLS

**Solution** : 
- Vérifier les politiques existantes dans Supabase Dashboard
- Soit modifier les politiques existantes
- Soit supprimer les anciennes politiques avant d'en créer de nouvelles

---

## 🔍 Vérifier Avant d'Exécuter

- [ ] Nom de table remplacé (`'YOUR_TABLE_NAME'` → nom réel)
- [ ] Pattern approprié choisi et décommenté
- [ ] Autres patterns commentés
- [ ] Noms de colonnes adaptés si nécessaire
- [ ] RLS activé sur la table
- [ ] Pas de politiques existantes (ou intention de les remplacer)

---

## 📚 Ressources

- **Template** : `supabase/migrations/20250130_rls_critical_tables_template.sql`
- **Guide** : `docs/audits/GUIDE_MIGRATIONS_RLS.md`
- **Exemples** : `docs/audits/EXEMPLE_MIGRATION_RLS.md`

---

**Rappel** : Le template est un **modèle**, pas un script à exécuter directement. Toujours créer un nouveau fichier de migration avec le nom de table réel.
