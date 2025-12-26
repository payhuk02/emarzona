# 🚀 Guide d'Application de l'Audit RLS

> **Guide rapide pour appliquer les corrections identifiées par l'audit RLS**

---

## 📊 Interprétation des Résultats

### ✅ Tables avec RLS Activé + Politiques

```
✅ Table: products - RLS activé avec 3 politique(s)
```

**Action**: Aucune action requise - Configuration correcte

### ❌ Tables sans RLS

```
❌ Table: digital_product_downloads_partitioned - RLS DÉSACTIVÉ
```

**Action**: Activer RLS immédiatement

### ⚠️ Tables avec RLS mais Sans Politiques

```
⚠️ Table: orders_partitioned - RLS activé mais AUCUNE politique (Accès bloqué!)
```

**Action**: Créer des politiques ou désactiver RLS temporairement

---

## 🔧 Actions Correctives

### Étape 1: Activer RLS sur les Tables Sans Protection

Pour chaque table identifiée sans RLS, exécuter:

```sql
-- Exemple pour digital_product_downloads_partitioned
ALTER TABLE digital_product_downloads_partitioned ENABLE ROW LEVEL SECURITY;
```

### Étape 2: Créer les Politiques Manquantes

#### Exemple: Table `digital_product_downloads_partitioned`

```sql
-- Activer RLS
ALTER TABLE digital_product_downloads_partitioned ENABLE ROW LEVEL SECURITY;

-- Politique: Les utilisateurs peuvent voir leurs propres téléchargements
CREATE POLICY "Users can view their own downloads"
  ON digital_product_downloads_partitioned
  FOR SELECT
  USING (auth.uid() = user_id);

-- Politique: Les utilisateurs peuvent créer leurs propres téléchargements
CREATE POLICY "Users can create their own downloads"
  ON digital_product_downloads_partitioned
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

#### Exemple: Table `orders_partitioned`

```sql
-- Vérifier que RLS est activé
ALTER TABLE orders_partitioned ENABLE ROW LEVEL SECURITY;

-- Politique: Les clients peuvent voir leurs propres commandes
CREATE POLICY "Customers can view their own orders"
  ON orders_partitioned
  FOR SELECT
  USING (auth.uid() = customer_id);

-- Politique: Les vendeurs peuvent voir les commandes de leurs produits
CREATE POLICY "Vendors can view orders for their products"
  ON orders_partitioned
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN stores s ON p.store_id = s.id
      WHERE oi.order_id = orders_partitioned.id
      AND s.user_id = auth.uid()
    )
  );
```

---

## 📋 Checklist d'Application

### Pour Chaque Table Identifiée

- [ ] **Activer RLS** si désactivé
- [ ] **Créer politique SELECT** (lecture)
- [ ] **Créer politique INSERT** si nécessaire (création)
- [ ] **Créer politique UPDATE** si nécessaire (modification)
- [ ] **Créer politique DELETE** si nécessaire (suppression)
- [ ] **Tester les politiques** en développement
- [ ] **Documenter** dans `supabase/rls-policies.md`

---

## 🧪 Tests des Politiques

### Test 1: Utilisateur Anonyme

```sql
SET ROLE anon;
SELECT * FROM table_name; -- Devrait retourner vide ou données publiques
RESET ROLE;
```

### Test 2: Utilisateur Authentifié

```sql
SET ROLE authenticated;
SELECT * FROM table_name; -- Devrait retourner seulement ses données
RESET ROLE;
```

### Test 3: Vendeur

```sql
-- Tester avec un user_id de vendeur
SET ROLE authenticated;
SET request.jwt.claim.sub = 'vendor-user-id';
SELECT * FROM orders; -- Devrait retourner les commandes de ses produits
RESET ROLE;
```

---

## ⚠️ Précautions

1. **Ne pas activer RLS sans politiques** - Cela bloque tous les accès
2. **Tester en développement** avant production
3. **Créer des backups** avant modifications
4. **Documenter chaque politique** créée

---

## 🚀 Script de Correction Rapide

Un script prêt à l'emploi est disponible pour corriger les tables partitionnées identifiées dans votre audit:

**Fichier**: `supabase/scripts/fix-rls-partitioned-tables.sql`

**Tables corrigées**:

- ✅ `digital_product_downloads_partitioned` - Activation RLS + Politiques
- ✅ `orders_partitioned` - Création des politiques manquantes

**Usage**:

1. Ouvrir `supabase/scripts/fix-rls-partitioned-tables.sql`
2. Copier le contenu dans Supabase SQL Editor
3. Exécuter le script
4. Vérifier les résultats des vérifications à la fin du script

---

## 🔗 Ressources

- [Guide Complet RLS](docs/GUIDE_AUDIT_RLS_SUPABASE.md)
- [Script de Correction](supabase/scripts/fix-rls-partitioned-tables.sql)
- [Documentation Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)

---

_Guide créé le 2025-01-30_  
_Mis à jour avec script de correction rapide_
