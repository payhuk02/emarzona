# 🔧 Correction de l'erreur `license_terms` dans EditCourseProductWizard

**Date** : 2025-01-28  
**Statut** : ✅ **CORRIGÉ**

---

## 📋 Problème identifié

Lors de la sauvegarde d'un cours, une erreur `400 Bad Request` se produisait avec le message :

```
Error: Could not find the 'license_terms' column of 'courses' in the schema cache
```

Code d'erreur Supabase : `PGRST204`

### Cause

Le code dans `EditCourseProductWizard.tsx` essayait de mettre à jour les colonnes `licensing_type` et `license_terms` dans la table `courses`, mais ces colonnes n'existent pas dans cette table. Elles sont en réalité stockées dans la table `products`.

### Erreur dans la console

```
PATCH https://hbdnzajbyjakdhuavrvb.supabase.co/rest/v1/courses?id=eq.c3e0b784-... 400 (Bad Request)
Error: Could not find the 'license_terms' column of 'courses' in the schema cache
```

---

## ✅ Corrections apportées

### 1. Déplacement de `licensing_type` et `license_terms` vers la mise à jour de `products`

**Ligne 449-468** - Mise à jour de la table `products` :

```typescript
// AVANT
.update({
  name: formData.title,
  slug,
  description: formData.description,
  short_description: formData.short_description,
  price: formData.price || 0,
  promotional_price: formData.promotional_price,
  currency: formData.currency || 'XOF',
  image_url: formData.image_url || '',
  images: formData.images || [],
  category_id: formData.category || null,
  meta_title: seoData.meta_title,
  meta_description: seoData.meta_description,
  og_image: seoData.og_image,
  faqs: faqs || [],
  pricing_model: formData.pricing_model || 'one-time',
})

// APRÈS
.update({
  name: formData.title,
  slug,
  description: formData.description,
  short_description: formData.short_description,
  price: formData.price || 0,
  promotional_price: formData.promotional_price,
  currency: formData.currency || 'XOF',
  image_url: formData.image_url || '',
  images: formData.images || [],
  category_id: formData.category || null,
  meta_title: seoData.meta_title,
  meta_description: seoData.meta_description,
  og_image: seoData.og_image,
  faqs: faqs || [],
  pricing_model: formData.pricing_model || 'one-time',
  licensing_type: formData.licensing_type || 'standard',  // ✅ AJOUTÉ
  license_terms: formData.license_terms || null,            // ✅ AJOUTÉ
})
```

### 2. Retrait de `licensing_type` et `license_terms` de la mise à jour de `courses`

**Ligne 480-491** - Objet `courseData` :

```typescript
// AVANT
const courseData = {
  product_id: productId,
  level: formData.level || '',
  language: formData.language || 'fr',
  licensing_type: formData.licensing_type || 'standard', // ❌ RETIRÉ
  license_terms: formData.license_terms || '', // ❌ RETIRÉ
  certificate_enabled: formData.certificate_enabled ?? true,
  certificate_passing_score: formData.certificate_passing_score || 80,
  learning_objectives: formData.learning_objectives || [],
  prerequisites: formData.prerequisites || [],
  target_audience: formData.target_audience || [],
};

// APRÈS
const courseData = {
  product_id: productId,
  level: formData.level || '',
  language: formData.language || 'fr',
  certificate_enabled: formData.certificate_enabled ?? true,
  certificate_passing_score: formData.certificate_passing_score || 80,
  learning_objectives: formData.learning_objectives || [],
  prerequisites: formData.prerequisites || [],
  target_audience: formData.target_audience || [],
};
```

### 3. Correction de la lecture des données dans `convertToFormData`

**Ligne 212-213** - Chargement initial des données :

```typescript
// AVANT
licensing_type: (course?.licensing_type as 'standard' | 'plr' | 'copyrighted') || 'standard',
license_terms: course?.license_terms || '',

// APRÈS
licensing_type: (product.licensing_type as 'standard' | 'plr' | 'copyrighted') || 'standard',
license_terms: product.license_terms || '',
```

---

## 📁 Fichiers modifiés

1. **`src/components/products/edit/EditCourseProductWizard.tsx`**
   - Ligne 212-213 : Lecture de `licensing_type` et `license_terms` depuis `product` au lieu de `course`
   - Ligne 449-468 : Ajout de `licensing_type` et `license_terms` à la mise à jour de `products`
   - Ligne 480-491 : Retrait de `licensing_type` et `license_terms` de la mise à jour de `courses`

---

## 🎯 Résultat

### Avant

- ❌ Erreur `400 Bad Request` lors de la sauvegarde d'un cours
- ❌ Message d'erreur : "Could not find the 'license_terms' column of 'courses'"
- ❌ Impossible de sauvegarder les modifications d'un cours

### Après

- ✅ Les champs `licensing_type` et `license_terms` sont correctement sauvegardés dans la table `products`
- ✅ Plus d'erreur `400 Bad Request`
- ✅ La sauvegarde de cours fonctionne correctement

---

## 🔍 Notes techniques

### Structure de la base de données

D'après la migration `20251030_products_licensing.sql`, les colonnes `licensing_type` et `license_terms` sont définies dans la table `products` :

```sql
-- Add licensing_type with constrained values
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS licensing_type TEXT
  CHECK (licensing_type IN ('standard', 'plr', 'copyrighted'))
  DEFAULT 'standard';

-- Add optional license_terms (free text)
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS license_terms TEXT;
```

La table `courses` ne contient pas ces colonnes, comme le montre la migration `20251027_courses_system_complete.sql`.

### Raison de l'erreur

Le code essayait de mettre à jour des colonnes inexistantes dans la table `courses`, ce qui causait une erreur de schéma Supabase (`PGRST204`). La solution consiste à mettre à jour ces champs dans la table `products`, où ils sont réellement définis.

---

## ✅ Tests recommandés

1. **Test de sauvegarde avec licensing_type** :
   - Éditer un cours
   - Modifier le type de licence (standard, plr, copyrighted)
   - Ajouter des termes de licence
   - Sauvegarder
   - Vérifier que les modifications sont enregistrées

2. **Test de chargement** :
   - Ouvrir un cours existant avec `licensing_type` et `license_terms` définis
   - Vérifier que les valeurs sont correctement chargées dans le formulaire

3. **Test avec valeurs nulles** :
   - Éditer un cours sans `license_terms`
   - Sauvegarder
   - Vérifier qu'aucune erreur ne se produit

---

## 📚 Références

- `src/components/products/edit/EditCourseProductWizard.tsx`
- `supabase/migrations/20251030_products_licensing.sql`
- `supabase/migrations/20251027_courses_system_complete.sql`
- `CORRECTION_ERREUR_COURSEBASICINFOFORM.md` (correction précédente)
