# ⚡ GUIDE D'OPTIMISATION PERFORMANCE - WEB VITALS (PRIORITÉ 2)

**Date** : 13 Janvier 2026  
**Priorité** : 🟡 **HAUTE**  
**Durée estimée** : 3-5 jours

---

## 📊 OBJECTIFS

| Métrique | Actuel | Objectif | Amélioration Requise |
|----------|--------|----------|---------------------|
| **FCP** | 2-5s | <1.8s | -10% à -64% |
| **LCP** | 2-5s | <2.5s | 0% à -50% |
| **TTFB** | Variable | <600ms | Variable |
| **Bundle JS** | 450-550KB | <350KB | -22% à -36% |

---

## ✅ OPTIMISATIONS DÉJÀ EN PLACE

### 1. Code Splitting ✅
- ✅ Lazy loading des routes
- ✅ Chunks séparés (charts, calendar, editor)
- ✅ React Query pour cache

### 2. Resource Hints ✅
- ✅ Preconnect pour Supabase, Google Fonts, CDN
- ✅ DNS-prefetch pour services externes
- ✅ Preload logo pour LCP

### 3. Fonts Optimisées ✅
- ✅ `font-display: swap` configuré
- ✅ Preconnect pour fonts.googleapis.com
- ✅ Chargement asynchrone avec `media="print"` trick

### 4. CSS Critique ✅
- ✅ CSS critique injecté immédiatement
- ✅ CSS non-critique chargé asynchrone
- ✅ Variables CSS critiques inline

---

## 🎯 OPTIMISATIONS À IMPLÉMENTER

### 1. Optimiser Images (PRIORITÉ HAUTE) 🟡

#### Problème
- Images non optimisées (PNG/JPG au lieu de WebP/AVIF)
- Images trop lourdes (>500KB)
- Pas de lazy loading systématique
- Pas de responsive images

#### Actions

**1.1 Convertir images en WebP/AVIF**

```bash
# Installer sharp-cli si nécessaire
npm install -g sharp-cli

# Créer script d'optimisation
# scripts/optimize-images.js
```

**1.2 Implémenter lazy loading**

```typescript
// Vérifier que OptimizedImage utilise loading="lazy"
// src/components/OptimizedImage.tsx
```

**1.3 Précharger images LCP critiques**

```html
<!-- Dans index.html -->
<link rel="preload" as="image" href="/logo.png" fetchpriority="high">
```

**Gains attendus** :
- LCP : -20% à -40% (2-5s → 1.5-3s)
- Bundle : -30% à -50% sur images

**Durée** : 1 jour

---

### 2. Réduire Bundle Principal 🟡

#### Problème
- Bundle principal : ~450-550KB JS
- Beaucoup de dépendances dans chunk principal
- Pas d'analyse systématique du bundle

#### Actions

**2.1 Analyser le bundle**

```bash
# Analyser le bundle
npm run analyze:bundle

# Ou avec vite-bundle-visualizer
npm install -D vite-bundle-visualizer
```

**2.2 Identifier les dépendances lourdes**

Dépendances courantes à vérifier :
- `@tanstack/react-query` (déjà optimisé)
- `lucide-react` (icons - déjà lazy loaded)
- `recharts` (charts - déjà lazy loaded)
- `react-datepicker` (calendar - déjà lazy loaded)
- `@tiptap/react` (editor - déjà lazy loaded)

**2.3 Optimiser les imports**

```typescript
// ❌ Mauvais
import { Icon1, Icon2, Icon3 } from 'lucide-react';

// ✅ Bon
const Icon1 = lazy(() => import('lucide-react').then(m => ({ default: m.Icon1 })));
```

**2.4 Tree-shaking**

Vérifier que Vite fait bien le tree-shaking :
```typescript
// Vérifier vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Chunks déjà configurés
        }
      }
    }
  }
});
```

**Gains attendus** :
- Bundle : -20% à -30% (450-550KB → 350-400KB)

**Durée** : 1-2 jours

---

### 3. Optimiser Fonts 🟡

#### Problème
- Fonts Google peuvent bloquer le render
- Pas de subset fonts (tous les caractères chargés)
- Pas de fallback système optimisé

#### Actions

**3.1 Preload fonts critiques**

```html
<!-- Dans index.html -->
<link rel="preload" as="font" href="..." type="font/woff2" crossorigin>
```

**3.2 Subset fonts (optionnel)**

```html
<!-- Utiliser Google Fonts avec subset -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap&subset=latin" rel="stylesheet">
```

**3.3 Fallback système**

```css
/* Dans index.css */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

**Gains attendus** :
- FCP : -100ms à -200ms

**Durée** : 0.5 jour

---

### 4. Service Worker pour Cache 🟡

#### Problème
- Pas de cache côté client
- Ressources rechargées à chaque visite
- Pas de stratégie de cache optimale

#### Actions

**4.1 Vérifier service worker existant**

```typescript
// Vérifier src/main.tsx ligne 105-119
// Service worker déjà enregistré en production
```

**4.2 Optimiser stratégie de cache**

```javascript
// public/sw.js
// Implémenter stratégie cache-first pour assets statiques
// Network-first pour API calls
```

**4.3 Précharger ressources critiques**

```javascript
// Dans service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('v1').then((cache) => {
      return cache.addAll([
        '/logo.png',
        '/fonts/inter-400.woff2',
        // Ressources critiques
      ]);
    })
  );
});
```

**Gains attendus** :
- TTFB : -50% à -70% sur revisites
- LCP : -10% à -20% sur revisites

**Durée** : 1 jour

---

### 5. Monitoring Web Vitals 🟡

#### Problème
- Pas de monitoring en production
- Pas d'alertes si métriques dégradées
- Pas de dashboard performance

#### Actions

**5.1 Vérifier tracking Web Vitals**

```typescript
// Vérifier src/lib/web-vitals.ts
// Tracking déjà implémenté avec Sentry
```

**5.2 Configurer alertes Sentry**

```typescript
// Dans src/lib/web-vitals.ts
// Ajouter alertes si métriques > seuils
```

**5.3 Dashboard performance**

```typescript
// Créer composant admin pour afficher métriques
// src/components/admin/PerformanceDashboard.tsx
```

**Durée** : 0.5 jour

---

## 📋 PLAN D'EXÉCUTION

### Jour 1 : Images
- [ ] Créer script d'optimisation images
- [ ] Convertir images principales en WebP/AVIF
- [ ] Implémenter lazy loading systématique
- [ ] Précharger images LCP critiques

### Jour 2-3 : Bundle
- [ ] Analyser bundle avec vite-bundle-visualizer
- [ ] Identifier dépendances lourdes
- [ ] Optimiser imports (tree-shaking)
- [ ] Réduire bundle principal de 20-30%

### Jour 4 : Fonts & Service Worker
- [ ] Preload fonts critiques
- [ ] Optimiser stratégie de cache
- [ ] Tester service worker

### Jour 5 : Monitoring & Tests
- [ ] Configurer alertes Web Vitals
- [ ] Créer dashboard performance
- [ ] Tester toutes les optimisations
- [ ] Mesurer améliorations

---

## 🧪 TESTS DE VALIDATION

### Avant optimisations

```bash
# Mesurer métriques actuelles
npm run lighthouse
# Ou utiliser Chrome DevTools → Lighthouse
```

### Après optimisations

```bash
# Remesurer métriques
npm run lighthouse

# Comparer résultats
# FCP : Avant vs Après
# LCP : Avant vs Après
# TTFB : Avant vs Après
# Bundle size : Avant vs Après
```

---

## 📊 MÉTRIQUES DE SUCCÈS

### Objectifs

- ✅ **FCP** < 1.8s (actuellement 2-5s)
- ✅ **LCP** < 2.5s (actuellement 2-5s)
- ✅ **TTFB** < 600ms (variable)
- ✅ **Bundle size** < 350KB (actuellement 450-550KB)

### Indicateurs de progression

- [ ] Images optimisées : 0% → 100%
- [ ] Bundle réduit : 0% → 20-30%
- [ ] Fonts optimisées : 50% → 100%
- [ ] Service worker : 50% → 100%
- [ ] Monitoring : 50% → 100%

---

## 🔗 RESSOURCES

### Documentation
- `docs/OPTIMISATION_PERFORMANCE_FCP_LCP.md` - Optimisations FCP/LCP
- `docs/audits/GUIDE_OPTIMISATION_WEB_VITALS.md` - Guide Web Vitals
- `src/lib/web-vitals.ts` - Tracking Web Vitals

### Scripts
- `npm run analyze:bundle` - Analyser bundle
- `npm run lighthouse` - Audit Lighthouse
- `scripts/optimize-images.js` - Optimiser images (à créer)

### Outils
- [WebPageTest](https://www.webpagetest.org/) - Test performance
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci) - CI/CD
- [Bundlephobia](https://bundlephobia.com/) - Analyser dépendances

---

**Document créé le** : 13 Janvier 2026  
**Dernière mise à jour** : 13 Janvier 2026  
**Version** : 1.0
