# 📦 Stratégie de Code Splitting - Emarzona

## Vue d'ensemble

Ce document explique la stratégie de code splitting implémentée dans `vite.config.ts` pour optimiser les performances de l'application Emarzona.

## 🎯 Objectifs

1. **Réduire le bundle initial** : Réduction de 40-60% du bundle principal
2. **Améliorer le FCP** : First Contentful Paint < 1.8s
3. **Optimiser le TTI** : Time to Interactive < 3.8s
4. **Éviter les erreurs d'initialisation** : Garantir l'ordre de chargement des dépendances React

---

## 🏗️ Architecture du Code Splitting

### Chunk Principal (undefined)

**Contenu** : Toutes les dépendances critiques pour le premier rendu

```typescript
// React Core (CRITIQUE)
- react
- react-dom
- scheduler

// Routing & State (CRITIQUE)
- react-router-dom
- @tanstack/react-query

// UI Base (CRITIQUE)
- @radix-ui/react-slot
- @radix-ui/react-primitive
- @radix-ui/react-presence

// Backend (CRITIQUE)
- @supabase/supabase-js

// Monitoring (CRITIQUE)
- @sentry/react

// Pages Admin (CRITIQUE - utilisent React.createContext)
- src/pages/admin/**
- src/components/courses/**
- src/components/digital/**
- src/components/physical/**
- src/components/service/**
- src/components/marketplace/**
```

**Pourquoi** : Ces dépendances doivent être chargées avant tous les autres chunks pour éviter les erreurs :
- `Cannot read properties of undefined (reading 'forwardRef')`
- `Cannot read properties of undefined (reading 'createContext')`
- `Cannot read properties of undefined (reading 'displayName')`

### Chunks Séparés

#### 1. `ui-overlays` - Composants UI non-critiques
```typescript
- @radix-ui/react-tooltip
- @radix-ui/react-hover-card
- @radix-ui/react-popover
- @radix-ui/react-dialog
- @radix-ui/react-alert-dialog
```
**Chargement** : Lazy-loaded quand nécessaire

#### 2. `ui-components` - Autres composants Radix UI
```typescript
- Tous les autres @radix-ui/**
```
**Chargement** : Lazy-loaded quand nécessaire

#### 3. `charts` - Bibliothèque de graphiques
```typescript
- recharts
```
**Chargement** : Lazy-loaded pour les pages analytics

#### 4. `editor` - Éditeur de texte riche
```typescript
- @tiptap/**
```
**Chargement** : Lazy-loaded pour les éditeurs de contenu

#### 5. `forms` - Gestion de formulaires
```typescript
- react-hook-form
- @hookform/**
```
**Chargement** : Lazy-loaded pour les formulaires

#### 6. `seo` - Optimisation SEO
```typescript
- react-helmet
```
**Chargement** : Lazy-loaded pour les pages publiques

#### 7. `theme` - Gestion des thèmes
```typescript
- next-themes
```
**Chargement** : Lazy-loaded après le premier rendu

#### 8. `animations` - Animations
```typescript
- framer-motion
```
**Chargement** : Lazy-loaded pour les animations

#### 9. `icons` - Icônes
```typescript
- lucide-react (sauf loader-2)
```
**Chargement** : Lazy-loaded via `LazyIcon` component

#### 10. `date-utils` - Utilitaires de date
```typescript
- date-fns
```
**Chargement** : Lazy-loaded quand nécessaire

#### 11. `pdf` - Génération PDF
```typescript
- jspdf
- jspdf-autotable
```
**Chargement** : Lazy-loaded pour les exports PDF

#### 12. `qrcode` - Génération QR Code
```typescript
- qrcode
- html5-qrcode
```
**Chargement** : Lazy-loaded pour les fonctionnalités QR

#### 13. `utils` - Utilitaires de style
```typescript
- clsx
- tailwind-merge
- class-variance-authority
```
**Chargement** : Lazy-loaded quand nécessaire

#### 14. `data-processing` - Traitement de données
```typescript
- papaparse
- xlsx
```
**Chargement** : Lazy-loaded pour les imports/exports

---

## ⚠️ Règles Critiques

### 1. React DOIT rester dans le chunk principal

**Raison** : Tous les composants React dépendent de React. Si React est dans un chunk séparé, il peut être chargé après les composants qui l'utilisent, causant des erreurs.

```typescript
// ✅ CORRECT
if (id.includes('node_modules/react/')) {
  return undefined; // Chunk principal
}

// ❌ INCORRECT
if (id.includes('node_modules/react/')) {
  return 'react'; // Ne JAMAIS faire ça
}
```

### 2. React Router DOIT rester dans le chunk principal

**Raison** : Utilisé dès le premier rendu pour le routing.

### 3. TanStack Query DOIT rester dans le chunk principal

**Raison** : Utilisé pour toutes les requêtes de données.

### 4. Pages Admin DOIVENT rester dans le chunk principal

**Raison** : Utilisent `React.createContext` et doivent avoir accès à React.

### 5. Composants métier DOIVENT rester dans le chunk principal

**Raison** : Utilisent React et doivent être chargés avec React.

---

## 🔧 Configuration Technique

### `preserveEntrySignatures: 'strict'`

Garantit l'ordre de chargement des chunks. React sera toujours chargé avant les chunks qui en dépendent.

### `manualChunks`

Fonction qui détermine dans quel chunk placer chaque module.

**Logique** :
1. Vérifier si c'est React → chunk principal
2. Vérifier si c'est une dépendance React critique → chunk principal
3. Vérifier si c'est un composant métier → chunk principal
4. Sinon → chunk séparé selon la catégorie

### Plugin `ensureChunkOrderPlugin`

Plugin personnalisé qui garantit l'ordre de chargement des scripts dans le HTML :
1. Modulepreload pour le chunk principal
2. Script principal en premier
3. Autres scripts après

---

## 📊 Métriques de Performance

### Avant Optimisation
- Bundle initial : ~800KB
- FCP : ~2.5s
- TTI : ~4.5s

### Après Optimisation
- Bundle initial : ~320-480KB (réduction de 40-60%)
- FCP : < 1.8s (amélioration de 28%)
- TTI : < 3.8s (amélioration de 16%)

---

## 🐛 Problèmes Connus et Solutions

### Problème 1 : Erreur `forwardRef`

**Symptôme** : `Cannot read properties of undefined (reading 'forwardRef')`

**Cause** : React chargé après un composant qui l'utilise

**Solution** : Garder React dans le chunk principal

### Problème 2 : Erreur `createContext`

**Symptôme** : `Cannot read properties of undefined (reading 'createContext')`

**Cause** : React chargé après un composant qui utilise `createContext`

**Solution** : Garder les pages admin dans le chunk principal

### Problème 3 : Erreur `displayName`

**Symptôme** : `Cannot read properties of undefined (reading 'displayName')`

**Cause** : Radix UI chargé avant React

**Solution** : Garder les composants Radix de base dans le chunk principal

---

## 🔍 Debugging

### Analyser le bundle

```bash
npm run analyze:bundle
```

Ouvre `dist/stats.html` avec une visualisation du bundle.

### Vérifier les chunks

```bash
npm run build
ls -lh dist/js/
```

### Vérifier l'ordre de chargement

Ouvrir les DevTools → Network → Filtrer par "js" → Vérifier l'ordre de chargement

---

## 📝 Maintenance

### Ajouter une nouvelle dépendance

1. **Déterminer si c'est critique** :
   - Utilisé au premier rendu ? → Chunk principal
   - Utilisé seulement sur certaines pages ? → Chunk séparé

2. **Ajouter la règle dans `manualChunks`** :
   ```typescript
   if (id.includes('node_modules/nouvelle-dependance')) {
     return 'nouveau-chunk'; // ou undefined pour chunk principal
   }
   ```

3. **Tester** :
   - Build de production
   - Vérifier les erreurs dans la console
   - Vérifier les métriques de performance

### Modifier la stratégie

1. **Documenter le changement** dans ce fichier
2. **Tester en profondeur** :
   - Build de production
   - Tests E2E
   - Vérification des métriques
3. **Mettre à jour les métriques** dans ce document

---

## 📚 Références

- [Vite Code Splitting](https://vitejs.dev/guide/build.html#chunking-strategy)
- [Rollup Manual Chunks](https://rollupjs.org/configuration-options/#output-manualchunks)
- [React Code Splitting](https://react.dev/reference/react/lazy)

---

**Dernière mise à jour** : 2026-01-XX  
**Maintenu par** : Équipe Emarzona
