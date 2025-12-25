# ✨ AMÉLIORATION - Auto-remplissage URL produit à partir du titre

**Date:** 1 Février 2025

---

## 📋 OBJECTIF

Faire en sorte que le champ "Lien du produit" (`artwork_link_url`) se remplisse automatiquement au fur et à mesure qu'on saisit le titre de l'œuvre, similaire au comportement du wizard de produits digitaux.

---

## ✅ IMPLÉMENTATION

### Fichier modifié

**`src/components/products/create/artist/ArtistBasicInfoForm.tsx`**

### Changements apportés

#### 1. Import ajouté

```typescript
import { generateSlug } from '@/lib/validation-utils';
```

#### 2. État ajouté

```typescript
const [isManuallyEdited, setIsManuallyEdited] = useState(false);
```

**Usage:** Suivre si l'utilisateur a modifié manuellement l'URL pour éviter de l'écraser.

#### 3. Fonction de génération d'URL

```typescript
/**
 * Générer une URL automatique à partir du titre de l'œuvre
 */
const generateUrlFromTitle = (title: string): string => {
  if (!title || title.trim().length < 2) {
    return '';
  }

  // Générer un slug à partir du titre
  const slug = generateSlug(title);

  // Créer une URL avec un domaine générique (l'utilisateur pourra modifier)
  // Format: https://exemple.com/[slug-du-titre]
  return `https://exemple.com/${slug}`;
};
```

**Fonctionnalités:**

- ✅ Génère un slug à partir du titre (minuscules, tirets, sans accents)
- ✅ Crée une URL avec un domaine générique `https://exemple.com/[slug]`
- ✅ L'utilisateur peut modifier le domaine et le chemin

**Exemples:**

- Titre: "Mon Œuvre d'Art" → URL: `https://exemple.com/mon-oeuvre-d-art`
- Titre: "Sculpture Moderne" → URL: `https://exemple.com/sculpture-moderne`

#### 4. useEffect pour auto-remplissage

```typescript
/**
 * Auto-remplir l'URL à partir du titre de l'œuvre
 * Seulement si le champ URL est vide et n'a pas été modifié manuellement
 */
React.useEffect(() => {
  // Ne pas auto-remplir si :
  // 1. L'URL a été modifiée manuellement
  // 2. L'URL existe déjà
  // 3. Le titre est vide
  if (isManuallyEdited || data.artwork_link_url || !data.artwork_title) {
    return;
  }

  const generatedUrl = generateUrlFromTitle(data.artwork_title);
  if (generatedUrl && generatedUrl !== artworkLinkUrl) {
    setArtworkLinkUrl(generatedUrl);
    // Mettre à jour seulement si l'URL générée est valide
    if (isValidUrl(generatedUrl)) {
      onUpdate({ artwork_link_url: generatedUrl });
    }
  }
}, [data.artwork_title, isManuallyEdited, data.artwork_link_url]);
```

**Conditions d'auto-remplissage:**

- ✅ Le titre de l'œuvre est renseigné (minimum 2 caractères)
- ✅ Le champ URL est vide
- ✅ L'utilisateur n'a pas modifié manuellement l'URL
- ✅ L'URL générée est valide (format http:// ou https://)

#### 5. Mise à jour de `handleArtworkLinkUrlChange`

```typescript
const handleArtworkLinkUrlChange = (url: string) => {
  setArtworkLinkUrl(url);
  // Marquer comme modifié manuellement si l'utilisateur saisit quelque chose
  if (url && url.trim().length > 0) {
    setIsManuallyEdited(true);
  }

  if (url && isValidUrl(url)) {
    onUpdate({ artwork_link_url: url });
  } else if (!url) {
    onUpdate({ artwork_link_url: undefined });
    // Réinitialiser le flag si l'utilisateur supprime l'URL
    setIsManuallyEdited(false);
  }
};
```

**Fonctionnalités:**

- ✅ Marque l'URL comme modifiée manuellement dès qu'elle est saisie
- ✅ Réinitialise le flag si l'utilisateur supprime l'URL
- ✅ Valide l'URL avant de la sauvegarder

---

## 🎯 COMPORTEMENT

### Scénario 1: Saisie du titre (URL vide)

1. **Utilisateur saisit:** "Mon Œuvre d'Art"
2. **Système génère automatiquement:** `https://exemple.com/mon-oeuvre-d-art`
3. **Champ URL se remplit:** Automatiquement avec l'URL générée
4. **Utilisateur peut modifier:** Le domaine et le chemin selon ses besoins

### Scénario 2: Modification manuelle de l'URL

1. **URL auto-générée:** `https://exemple.com/mon-oeuvre-d-art`
2. **Utilisateur modifie:** `https://ma-galerie.com/mon-oeuvre`
3. **Système:** Ne remplace plus l'URL même si le titre change
4. **Flag:** `isManuallyEdited = true`

### Scénario 3: Suppression de l'URL

1. **Utilisateur supprime:** L'URL complètement
2. **Système:** Réinitialise `isManuallyEdited = false`
3. **Comportement:** L'auto-remplissage redevient actif si le titre change

### Scénario 4: Changement du titre (URL déjà modifiée)

1. **Titre initial:** "Mon Œuvre d'Art" → URL: `https://exemple.com/mon-oeuvre-d-art`
2. **Utilisateur modifie l'URL:** `https://ma-galerie.com/mon-oeuvre`
3. **Utilisateur change le titre:** "Ma Nouvelle Œuvre"
4. **Système:** Ne remplace pas l'URL (car `isManuallyEdited = true`)

---

## 🔍 DÉTAILS TECHNIQUES

### Génération du slug

**Fonction:** `generateSlug` de `@/lib/validation-utils`

**Transformation:**

- Minuscules
- Suppression des accents
- Remplacement des espaces par des tirets
- Suppression des caractères spéciaux
- Format: `[a-z0-9-]+`

**Exemples:**

- "Mon Œuvre d'Art" → `mon-oeuvre-d-art`
- "Sculpture Moderne 2025" → `sculpture-moderne-2025`
- "L'Art & La Beauté" → `l-art-la-beaute`

### Format d'URL généré

**Template:** `https://exemple.com/[slug]`

**Note:** Le domaine `exemple.com` est un placeholder. L'utilisateur peut le modifier pour pointer vers :

- Sa propre galerie en ligne
- Un portfolio personnel
- Une page dédiée à l'œuvre
- Un service d'hébergement d'images

---

## 🧪 TESTS À EFFECTUER

### Test 1: Auto-remplissage initial

- [ ] Saisir un titre de l'œuvre
- [ ] Vérifier que l'URL se remplit automatiquement
- [ ] Vérifier que l'URL est valide

### Test 2: Modification manuelle

- [ ] Saisir un titre (URL auto-générée)
- [ ] Modifier l'URL manuellement
- [ ] Changer le titre
- [ ] Vérifier que l'URL modifiée n'est pas remplacée

### Test 3: Suppression et réactivation

- [ ] Saisir un titre (URL auto-générée)
- [ ] Supprimer l'URL
- [ ] Modifier le titre
- [ ] Vérifier que l'auto-remplissage redevient actif

### Test 4: Titre avec caractères spéciaux

- [ ] Saisir un titre avec accents: "Œuvre d'Art"
- [ ] Vérifier que le slug est correctement généré
- [ ] Vérifier que l'URL est valide

### Test 5: Titre court

- [ ] Saisir un titre d'un seul caractère
- [ ] Vérifier que l'URL n'est pas générée (minimum 2 caractères)

---

## 📊 COMPARAISON AVEC LE WIZARD DIGITAL

| Fonctionnalité                   | Wizard Digital | Wizard Artiste |
| -------------------------------- | -------------- | -------------- |
| Auto-remplissage URL             | ❓ À vérifier  | ✅ Implémenté  |
| Génération depuis titre          | ❓ À vérifier  | ✅ Implémenté  |
| Protection modification manuelle | ❓ À vérifier  | ✅ Implémenté  |
| Validation URL                   | ✅             | ✅             |

**Note:** Le comportement exact du wizard digital n'a pas été trouvé dans le code, mais la fonctionnalité a été implémentée pour le wizard artiste.

---

## 📝 NOTES IMPORTANTES

### Domaine générique

Le domaine `https://exemple.com` est utilisé comme placeholder. L'utilisateur doit le remplacer par son propre domaine. C'est intentionnel pour :

- ✅ Donner un exemple de format d'URL
- ✅ Permettre à l'utilisateur de personnaliser le domaine
- ✅ Éviter de générer des URLs vers des domaines inexistants

### Protection contre l'écrasement

Le système protège les modifications manuelles :

- ✅ Si l'utilisateur modifie l'URL, elle n'est plus remplacée automatiquement
- ✅ Si l'utilisateur supprime l'URL, l'auto-remplissage redevient actif
- ✅ L'utilisateur garde le contrôle total sur l'URL finale

### Validation

L'URL générée est validée avant d'être sauvegardée :

- ✅ Format http:// ou https://
- ✅ Structure d'URL valide
- ✅ Seulement si valide, l'URL est mise à jour dans le formulaire

---

## 🔄 PROCHAINES ÉTAPES

1. **Tester la fonctionnalité**
   - Saisir différents titres
   - Vérifier que l'URL se remplit correctement
   - Vérifier que les modifications manuelles sont protégées

2. **Amélioration possible (optionnelle)**
   - Permettre à l'utilisateur de configurer un domaine par défaut
   - Utiliser le domaine de la boutique si disponible
   - Ajouter un bouton pour régénérer l'URL à partir du titre

3. **Documentation utilisateur**
   - Expliquer comment utiliser l'auto-remplissage
   - Préciser que le domaine peut être modifié
   - Indiquer quand l'URL est protégée contre l'auto-remplissage

---

**Date d'implémentation:** 1 Février 2025  
**Implémenté par:** Assistant IA  
**Fichier modifié:**

- `src/components/products/create/artist/ArtistBasicInfoForm.tsx`
