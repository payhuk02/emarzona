# 🧪 GUIDE DE TEST - DIGITAL PRODUCTS FEATURES

## 🎯 OBJECTIF

Tester toutes les nouvelles fonctionnalités du système Digital Products pour s'assurer qu'elles fonctionnent parfaitement.

---

## 📋 TESTS DISPONIBLES

### 1. Tests Base de Données (SQL) ✅

**Fichier:** `supabase/DIGITAL_FEATURES_TESTS.sql`

**Ce qui est testé:**
- ✅ Création de bundles
- ✅ Vues analytics (4 vues)
- ✅ Fonctions utilitaires (8 fonctions)
- ✅ Triggers automatiques
- ✅ RLS Policies
- ✅ Indexes de performance

**Durée:** ~30 secondes

---

## 🚀 EXÉCUTION DES TESTS

### Test 1: Tests Base de Données

#### Option A: Tous les tests en une fois (Recommandé)

1. Ouvrir **Supabase Dashboard** > **SQL Editor**
2. Créer une nouvelle query
3. Copier **TOUT** le contenu de `supabase/DIGITAL_FEATURES_TESTS.sql`
4. Coller dans l'éditeur
5. Cliquer sur **"Run"**
6. ✅ Observer les résultats dans l'onglet **"Results"**

**Résultat attendu:**
```
✅ Store trouvé: [UUID]
✅ Produits trouvés: [UUID], [UUID], [UUID]
✅ Bundle créé: [UUID]
✅ 3 produits ajoutés au bundle
🎉 Bundle test créé avec succès!

✅ Trigger fonctionne correctement!
🧹 Bundle de test supprimé

🎉 TESTS COMPLÉTÉS AVEC SUCCÈS !
```

#### Option B: Tests individuels

Si vous préférez tester une fonctionnalité à la fois, copiez uniquement la section désirée :

**Test 1: Créer un bundle**
```sql
-- Lignes 1-80 du fichier DIGITAL_FEATURES_TESTS.sql
```

**Test 2: Vérifier les vues**
```sql
-- Lignes 82-125
```

**Test 3: Tester les fonctions**
```sql
-- Lignes 127-220
```

---

## 📊 INTERPRÉTATION DES RÉSULTATS

### Résultats attendus par test

#### Test 1: Création de Bundle ✅
```
NOTICE: ✅ Store trouvé: xxx
NOTICE: ✅ Produits trouvés: xxx, xxx, xxx
NOTICE: ✅ Bundle créé: xxx
NOTICE: 🎉 Bundle test créé avec succès!
```

#### Test 2: Vues Analytics ✅
```
| test                              | bundles_count | total_products |
|-----------------------------------|---------------|----------------|
| 📊 Vue: digital_bundles_with_stats| 1+            | 3+             |
```

#### Test 3: Fonctions Utilitaires ✅
```
| test                          | license_key_1     | license_key_2     |
|-------------------------------|-------------------|-------------------|
| 🔑 Test: generate_license_key | XXXX-XXXX-XXXX-XX | YYYY-YYYY-YYYY-YY |

NOTICE: 🏷️  Slug 1: mon-super-bundle-2025
NOTICE: 🏷️  Slug 2 (duplicate): mon-super-bundle-2025-1
```

#### Test 4: Statistiques Système ✅
```
| section              | total_bundles | total_digital_products |
|----------------------|---------------|------------------------|
| 📊 STATISTIQUES      | 1+            | X                      |
```

#### Test 5: Triggers Automatiques ✅
```
NOTICE: ⚡ TEST TRIGGER: update_bundle_pricing()
NOTICE: Prix bundle: 79.99 EUR
NOTICE: ✅ Trigger fonctionne correctement!
```

#### Test 6: RLS Policies ✅
```
| tablename            | policies_count |
|----------------------|----------------|
| digital_bundles      | 2              |
| digital_bundle_items | 2              |
```

#### Test 7: Indexes Performance ✅
```
| tablename            | indexes_count |
|----------------------|---------------|
| digital_bundles      | 9+            |
| digital_bundle_items | 3+            |
```

---

## 🔍 VÉRIFICATIONS MANUELLES

Après les tests automatiques, vérifier manuellement :

### 1. Vérifier les bundles créés

```sql
SELECT * FROM digital_bundles ORDER BY created_at DESC LIMIT 5;
```

**Attendu:** Au moins 1 bundle avec status 'active'

### 2. Vérifier les items des bundles

```sql
SELECT 
  b.name as bundle_name,
  COUNT(bi.id) as products_count,
  SUM(bi.product_price) as total_price
FROM digital_bundles b
LEFT JOIN digital_bundle_items bi ON b.id = bi.bundle_id
GROUP BY b.id, b.name;
```

**Attendu:** Chaque bundle a 3 produits

### 3. Vérifier le calcul des prix

```sql
SELECT 
  name,
  original_price,
  bundle_price,
  savings,
  savings_percentage,
  discount_type,
  discount_value
FROM digital_bundles
WHERE status = 'active';
```

**Attendu:** 
- `original_price` = somme des prix des produits
- `bundle_price` = `original_price` - réduction
- `savings` = `original_price` - `bundle_price`
- `savings_percentage` = calcul correct

### 4. Tester une vue analytics

```sql
SELECT * FROM digital_bundles_with_stats LIMIT 1;
```

**Attendu:** Toutes les colonnes remplies, `products_count` > 0

---

## 🐛 TROUBLESHOOTING

### Erreur: "Aucun store trouvé"

**Cause:** Vous n'avez pas encore créé de store  
**Solution:** Créer un store d'abord
```sql
INSERT INTO public.stores (name, slug, user_id)
VALUES ('Mon Store Test', 'mon-store-test', auth.uid())
RETURNING *;
```

### Erreur: "Pas assez de produits"

**Cause:** Moins de 3 produits dans le store  
**Solution:** Créer des produits de test
```sql
-- Créer 3 produits rapides
INSERT INTO public.products (store_id, name, slug, price, is_active)
VALUES 
  ((SELECT id FROM stores LIMIT 1), 'Produit Test 1', 'produit-test-1', 49.99, true),
  ((SELECT id FROM stores LIMIT 1), 'Produit Test 2', 'produit-test-2', 39.99, true),
  ((SELECT id FROM stores LIMIT 1), 'Produit Test 3', 'produit-test-3', 29.99, true);
```

### Erreur: "Aucun produit digital trouvé"

**Cause:** Certains tests nécessitent des produits digitaux  
**Solution:** Créer un produit digital
```sql
-- D'abord créer un produit
INSERT INTO public.products (store_id, name, slug, price, product_type)
VALUES ((SELECT id FROM stores LIMIT 1), 'eBook Test', 'ebook-test', 19.99, 'digital')
RETURNING id;

-- Puis créer l'entrée digital_products
INSERT INTO public.digital_products (product_id, digital_type, main_file_url)
VALUES ('[ID du produit créé]', 'ebook', 'https://example.com/ebook.pdf');
```

### Les résultats sont vides

**Cause:** Première exécution sans données  
**Solution:** Normal ! Les tests créent des données de test automatiquement. Relancez les tests.

---

## ✅ CHECKLIST DE VALIDATION

Après avoir exécuté tous les tests, cocher :

- [ ] ✅ Tests SQL exécutés sans erreur
- [ ] ✅ Bundle de test créé avec succès
- [ ] ✅ Vues analytics retournent des données
- [ ] ✅ Fonctions utilitaires fonctionnent
- [ ] ✅ Triggers se déclenchent correctement
- [ ] ✅ RLS Policies actives (4 policies)
- [ ] ✅ Indexes présents (12+ indexes)
- [ ] ✅ Calculs de prix corrects
- [ ] ✅ Slugs uniques générés automatiquement

---

## 📈 PROCHAINES ÉTAPES

Une fois tous les tests passés :

### 1. Tests d'intégration React
- Tester `DigitalBundleManager` component
- Tester `DigitalProductsDashboard` component
- Vérifier les hooks (`useDigitalProducts`, etc.)

### 2. Tests utilisateur (E2E)
- Créer un bundle via l'interface
- Acheter un bundle
- Télécharger un produit digital
- Vérifier une license

### 3. Tests de performance
- Temps de chargement des vues
- Performance des requêtes avec beaucoup de données
- Optimisation si nécessaire

---

## 💡 CONSEILS

1. **Exécutez d'abord les tests SQL** - Ils créent des données de test
2. **Vérifiez les NOTICE messages** - Ils contiennent des infos importantes
3. **Gardez un bundle de test** - Utile pour les tests React
4. **Notez les IDs** - Utiles pour les tests manuels
5. **Testez en conditions réelles** - Créez de vrais bundles ensuite

---

## 📞 SUPPORT

En cas de problème :

1. Vérifier les logs Supabase : Dashboard > Logs > Database
2. Relire la section Troubleshooting ci-dessus
3. Vérifier que les migrations ont bien été exécutées
4. Consulter `DIGITAL_MIGRATION_GUIDE.md`

---

**Date:** 29 Octobre 2025  
**Version:** 1.0  
**Status:** Ready for testing ✅

---

**🎯 Objectif:** S'assurer que le système Digital Products fonctionne à 100% avant de passer en production

