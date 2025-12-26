# 🔒 Audit RLS (Row Level Security) - Emarzona

## 📋 Vue d'ensemble

Ce document décrit l'audit des politiques RLS (Row Level Security) sur toutes les tables de la base de données Emarzona.

## 🔍 Comment effectuer l'audit

### 1. Exécuter la migration d'audit

```sql
-- La migration 20250130_audit_rls_policies.sql crée les fonctions d'audit
```

### 2. Consulter le rapport complet

```sql
SELECT * FROM rls_audit_report
ORDER BY
  CASE WHEN recommendation LIKE '⚠️%' THEN 0 ELSE 1 END,
  table_name;
```

### 3. Tables sans RLS

```sql
SELECT * FROM get_tables_without_rls();
```

### 4. Tables avec RLS mais sans politiques

```sql
SELECT * FROM get_tables_without_policies();
```

## 📊 Résultats attendus

### ✅ Tables avec RLS correctement configuré

Les tables suivantes devraient avoir RLS activé avec des politiques appropriées :

- `profiles` - Données utilisateurs
- `stores` - Boutiques
- `products` - Produits
- `orders` - Commandes
- `order_items` - Articles de commande
- `transactions` - Transactions
- `customers` - Clients
- `cart_items` - Panier
- `reviews` - Avis
- `notifications` - Notifications
- `payments` - Paiements
- `shipments` - Expéditions
- `returns` - Retours
- `affiliates` - Affiliation
- `commissions` - Commissions
- `withdrawals` - Retraits
- `digital_products` - Produits digitaux
- `physical_products` - Produits physiques
- `service_products` - Services
- `courses` - Cours
- `enrollments` - Inscriptions
- `lessons` - Leçons
- `community_posts` - Posts communauté
- `messages` - Messages
- `disputes` - Litiges

### ⚠️ Tables à vérifier

Certaines tables peuvent nécessiter des politiques RLS supplémentaires :

- Tables de configuration (peuvent être publiques en lecture)
- Tables de logs (peuvent nécessiter un accès restreint)
- Tables de cache (peuvent être publiques)

## 🎯 Recommandations

### 1. Politiques de base recommandées

Pour chaque table sensible, implémenter au minimum :

```sql
-- Exemple pour une table 'products'
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Lecture : Tous peuvent voir les produits publics
CREATE POLICY "Public products are viewable by everyone"
  ON products FOR SELECT
  USING (is_public = true OR store_id IN (
    SELECT id FROM stores WHERE is_public = true
  ));

-- Insertion : Seulement les propriétaires de boutique
CREATE POLICY "Store owners can insert products"
  ON products FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = products.store_id
      AND stores.owner_id = auth.uid()
    )
  );

-- Mise à jour : Seulement les propriétaires
CREATE POLICY "Store owners can update their products"
  ON products FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = products.store_id
      AND stores.owner_id = auth.uid()
    )
  );

-- Suppression : Seulement les propriétaires
CREATE POLICY "Store owners can delete their products"
  ON products FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = products.store_id
      AND stores.owner_id = auth.uid()
    )
  );
```

### 2. Tables publiques

Certaines tables peuvent être publiques en lecture :

- `product_categories` - Catégories de produits
- `shipping_carriers` - Transporteurs
- `currencies` - Devises
- `countries` - Pays

Pour ces tables :

```sql
-- Activer RLS
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

-- Politique de lecture publique
CREATE POLICY "Categories are viewable by everyone"
  ON product_categories FOR SELECT
  USING (true);
```

### 3. Tables admin uniquement

Certaines tables doivent être accessibles uniquement aux admins :

- `admin_actions` - Actions admin
- `platform_settings` - Paramètres plateforme
- `admin_config` - Configuration admin

```sql
-- Activer RLS
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

-- Politique admin uniquement
CREATE POLICY "Only admins can access admin actions"
  ON admin_actions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
```

## 🔧 Maintenance

### Vérification régulière

Exécuter l'audit RLS régulièrement (mensuellement) :

```sql
SELECT * FROM rls_audit_report
WHERE recommendation LIKE '⚠️%'
ORDER BY table_name;
```

### Ajout de nouvelles tables

Lors de la création d'une nouvelle table :

1. Activer RLS immédiatement
2. Créer les politiques appropriées
3. Tester les politiques
4. Documenter dans ce fichier

## 📝 Notes

- Les politiques RLS sont évaluées pour chaque requête
- Les performances peuvent être impactées si les politiques sont complexes
- Utiliser des index sur les colonnes utilisées dans les politiques
- Tester les politiques avec différents rôles utilisateurs

## 🔗 Références

- [Documentation Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Best Practices RLS](https://supabase.com/docs/guides/auth/row-level-security#best-practices)

---

_Dernière mise à jour : 2025-01-30_
