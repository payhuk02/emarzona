# 📸 Ajout Photo Artiste et Lien Œuvre
## Date : 28 Février 2025

---

## 📋 RÉSUMÉ

Ajout de deux nouvelles fonctionnalités au système e-commerce d'œuvres d'artistes :
1. **Photo de l'artiste** : Possibilité d'ajouter une photo de profil de l'artiste
2. **Lien de l'œuvre** : Possibilité d'ajouter un lien vers l'œuvre si elle n'est pas physique

---

## ✅ MODIFICATIONS APPORTÉES

### 1. 🗄️ Base de données (`supabase/migrations/20250228_add_artist_photo_and_artwork_link.sql`)

**Nouvelles colonnes ajoutées à `artist_products` :**
- `artist_photo_url` (TEXT, nullable) : URL de la photo de l'artiste
- `artwork_link_url` (TEXT, nullable) : URL vers l'œuvre si non physique

**Index créé :**
- Index sur `artwork_link_url` pour optimiser les recherches

---

### 2. 📝 Types TypeScript (`src/types/artist-product.ts`)

**Champs ajoutés à `ArtistProductFormData` :**
```typescript
artist_photo_url?: string; // Photo de l'artiste
artwork_link_url?: string; // Lien vers l'œuvre si non physique
```

---

### 3. 🎨 Formulaire de base (`src/components/products/create/artist/ArtistBasicInfoForm.tsx`)

**Ajouts :**

#### Photo de l'artiste
- Champ d'upload d'image avec prévisualisation
- Upload vers Supabase Storage (bucket `product-images`, path `artist`)
- Préfixe de fichier : `artist-photo`
- Affichage de la photo en cercle avec possibilité de suppression
- Barre de progression pendant l'upload

**Emplacement :** Section "Informations Artiste", après le champ "Site web / Portfolio"

#### Lien de l'œuvre
- Champ URL conditionnel (affiché uniquement si `requires_shipping = false`)
- Validation du format URL
- Placeholder avec exemples d'utilisation
- Texte d'aide explicatif

**Emplacement :** Section "Informations Œuvre", après les dimensions

---

### 4. 💾 Sauvegarde (`src/components/products/create/artist/CreateArtistProductWizard.tsx`)

**Modifications :**
- Ajout de `artist_photo_url` dans l'insertion `artist_products`
- Ajout de `artwork_link_url` dans l'insertion `artist_products`
- Initialisation des champs dans le state initial

---

### 5. 👁️ Prévisualisation (`src/components/products/create/artist/ArtistPreview.tsx`)

**Ajouts :**
- Affichage de la photo de l'artiste (cercle) à côté du nom
- Affichage du lien de l'œuvre (si présent et non physique) avec icône et lien cliquable
- Import des icônes `LinkIcon` et `ImageIcon`

---

## 🎯 FONCTIONNALITÉS

### Photo de l'artiste
- ✅ Upload d'image (JPEG, JPG, PNG, WebP)
- ✅ Prévisualisation avant sauvegarde
- ✅ Suppression de la photo
- ✅ Barre de progression pendant l'upload
- ✅ Stockage dans Supabase Storage
- ✅ Affichage dans la prévisualisation

### Lien de l'œuvre
- ✅ Champ conditionnel (affiché si œuvre non physique)
- ✅ Validation URL
- ✅ Lien cliquable dans la prévisualisation
- ✅ Texte d'aide avec exemples

---

## 📍 EMPLACEMENTS DANS LE WIZARD

### Étape 2 : Informations de base
1. **Section "Informations Artiste"**
   - Nom de l'artiste *
   - Biographie
   - Site web / Portfolio
   - **Photo de l'artiste** ← NOUVEAU
   - Réseaux sociaux

2. **Section "Informations Œuvre"**
   - Titre de l'œuvre *
   - Année de création
   - Médium / Technique *
   - Dimensions
   - **Lien vers l'œuvre** ← NOUVEAU (si non physique)

### Étape 8 : Aperçu
- Photo de l'artiste affichée à côté du nom
- Lien de l'œuvre affiché avec icône (si présent)

---

## 🔄 LOGIQUE CONDITIONNELLE

Le champ **"Lien vers l'œuvre"** s'affiche uniquement si :
- `requires_shipping = false` (œuvre non physique)

Cette logique est gérée dans :
- `ArtistBasicInfoForm.tsx` : Affichage conditionnel du champ
- `ArtistShippingConfig.tsx` : Switch pour activer/désactiver l'expédition
- `ArtistPreview.tsx` : Affichage conditionnel du lien

---

## 📊 EXEMPLES D'UTILISATION

### Photo de l'artiste
- Photo de profil professionnelle
- Portrait de l'artiste
- Logo/avatar de l'artiste

### Lien de l'œuvre (non physique)
- **Écrivain** : Lien vers livre numérique, plateforme de lecture
- **Musicien** : Lien vers streaming (Spotify, YouTube Music, etc.)
- **Artiste visuel** : Lien vers galerie en ligne, portfolio
- **Designer** : Lien vers fichier téléchargeable, template
- **Multimédia** : Lien vers vidéo YouTube, installation interactive, NFT

---

## 🚀 PROCHAINES ÉTAPES (Optionnel)

1. **Validation avancée** : Vérifier que le lien pointe vers un domaine valide
2. **Prévisualisation du lien** : Afficher un aperçu (Open Graph) du lien
3. **Galerie de photos** : Permettre plusieurs photos de l'artiste
4. **Intégration sociale** : Utiliser la photo de l'artiste dans les partages sociaux

---

## 📝 NOTES TECHNIQUES

- **Upload** : Utilise `uploadToSupabaseStorage` avec gestion d'erreurs
- **Validation** : Type URL natif du navigateur
- **Stockage** : Supabase Storage (bucket `product-images`)
- **Performance** : Index sur `artwork_link_url` pour recherches rapides

---

**Date de création** : 28 Février 2025  
**Version** : 1.0

## Date : 28 Février 2025

---

## 📋 RÉSUMÉ

Ajout de deux nouvelles fonctionnalités au système e-commerce d'œuvres d'artistes :
1. **Photo de l'artiste** : Possibilité d'ajouter une photo de profil de l'artiste
2. **Lien de l'œuvre** : Possibilité d'ajouter un lien vers l'œuvre si elle n'est pas physique

---

## ✅ MODIFICATIONS APPORTÉES

### 1. 🗄️ Base de données (`supabase/migrations/20250228_add_artist_photo_and_artwork_link.sql`)

**Nouvelles colonnes ajoutées à `artist_products` :**
- `artist_photo_url` (TEXT, nullable) : URL de la photo de l'artiste
- `artwork_link_url` (TEXT, nullable) : URL vers l'œuvre si non physique

**Index créé :**
- Index sur `artwork_link_url` pour optimiser les recherches

---

### 2. 📝 Types TypeScript (`src/types/artist-product.ts`)

**Champs ajoutés à `ArtistProductFormData` :**
```typescript
artist_photo_url?: string; // Photo de l'artiste
artwork_link_url?: string; // Lien vers l'œuvre si non physique
```

---

### 3. 🎨 Formulaire de base (`src/components/products/create/artist/ArtistBasicInfoForm.tsx`)

**Ajouts :**

#### Photo de l'artiste
- Champ d'upload d'image avec prévisualisation
- Upload vers Supabase Storage (bucket `product-images`, path `artist`)
- Préfixe de fichier : `artist-photo`
- Affichage de la photo en cercle avec possibilité de suppression
- Barre de progression pendant l'upload

**Emplacement :** Section "Informations Artiste", après le champ "Site web / Portfolio"

#### Lien de l'œuvre
- Champ URL conditionnel (affiché uniquement si `requires_shipping = false`)
- Validation du format URL
- Placeholder avec exemples d'utilisation
- Texte d'aide explicatif

**Emplacement :** Section "Informations Œuvre", après les dimensions

---

### 4. 💾 Sauvegarde (`src/components/products/create/artist/CreateArtistProductWizard.tsx`)

**Modifications :**
- Ajout de `artist_photo_url` dans l'insertion `artist_products`
- Ajout de `artwork_link_url` dans l'insertion `artist_products`
- Initialisation des champs dans le state initial

---

### 5. 👁️ Prévisualisation (`src/components/products/create/artist/ArtistPreview.tsx`)

**Ajouts :**
- Affichage de la photo de l'artiste (cercle) à côté du nom
- Affichage du lien de l'œuvre (si présent et non physique) avec icône et lien cliquable
- Import des icônes `LinkIcon` et `ImageIcon`

---

## 🎯 FONCTIONNALITÉS

### Photo de l'artiste
- ✅ Upload d'image (JPEG, JPG, PNG, WebP)
- ✅ Prévisualisation avant sauvegarde
- ✅ Suppression de la photo
- ✅ Barre de progression pendant l'upload
- ✅ Stockage dans Supabase Storage
- ✅ Affichage dans la prévisualisation

### Lien de l'œuvre
- ✅ Champ conditionnel (affiché si œuvre non physique)
- ✅ Validation URL
- ✅ Lien cliquable dans la prévisualisation
- ✅ Texte d'aide avec exemples

---

## 📍 EMPLACEMENTS DANS LE WIZARD

### Étape 2 : Informations de base
1. **Section "Informations Artiste"**
   - Nom de l'artiste *
   - Biographie
   - Site web / Portfolio
   - **Photo de l'artiste** ← NOUVEAU
   - Réseaux sociaux

2. **Section "Informations Œuvre"**
   - Titre de l'œuvre *
   - Année de création
   - Médium / Technique *
   - Dimensions
   - **Lien vers l'œuvre** ← NOUVEAU (si non physique)

### Étape 8 : Aperçu
- Photo de l'artiste affichée à côté du nom
- Lien de l'œuvre affiché avec icône (si présent)

---

## 🔄 LOGIQUE CONDITIONNELLE

Le champ **"Lien vers l'œuvre"** s'affiche uniquement si :
- `requires_shipping = false` (œuvre non physique)

Cette logique est gérée dans :
- `ArtistBasicInfoForm.tsx` : Affichage conditionnel du champ
- `ArtistShippingConfig.tsx` : Switch pour activer/désactiver l'expédition
- `ArtistPreview.tsx` : Affichage conditionnel du lien

---

## 📊 EXEMPLES D'UTILISATION

### Photo de l'artiste
- Photo de profil professionnelle
- Portrait de l'artiste
- Logo/avatar de l'artiste

### Lien de l'œuvre (non physique)
- **Écrivain** : Lien vers livre numérique, plateforme de lecture
- **Musicien** : Lien vers streaming (Spotify, YouTube Music, etc.)
- **Artiste visuel** : Lien vers galerie en ligne, portfolio
- **Designer** : Lien vers fichier téléchargeable, template
- **Multimédia** : Lien vers vidéo YouTube, installation interactive, NFT

---

## 🚀 PROCHAINES ÉTAPES (Optionnel)

1. **Validation avancée** : Vérifier que le lien pointe vers un domaine valide
2. **Prévisualisation du lien** : Afficher un aperçu (Open Graph) du lien
3. **Galerie de photos** : Permettre plusieurs photos de l'artiste
4. **Intégration sociale** : Utiliser la photo de l'artiste dans les partages sociaux

---

## 📝 NOTES TECHNIQUES

- **Upload** : Utilise `uploadToSupabaseStorage` avec gestion d'erreurs
- **Validation** : Type URL natif du navigateur
- **Stockage** : Supabase Storage (bucket `product-images`)
- **Performance** : Index sur `artwork_link_url` pour recherches rapides

---

**Date de création** : 28 Février 2025  
**Version** : 1.0










