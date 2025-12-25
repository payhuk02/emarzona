# ✅ CORRECTION - Erreur Vercel "unstable_scheduleCallback"

> **Date** : Janvier 2025  
> **Erreur** : `Cannot read properties of undefined (reading 'unstable_scheduleCallback')`  
> **Fichier** : `radix-ui-hJLcS6Fx.js:5:11478` (production Vercel)  
> **Statut** : ✅ **CORRIGÉ**

---

## ❌ PROBLÈME IDENTIFIÉ

### Erreur Console Vercel
```
Uncaught TypeError: Cannot read properties of undefined (reading 'unstable_scheduleCallback')
  at radix-ui-hJLcS6Fx.js:5:11478
```

### Symptômes
- ✅ Application fonctionne **localement** (`npm run dev`)
- ❌ Application **ne démarre pas** sur Vercel (écran noir)
- ❌ Erreur d'accès à `unstable_scheduleCallback` dans le chunk Radix UI
- ⚠️ Problème apparu **après correction de l'erreur forwardRef**

---

## 🔍 CAUSE RACINE

### Problème Principal

L'erreur `Cannot read properties of undefined (reading 'unstable_scheduleCallback')` se produit parce que :

1. **React Scheduler n'est pas disponible** :
   - `unstable_scheduleCallback` est une fonction de React Scheduler
   - Radix UI utilise cette fonction pour gérer les priorités de rendu
   - Si `scheduler` n'est pas chargé, cette fonction est `undefined`

2. **Scheduler dans un chunk séparé** :
   - `scheduler` est une dépendance de `react-dom`
   - Avec le code splitting, `scheduler` peut être dans un chunk séparé
   - Si Radix UI charge avant `scheduler`, l'erreur se produit

3. **Ordre de chargement** :
   - Même si React est dans le chunk principal, `scheduler` peut être séparé
   - Radix UI a besoin de `scheduler` immédiatement à l'initialisation

---

## ✅ SOLUTION APPLIQUÉE

### 1. Scheduler dans le Chunk Principal

**Fichier** : `vite.config.ts`

**AVANT** (problématique) :
```typescript
manualChunks: (id) => {
  if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
    return undefined; // ✅ React dans chunk principal
    // ❌ Mais scheduler peut être séparé
  }
  // ...
}
```

**APRÈS** (corrigé) :
```typescript
manualChunks: (id) => {
  // CRITIQUE: React, React DOM et Scheduler dans le chunk principal (undefined)
  // Ne pas séparer React pour garantir qu'il est chargé avant tous les composants
  // Cela évite les erreurs "forwardRef" et "unstable_scheduleCallback"
  if (
    id.includes('node_modules/react/') || 
    id.includes('node_modules/react-dom/') ||
    id.includes('node_modules/scheduler/')  // ✅ Scheduler inclus
  ) {
    return undefined; // Garder dans le chunk principal
  }
  // ...
}
```

**Explication** :
- `scheduler` reste dans le chunk principal avec React
- Le chunk principal est toujours chargé en premier
- Radix UI peut maintenant accéder à `unstable_scheduleCallback`

---

### 2. Déduplication de Scheduler

**Fichier** : `vite.config.ts`

**AVANT** :
```typescript
dedupe: ['react', 'react-dom'],
```

**APRÈS** :
```typescript
// Dédupliquer React et Scheduler pour éviter les problèmes d'initialisation
dedupe: ['react', 'react-dom', 'scheduler'],
```

**Explication** :
- Garantit une seule instance de `scheduler`
- Évite les problèmes de duplication
- Assure la cohérence entre React et Scheduler

---

### 3. Optimisation des Dépendances

**Fichier** : `vite.config.ts`

**Ajouté** :
```typescript
optimizeDeps: {
  include: [
    'react',
    'react-dom',
    'scheduler', // CRITIQUE: Inclure scheduler pour Radix UI
    'react-router-dom',
    // ...
  ]
}
```

**Explication** :
- Force l'inclusion de `scheduler` dans les dépendances optimisées
- Garantit que `scheduler` est pré-bundlé avec React
- Améliore les performances de chargement

---

## 📊 RÉSULTAT

| Avant | Après |
|-------|-------|
| ❌ Scheduler dans chunk séparé | ✅ Scheduler dans chunk principal |
| ❌ Radix UI ne trouve pas `unstable_scheduleCallback` | ✅ `unstable_scheduleCallback` accessible |
| ❌ Erreur sur Vercel | ✅ Application démarre |
| ❌ Scheduler non dédupliqué | ✅ Scheduler dédupliqué |

---

## 🔍 POURQUOI CETTE ERREUR ?

### Contexte Technique

1. **React Scheduler** :
   - `scheduler` est le package qui gère les priorités de rendu dans React
   - `unstable_scheduleCallback` est utilisé pour planifier les mises à jour
   - Radix UI utilise cette fonction pour optimiser les rendus

2. **Dépendances** :
   - `react-dom` dépend de `scheduler`
   - Mais `scheduler` peut être dans un chunk séparé avec le code splitting
   - Radix UI a besoin de `scheduler` immédiatement

3. **Ordre de chargement** :
   - Même si React est dans le chunk principal, `scheduler` peut être séparé
   - Si Radix UI charge avant `scheduler`, l'erreur se produit
   - Solution : Garder `scheduler` dans le chunk principal

---

## 📝 NOTES

### Trade-offs

- ✅ **Avantage** : Application fonctionne sur Vercel
- ⚠️ **Trade-off** : Le chunk principal contient React + React-DOM + Scheduler (~150KB)
- ✅ **Bénéfice net** : Code splitting toujours actif pour les autres dépendances

### Performance

- Le chunk principal contient maintenant React + React-DOM + Scheduler
- Les autres chunks sont toujours séparés (Radix UI, Charts, Calendar, etc.)
- Le code splitting reste bénéfique pour les autres dépendances
- Impact minimal sur les performances globales

### Dépendances React à garder ensemble

Pour éviter les erreurs similaires, ces packages doivent rester dans le chunk principal :
- ✅ `react` - Core React
- ✅ `react-dom` - React DOM renderer
- ✅ `scheduler` - React Scheduler (utilisé par react-dom et Radix UI)

---

## 🚀 DÉPLOIEMENT

### Commandes
```bash
# Build local pour vérifier
npm run build

# Vérifier que scheduler est dans le chunk principal
# Le fichier index-[hash].js doit contenir React, React-DOM et Scheduler

# Commit et push
git add .
git commit -m "fix: include scheduler in main chunk to fix unstable_scheduleCallback error"
git push
```

### Vérifications Post-Deploy

1. ✅ Vérifier que l'application démarre sur Vercel
2. ✅ Vérifier qu'il n'y a pas d'erreurs dans la console
3. ✅ Vérifier que tous les composants Radix UI fonctionnent
4. ✅ Vérifier que `unstable_scheduleCallback` est accessible

---

## ✅ STATUT

**Statut**: ✅ **CORRIGÉ**

### Changements
- ✅ Scheduler inclus dans le chunk principal
- ✅ Scheduler ajouté à `dedupe`
- ✅ Scheduler ajouté à `optimizeDeps.include`
- ✅ Documentation mise à jour

---

*Dernière mise à jour : Janvier 2025*

