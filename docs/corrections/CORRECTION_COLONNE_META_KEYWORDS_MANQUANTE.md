# 🔧 CORRECTION : Colonne meta_keywords manquante

**Date** : 1er Février 2025  
**Problème** : `column "meta_keywords" of relation "products" does not exist`  
**Statut** : ✅ Corrigé

---

## 🐛 Problème identifié

Lors de la création d'un cours, une erreur SQL se produit :

```
column "meta_keywords" of relation "products" does not exist
```

La fonction SQL `create_full_course()` tente d'insérer des données dans la colonne `meta_keywords` qui n'existe pas dans la table `products`.

---

## ✅ Solutions implémentées

### 1. Migration pour ajouter la colonne

**Fichier** : `supabase/migrations/20250201_add_meta_keywords_to_products.sql`

Cette migration ajoute la colonne `meta_keywords` à la table `products` si elle n'existe pas déjà.

```sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'products'
    AND column_name = 'meta_keywords'
  ) THEN
    ALTER TABLE public.products
    ADD COLUMN meta_keywords TEXT;

    COMMENT ON COLUMN public.products.meta_keywords IS 'Mots-clés SEO pour le référencement du produit';
  END IF;
END $$;
```

### 2. Vérification dans la fonction SQL

**Fichier** : `supabase/migrations/20250201_create_full_course_transaction.sql`

La fonction SQL vérifie maintenant si la colonne existe avant de l'utiliser :

```sql
-- Vérifier si meta_keywords existe, sinon l'ajouter
IF NOT EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_schema = 'public'
  AND table_name = 'products'
  AND column_name = 'meta_keywords'
) THEN
  ALTER TABLE public.products ADD COLUMN meta_keywords TEXT;
END IF;
```

---

## 📋 Instructions pour résoudre le problème

### Option 1 : Exécuter la migration (Recommandé)

1. **Dans Supabase Dashboard** :
   - Allez dans **SQL Editor**
   - Exécutez la migration : `20250201_add_meta_keywords_to_products.sql`
   - Vérifiez que la colonne a été ajoutée

2. **Vérification** :

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'products'
AND column_name = 'meta_keywords';
```

### Option 2 : La fonction SQL l'ajoutera automatiquement

Si vous exécutez la fonction `create_full_course()` et que la colonne n'existe pas, elle sera automatiquement ajoutée lors de la première exécution.

---

## ⚠️ Ordre d'exécution des migrations

Les migrations doivent être exécutées dans cet ordre :

1. ✅ `20250201_add_meta_keywords_to_products.sql` (ajoute la colonne)
2. ✅ `20250201_create_full_course_transaction.sql` (utilise la colonne)
3. ✅ `20250201_improve_enrollment_error_handling.sql` (améliore l'enrollment)

**Note** : L'ordre alphabétique des noms de fichiers garantit que `add_meta_keywords` est exécuté avant `create_full_course`.

---

## 🧪 Test

Après avoir exécuté la migration, testez la création d'un cours :

1. Allez sur `/dashboard/products/new/course`
2. Remplissez le formulaire
3. Cliquez sur "Publier"
4. Vérifiez que le cours est créé sans erreur

---

## ✅ Statut

- ✅ Migration créée pour ajouter `meta_keywords`
- ✅ Fonction SQL mise à jour avec vérification
- ✅ Protection contre l'erreur si la colonne n'existe pas

**Le problème devrait être résolu après l'exécution de la migration.**

---

**Fin du document**
