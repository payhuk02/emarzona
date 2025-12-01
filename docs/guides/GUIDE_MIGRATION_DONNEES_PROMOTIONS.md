# Guide : Migration des Données de Promotions

**Date:** 28 Janvier 2025  
**Version:** 1.0

---

## 📋 Vue d'Ensemble

Ce guide explique comment migrer les données depuis les anciens systèmes de promotions vers le système unifié `product_promotions`.

---

## ⚠️ Prérequis

Avant de commencer la migration :

1. ✅ **Vérifier que la migration principale a été exécutée**
   - La table `product_promotions` doit exister
   - Les colonnes de migration doivent être présentes
   - Les fonctions de migration doivent exister

2. ✅ **Faire une sauvegarde de la base de données**
   ```bash
   # Via Supabase CLI (recommandé)
   supabase db dump > backup_before_migration.sql
   ```

3. ✅ **Vérifier l'état actuel**
   - Compter les enregistrements dans chaque table
   - Identifier les données à migrer

---

## 🔄 Processus de Migration

### Étape 1 : Préparation

1. **Accéder au SQL Editor dans Supabase**
   - Allez dans votre projet Supabase
   - Cliquez sur "SQL Editor"

2. **Vérifier l'état actuel**

Exécutez cette requête pour voir combien d'enregistrements vous avez :

```sql
-- Voir l'état actuel
SELECT 
  (SELECT COUNT(*) FROM public.promotions) as promotions_count,
  (SELECT COUNT(*) FROM public.digital_product_coupons WHERE is_archived = FALSE) as digital_coupons_count,
  (SELECT COUNT(*) FROM public.product_promotions) as product_promotions_count;
```

---

### Étape 2 : Exécuter la Migration

#### Option A : Migration Automatique (Recommandée)

Utilisez le script complet qui gère tout automatiquement :

**Fichier :** `supabase/migrations/20250128_execute_data_migration.sql`

1. Ouvrez ce fichier
2. Copiez **TOUT** le contenu
3. Collez dans Supabase SQL Editor
4. Exécutez le script

Le script va :
- ✅ Vérifier l'état actuel
- ✅ Migrer depuis `promotions`
- ✅ Migrer depuis `digital_product_coupons`
- ✅ Migrer les données d'utilisation
- ✅ Afficher un rapport complet

#### Option B : Migration Manuelle Étape par Étape

Si vous préférez migrer étape par étape :

##### 1. Migration depuis `promotions`

```sql
SELECT * FROM migrate_promotions_to_product_promotions();
```

Cette fonction retourne :
- `migrated_count` : Nombre de promotions migrées avec succès
- `skipped_count` : Nombre de promotions ignorées (déjà migrées ou erreurs)
- `errors` : Tableau des erreurs rencontrées

##### 2. Migration depuis `digital_product_coupons`

```sql
SELECT * FROM migrate_digital_coupons_to_product_promotions();
```

##### 3. Migration des données d'utilisation

```sql
SELECT migrate_coupon_usages_to_promotion_usage();
```

---

## ✅ Vérification Post-Migration

### 1. Vérifier les Promotions Migrées

```sql
-- Voir toutes les promotions migrées depuis promotions
SELECT 
  id,
  name,
  code,
  migration_source,
  original_promotion_id,
  is_active,
  created_at
FROM public.product_promotions
WHERE migration_source = 'promotions'
ORDER BY created_at DESC;
```

```sql
-- Voir toutes les promotions migrées depuis digital_product_coupons
SELECT 
  id,
  name,
  code,
  migration_source,
  original_digital_coupon_id,
  is_active,
  created_at
FROM public.product_promotions
WHERE migration_source = 'digital_product_coupons'
ORDER BY created_at DESC;
```

### 2. Compter les Migrations

```sql
-- Statistiques globales
SELECT 
  migration_source,
  COUNT(*) as count,
  COUNT(CASE WHEN is_active THEN 1 END) as active_count
FROM public.product_promotions
WHERE migration_source IS NOT NULL
GROUP BY migration_source;
```

### 3. Vérifier les Utilisations Migrées

```sql
-- Compter les utilisations migrées
SELECT COUNT(*) as migrated_usages
FROM public.promotion_usage;
```

---

## 🐛 Résolution de Problèmes

### Problème : Aucune donnée migrée

**Vérifications :**
1. Les tables source existent-elles ?
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
     AND table_name IN ('promotions', 'digital_product_coupons');
   ```

2. Les fonctions de migration existent-elles ?
   ```sql
   SELECT routine_name 
   FROM information_schema.routines 
   WHERE routine_name IN (
     'migrate_promotions_to_product_promotions',
     'migrate_digital_coupons_to_product_promotions'
   );
   ```

3. Y a-t-il des données à migrer ?
   ```sql
   SELECT COUNT(*) FROM public.promotions;
   SELECT COUNT(*) FROM public.digital_product_coupons WHERE is_archived = FALSE;
   ```

---

### Problème : Erreurs lors de la Migration

Si vous voyez des erreurs dans les résultats :

1. **Vérifier les erreurs spécifiques**
   Les erreurs sont retournées dans le champ `errors` du résultat.

2. **Vérifier les contraintes**
   ```sql
   -- Voir les contraintes sur product_promotions
   SELECT 
     constraint_name,
     constraint_type
   FROM information_schema.table_constraints
   WHERE table_name = 'product_promotions';
   ```

3. **Vérifier les types de données**
   Assurez-vous que les types correspondent entre les tables source et destination.

---

### Problème : Données dupliquées

La migration évite automatiquement les doublons en vérifiant :
- Pour `promotions` : `original_promotion_id` doit être unique
- Pour `digital_product_coupons` : `original_digital_coupon_id` doit être unique

Si vous voyez des doublons, vérifiez :

```sql
-- Vérifier les doublons par original_promotion_id
SELECT original_promotion_id, COUNT(*) 
FROM public.product_promotions
WHERE original_promotion_id IS NOT NULL
GROUP BY original_promotion_id
HAVING COUNT(*) > 1;
```

---

## 📊 Statistiques Post-Migration

Pour avoir une vue complète après la migration :

```sql
-- Vue d'ensemble complète
SELECT 
  'Total product_promotions' as type,
  COUNT(*) as count
FROM public.product_promotions
UNION ALL
SELECT 
  'Migrées depuis promotions',
  COUNT(*)
FROM public.product_promotions
WHERE migration_source = 'promotions'
UNION ALL
SELECT 
  'Migrées depuis digital_product_coupons',
  COUNT(*)
FROM public.product_promotions
WHERE migration_source = 'digital_product_coupons'
UNION ALL
SELECT 
  'Créées directement',
  COUNT(*)
FROM public.product_promotions
WHERE migration_source IS NULL OR migration_source = 'product_promotions'
UNION ALL
SELECT 
  'Promotions actives',
  COUNT(*)
FROM public.product_promotions
WHERE is_active = TRUE;
```

---

## 🔍 Tests Post-Migration

### Test 1 : Vérifier une promotion migrée

```sql
-- Sélectionner une promotion migrée et vérifier ses données
SELECT * 
FROM public.product_promotions
WHERE migration_source IS NOT NULL
LIMIT 1;
```

### Test 2 : Comparer avec l'original

```sql
-- Pour une promotion migrée depuis promotions
SELECT 
  pp.id as new_id,
  pp.name as new_name,
  pp.code as new_code,
  p.id as original_id,
  p.code as original_code
FROM public.product_promotions pp
JOIN public.promotions p ON pp.original_promotion_id = p.id
LIMIT 5;
```

### Test 3 : Tester la validation

```sql
-- Tester avec un code migré
SELECT validate_unified_promotion(
  'VOTRE_CODE_MIGRE'::TEXT,
  NULL::UUID,
  NULL::UUID[],
  NULL::UUID[],
  NULL::UUID[],
  10000::NUMERIC,
  NULL::UUID,
  FALSE::BOOLEAN
);
```

---

## ⚙️ Options Avancées

### Migrer seulement les promotions actives

Si vous voulez migrer seulement les promotions actives :

```sql
-- Modifier temporairement la fonction ou créer une variante
-- (Nécessite de modifier les fonctions de migration)
```

### Migrer par lots

Pour les grandes quantités de données, vous pouvez migrer par lots en modifiant les fonctions de migration.

---

## 📝 Checklist Post-Migration

- [ ] Migration depuis `promotions` exécutée
- [ ] Migration depuis `digital_product_coupons` exécutée
- [ ] Migration des utilisations exécutée
- [ ] Vérifications effectuées
- [ ] Aucune erreur critique
- [ ] Données vérifiées manuellement
- [ ] Tests de validation effectués
- [ ] Interface utilisateur testée

---

## 🎯 Prochaines Étapes

Après la migration réussie :

1. **Tester l'interface unifiée**
   - Accéder à `/dashboard/promotions`
   - Vérifier que toutes les promotions apparaissent

2. **Tester la validation au checkout**
   - Tester avec un code migré
   - Vérifier que la réduction s'applique correctement

3. **Documenter les résultats**
   - Noter le nombre de promotions migrées
   - Documenter toute erreur rencontrée

4. **Planifier la dépréciation** (optionnel)
   - Après une période de transition, envisager de marquer les anciennes tables comme dépréciées

---

**Dernière mise à jour :** 28 Janvier 2025

