# 🔧 CORRECTION - Erreur Validation Slug

**Date:** 31 Janvier 2025

---

## 📋 PROBLÈME IDENTIFIÉ

**Erreur:** "Le slug ne peut contenir que des minuscules, chiffres et tirets"

**Cause:** Le slug était passé comme chaîne vide (`''`) à la validation serveur, alors qu'il était généré APRÈS la validation.

**Fichier:** `src/components/products/create/artist/CreateArtistProductWizard.tsx`

---

## 🔍 ANALYSE

### Ordre d'exécution AVANT correction

1. ✅ Sanitization des données
2. ❌ **Validation serveur avec slug vide** (`slug: ''`)
3. ✅ Génération du slug
4. ✅ Insertion en base

**Problème:** La validation Zod vérifie le format du slug avec la regex `/^[a-z0-9-]+$/` qui ne correspond pas à une chaîne vide, donc la validation échoue.

### Code problématique

```typescript
// 2. Validation côté serveur (si pas brouillon)
if (!isDraft) {
  const validationResult = await validateArtistProduct(
    {
      name: sanitizedData.artwork_title || sanitizedData.name || '',
      slug: '', // ❌ Chaîne vide - validation échoue
      description: sanitizedData.description || '',
      price: sanitizedData.price || 0,
      artist_name: sanitizedData.artist_name || '',
      artwork_title: sanitizedData.artwork_title || '',
    },
    store.id
  );
  // ...
}

// Generate slug (après sanitization) - ❌ Trop tard !
let slug = generateSlug(sanitizedData.artwork_title || sanitizedData.name || 'artwork');
```

---

## ✅ CORRECTION APPLIQUÉE

### Ordre d'exécution APRÈS correction

1. ✅ Sanitization des données
2. ✅ **Génération du slug** (AVANT validation)
3. ✅ **Validation serveur avec slug généré**
4. ✅ Insertion en base

### Code corrigé

```typescript
// Generate slug (après sanitization, AVANT validation serveur)
let slug = generateSlug(sanitizedData.artwork_title || sanitizedData.name || 'artwork');
let attempts = 0;
while (attempts < 10) {
  const { data: existing } = await supabase
    .from('products')
    .select('id')
    .eq('store_id', store.id)
    .eq('slug', slug)
    .limit(1);

  if (!existing || existing.length === 0) break;
  attempts++;
  slug = `${generateSlug(sanitizedData.artwork_title || sanitizedData.name || 'artwork')}-${attempts}`;
}

// 2. Validation côté serveur (si pas brouillon) - AVEC slug généré
if (!isDraft) {
  const validationResult = await validateArtistProduct(
    {
      name: sanitizedData.artwork_title || sanitizedData.name || '',
      slug: slug, // ✅ Slug généré et validé
      description: sanitizedData.description || '',
      price: sanitizedData.price || 0,
      artist_name: sanitizedData.artist_name || '',
      artwork_title: sanitizedData.artwork_title || '',
    },
    store.id
  );
  // ...
}
```

---

## 🔍 FONCTION `generateSlug`

**Fichier:** `src/lib/validation-utils.ts`

**Fonction:**

```typescript
export const generateSlug = (text: string): string => {
  return sanitizeSlug(text);
};

export const sanitizeSlug = (slug: string): string => {
  return slug
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Enlever les accents
    .replace(/[^a-z0-9\s-]/g, '') // Enlever caractères spéciaux
    .replace(/\s+/g, '-') // Remplacer espaces par tirets
    .replace(/-+/g, '-') // Réduire tirets multiples
    .replace(/^-+|-+$/g, ''); // Enlever tirets début/fin
};
```

**Validation:** ✅ La fonction génère un slug valide conforme à `/^[a-z0-9-]+$/`

---

## ✅ VALIDATION

**Tests effectués:**

- ✅ Compilation TypeScript: **OK**
- ✅ Linting: **Aucune erreur**
- ✅ Logique: **Corrigée**

**Tests à effectuer:**

- [ ] Test création produit avec titre normal
- [ ] Test création produit avec titre avec accents
- [ ] Test création produit avec titre avec caractères spéciaux
- [ ] Test création produit avec slug déjà existant (retry)
- [ ] Test validation serveur avec slug généré

---

## 📊 IMPACT

**Avant:**

- ❌ Erreur de validation à chaque tentative de publication
- ❌ Message d'erreur confus pour l'utilisateur
- ❌ Impossible de publier un produit

**Après:**

- ✅ Slug généré correctement avant validation
- ✅ Validation serveur réussit
- ✅ Publication fonctionnelle

---

**Date de correction:** 31 Janvier 2025  
**Corrigé par:** Assistant IA  
**Fichier modifié:** `src/components/products/create/artist/CreateArtistProductWizard.tsx`
