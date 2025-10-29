# 🗄️ GUIDE D'EXÉCUTION - MIGRATION PHYSICAL ADVANCED FEATURES

## 📋 Vue d'ensemble

**Migration:** `20251029_physical_advanced_features.sql`  
**Date:** 29 Octobre 2025  
**Objectif:** Ajouter les tables pour Pre-orders, Backorders, Alerts, Size Charts, Bundles

---

## 📊 TABLES CRÉÉES (11)

### 1. Pre-orders System
- ✅ `pre_orders` - Table principale des pré-commandes
- ✅ `pre_order_customers` - Clients en pré-commande

### 2. Backorders System
- ✅ `backorders` - Table principale des backorders
- ✅ `backorder_customers` - Clients en backorder

### 3. Stock Alerts System
- ✅ `stock_alerts` - Alertes de stock

### 4. Size Charts System
- ✅ `size_charts` - Guides des tailles
- ✅ `size_chart_measurements` - Mesures par taille
- ✅ `product_size_charts` - Mapping produits ↔ guides

### 5. Product Bundles System
- ✅ `product_bundles` - Packs produits
- ✅ `bundle_items` - Produits dans les packs

### 6. Variant Images System
- ✅ `variant_images` - Images par variante

---

## 🚀 EXÉCUTION DE LA MIGRATION

### Méthode 1 : Supabase Dashboard (Recommandée)

1. **Aller sur Supabase Dashboard**
   ```
   https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new
   ```

2. **Copier-Coller**
   - Ouvrir le fichier `supabase/migrations/20251029_physical_advanced_features.sql`
   - Copier **TOUT** le contenu
   - Coller dans l'éditeur SQL de Supabase

3. **Exécuter**
   - Cliquer sur "Run"
   - Attendre la confirmation "Success"

4. **Vérifier**
   ```sql
   -- Vérifier que les tables existent
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN (
     'pre_orders',
     'backorders',
     'stock_alerts',
     'size_charts',
     'product_bundles',
     'variant_images'
   );
   ```

### Méthode 2 : CLI Supabase

```bash
# 1. Pull remote schema
supabase db pull

# 2. Apply migration
supabase db push

# 3. Verify
supabase db remote list
```

---

## ✅ VÉRIFICATIONS POST-MIGRATION

### 1. Tables créées
```sql
SELECT COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'pre_order%' 
   OR table_name LIKE 'backorder%'
   OR table_name LIKE 'size_chart%'
   OR table_name LIKE 'product_bundle%'
   OR table_name = 'stock_alerts'
   OR table_name = 'variant_images';
-- Expected: 11 tables
```

### 2. RLS activé
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN (
  'pre_orders',
  'backorders',
  'stock_alerts',
  'size_charts',
  'product_bundles',
  'variant_images'
);
-- Expected: rowsecurity = true for all
```

### 3. Policies créées
```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN (
  'pre_orders',
  'backorders',
  'stock_alerts',
  'size_charts',
  'product_bundles',
  'variant_images'
);
-- Expected: Multiple policies per table
```

### 4. Triggers créés
```sql
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
AND trigger_name LIKE '%updated_at%';
-- Expected: update triggers for main tables
```

---

## 🧪 TESTS DE VALIDATION

### Test 1: Créer une pré-commande
```sql
INSERT INTO public.pre_orders (
  store_id,
  product_id,
  status,
  expected_availability_date,
  pre_order_limit
) VALUES (
  'YOUR_STORE_ID',
  'YOUR_PRODUCT_ID',
  'active',
  NOW() + INTERVAL '30 days',
  100
) RETURNING *;
```

### Test 2: Créer une alerte de stock
```sql
INSERT INTO public.stock_alerts (
  store_id,
  product_id,
  alert_type,
  severity,
  current_quantity,
  threshold_quantity,
  message
) VALUES (
  'YOUR_STORE_ID',
  'YOUR_PRODUCT_ID',
  'low_stock',
  'warning',
  5,
  10,
  'Stock faible détecté'
) RETURNING *;
```

### Test 3: Créer un guide des tailles
```sql
INSERT INTO public.size_charts (
  store_id,
  name,
  system,
  sizes
) VALUES (
  'YOUR_STORE_ID',
  'Guide T-Shirt Standard',
  'eu',
  '["XS", "S", "M", "L", "XL"]'::JSONB
) RETURNING *;
```

### Test 4: Créer un pack produit
```sql
INSERT INTO public.product_bundles (
  store_id,
  name,
  type,
  original_price,
  bundle_price,
  discount_percentage
) VALUES (
  'YOUR_STORE_ID',
  'Pack Sportif Complet',
  'fixed',
  100000,
  85000,
  15
) RETURNING *;
```

---

## 🔧 ROLLBACK (Si nécessaire)

### Méthode complète
```sql
-- ATTENTION: Supprime toutes les tables créées
DROP TABLE IF EXISTS public.variant_images CASCADE;
DROP TABLE IF EXISTS public.bundle_items CASCADE;
DROP TABLE IF EXISTS public.product_bundles CASCADE;
DROP TABLE IF EXISTS public.product_size_charts CASCADE;
DROP TABLE IF EXISTS public.size_chart_measurements CASCADE;
DROP TABLE IF EXISTS public.size_charts CASCADE;
DROP TABLE IF EXISTS public.stock_alerts CASCADE;
DROP TABLE IF EXISTS public.backorder_customers CASCADE;
DROP TABLE IF EXISTS public.backorders CASCADE;
DROP TABLE IF EXISTS public.pre_order_customers CASCADE;
DROP TABLE IF EXISTS public.pre_orders CASCADE;
```

---

## 📈 PERFORMANCES

### Indexes créés automatiquement
- ✅ Pre-orders: store_id, product_id, status
- ✅ Backorders: store_id, product_id, status, priority
- ✅ Stock alerts: store_id, product_id, type, severity, resolved
- ✅ Size charts: store_id, is_default
- ✅ Bundles: store_id, is_active
- ✅ Variant images: variant_id, is_primary, display_order

---

## 🔒 SÉCURITÉ

### RLS Policies appliquées
- ✅ Users can only access their own store data
- ✅ Public read for variant images
- ✅ Full CRUD for store owners
- ✅ Cascade deletes configured

---

## ⚠️ NOTES IMPORTANTES

1. **Dépendances requises:**
   - Table `stores` doit exister
   - Table `products` doit exister
   - Table `customers` doit exister
   - Table `orders` doit exister
   - Table `product_variants` doit exister

2. **Ordre d'exécution:**
   - Exécuter APRÈS `20251028_physical_products_professional.sql`

3. **Compatibilité:**
   - PostgreSQL 14+
   - Supabase Platform compatible

---

## ✅ CHECKLIST DE VALIDATION

- [ ] Migration exécutée sans erreur
- [ ] 11 tables créées
- [ ] RLS activé sur toutes les tables
- [ ] Policies créées (minimum 2 par table)
- [ ] Triggers `updated_at` créés
- [ ] Tests d'insertion réussis
- [ ] Application React peut se connecter
- [ ] Hooks TypeScript fonctionnent

---

## 📞 SUPPORT

En cas de problème:
1. Vérifier les logs Supabase Dashboard > Database > Logs
2. Vérifier les conflits de noms de tables
3. Vérifier que toutes les tables dépendantes existent
4. Consulter la documentation Supabase RLS

---

**Date de création:** 29 Octobre 2025  
**Version:** 1.0  
**Auteur:** Payhuk Dev Team

