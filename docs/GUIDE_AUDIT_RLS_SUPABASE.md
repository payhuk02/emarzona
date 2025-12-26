# 🔒 Guide d'Audit RLS (Row Level Security) - Supabase

> **Objectif**: Vérifier que toutes les tables ont des politiques RLS appropriées pour garantir la sécurité des données

---

## 📊 État Actuel

- **Tables à auditer**: Toutes les tables de la base de données
- **Objectif**: 100% des tables avec politiques RLS
- **Priorité**: 🔴 Haute (Sécurité)

---

## 🎯 Objectifs

1. ✅ Identifier les tables sans politiques RLS
2. ✅ Vérifier les politiques existantes
3. ✅ Créer les politiques manquantes
4. ✅ Documenter les politiques RLS
5. ✅ Tester les politiques en développement

---

## 📋 Étapes d'Audit

### Étape 1: Lister Toutes les Tables

Exécuter dans Supabase SQL Editor:

```sql
-- Lister toutes les tables
SELECT
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

### Étape 2: Vérifier les Politiques RLS

```sql
-- Vérifier si RLS est activé sur chaque table
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Lister toutes les politiques RLS existantes
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Étape 3: Identifier les Tables Sans RLS

```sql
-- Tables sans RLS activé
SELECT
  t.tablename,
  t.rowsecurity as rls_enabled,
  COUNT(p.policyname) as policy_count
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND p.schemaname = 'public'
WHERE t.schemaname = 'public'
GROUP BY t.tablename, t.rowsecurity
HAVING t.rowsecurity = false OR COUNT(p.policyname) = 0
ORDER BY t.tablename;
```

### Étape 4: Créer les Politiques Manquantes

#### Exemple: Table `products`

```sql
-- Activer RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Politique: Les utilisateurs peuvent voir tous les produits actifs
CREATE POLICY "Products are viewable by everyone"
  ON products
  FOR SELECT
  USING (is_active = true);

-- Politique: Les vendeurs peuvent modifier leurs propres produits
CREATE POLICY "Vendors can update their own products"
  ON products
  FOR UPDATE
  USING (auth.uid() = store_id IN (
    SELECT id FROM stores WHERE owner_id = auth.uid()
  ));

-- Politique: Les vendeurs peuvent créer des produits
CREATE POLICY "Vendors can create products"
  ON products
  FOR INSERT
  WITH CHECK (auth.uid() IN (
    SELECT owner_id FROM stores WHERE id = store_id
  ));
```

#### Exemple: Table `orders`

```sql
-- Activer RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Politique: Les clients peuvent voir leurs propres commandes
CREATE POLICY "Users can view their own orders"
  ON orders
  FOR SELECT
  USING (auth.uid() = user_id);

-- Politique: Les vendeurs peuvent voir les commandes de leurs produits
CREATE POLICY "Vendors can view orders for their products"
  ON orders
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN stores s ON p.store_id = s.id
      WHERE oi.order_id = orders.id
      AND s.owner_id = auth.uid()
    )
  );
```

---

## 🔧 Script d'Audit Automatisé

Créer `supabase/scripts/audit-rls.sql`:

```sql
-- Script d'audit RLS complet
DO $$
DECLARE
  table_record RECORD;
  policy_count INTEGER;
BEGIN
  RAISE NOTICE '=== AUDIT RLS ===';
  RAISE NOTICE '';

  FOR table_record IN
    SELECT tablename, rowsecurity
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  LOOP
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = table_record.tablename;

    IF table_record.rowsecurity = false THEN
      RAISE NOTICE '⚠️  Table: % - RLS DÉSACTIVÉ', table_record.tablename;
    ELSIF policy_count = 0 THEN
      RAISE NOTICE '⚠️  Table: % - RLS activé mais AUCUNE politique', table_record.tablename;
    ELSE
      RAISE NOTICE '✅ Table: % - RLS activé avec % politique(s)', table_record.tablename, policy_count;
    END IF;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '=== FIN AUDIT ===';
END $$;
```

---

## 📝 Checklist d'Audit

### Tables Critiques (Priorité Haute)

- [ ] `users` / `profiles`
- [ ] `stores`
- [ ] `products`
- [ ] `orders`
- [ ] `order_items`
- [ ] `payments`
- [ ] `customers`
- [ ] `digital_products`
- [ ] `digital_licenses`
- [ ] `physical_products`
- [ ] `inventory`

### Tables Secondaires (Priorité Moyenne)

- [ ] `reviews`
- [ ] `notifications`
- [ ] `affiliates`
- [ ] `promotions`
- [ ] `coupons`
- [ ] `shipping_addresses`
- [ ] `wishlists`

### Tables Système (Priorité Basse)

- [ ] `migrations`
- [ ] `logs`
- [ ] `settings`

---

## 🛡️ Bonnes Pratiques RLS

### 1. Toujours Activer RLS

```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

### 2. Politiques Spécifiques

- ✅ Utiliser `USING` pour SELECT/UPDATE/DELETE
- ✅ Utiliser `WITH CHECK` pour INSERT/UPDATE
- ✅ Éviter les politiques trop permissives

### 3. Tests des Politiques

```sql
-- Tester en tant qu'utilisateur anonyme
SET ROLE anon;
SELECT * FROM products; -- Devrait retourner seulement les produits actifs

-- Tester en tant qu'utilisateur authentifié
SET ROLE authenticated;
SELECT * FROM orders; -- Devrait retourner seulement les commandes de l'utilisateur

-- Réinitialiser
RESET ROLE;
```

### 4. Documentation

Documenter chaque politique dans un fichier `supabase/rls-policies.md`:

```markdown
## Table: products

### Politique: "Products are viewable by everyone"

- **Type**: SELECT
- **Condition**: `is_active = true`
- **Description**: Tous les utilisateurs peuvent voir les produits actifs

### Politique: "Vendors can update their own products"

- **Type**: UPDATE
- **Condition**: Vendeur propriétaire de la boutique
- **Description**: Seuls les vendeurs peuvent modifier leurs produits
```

---

## 🚨 Problèmes Courants

### 1. RLS Activé Sans Politiques

**Problème**: Table avec RLS activé mais aucune politique = Aucun accès

**Solution**: Créer au moins une politique SELECT

### 2. Politiques Trop Permissives

**Problème**: `USING (true)` permet tout

**Solution**: Remplacer par des conditions spécifiques

### 3. Politiques Manquantes pour INSERT/UPDATE

**Problème**: SELECT fonctionne mais INSERT/UPDATE échoue

**Solution**: Créer des politiques pour toutes les opérations nécessaires

---

## ✅ Résultat Attendu

Après l'audit complet:

- ✅ **100% des tables** avec RLS activé
- ✅ **Politiques appropriées** pour chaque table
- ✅ **Documentation complète** des politiques
- ✅ **Tests validés** en développement

---

## 🔗 Ressources

- [Documentation RLS Supabase](https://supabase.com/docs/guides/auth/row-level-security)
- [Best Practices RLS](https://supabase.com/docs/guides/auth/row-level-security#best-practices)
- [Exemples de Politiques](https://supabase.com/docs/guides/auth/row-level-security#examples)

---

_Dernière mise à jour: 2025-01-30_
