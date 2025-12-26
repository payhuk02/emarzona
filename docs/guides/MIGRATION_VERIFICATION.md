# Vérification de la Migration des Promotions

**Date:** 28 Janvier 2025

---

## ✅ Script Exécuté avec Succès

Si vous voyez "Success. No rows returned", cela signifie que le script s'est exécuté correctement.

---

## 🔍 Vérifications à Effectuer

### 1. Vérifier les Colonnes Ajoutées

Exécutez cette requête pour vérifier que les colonnes existent :

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'product_promotions'
  AND column_name IN (
    'original_promotion_id',
    'original_digital_coupon_id',
    'migration_source',
    'max_discount_amount'
  )
ORDER BY column_name;
```

Vous devriez voir les 4 colonnes listées.

---

### 2. Vérifier les Fonctions de Migration

```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_name IN (
  'migrate_promotions_to_product_promotions',
  'migrate_digital_coupons_to_product_promotions',
  'migrate_coupon_usages_to_promotion_usage'
)
AND routine_schema = 'public';
```

Vous devriez voir 3 fonctions.

---

### 3. Voir les Données Migrées

```sql
-- Compter les promotions migrées
SELECT
  migration_source,
  COUNT(*) as count,
  COUNT(CASE WHEN is_active THEN 1 END) as active_count
FROM public.product_promotions
WHERE migration_source IS NOT NULL
GROUP BY migration_source;
```

---

### 4. Voir un Exemple de Promotion Migrée

```sql
-- Voir quelques promotions migrées
SELECT
  id,
  name,
  code,
  migration_source,
  original_promotion_id,
  is_active,
  created_at
FROM public.product_promotions
WHERE migration_source IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;
```

---

## 📊 Statistiques Complètes

Utilisez le script de vérification complet :

**Fichier :** `supabase/migrations/20250128_verify_migration.sql`

1. Ouvrez ce fichier
2. Copiez tout le contenu
3. Exécutez dans Supabase SQL Editor

Ce script vous donnera :

- ✅ Vérification des colonnes
- ✅ Vérification des fonctions
- ✅ Statistiques des données
- ✅ Exemples de données migrées
- ✅ Résumé final

---

## ✅ Checklist de Vérification

- [ ] Les colonnes de migration existent dans `product_promotions`
- [ ] Les fonctions de migration existent
- [ ] Des données ont été migrées (si vous aviez des promotions)
- [ ] Les promotions migrées sont visibles dans l'interface

---

**Prochaine étape :** Tester l'interface unifiée de gestion des promotions !
