# 🔧 CORRECTION : Table product_analytics manquante

**Date** : 1er Février 2025  
**Problème** : `relation "public.product_analytics" does not exist`  
**Statut** : ✅ Corrigé

---

## 🐛 Problème identifié

Lors de la création d'un cours, une erreur SQL se produit :

```
relation "public.product_analytics" does not exist
```

La fonction SQL `create_full_course()` tente d'insérer des données dans la table `product_analytics` qui n'existe pas dans la base de données.

---

## ✅ Solutions implémentées

### 1. Fonction SQL mise à jour

**Fichier** : `supabase/migrations/20250201_create_full_course_transaction.sql`

La fonction vérifie maintenant si la table existe avant de l'utiliser :

```sql
-- 6. Configurer le tracking et les pixels (si la table existe)
IF EXISTS (
  SELECT 1
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'product_analytics'
) THEN
  -- UPSERT dans product_analytics
  ...
END IF;
```

### 2. Migration de contrainte UNIQUE corrigée

**Fichier** : `supabase/migrations/20250201_add_unique_constraint_product_analytics.sql`

La migration vérifie maintenant l'existence de la table et de la contrainte avant d'ajouter le commentaire.

---

## 📋 Instructions pour résoudre le problème

### Étape 1 : Créer la table product_analytics (OBLIGATOIRE)

**Dans Supabase SQL Editor**, exécutez la migration qui crée la table :

```sql
-- Exécuter ce fichier dans Supabase :
-- supabase/migrations/20250122_create_product_analytics_system.sql
```

Cette migration crée :

- ✅ La table `product_analytics` avec toutes ses colonnes
- ✅ Les tables associées (`analytics_events`, `user_sessions`, `analytics_reports`)
- ✅ Les index pour optimiser les performances
- ✅ Les politiques RLS (Row Level Security)
- ✅ Les fonctions et triggers nécessaires

### Étape 2 : Ajouter la contrainte UNIQUE (Optionnel mais recommandé)

Après avoir créé la table, exécutez :

```sql
-- Exécuter ce fichier dans Supabase :
-- supabase/migrations/20250201_add_unique_constraint_product_analytics.sql
```

Cette migration :

- ✅ Supprime les doublons éventuels
- ✅ Ajoute une contrainte UNIQUE sur `product_id`
- ✅ Garantit un seul enregistrement d'analytics par produit

### Étape 3 : Vérifier que la table existe

```sql
-- Vérification
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'product_analytics';
```

Si la requête retourne un résultat, la table existe ✅

---

## 🧪 Test

Après avoir exécuté la migration `20250122_create_product_analytics_system.sql` :

1. Allez sur `/dashboard/products/new/course`
2. Remplissez le formulaire de création de cours
3. Cliquez sur "Publier"
4. Vérifiez que le cours est créé sans erreur

---

## ⚠️ Note importante

**La fonction SQL `create_full_course()` fonctionne maintenant même si la table `product_analytics` n'existe pas.** Elle ignore simplement cette étape si la table est absente.

Cependant, pour bénéficier du tracking et des analytics, il est **fortement recommandé** de créer la table en exécutant la migration `20250122_create_product_analytics_system.sql`.

---

## ✅ Statut

- ✅ Fonction SQL mise à jour avec vérification d'existence
- ✅ Migration de contrainte UNIQUE corrigée
- ✅ Protection contre l'erreur si la table n'existe pas
- ⚠️ **Action requise** : Exécuter la migration `20250122_create_product_analytics_system.sql`

---

**Fin du document**
