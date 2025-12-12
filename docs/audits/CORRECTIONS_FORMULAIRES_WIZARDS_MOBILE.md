# 🔧 CORRECTIONS FORMULAIRES WIZARDS MOBILE

## Implémentations concrètes

**Date** : 28 Janvier 2025  
**Basé sur** : `AUDIT_COMPLET_FORMULAIRES_WIZARDS_MOBILE.md`

---

## 📋 CORRECTIONS PAR FICHIER

### 1. `DigitalBasicInfoForm.tsx`

#### Correction 1 : Textarea description courte

```tsx
// AVANT
<Textarea
  id="short_description"
  placeholder="Une brève description de votre produit (1-2 phrases)"
  value={formData.short_description || ''}
  onChange={(e) => updateFormData({ short_description: e.target.value })}
  onKeyDown={handleSpaceKeyDown}
  rows={2}
  maxLength={160}
/>

// APRÈS
<Textarea
  id="short_description"
  placeholder="Une brève description de votre produit (1-2 phrases)"
  value={formData.short_description || ''}
  onChange={(e) => updateFormData({ short_description: e.target.value })}
  onKeyDown={handleSpaceKeyDown}
  rows={2}
  maxLength={160}
  className="min-h-[44px] sm:min-h-[auto] text-base sm:text-sm"
/>
```

#### Correction 2 : Inputs number (prix)

```tsx
// AVANT
<Input
  id="price"
  type="number"
  min="0"
  step="0.01"
  placeholder="0.00"
  value={formData.price || ''}
  onChange={(e) => updateFormData({ price: parseFloat(e.target.value) || 0 })}
  required
/>

// APRÈS
<Input
  id="price"
  type="number"
  min="0"
  step="0.01"
  placeholder="0.00"
  value={formData.price || ''}
  onChange={(e) => updateFormData({ price: parseFloat(e.target.value) || 0 })}
  required
  className="text-base sm:text-sm"
/>
```

#### Correction 3 : Zone upload images

```tsx
// AVANT
<label
  htmlFor="images_upload"
  className={cn(
    "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
    uploadingImage ? "bg-muted/70 cursor-not-allowed" : "hover:bg-muted/50",
    "border-muted-foreground/25"
  )}
>

// APRÈS
<label
  htmlFor="images_upload"
  className={cn(
    "flex flex-col items-center justify-center w-full border-2 border-dashed rounded-lg cursor-pointer transition-colors",
    "h-32 sm:h-32 md:h-40 min-h-[120px] touch-manipulation", // Zone tactile minimale
    uploadingImage ? "bg-muted/70 cursor-not-allowed" : "hover:bg-muted/50",
    "border-muted-foreground/25"
  )}
>
```

#### Correction 4 : Textarea conditions licence

```tsx
// AVANT
<Textarea
  id="license_terms"
  placeholder="Détails supplémentaires sur les conditions d'utilisation, restrictions, permissions..."
  value={formData.license_terms || ''}
  onChange={(e) => updateFormData({ license_terms: e.target.value })}
  rows={4}
  maxLength={1000}
/>

// APRÈS
<Textarea
  id="license_terms"
  placeholder="Détails supplémentaires sur les conditions d'utilisation, restrictions, permissions..."
  value={formData.license_terms || ''}
  onChange={(e) => updateFormData({ license_terms: e.target.value })}
  rows={4}
  maxLength={1000}
  className="min-h-[44px] sm:min-h-[auto] text-base sm:text-sm"
/>
```

---

### 2. `PhysicalBasicInfoForm.tsx`

#### Correction 1 : Inputs number (prix)

```tsx
// AVANT
<Input
  id="price"
  type="number"
  min="0"
  step="1"
  placeholder="10000"
  value={data.price || ''}
  onChange={(e) => onUpdate({ price: parseFloat(e.target.value) || 0 })}
/>

// APRÈS
<Input
  id="price"
  type="number"
  min="0"
  step="1"
  placeholder="10000"
  value={data.price || ''}
  onChange={(e) => onUpdate({ price: parseFloat(e.target.value) || 0 })}
  className="text-base sm:text-sm"
/>
```

#### Correction 2 : Grille images

```tsx
// AVANT
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">

// APRÈS
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
```

---

### 3. `ServiceBasicInfoForm.tsx`

#### Correction 1 : Inputs number (prix)

```tsx
// AVANT
<Input
  id="price"
  type="number"
  min="0"
  step="0.01"
  placeholder="25000"
  value={data.price || ''}
  onChange={(e) => onUpdate({ price: parseFloat(e.target.value) || 0 })}
  required
/>

// APRÈS
<Input
  id="price"
  type="number"
  min="0"
  step="0.01"
  placeholder="25000"
  value={data.price || ''}
  onChange={(e) => onUpdate({ price: parseFloat(e.target.value) || 0 })}
  required
  className="text-base sm:text-sm"
/>
```

#### Correction 2 : Textarea preview content

```tsx
// AVANT
<Textarea
  id="preview_content_description"
  placeholder="Ex: Consultation gratuite de 15 minutes pour discuter de vos besoins. Le service complet dure 60 minutes."
  value={data.preview_content_description || ''}
  onChange={(e) => onUpdate({ preview_content_description: e.target.value })}
  onKeyDown={handleSpaceKeyDown}
  rows={3}
  maxLength={500}
/>

// APRÈS
<Textarea
  id="preview_content_description"
  placeholder="Ex: Consultation gratuite de 15 minutes pour discuter de vos besoins. Le service complet dure 60 minutes."
  value={data.preview_content_description || ''}
  onChange={(e) => onUpdate({ preview_content_description: e.target.value })}
  onKeyDown={handleSpaceKeyDown}
  rows={3}
  maxLength={500}
  className="min-h-[44px] sm:min-h-[auto] text-base sm:text-sm"
/>
```

---

### 4. `CourseBasicInfoForm.tsx`

#### Correction 1 : Input slug

```tsx
// AVANT
<Input
  id="slug"
  placeholder="maitriser-react-typescript"
  value={formData.slug}
  onChange={(e) => onChange('slug', e.target.value)}
  className={errors.slug ? 'border-red-500' : ''}
/>

// APRÈS
<Input
  id="slug"
  placeholder="maitriser-react-typescript"
  value={formData.slug}
  onChange={(e) => onChange('slug', e.target.value)}
  className={cn(
    "text-base sm:text-sm", // Éviter zoom iOS
    errors.slug && 'border-red-500'
  )}
/>
```

#### Correction 2 : Textarea description courte

```tsx
// AVANT
<Textarea
  id="short_description"
  placeholder="Résumé en une phrase de votre cours..."
  value={formData.short_description}
  onChange={(e) => onChange('short_description', e.target.value)}
  onKeyDown={handleSpaceKeyDown}
  className={errors.short_description ? 'border-red-500' : ''}
  rows={2}
/>

// APRÈS
<Textarea
  id="short_description"
  placeholder="Résumé en une phrase de votre cours..."
  value={formData.short_description}
  onChange={(e) => onChange('short_description', e.target.value)}
  onKeyDown={handleSpaceKeyDown}
  className={cn(
    "min-h-[44px] sm:min-h-[auto] text-base sm:text-sm",
    errors.short_description && 'border-red-500'
  )}
  rows={2}
/>
```

#### Correction 3 : Inputs number (prix)

```tsx
// AVANT
<Input
  id="price"
  type="number"
  min="0"
  step="0.01"
  placeholder="0.00"
  value={formData.price || ''}
  onChange={(e) => onChange('price', parseFloat(e.target.value) || 0)}
  required
/>

// APRÈS
<Input
  id="price"
  type="number"
  min="0"
  step="0.01"
  placeholder="0.00"
  value={formData.price || ''}
  onChange={(e) => onChange('price', parseFloat(e.target.value) || 0)}
  required
  className="text-base sm:text-sm"
/>
```

#### Correction 4 : Textarea conditions licence

```tsx
// AVANT
<Textarea
  id="license_terms"
  placeholder="Détails supplémentaires sur les conditions d'utilisation, restrictions, permissions..."
  value={formData.license_terms || ''}
  onChange={(e) => onChange('license_terms', e.target.value)}
  onKeyDown={handleSpaceKeyDown}
  rows={4}
  maxLength={1000}
/>

// APRÈS
<Textarea
  id="license_terms"
  placeholder="Détails supplémentaires sur les conditions d'utilisation, restrictions, permissions..."
  value={formData.license_terms || ''}
  onChange={(e) => onChange('license_terms', e.target.value)}
  onKeyDown={handleSpaceKeyDown}
  rows={4}
  maxLength={1000}
  className="min-h-[44px] sm:min-h-[auto] text-base sm:text-sm"
/>
```

#### Correction 5 : Zone upload images

```tsx
// AVANT
<label
  htmlFor="images_upload"
  className={cn(
    "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
    uploadingImage ? "bg-muted/70 cursor-not-allowed" : "hover:bg-muted/50",
    "border-muted-foreground/25"
  )}
>

// APRÈS
<label
  htmlFor="images_upload"
  className={cn(
    "flex flex-col items-center justify-center w-full border-2 border-dashed rounded-lg cursor-pointer transition-colors",
    "h-32 sm:h-32 md:h-40 min-h-[120px] touch-manipulation",
    uploadingImage ? "bg-muted/70 cursor-not-allowed" : "hover:bg-muted/50",
    "border-muted-foreground/25"
  )}
>
```

---

### 5. `ArtistBasicInfoForm.tsx`

#### Correction 1 : Grille dimensions

```tsx
// AVANT
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">

// APRÈS
<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
```

#### Correction 2 : Inputs number (dimensions)

```tsx
// AVANT
<Input
  id="artwork_width"
  type="number"
  min="0"
  value={data.artwork_dimensions?.width || ''}
  onChange={(e) => onUpdate({
    artwork_dimensions: {
      ...(data.artwork_dimensions || { width: null, height: null, depth: null, unit: 'cm' }),
      width: e.target.value ? parseFloat(e.target.value) : null
    }
  })}
  placeholder="0"
  onKeyDown={handleSpaceKeyDown}
/>

// APRÈS
<Input
  id="artwork_width"
  type="number"
  min="0"
  value={data.artwork_dimensions?.width || ''}
  onChange={(e) => onUpdate({
    artwork_dimensions: {
      ...(data.artwork_dimensions || { width: null, height: null, depth: null, unit: 'cm' }),
      width: e.target.value ? parseFloat(e.target.value) : null
    }
  })}
  placeholder="0"
  onKeyDown={handleSpaceKeyDown}
  className="text-base sm:text-sm"
/>
```

#### Correction 3 : Inputs URL (réseaux sociaux)

```tsx
// AVANT
<Input
  type="url"
  placeholder="Instagram"
  value={(data.artist_social_links as ArtistSocialLinks)?.instagram || ''}
  onChange={(e) => onUpdate({
    artist_social_links: {
      ...(data.artist_social_links as ArtistSocialLinks || {}),
      instagram: e.target.value
    }
  })}
  onKeyDown={handleSpaceKeyDown}
/>

// APRÈS
<Input
  type="url"
  placeholder="Instagram"
  value={(data.artist_social_links as ArtistSocialLinks)?.instagram || ''}
  onChange={(e) => onUpdate({
    artist_social_links: {
      ...(data.artist_social_links as ArtistSocialLinks || {}),
      instagram: e.target.value
    }
  })}
  onKeyDown={handleSpaceKeyDown}
  className="text-base sm:text-sm"
/>
```

#### Correction 4 : Textarea biographie

```tsx
// AVANT
<Textarea
  id="artist_bio"
  value={data.artist_bio || ''}
  onChange={(e) => onUpdate({ artist_bio: e.target.value })}
  placeholder="Présentez l'artiste, son parcours, son style..."
  rows={4}
  onKeyDown={handleSpaceKeyDown}
/>

// APRÈS
<Textarea
  id="artist_bio"
  value={data.artist_bio || ''}
  onChange={(e) => onUpdate({ artist_bio: e.target.value })}
  placeholder="Présentez l'artiste, son parcours, son style..."
  rows={4}
  onKeyDown={handleSpaceKeyDown}
  className="min-h-[44px] sm:min-h-[auto] text-base sm:text-sm"
/>
```

#### Correction 5 : Textarea description courte

```tsx
// AVANT
<Textarea
  id="short_description"
  value={data.short_description || ''}
  onChange={(e) => onUpdate({ short_description: e.target.value })}
  placeholder="Description courte pour les aperçus (max 160 caractères)"
  rows={2}
  maxLength={160}
  onKeyDown={handleSpaceKeyDown}
/>

// APRÈS
<Textarea
  id="short_description"
  value={data.short_description || ''}
  onChange={(e) => onUpdate({ short_description: e.target.value })}
  placeholder="Description courte pour les aperçus (max 160 caractères)"
  rows={2}
  maxLength={160}
  onKeyDown={handleSpaceKeyDown}
  className="min-h-[44px] sm:min-h-[auto] text-base sm:text-sm"
/>
```

#### Correction 6 : Inputs number (prix)

```tsx
// AVANT
<Input
  id="price"
  type="number"
  min="0"
  step="0.01"
  value={data.price || 0}
  onChange={(e) => onUpdate({ price: parseFloat(e.target.value) || 0 })}
  placeholder="0.00"
  onKeyDown={handleSpaceKeyDown}
/>

// APRÈS
<Input
  id="price"
  type="number"
  min="0"
  step="0.01"
  value={data.price || 0}
  onChange={(e) => onUpdate({ price: parseFloat(e.target.value) || 0 })}
  placeholder="0.00"
  onKeyDown={handleSpaceKeyDown}
  className="text-base sm:text-sm"
/>
```

---

## 🎨 UTILITAIRES CSS GLOBAUX

### Ajouter dans `globals.css` ou composant global

```css
/* Empêcher zoom automatique iOS sur inputs */
@media screen and (max-width: 768px) {
  input[type='number'],
  input[type='url'],
  input[type='email'],
  input[type='tel'] {
    font-size: 16px !important;
  }
}

/* Zones tactiles minimales */
@media (pointer: coarse) {
  button,
  [role='button'],
  a {
    min-height: 44px;
    min-width: 44px;
  }
}
```

---

## ✅ CHECKLIST D'IMPLÉMENTATION

### Phase 1 : Corrections critiques

- [ ] `DigitalBasicInfoForm.tsx`
  - [ ] Textarea description courte
  - [ ] Inputs number (prix, prix promotionnel)
  - [ ] Zone upload images
  - [ ] Textarea conditions licence

- [ ] `PhysicalBasicInfoForm.tsx`
  - [ ] Inputs number (prix, prix comparaison, coût)
  - [ ] Grille images

- [ ] `ServiceBasicInfoForm.tsx`
  - [ ] Inputs number (prix, prix promotionnel)
  - [ ] Textarea preview content

- [ ] `CourseBasicInfoForm.tsx`
  - [ ] Input slug
  - [ ] Textarea description courte
  - [ ] Inputs number (prix, prix promotionnel)
  - [ ] Textarea conditions licence
  - [ ] Zone upload images

- [ ] `ArtistBasicInfoForm.tsx`
  - [ ] Grille dimensions
  - [ ] Inputs number (dimensions, prix, prix comparaison)
  - [ ] Inputs URL (réseaux sociaux, site web, lien œuvre)
  - [ ] Textarea biographie
  - [ ] Textarea description courte

### Phase 2 : Tests

- [ ] Test sur iPhone SE (320px)
- [ ] Test sur iPhone 12/13/14 (390px)
- [ ] Test sur iPhone 14 Pro Max (430px)
- [ ] Test sur Samsung Galaxy S21 (360px)
- [ ] Test sur iPad Mini (768px)

### Phase 3 : Validation

- [ ] Vérifier aucun zoom automatique
- [ ] Vérifier zones tactiles ≥ 44px
- [ ] Vérifier menus s'ouvrent correctement
- [ ] Vérifier zones upload ≥ 120px
- [ ] Vérifier grilles adaptatives

---

## 📝 NOTES

- Tous les `SelectItem` ont déjà `min-h-[44px]` ✅
- Les composants `CurrencySelect` sont déjà optimisés ✅
- Les `RichTextEditorPro` sont déjà optimisés ✅
- Les boutons de navigation sont déjà optimisés ✅

---

**Prochaine étape** : Appliquer les corrections Phase 1, puis tester sur appareils réels.
