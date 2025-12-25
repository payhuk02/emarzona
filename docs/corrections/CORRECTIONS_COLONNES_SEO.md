# 🔧 CORRECTIONS COLONNES SEO - PRODUITS

**Date** : 31 Janvier 2025  
**Problème** : Colonnes SEO inexistantes dans la table `products`

---

## ❌ PROBLÈME IDENTIFIÉ

Lors de la sauvegarde d'un brouillon de produit, les erreurs suivantes apparaissaient :
1. `Could not find the 'meta_keywords' column of 'products' in the schema cache`
2. `Could not find the 'og_description' column of 'products' in the schema cache`
3. `Could not find the 'og_title' column of 'products' in the schema cache`

---

## ✅ COLONNES EXISTANTES DANS LA TABLE `products`

D'après le schéma Supabase (`src/integrations/supabase/types.ts`), les colonnes SEO suivantes **existent** :
- ✅ `meta_title` (string | null)
- ✅ `meta_description` (string | null)
- ✅ `og_image` (string | null)

---

## ❌ COLONNES QUI N'EXISTENT PAS

Les colonnes suivantes **n'existent pas** dans la table `products` :
- ❌ `meta_keywords` (présent dans le type mais pas dans la base réelle)
- ❌ `og_title`
- ❌ `og_description`

---

## 🔧 CORRECTIONS APPLIQUÉES

### 1. CreateDigitalProductWizard_v2.tsx ✅

**Avant** :
```typescript
meta_keywords: formData.seo?.meta_keywords,
og_title: formData.seo?.og_title,
og_description: formData.seo?.og_description,
```

**Après** :
```typescript
// Note: meta_keywords, og_title, og_description are not saved to DB (columns don't exist)
```

**Fichier** : `src/components/products/create/digital/CreateDigitalProductWizard_v2.tsx`

### 2. CreatePhysicalProductWizard_v2.tsx ✅

**Même correction appliquée**

**Fichier** : `src/components/products/create/physical/CreatePhysicalProductWizard_v2.tsx`

### 3. CreateServiceWizard_v2.tsx ✅

**Même correction appliquée**

**Fichier** : `src/components/products/create/service/CreateServiceWizard_v2.tsx`

### 4. ProductForm.tsx ✅

**Avant** :
```typescript
const { meta_keywords, ...formDataWithoutMetaKeywords } = formData;
```

**Après** :
```typescript
// Retirer les colonnes qui n'existent pas dans la table products
const { meta_keywords, og_title, og_description, ...formDataCleaned } = formData;
```

**Fichier** : `src/components/products/ProductForm.tsx`

---

## ✅ RÉSULTAT

- ✅ Le bouton "Sauvegarder un brouillon" fonctionne sans erreur
- ✅ Le bouton "Suivant" fonctionne correctement (validation + navigation)
- ✅ Les champs SEO restent dans l'interface pour l'analyse, mais seules les colonnes existantes sont sauvegardées

---

## 📝 NOTE IMPORTANTE

Les champs `meta_keywords`, `og_title`, et `og_description` restent disponibles dans l'interface utilisateur pour :
- L'analyse SEO
- L'affichage dans les formulaires
- Les suggestions et recommandations

Cependant, ces valeurs **ne sont pas sauvegardées** dans la base de données car les colonnes n'existent pas.

Si vous souhaitez sauvegarder ces valeurs à l'avenir, il faudra :
1. Créer une migration Supabase pour ajouter ces colonnes
2. Mettre à jour le schéma TypeScript
3. Réactiver la sauvegarde de ces champs

---

**Dernière mise à jour** : 31 Janvier 2025

