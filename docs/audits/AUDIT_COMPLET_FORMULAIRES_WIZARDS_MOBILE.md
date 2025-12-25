# 🔍 AUDIT COMPLET - FORMULAIRES WIZARDS MOBILE

## Édition de tous les champs et menus de sélection

**Date** : 28 Janvier 2025  
**Objectif** : Audit complet de l'édition de tous les champs et menus de sélection des 5 wizards e-commerce sur mobile  
**Portée** : Produits digitaux, physiques, services, cours en ligne, œuvres d'artiste

---

## 📋 RÉSUMÉ EXÉCUTIF

### Problèmes identifiés

1. **Menus Select** : Certains SelectItems n'ont pas la classe `min-h-[44px]` requise pour mobile
2. **Inputs** : Taille de police variable sur mobile (zoom iOS)
3. **Textareas** : Manque de padding tactile optimal
4. **Boutons** : Zones de touch parfois < 44px
5. **Grilles** : Certaines grilles ne s'adaptent pas bien sur très petits écrans
6. **Labels** : Certains labels manquent de contraste ou sont trop petits
7. **Validation** : Messages d'erreur parfois coupés sur mobile
8. **Upload images** : Zones de drop parfois trop petites sur mobile

---

## 🔎 AUDIT DÉTAILLÉ PAR WIZARD

### 1. WIZARD PRODUITS DIGITAUX (`CreateDigitalProductWizard_v2`)

#### Étape 1 : Informations de base (`DigitalBasicInfoForm`)

**Champs analysés :**

| Champ                 | Type           | Problèmes identifiés                       | Priorité |
| --------------------- | -------------- | ------------------------------------------ | -------- |
| Nom du produit        | Input text     | ✅ Bon (utilise `useSpaceInputFix`)        | -        |
| URL du produit (slug) | Input text     | ✅ Bon                                     | -        |
| Catégorie             | Select         | ⚠️ `SelectItem` avec `min-h-[44px]` ✅     | Basse    |
| Description courte    | Textarea       | ⚠️ Manque `min-h-[44px]` pour zone tactile | Moyenne  |
| Description complète  | RichTextEditor | ✅ Bon                                     | -        |
| Prix                  | Input number   | ⚠️ Taille police mobile (zoom iOS)         | Moyenne  |
| Devise                | CurrencySelect | ✅ Bon (composant optimisé)                | -        |
| Prix promotionnel     | Input number   | ⚠️ Taille police mobile                    | Moyenne  |
| Modèle tarification   | Select         | ✅ `SelectItem` avec `min-h-[44px]`        | -        |
| Images                | File upload    | ⚠️ Zone de drop trop petite sur mobile     | Haute    |
| Type de licence       | Select         | ✅ `SelectItem` avec `min-h-[44px]`        | -        |
| Conditions licence    | Textarea       | ⚠️ Manque `min-h-[44px]`                   | Moyenne  |

**Corrections proposées :**

```tsx
// 1. Textarea - Ajouter min-h pour zone tactile
<Textarea
  id="short_description"
  className="min-h-[44px] sm:min-h-[auto]" // Zone tactile mobile
  // ...
/>

// 2. Input number - Forcer taille police 16px sur mobile
<Input
  id="price"
  type="number"
  className="text-base sm:text-sm" // Éviter zoom iOS
  // ...
/>

// 3. Zone upload images - Agrandir sur mobile
<label
  htmlFor="images_upload"
  className={cn(
    "flex flex-col items-center justify-center",
    "h-32 sm:h-32 md:h-40", // Plus grand sur mobile
    "border-2 border-dashed rounded-lg cursor-pointer",
    "min-h-[120px] touch-manipulation", // Zone tactile minimale
    // ...
  )}
>
```

---

### 2. WIZARD PRODUITS PHYSIQUES (`CreatePhysicalProductWizard_v2`)

#### Étape 1 : Informations de base (`PhysicalBasicInfoForm`)

**Champs analysés :**

| Champ               | Type           | Problèmes identifiés                         | Priorité |
| ------------------- | -------------- | -------------------------------------------- | -------- |
| Nom du produit      | Input text     | ✅ Bon                                       | -        |
| Description         | RichTextEditor | ✅ Bon                                       | -        |
| Prix de vente       | Input number   | ⚠️ Taille police mobile                      | Moyenne  |
| Prix de comparaison | Input number   | ⚠️ Taille police mobile                      | Moyenne  |
| Coût par article    | Input number   | ⚠️ Taille police mobile                      | Moyenne  |
| Images              | File upload    | ⚠️ Grille 2 cols sur mobile peut être serrée | Moyenne  |
| Tags                | Input + Badges | ⚠️ Bouton suppression tag < 44px             | Haute    |

**Corrections proposées :**

```tsx
// 1. Input number - Forcer taille police
<Input
  id="price"
  type="number"
  className="text-base sm:text-sm" // Éviter zoom iOS
  // ...
/>

// 2. Bouton suppression tag - Agrandir zone tactile
<button
  onClick={() => handleTagRemove(index)}
  className="hover:text-destructive transition-colors duration-200 rounded-sm p-0.5 hover:bg-destructive/10 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center" // ✅ Déjà corrigé
  aria-label={`Supprimer le tag "${tag}"`}
>
  <X className="h-4 w-4" aria-hidden="true" />
</button>

// 3. Grille images - Adapter pour très petits écrans
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
  {/* ... */}
</div>
```

---

### 3. WIZARD SERVICES (`CreateServiceWizard_v2`)

#### Étape 1 : Informations de base (`ServiceBasicInfoForm`)

**Champs analysés :**

| Champ               | Type           | Problèmes identifiés                | Priorité |
| ------------------- | -------------- | ----------------------------------- | -------- |
| Type de service     | Select         | ✅ `SelectItem` avec `min-h-[44px]` | -        |
| Nom du service      | Input text     | ✅ Bon                              | -        |
| Description         | RichTextEditor | ✅ Bon                              | -        |
| Prix                | Input number   | ⚠️ Taille police mobile             | Moyenne  |
| Devise              | CurrencySelect | ✅ Bon                              | -        |
| Prix promotionnel   | Input number   | ⚠️ Taille police mobile             | Moyenne  |
| Modèle tarification | Select         | ✅ `SelectItem` avec `min-h-[44px]` | -        |
| Images              | File upload    | ⚠️ Zone de drop                     | Moyenne  |
| Tags                | Input + Badges | ⚠️ Bouton suppression tag           | Haute    |

**Corrections proposées :**

```tsx
// Identiques aux produits physiques
// Voir section 2
```

---

### 4. WIZARD COURS EN LIGNE (`CreateCourseWizard`)

#### Étape 1 : Informations de base (`CourseBasicInfoForm`)

**Champs analysés :**

| Champ                | Type           | Problèmes identifiés                | Priorité |
| -------------------- | -------------- | ----------------------------------- | -------- |
| Titre du cours       | Input text     | ✅ Bon                              | -        |
| URL du cours (slug)  | Input text     | ⚠️ Taille police mobile             | Moyenne  |
| Description courte   | Textarea       | ⚠️ Manque `min-h-[44px]`            | Moyenne  |
| Description complète | RichTextEditor | ✅ Bon                              | -        |
| Niveau               | Select         | ✅ `SelectItem` avec `min-h-[44px]` | -        |
| Langue               | Select         | ✅ `SelectItem` avec `min-h-[44px]` | -        |
| Catégorie            | Select         | ✅ `SelectItem` avec `min-h-[44px]` | -        |
| Prix                 | Input number   | ⚠️ Taille police mobile             | Moyenne  |
| Devise               | CurrencySelect | ✅ Bon                              | -        |
| Prix promotionnel    | Input number   | ⚠️ Taille police mobile             | Moyenne  |
| Modèle tarification  | Select         | ✅ `SelectItem` avec `min-h-[44px]` | -        |
| Images               | File upload    | ⚠️ Zone de drop                     | Moyenne  |
| Type de licence      | Select         | ✅ `SelectItem` avec `min-h-[44px]` | -        |
| Conditions licence   | Textarea       | ⚠️ Manque `min-h-[44px]`            | Moyenne  |

**Corrections proposées :**

```tsx
// 1. Slug input - Forcer taille police
<div className="flex items-center gap-2">
  <span className="text-sm text-muted-foreground">/courses/</span>
  <Input
    id="slug"
    className="text-base sm:text-sm" // Éviter zoom iOS
    // ...
  />
</div>

// 2. Textarea description courte
<Textarea
  id="short_description"
  className="min-h-[44px] sm:min-h-[auto]"
  // ...
/>

// 3. Textarea conditions licence
<Textarea
  id="license_terms"
  className="min-h-[44px] sm:min-h-[auto]"
  // ...
/>
```

---

### 5. WIZARD ŒUVRES D'ARTISTE (`CreateArtistProductWizard`)

#### Étape 2 : Informations de base (`ArtistBasicInfoForm`)

**Champs analysés :**

| Champ              | Type              | Problèmes identifiés                    | Priorité |
| ------------------ | ----------------- | --------------------------------------- | -------- |
| Photo artiste      | File upload       | ✅ Bon (zone tactile OK)                | -        |
| Nom artiste        | Input text        | ✅ Bon                                  | -        |
| Biographie artiste | Textarea          | ⚠️ Manque `min-h-[44px]`                | Moyenne  |
| Site web artiste   | Input url         | ⚠️ Taille police mobile                 | Moyenne  |
| Réseaux sociaux    | Input url (×4)    | ⚠️ Taille police mobile                 | Moyenne  |
| Titre œuvre        | Input text        | ✅ Bon                                  | -        |
| Année création     | Input number      | ⚠️ Taille police mobile                 | Moyenne  |
| Médium             | Input text        | ✅ Bon                                  | -        |
| Dimensions         | Input number (×3) | ⚠️ Taille police mobile + grille serrée | Haute    |
| Lien œuvre         | Input url         | ⚠️ Taille police mobile                 | Moyenne  |
| Images œuvre       | File upload       | ⚠️ Zone de drop                         | Moyenne  |
| Description        | RichTextEditor    | ✅ Bon                                  | -        |
| Description courte | Textarea          | ⚠️ Manque `min-h-[44px]`                | Moyenne  |
| Prix               | Input number      | ⚠️ Taille police mobile                 | Moyenne  |
| Prix comparaison   | Input number      | ⚠️ Taille police mobile                 | Moyenne  |

**Corrections proposées :**

```tsx
// 1. Grille dimensions - Adapter pour mobile
<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
  {/* Largeur, Hauteur, Unité */}
  <div>
    <Label htmlFor="artwork_width" className="text-xs sm:text-sm">
      Largeur
    </Label>
    <Input
      id="artwork_width"
      type="number"
      className="text-base sm:text-sm" // Éviter zoom iOS
      // ...
    />
  </div>
  {/* ... */}
</div>

// 2. Inputs URL - Forcer taille police
<Input
  type="url"
  className="text-base sm:text-sm" // Éviter zoom iOS
  // ...
/>

// 3. Textareas - Ajouter min-h
<Textarea
  className="min-h-[44px] sm:min-h-[auto]"
  // ...
/>
```

---

## 🎯 CORRECTIONS PRIORITAIRES

### Priorité HAUTE

1. **Zones de touch < 44px**
   - Boutons de suppression (tags, images)
   - Boutons d'action dans les grilles
   - **Solution** : Ajouter `min-h-[44px] min-w-[44px]` à tous les boutons tactiles

2. **Grilles trop serrées sur mobile**
   - Dimensions (artiste)
   - Images (tous wizards)
   - **Solution** : Utiliser `grid-cols-1` sur très petits écrans, `grid-cols-2` sur mobile standard

3. **Zones d'upload trop petites**
   - **Solution** : Augmenter `min-h-[120px]` sur mobile

### Priorité MOYENNE

1. **Taille de police sur inputs number/url**
   - Zoom automatique iOS
   - **Solution** : Ajouter `text-base` sur mobile, `sm:text-sm` sur desktop

2. **Textareas sans zone tactile minimale**
   - **Solution** : Ajouter `min-h-[44px]` sur mobile

3. **Labels trop petits**
   - **Solution** : Utiliser `text-xs sm:text-sm` pour les labels secondaires

### Priorité BASSE

1. **Espacement entre champs**
   - **Solution** : Utiliser `space-y-4 sm:space-y-6` pour plus d'espace sur mobile

2. **Messages d'erreur coupés**
   - **Solution** : Ajouter `break-words` et `max-w-full`

---

## 📝 PLAN D'ACTION

### Phase 1 : Corrections critiques (Priorité HAUTE)

1. ✅ Vérifier tous les boutons tactiles ont `min-h-[44px] min-w-[44px]`
2. ✅ Adapter toutes les grilles pour mobile (`grid-cols-1` sur très petits écrans)
3. ✅ Agrandir zones d'upload (`min-h-[120px]`)

### Phase 2 : Améliorations UX (Priorité MOYENNE)

1. ✅ Ajouter `text-base` sur tous les inputs number/url
2. ✅ Ajouter `min-h-[44px]` sur tous les textareas
3. ✅ Améliorer taille des labels secondaires

### Phase 3 : Polish (Priorité BASSE)

1. ✅ Ajuster espacements
2. ✅ Améliorer messages d'erreur
3. ✅ Tests finaux sur différents appareils

---

## 🧪 TESTS RECOMMANDÉS

### Appareils de test

- iPhone SE (320px)
- iPhone 12/13/14 (390px)
- iPhone 14 Pro Max (430px)
- Samsung Galaxy S21 (360px)
- iPad Mini (768px)

### Scénarios de test

1. **Saisie de texte**
   - Vérifier pas de zoom automatique sur inputs
   - Vérifier espacement correct
   - Vérifier clavier ne cache pas les champs

2. **Sélection dans menus**
   - Vérifier menus s'ouvrent correctement
   - Vérifier options cliquables (44px minimum)
   - Vérifier menu ne se ferme pas prématurément

3. **Upload d'images**
   - Vérifier zone de drop suffisamment grande
   - Vérifier feedback visuel clair
   - Vérifier progression upload visible

4. **Navigation**
   - Vérifier boutons précédent/suivant accessibles
   - Vérifier pas de chevauchement avec clavier
   - Vérifier scroll fluide

---

## 📊 MÉTRIQUES DE SUCCÈS

- ✅ Tous les éléments tactiles ≥ 44px
- ✅ Aucun zoom automatique sur inputs
- ✅ Tous les menus s'ouvrent correctement
- ✅ Zones d'upload ≥ 120px de hauteur
- ✅ Grilles adaptatives sur tous les écrans
- ✅ Labels lisibles (≥ 12px sur mobile)
- ✅ Messages d'erreur complets et visibles

---

## 🔗 RÉFÉRENCES

- [Apple Human Interface Guidelines - Touch Targets](https://developer.apple.com/design/human-interface-guidelines/components/selection-and-input/touch-targets/)
- [Material Design - Touch Targets](https://material.io/design/usability/accessibility.html#layout-typography)
- [WCAG 2.1 - Target Size](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)

---

**Prochaines étapes** : Implémenter les corrections Phase 1, puis tester sur appareils réels.
