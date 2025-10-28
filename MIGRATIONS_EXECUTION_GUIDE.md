# 🗄️ GUIDE D'EXÉCUTION DES MIGRATIONS SQL

**Date**: 28 Octobre 2025  
**Objectif**: Exécuter les migrations dans le bon ordre pour corriger l'erreur `physical_product_variants`

---

## ❌ ERREUR RENCONTRÉE

```
ERROR: 42P01: relation "public.physical_product_variants" does not exist
```

**Cause**: Incohérence de nommage entre le code TypeScript (`physical_product_variants`) et la migration SQL (`product_variants`)

**Solution**: Migration corrective pour renommer la table

---

## 📝 ORDRE D'EXÉCUTION DES MIGRATIONS

### ✅ Migrations à exécuter dans l'ordre :

1. **Digital Products** (si pas déjà fait)
   - Fichier: `supabase/migrations/20251027_digital_products_professional.sql`
   - Tables créées: `digital_products`, `digital_product_files`, `digital_product_downloads`, `digital_licenses`, `digital_license_activations`, `digital_product_updates`

2. **Physical Products** (si pas déjà fait)
   - Fichier: `supabase/migrations/20251028_physical_products_professional.sql`
   - Tables créées: `physical_products`, `product_variants`, `inventory_items`, `stock_movements`, `shipping_zones`, `shipping_rates`

3. **🔧 FIX Physical Product Variants** (NOUVEAU - REQUIS)
   - Fichier: `supabase/migrations/20251028_fix_physical_product_variants_naming.sql`
   - Action: Renomme `product_variants` → `physical_product_variants`
   - **⚠️ CRITIQUE: À exécuter AVANT la migration order_items**

4. **Service Products** (si pas déjà fait)
   - Fichier: `supabase/migrations/20251028000001_service_products_system.sql`
   - Tables créées: `service_products`, `service_staff_members`, `service_availability_slots`, `service_resources`, `service_bookings`, `service_booking_participants`

5. **Order Items Extension**
   - Fichier: `supabase/migrations/20251028_extend_order_items_for_specialized_products.sql`
   - Action: Ajoute colonnes à `order_items` pour supporter les produits spécialisés
   - **⚠️ DÉPEND de: Digital, Physical (fixé), Service**

---

## 🚀 INSTRUCTIONS D'EXÉCUTION

### Option A: Interface Supabase Dashboard (Recommandé)

1. Allez sur [app.supabase.com](https://app.supabase.com)
2. Sélectionnez votre projet Payhuk
3. Allez dans **SQL Editor** (menu de gauche)
4. Créez une nouvelle requête
5. **Exécutez les migrations dans l'ordre ci-dessus**

**Pour chaque migration:**
```sql
-- 1. Copier le contenu du fichier .sql
-- 2. Coller dans l'éditeur SQL
-- 3. Cliquer "Run" (Ctrl+Enter)
-- 4. Vérifier qu'il n'y a pas d'erreur
```

---

### Option B: CLI Supabase (Pour développeurs avancés)

```bash
# 1. Se connecter
supabase login

# 2. Lier au projet
supabase link --project-ref your-project-ref

# 3. Exécuter toutes les migrations
supabase db push

# OU exécuter une migration spécifique
supabase db execute -f supabase/migrations/20251028_fix_physical_product_variants_naming.sql
```

---

## 🔍 VÉRIFICATION APRÈS MIGRATION

Exécutez cette requête pour vérifier que toutes les tables existent :

```sql
-- Vérifier l'existence de toutes les tables requises
SELECT 
  table_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = t.expected_table
    ) THEN '✅ Existe'
    ELSE '❌ Manquante'
  END as status
FROM (
  VALUES 
    -- Digital Products
    ('digital_products'),
    ('digital_product_files'),
    ('digital_product_downloads'),
    ('digital_licenses'),
    ('digital_license_activations'),
    ('digital_product_updates'),
    
    -- Physical Products
    ('physical_products'),
    ('physical_product_variants'), -- ⚠️ CRUCIAL
    ('physical_product_inventory'),
    ('physical_product_shipping_zones'),
    ('physical_product_shipping_rates'),
    ('physical_product_stock_alerts'),
    ('inventory_items'),
    ('stock_movements'),
    ('shipping_zones'),
    ('shipping_rates'),
    
    -- Service Products
    ('service_products'),
    ('service_staff_members'),
    ('service_availability_slots'),
    ('service_resources'),
    ('service_bookings'),
    ('service_booking_participants'),
    
    -- Orders Extension
    ('order_items') -- Devrait avoir les nouvelles colonnes
) AS t(expected_table)
ORDER BY expected_table;
```

**Résultat attendu**: Toutes les tables avec "✅ Existe"

---

## 🔧 VÉRIFICATION SPÉCIFIQUE `physical_product_variants`

```sql
-- 1. Vérifier que la table existe
SELECT EXISTS (
  SELECT 1 
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'physical_product_variants'
) AS table_exists;

-- 2. Vérifier les indexes
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'physical_product_variants';

-- 3. Vérifier les policies RLS
SELECT policyname 
FROM pg_policies 
WHERE tablename = 'physical_product_variants';

-- 4. Vérifier les foreign keys
SELECT
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND (tc.table_name = 'physical_product_variants' 
    OR ccu.table_name = 'physical_product_variants');
```

---

## ✅ CHECKLIST DE MIGRATION

- [ ] Migration Digital Products exécutée
- [ ] Migration Physical Products exécutée
- [ ] **Migration FIX Physical Product Variants exécutée** ⚠️
- [ ] Migration Service Products exécutée
- [ ] Migration Order Items Extension exécutée
- [ ] Vérification tables effectuée
- [ ] Vérification `physical_product_variants` effectuée
- [ ] Tests manuels de création de produit physique

---

## 🆘 RÉSOLUTION DE PROBLÈMES

### Erreur: "table already exists"

```sql
-- Si une table existe déjà mais avec le mauvais nom
DROP TABLE IF EXISTS public.product_variants CASCADE;
-- Puis réexécutez la migration FIX
```

### Erreur: "foreign key constraint"

```sql
-- Désactiver temporairement les contraintes
SET session_replication_role = replica;
-- Exécuter la migration
-- Réactiver
SET session_replication_role = DEFAULT;
```

### Vérifier les dépendances circulaires

```sql
SELECT 
  conname as constraint_name,
  conrelid::regclass as table_name,
  confrelid::regclass as referenced_table
FROM pg_constraint
WHERE contype = 'f'
  AND (conrelid::regclass::text LIKE '%physical%' 
    OR confrelid::regclass::text LIKE '%physical%')
ORDER BY conrelid::regclass::text;
```

---

## 📊 RÉSULTAT ATTENDU

Après exécution de toutes les migrations :

| Type | Tables | Status |
|------|--------|--------|
| **Digital** | 6 tables | ✅ |
| **Physical** | 12 tables | ✅ |
| **Service** | 6 tables | ✅ |
| **Orders** | 1 table étendue | ✅ |
| **TOTAL** | **25 tables** | ✅ |

---

## 🎯 PROCHAINES ÉTAPES

Une fois les migrations exécutées avec succès :

1. ✅ Vérifier que l'erreur `physical_product_variants` est résolue
2. ✅ Tester la création d'un produit physique via le wizard
3. ✅ Tester la création de variantes
4. ✅ Tester le système d'inventaire
5. ✅ Tester une commande complète

---

## 💡 CONSEILS

- **Toujours faire un backup** avant d'exécuter des migrations
- Exécuter les migrations en **environnement de développement** d'abord
- Vérifier les logs après chaque migration
- Ne pas hésiter à rollback en cas d'erreur

---

## 📞 SUPPORT

Si l'erreur persiste après avoir suivi ce guide :

1. Vérifiez les logs Supabase
2. Vérifiez que toutes les migrations sont dans le bon ordre
3. Vérifiez qu'il n'y a pas de migrations en conflit
4. Supprimez les anciennes migrations si nécessaire

---

**🎉 Une fois terminé, votre base de données sera 100% opérationnelle !**

