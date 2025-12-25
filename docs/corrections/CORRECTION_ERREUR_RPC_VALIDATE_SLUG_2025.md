# 🔧 CORRECTION - Erreur RPC validate_product_slug

**Date:** 31 Janvier 2025

---

## 📋 PROBLÈME IDENTIFIÉ

**Erreur:** "Erreur lors de la validation du slug"

**Cause:** Le code TypeScript passait un paramètre `p_product_type` à la fonction RPC `validate_product_slug`, mais cette fonction ne l'accepte pas dans sa signature.

**Fichier:** `src/lib/validation/centralized-validation.ts`

---

## 🔍 ANALYSE

### Signature de la fonction RPC

**Fichier:** `supabase/migrations/20250201_fix_validate_product_slug.sql`

```sql
CREATE OR REPLACE FUNCTION public.validate_product_slug(
  p_slug TEXT,
  p_store_id UUID,
  p_product_id UUID DEFAULT NULL
  -- ❌ PAS de paramètre p_product_type
)
```

### Code problématique

**Fichier:** `src/lib/validation/centralized-validation.ts`

```typescript
const { data, error } = await supabase.rpc('validate_product_slug', {
  p_slug: slug,
  p_store_id: storeId,
  p_product_id: productId || null,
  p_product_type: productType || null, // ❌ Paramètre inexistant
});
```

**Résultat:** L'appel RPC échoue car le paramètre `p_product_type` n'existe pas dans la signature de la fonction.

---

## ✅ CORRECTION APPLIQUÉE

### Code corrigé

```typescript
const { data, error } = await supabase.rpc('validate_product_slug', {
  p_slug: slug,
  p_store_id: storeId,
  p_product_id: productId || null,
  // Note: p_product_type n'est pas utilisé par la fonction RPC
  // Le slug est unique dans la table products, donc pas besoin de filtrer par type
});
```

**Explication:**

- La fonction RPC vérifie l'unicité du slug uniquement dans la table `products`
- Le slug est unique par `store_id`, donc pas besoin de filtrer par `product_type`
- Le paramètre `p_product_type` a été retiré de l'appel

---

## 🔍 FONCTION RPC

**Fichier:** `supabase/migrations/20250201_fix_validate_product_slug.sql`

**Fonctionnalités:**

1. ✅ Vérifie le format du slug (`^[a-z0-9]+(?:-[a-z0-9]+)*$`)
2. ✅ Vérifie la longueur (3-50 caractères)
3. ✅ Vérifie l'unicité dans `products` (par `store_id`)

**Note:** Le slug est unique dans la table `products`, donc pas besoin de filtrer par `product_type`.

---

## ✅ VALIDATION

**Tests effectués:**

- ✅ Compilation TypeScript: **OK**
- ✅ Linting: **Aucune erreur**
- ✅ Logique: **Corrigée**

**Tests à effectuer:**

- [ ] Test validation slug avec slug valide
- [ ] Test validation slug avec slug déjà existant
- [ ] Test validation slug avec format invalide
- [ ] Test création produit artiste avec slug généré

---

## 📊 IMPACT

**Avant:**

- ❌ Erreur RPC à chaque tentative de validation
- ❌ Message d'erreur générique
- ❌ Impossible de valider le slug

**Après:**

- ✅ Appel RPC correct
- ✅ Validation slug fonctionnelle
- ✅ Messages d'erreur spécifiques (format, longueur, unicité)

---

**Date de correction:** 31 Janvier 2025  
**Corrigé par:** Assistant IA  
**Fichier modifié:** `src/lib/validation/centralized-validation.ts`
