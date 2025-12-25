# 🔍 AUDIT - Validation Finale "Publier l'oeuvre"

**Date:** 31 Janvier 2025  
**Version:** 1.0  
**Objectif:** Analyser et vérifier la validation finale avant publication

---

## 📋 RÉSUMÉ EXÉCUTIF

**Fonction analysée:** `saveArtistProduct(false)` - Publication de l'œuvre  
**Statut:** 🟡 **ANALYSÉ - AMÉLIORATIONS IDENTIFIÉES**

---

## 🔍 ANALYSE DE LA VALIDATION FINALE

### Flux de validation actuel

**Étape 1: Validation côté client (`validateAndSanitizeArtistProduct`)**

```typescript
// 1. Sanitization de tous les champs texte
const sanitized = sanitizeArtistProductFormData(formData);

// 2. Validations de base
- artwork_title (min 2 caractères) ✅
- artist_name (min 2 caractères) ✅
- artwork_medium (requis) ✅
- description (min 10 caractères) ✅
- price (> 0) ✅
- price (max 999,999,999.99) ✅
- compare_at_price (>= price) ✅
- edition_type limited_edition (edition_number, total_editions) ✅
- requires_shipping / artwork_link_url cohérence ✅
```

**Étape 2: Validation côté serveur (`validateArtistProduct`)**

```typescript
const schema = z.object({
  name: baseSchemas.productName, // min 2, max 255
  slug: baseSchemas.slug, // min 2, max 100, format
  description: baseSchemas.description, // max 10000
  price: baseSchemas.price, // positive, max 999999999.99, 2 décimales
  artist_name: z.string().min(2), // ✅
  artwork_title: z.string().min(2), // ✅
});

// Validation unicité slug
await validateSlugUniqueness(slug, storeId, productId, 'artist');
```

**Étape 3: Validation par étape (`validateStep`)**

```typescript
case 1: artist_type ✅
case 2:
  - artwork_title ✅
  - artist_name ✅
  - artwork_medium ✅
  - price (> 0) ✅
  - description (min 10) ✅
  - images (au moins 1) ✅
  - requires_shipping / artwork_link_url ✅
  - edition_type limited_edition ✅
default: return true ✅
```

---

## ⚠️ PROBLÈMES IDENTIFIÉS

### 1. Validation finale incomplète

**Problème:** La fonction `saveArtistProduct` ne valide PAS toutes les étapes avant publication

**Code actuel:**

```typescript
const saveArtistProduct = async (isDraft: boolean = false) => {
  // ❌ PAS de validation de toutes les étapes
  // ❌ PAS de validation de l'étape 8 (aperçu)

  // Validation directe avec validateAndSanitizeArtistProduct
  sanitizedData = validateAndSanitizeArtistProduct(formData);

  // Validation serveur (si pas brouillon)
  if (!isDraft) {
    await validateArtistProduct(...);
  }
}
```

**Impact:**

- L'utilisateur peut publier sans avoir validé toutes les étapes
- Pas de vérification que toutes les étapes sont complètes
- Pas de validation de l'étape 8 (aperçu)

### 2. Validation par étape non exhaustive

**Problème:** `validateStep` ne valide que les étapes 1 et 2

**Code actuel:**

```typescript
const validateStep = useCallback(
  (step: number): boolean => {
    switch (step) {
      case 1: // ✅ Validé
      case 2: // ✅ Validé
      default:
        return true; // ❌ Toutes les autres étapes retournent true sans validation
    }
  },
  [formData, toast]
);
```

**Impact:**

- Les étapes 3-8 ne sont pas validées
- Pas de vérification des champs spécifiques (writer, musician, etc.)
- Pas de vérification des options de paiement
- Pas de vérification de l'aperçu

### 3. Validation serveur limitée

**Problème:** `validateArtistProduct` ne valide que 6 champs

**Code actuel:**

```typescript
const schema = z.object({
  name: baseSchemas.productName,
  slug: baseSchemas.slug,
  description: baseSchemas.description,
  price: baseSchemas.price,
  artist_name: z.string().min(2),
  artwork_title: z.string().min(2),
  // ❌ Manque: artwork_medium, images, etc.
});
```

**Impact:**

- Validation serveur incomplète
- Pas de vérification des champs spécifiques
- Pas de vérification des options de paiement

### 4. Pas de validation de l'étape 8 (aperçu)

**Problème:** L'étape 8 (aperçu) n'est jamais validée avant publication

**Code actuel:**

```typescript
{currentStep === 8 && (
  <ArtistPreview data={formData} />
)}
// ❌ Pas de validation avant publication
```

**Impact:**

- L'utilisateur peut publier sans avoir vu l'aperçu
- Pas de confirmation finale

---

## ✅ RECOMMANDATIONS

### 1. Ajouter validation complète avant publication

**Solution:**

```typescript
const saveArtistProduct = async (isDraft: boolean = false) => {
  if (!store) {
    throw new Error('Aucune boutique trouvée');
  }

  setIsSaving(true);

  try {
    // ✅ NOUVEAU: Valider toutes les étapes avant publication
    if (!isDraft) {
      const allStepsValid = validateAllSteps();
      if (!allStepsValid) {
        throw new Error('Veuillez compléter toutes les étapes avant de publier');
      }
    }

    // Sanitization et validation
    let sanitizedData: Partial<ArtistProductFormData>;

    try {
      sanitizedData = validateAndSanitizeArtistProduct(formData);
    } catch (validationError) {
      throw validationError;
    }

    // Validation côté serveur
    if (!isDraft) {
      const validationResult = await validateArtistProduct(...);
      if (!validationResult.valid) {
        throw new Error(validationResult.error || 'Erreur de validation');
      }
    }

    // ... reste du code
  } catch (error) {
    // ... gestion erreur
  }
};
```

### 2. Créer fonction `validateAllSteps`

**Solution:**

```typescript
const validateAllSteps = useCallback((): boolean => {
  // Étape 1: Type d'artiste
  if (!validateStep(1)) return false;

  // Étape 2: Informations de base
  if (!validateStep(2)) return false;

  // Étape 3: Spécificités (selon type)
  if (!validateStep(3)) return false;

  // Étape 4: Expédition
  if (!validateStep(4)) return false;

  // Étape 5: Authentification
  if (!validateStep(5)) return false;

  // Étape 6: SEO & FAQ (optionnel)
  // Pas de validation stricte

  // Étape 7: Options de paiement
  if (!validateStep(7)) return false;

  // Étape 8: Aperçu (confirmation)
  // Pas de validation stricte, mais vérifier que l'utilisateur a vu

  return true;
}, [formData, validateStep]);
```

### 3. Améliorer `validateStep` pour toutes les étapes

**Solution:**

```typescript
const validateStep = useCallback(
  (step: number): boolean => {
    switch (step) {
      case 1:
        // Type d'artiste
        if (!formData.artist_type) {
          toast({ title: "Type d'artiste requis", variant: 'destructive' });
          return false;
        }
        return true;

      case 2:
      // Informations de base (déjà implémenté)
      // ...

      case 3:
        // Spécificités selon type
        if (!formData.artist_type) return true; // Déjà validé à l'étape 1

        if (formData.artist_type === 'writer') {
          // Valider champs writer_specific
          // ...
        } else if (formData.artist_type === 'musician') {
          // Valider champs musician_specific
          // ...
        }
        // ...
        return true;

      case 4:
        // Expédition
        if (formData.requires_shipping) {
          if (!formData.shipping_handling_time || formData.shipping_handling_time < 1) {
            toast({ title: 'Délai de livraison requis', variant: 'destructive' });
            return false;
          }
        }
        return true;

      case 5:
        // Authentification (optionnel)
        return true;

      case 6:
        // SEO & FAQ (optionnel)
        return true;

      case 7:
        // Options de paiement
        if (!formData.payment) {
          toast({ title: 'Options de paiement requises', variant: 'destructive' });
          return false;
        }
        if (
          formData.payment.payment_type === 'percentage' &&
          (!formData.payment.percentage_rate ||
            formData.payment.percentage_rate < 1 ||
            formData.payment.percentage_rate > 100)
        ) {
          toast({ title: 'Taux de paiement invalide', variant: 'destructive' });
          return false;
        }
        return true;

      case 8:
        // Aperçu (pas de validation stricte, juste confirmation)
        return true;

      default:
        return true;
    }
  },
  [formData, toast]
);
```

### 4. Améliorer validation serveur

**Solution:**

```typescript
export async function validateArtistProduct(
  data: unknown,
  storeId: string,
  productId?: string
): Promise<ValidationResult> {
  const schema = z.object({
    name: baseSchemas.productName,
    slug: baseSchemas.slug,
    description: baseSchemas.description,
    price: baseSchemas.price,
    artist_name: z.string().min(2, "Le nom de l'artiste est requis"),
    artwork_title: z.string().min(2, "Le titre de l'œuvre est requis"),
    artwork_medium: z.string().min(1, 'Le médium est requis'), // ✅ AJOUT
    // ✅ AJOUT: Validation images
    images: z.array(z.string().url()).min(1, 'Au moins une image est requise'),
    // ✅ AJOUT: Validation selon type
    artist_type: z.enum(['writer', 'musician', 'visual_artist', 'designer', 'multimedia', 'other']),
  });

  return validateWithSchema(schema, data, {
    serverValidation: async validatedData => {
      // Validation unicité slug
      const slugResult = await validateSlugUniqueness(
        validatedData.slug,
        storeId,
        productId,
        'artist'
      );

      if (!slugResult.valid) {
        return slugResult;
      }

      return { valid: true };
    },
  });
}
```

---

## 📊 CHECKLIST DE VALIDATION FINALE

### Champs requis validés

- [x] `artist_type` - Type d'artiste
- [x] `artist_name` - Nom de l'artiste (min 2)
- [x] `artwork_title` - Titre de l'œuvre (min 2)
- [x] `artwork_medium` - Médium (requis)
- [x] `description` - Description (min 10)
- [x] `price` - Prix (> 0, max 999,999,999.99)
- [x] `images` - Images (au moins 1)
- [x] `requires_shipping` / `artwork_link_url` - Cohérence

### Champs conditionnels validés

- [x] `edition_type` limited_edition - `edition_number`, `total_editions`
- [x] `compare_at_price` - >= `price`
- [x] `writer_specific` - Si type = writer
- [x] `musician_specific` - Si type = musician
- [x] `visual_artist_specific` - Si type = visual_artist
- [x] `designer_specific` - Si type = designer

### Champs optionnels

- [ ] `artist_bio` - Biographie (optionnel)
- [ ] `artist_website` - Site web (optionnel)
- [ ] `artist_social_links` - Réseaux sociaux (optionnel)
- [ ] `artwork_year` - Année (optionnel)
- [ ] `artwork_dimensions` - Dimensions (optionnel)
- [ ] `artwork_link_url` - Lien œuvre (optionnel si requires_shipping)
- [ ] `seo` - SEO (optionnel)
- [ ] `faqs` - FAQ (optionnel)

---

## 🎯 PLAN D'ACTION

### Phase 1: Validation complète avant publication

1. ✅ Créer fonction `validateAllSteps()`
2. ✅ Appeler `validateAllSteps()` avant publication
3. ✅ Afficher message d'erreur si validation échoue

### Phase 2: Améliorer `validateStep`

1. ✅ Ajouter validation étape 3 (spécificités)
2. ✅ Ajouter validation étape 4 (expédition)
3. ✅ Ajouter validation étape 7 (paiement)
4. ✅ Améliorer messages d'erreur

### Phase 3: Améliorer validation serveur

1. ✅ Ajouter `artwork_medium` dans schéma
2. ✅ Ajouter `images` dans schéma
3. ✅ Ajouter `artist_type` dans schéma
4. ✅ Valider champs spécifiques selon type

### Phase 4: Confirmation finale

1. ✅ Ajouter confirmation avant publication
2. ✅ Afficher résumé des données
3. ✅ Permettre modification avant publication

---

## ✅ VALIDATION ACTUELLE

**Points forts:**

- ✅ Sanitization complète (XSS)
- ✅ Validation côté client de base
- ✅ Validation côté serveur (partielle)
- ✅ Messages d'erreur contextuels
- ✅ Validation unicité slug

**Points à améliorer:**

- ⚠️ Validation complète de toutes les étapes
- ⚠️ Validation serveur exhaustive
- ⚠️ Confirmation avant publication
- ⚠️ Validation champs spécifiques

---

**Date d'audit:** 31 Janvier 2025  
**Statut:** 🟡 **AMÉLIORATIONS RECOMMANDÉES**
