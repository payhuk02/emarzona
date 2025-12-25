# 🚀 PHASE 3 - PLAN D'ACTION

## Date : 2025 - Optimisations Moyenne Priorité

---

## 📋 OBJECTIFS PHASE 3

1. ✅ **Tests et corrections très petits écrans** (iPhone SE, iPhone 12 mini)
2. ✅ **Unifier composants ProductCard** (ProductCard, ProductCardModern, ProductCardProfessional)
3. ✅ **Vérifier images sans attribut alt**
4. ✅ **Ajouter React.memo sur composants restants**
5. ✅ **Optimiser lazy loading images manquants**

---

## 🎯 TÂCHE 1 : Tests Très Petits Écrans

### Problèmes identifiés

1. **Largeurs fixes problématiques** :
   - `min-w-[100px]` dans StoreDetails.tsx (peut être trop large sur iPhone SE)
   - `min-w-[120px]` dans StoreDetails.tsx (peut être trop large)
   - `max-w-[260px]` dans ProductVisualTab.tsx (acceptable pour tooltip)

2. **Hauteurs minimales** :
   - `min-h-[500px]` dans ProductCard (peut être trop haut sur iPhone SE)
   - `min-h-[600px]` dans ProductCard (peut être trop haut)
   - `min-h-[700px]` dans ProductCard (peut être trop haut)

3. **Breakpoints à vérifier** :
   - iPhone SE : 375px × 667px
   - iPhone 12 mini : 375px × 812px

### Actions à prendre

1. ✅ Vérifier tous les `min-w` et `max-w` sur très petits écrans
2. ✅ Ajuster les hauteurs minimales pour très petits écrans
3. ✅ Tester avec breakpoint `xs:` (475px) et en dessous

---

## 🎯 TÂCHE 2 : Unifier Composants ProductCard

### Composants identifiés

1. **ProductCard** (`src/components/marketplace/ProductCard.tsx`)
   - Interface simple
   - Utilise ProductBanner
   - ~352 lignes

2. **ProductCardModern** (`src/components/marketplace/ProductCardModern.tsx`)
   - Interface moderne avec LazyImage
   - Utilise ResponsiveProductImage
   - ~547 lignes

3. **ProductCardProfessional** (`src/components/marketplace/ProductCardProfessional.tsx`)
   - Interface professionnelle
   - Utilise ProductBanner et ResponsiveProductImage
   - ~565 lignes

4. **ProductCard** (`src/components/storefront/ProductCard.tsx`)
   - Pour storefront
   - Utilise ResponsiveProductImage
   - ~557 lignes

5. **UnifiedProductCard** (`src/components/products/UnifiedProductCard.tsx`)
   - Composant unifié avec variants
   - Déjà optimisé
   - ~331 lignes

### Stratégie d'unification

**Option 1** : Utiliser `UnifiedProductCard` comme base et ajouter les variants manquants

- ✅ Déjà optimisé
- ✅ Déjà avec variants
- ⚠️ Manque certaines fonctionnalités des autres

**Option 2** : Créer un nouveau composant unifié basé sur le meilleur de chaque

- ✅ Toutes les fonctionnalités
- ⚠️ Plus de travail

**Recommandation** : **Option 1** - Étendre `UnifiedProductCard` avec les fonctionnalités manquantes

---

## 🎯 TÂCHE 3 : Vérifier Images sans Alt

### Composants à vérifier

1. ✅ `MediaAttachment.tsx` : A déjà `alt={attachment.file_name || 'Image'}`
2. ✅ `ProductCard.tsx` (storefront) : A déjà `alt={product.name}`
3. ✅ `UnifiedProductCard.tsx` : A déjà `alt={product.name}`
4. ✅ `CourseCard.tsx` : A déjà `alt={product.name}`
5. ⚠️ `StoreDetails.tsx` : A `alt="Logo"` et `alt="Bannière"` (peut être amélioré)

### Actions à prendre

1. ✅ Vérifier tous les composants avec images
2. ✅ Améliorer les alt text pour être plus descriptifs
3. ✅ Ajouter alt text manquants si nécessaire

---

## 🎯 TÂCHE 4 : Ajouter React.memo

### Composants à vérifier

1. **ProductCard** : À vérifier si déjà mémorisé
2. **ProductCardModern** : À vérifier si déjà mémorisé
3. **ProductCardProfessional** : À vérifier si déjà mémorisé
4. **UnifiedProductCard** : À vérifier si déjà mémorisé

### Critères pour React.memo

- ✅ Composant re-render souvent avec mêmes props
- ✅ Props sont primitives ou objets stables
- ✅ Pas de side effects dans le render

---

## 🎯 TÂCHE 5 : Optimiser Lazy Loading Images

### Composants à vérifier

1. ✅ `UnifiedProductCard` : Utilise ResponsiveProductImage avec priority
2. ✅ `ProductCardModern` : Utilise LazyImage
3. ✅ `ProductCardProfessional` : Utilise ResponsiveProductImage
4. ✅ `CourseCard` : Utilise LazyImage

### Actions à prendre

1. ✅ Vérifier que toutes les images au-dessus de la ligne de flottaison ont `priority={true}`
2. ✅ Vérifier que toutes les images en dessous ont `loading="lazy"`
3. ✅ Optimiser les images avec WebP et srcset si nécessaire

---

## 📊 PROGRESSION

| Tâche                   | Statut      | Progression |
| ----------------------- | ----------- | ----------- |
| **Très petits écrans**  | 🔄 En cours | 0%          |
| **Unifier ProductCard** | ⏳ À faire  | 0%          |
| **Images sans alt**     | ⏳ À faire  | 0%          |
| **React.memo**          | ⏳ À faire  | 0%          |
| **Lazy loading**        | ⏳ À faire  | 0%          |

---

## ⏱️ TEMPS ESTIMÉ

- **Tâche 1** : 2-3 heures
- **Tâche 2** : 3-4 heures
- **Tâche 3** : 2-3 heures
- **Tâche 4** : 1-2 heures
- **Tâche 5** : 1-2 heures

**Total** : 9-14 heures

---

**Date de début** : 2025  
**Statut** : 🔄 En cours
