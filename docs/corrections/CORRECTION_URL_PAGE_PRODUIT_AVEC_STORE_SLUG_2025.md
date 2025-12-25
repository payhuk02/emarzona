# 🔧 CORRECTION - URL page produit avec slug de la boutique

**Date:** 1 Février 2025

---

## 📋 PROBLÈME IDENTIFIÉ

**Erreur:** L'URL de la page produit était générée sans tenir compte du slug de la boutique.

**Format incorrect:**

- `https://[domaine]/products/[slug]`

**Format attendu:**

- `https://[domaine]/stores/[storeSlug]/products/[slug]` (si storeSlug disponible)
- `https://[domaine]/products/[slug]` (si storeSlug non disponible)

---

## ✅ CORRECTION APPLIQUÉE

### Fichiers modifiés

1. **`src/components/products/create/artist/ArtistBasicInfoForm.tsx`**
2. **`src/components/products/create/artist/CreateArtistProductWizard.tsx`**

### Changements apportés

#### 1. Ajout du prop `storeSlug` à `ArtistBasicInfoForm`

**Avant:**

```typescript
interface ArtistBasicInfoFormProps {
  data: Partial<ArtistProductFormData>;
  onUpdate: (data: Partial<ArtistProductFormData>) => void;
}
```

**Après:**

```typescript
interface ArtistBasicInfoFormProps {
  data: Partial<ArtistProductFormData>;
  onUpdate: (data: Partial<ArtistProductFormData>) => void;
  storeSlug?: string; // ✅ Ajouté
}
```

#### 2. Mise à jour de la fonction de génération d'URL

**Avant:**

```typescript
const generateUrlFromTitle = (title: string): string => {
  // ...
  const baseUrl = window.location.origin;
  return `${baseUrl}/products/${slug}`; // ❌ Sans storeSlug
};
```

**Après:**

```typescript
const generateUrlFromTitle = (title: string): string => {
  // ...
  const baseUrl = window.location.origin;
  if (storeSlug) {
    return `${baseUrl}/stores/${storeSlug}/products/${slug}`; // ✅ Avec storeSlug
  }
  return `${baseUrl}/products/${slug}`; // ✅ Fallback sans storeSlug
};
```

#### 3. Passage du `storeSlug` depuis le wizard

**Fichier:** `CreateArtistProductWizard.tsx`

**Ajout:**

```typescript
const storeSlug = _storeSlug || hookStore?.slug;
```

**Utilisation:**

```typescript
{currentStep === 2 && (
  <ArtistBasicInfoForm
    data={formData}
    onUpdate={handleUpdateFormData}
    storeSlug={storeSlug} // ✅ Passage du storeSlug
  />
)}
```

#### 4. Mise à jour des textes et placeholders

**Placeholder dynamique:**

```typescript
placeholder={storeSlug
  ? `https://exemple.com/stores/${storeSlug}/products/mon-oeuvre`
  : "https://exemple.com/products/mon-oeuvre"
}
```

**Message d'aide dynamique:**

```typescript
💡 L'URL sera générée automatiquement à partir du titre de l'œuvre.
Format: {storeSlug ? `/stores/${storeSlug}/products/[slug]` : '/products/[slug]'}
```

---

## 📊 FORMATS D'URL GÉNÉRÉS

### Avec storeSlug

**Exemple:**

- Store slug: `ma-boutique`
- Titre: "Mon Œuvre d'Art"
- URL générée: `https://localhost:8080/stores/ma-boutique/products/mon-oeuvre-d-art`

### Sans storeSlug (fallback)

**Exemple:**

- Titre: "Mon Œuvre d'Art"
- URL générée: `https://localhost:8080/products/mon-oeuvre-d-art`

---

## 🔍 ROUTING DE L'APPLICATION

D'après `src/App.tsx`, les routes produits sont :

- `/stores/:slug/products/:productSlug` (avec store slug)
- `/products/:productSlug` (sans store slug, fallback)

**Référence:**

```typescript
<Route path="/stores/:slug/products/:productSlug" element={<ProductDetail />} />
```

---

## 🧪 TESTS À EFFECTUER

### Test 1: Génération avec storeSlug

- [ ] Créer un produit avec une boutique ayant un slug
- [ ] Saisir un titre de l'œuvre
- [ ] Vérifier que l'URL générée contient `/stores/[storeSlug]/products/[slug]`

### Test 2: Génération sans storeSlug

- [ ] Créer un produit sans storeSlug disponible
- [ ] Saisir un titre de l'œuvre
- [ ] Vérifier que l'URL générée est `/products/[slug]`

### Test 3: Modification manuelle

- [ ] Générer une URL automatiquement
- [ ] Modifier l'URL manuellement
- [ ] Vérifier que l'URL modifiée est préservée

### Test 4: Navigation vers la page produit

- [ ] Créer et publier un produit
- [ ] Cliquer sur l'URL générée
- [ ] Vérifier que la page produit s'affiche correctement

---

## 📝 NOTES IMPORTANTES

### Priorité du storeSlug

1. **Props `storeSlug`** (si fourni au wizard)
2. **`hookStore?.slug`** (depuis le hook `useStore`)
3. **Fallback** : URL sans storeSlug

### Cohérence avec le routing

L'URL générée correspond exactement au format utilisé par le routing de l'application :

- ✅ `/stores/[storeSlug]/products/[slug]` → Route avec store slug
- ✅ `/products/[slug]` → Route sans store slug (fallback)

---

**Date de correction:** 1 Février 2025  
**Corrigé par:** Assistant IA  
**Fichiers modifiés:**

- `src/components/products/create/artist/ArtistBasicInfoForm.tsx`
- `src/components/products/create/artist/CreateArtistProductWizard.tsx`
