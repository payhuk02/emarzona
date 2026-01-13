# ⚡ Guide d'Optimisation Web Vitals

**Date** : 30 Janvier 2025  
**Objectif** : Améliorer FCP <1.8s, LCP <2.5s, TTFB <600ms

---

## 📊 Métriques Actuelles vs Objectifs

| Métrique | Actuel | Objectif | Écart |
|----------|--------|----------|-------|
| **FCP** | 2-5s | <1.8s | ⚠️ -40% à -64% |
| **LCP** | 2-5s | <2.5s | ⚠️ 0% à -50% |
| **TTFB** | Variable | <600ms | ⚠️ Variable |
| **Bundle JS** | 450-550KB | <350KB | ⚠️ -22% à -36% |

---

## ✅ Optimisations Déjà en Place

### 1. Fonts Optimisées ✅

**État actuel** :
- ✅ `font-display: swap` configuré dans Google Fonts
- ✅ Preconnect pour fonts.googleapis.com et fonts.gstatic.com
- ✅ Preload des fonts critiques (400, 500, 600)
- ✅ Chargement asynchrone avec `media="print"` trick

**Fichiers** :
- `index.html` lignes 38-62
- `public/fonts.css` (prêt pour polices locales)

**Gain actuel** : ~100-200ms sur FCP

---

### 2. Resource Hints ✅

**État actuel** :
- ✅ DNS-prefetch pour fonts, analytics
- ✅ Preconnect pour Supabase, Google Fonts, CDN
- ✅ Preload logo pour LCP

**Fichiers** :
- `index.html` lignes 32-95

**Gain actuel** : ~50-100ms sur TTFB

---

### 3. Code Splitting ✅

**État actuel** :
- ✅ Lazy loading des routes
- ✅ Chunks séparés (charts, calendar, editor)
- ✅ React Query pour cache

**Gain actuel** : Bundle principal réduit

---

## 🎯 Optimisations à Implémenter

### 1. Optimiser Images (PRIORITÉ HAUTE)

**Problème** : Images non optimisées (PNG/JPG au lieu de WebP/AVIF)

**Actions** :
```bash
# 1. Convertir images en WebP/AVIF
npm run optimize:images

# 2. Ajouter lazy loading sur toutes les images non-critiques
# Déjà fait via OptimizedImage component

# 3. Précharger images LCP critiques
# Déjà fait pour logo dans index.html
```

**Gains attendus** :
- LCP : -20% à -40% (2-5s → 1.5-3s)
- Bundle : -30% à -50% sur images

**Durée** : 1 jour

---

### 2. Réduire Bundle Principal (PRIORITÉ HAUTE)

**Problème** : Bundle principal trop lourd (450-550KB)

**Actions** :
```bash
# 1. Analyser le bundle
npm run analyze:bundle

# 2. Identifier dépendances lourdes
# Vérifier avec rollup-plugin-visualizer

# 3. Code splitting supplémentaire si nécessaire
# Déjà fait pour certains chunks
```

**Dépendances potentiellement lourdes** :
- `@tiptap/*` (éditeur riche)
- `recharts` (graphiques)
- `react-big-calendar` (calendrier)
- `three` + `@react-three/*` (3D)

**Gains attendus** :
- Bundle : -30% à -40% (450KB → 300KB)
- FCP : -15% à -25%

**Durée** : 2-3 jours

---

### 3. Optimiser Fonts Locales (PRIORITÉ MOYENNE)

**Problème** : Google Fonts = requête externe (~50-100ms)

**Actions** :
```bash
# 1. Télécharger fonts Poppins en WOFF2
# Utiliser https://gwfh.mranftl.com/fonts/poppins

# 2. Placer dans /public/fonts/
# Poppins-Regular.woff2
# Poppins-Medium.woff2
# Poppins-SemiBold.woff2

# 3. Activer fonts.css dans index.html
# Remplacer Google Fonts par polices locales
```

**Fichiers à modifier** :
- `index.html` : Remplacer Google Fonts par `/fonts.css`
- `public/fonts.css` : Déjà prêt (décommenter)

**Gains attendus** :
- FCP : -33% (1.2s → 0.8s)
- LCP : -20% (2.5s → 2.0s)
- Lighthouse : +5-10 points

**Durée** : 2-3 heures

---

### 4. Service Worker pour Cache (PRIORITÉ MOYENNE)

**État actuel** : Service worker présent mais peut être optimisé

**Actions** :
```javascript
// Vérifier public/sw.js
// Optimiser stratégie de cache :
// - Cache First pour assets statiques
// - Network First pour API
// - Stale While Revalidate pour pages
```

**Gains attendus** :
- TTFB : -50% à -70% sur revisites
- FCP : -30% à -50% sur revisites

**Durée** : 1 jour

---

### 5. Précharger Ressources Critiques (PRIORITÉ BASSE)

**État actuel** : Partiellement fait

**Actions** :
```html
<!-- Dans index.html -->
<!-- Précharger CSS critique -->
<link rel="preload" href="/src/index.css" as="style" />

<!-- Précharger JS critique -->
<link rel="modulepreload" href="/src/main.tsx" />

<!-- Précharger API Supabase si nécessaire -->
<link rel="prefetch" href="https://hbdnzajbyjakdhuavrvb.supabase.co/rest/v1/" />
```

**Gains attendus** :
- FCP : -5% à -10%
- TTFB : -5% à -10%

**Durée** : 2-3 heures

---

## 📋 Plan d'Action par Priorité

### Semaine 1 (URGENT)

**Jour 1** : Optimiser images
- [ ] Exécuter `npm run optimize:images`
- [ ] Vérifier conversion WebP/AVIF
- [ ] Tester lazy loading

**Jour 2-3** : Réduire bundle
- [ ] Exécuter `npm run analyze:bundle`
- [ ] Identifier dépendances lourdes
- [ ] Code splitting supplémentaire
- [ ] Tester bundle réduit

### Semaine 2 (IMPORTANT)

**Jour 1** : Fonts locales
- [ ] Télécharger fonts Poppins
- [ ] Activer `fonts.css`
- [ ] Tester chargement

**Jour 2** : Service Worker
- [ ] Optimiser stratégie cache
- [ ] Tester cache
- [ ] Vérifier offline

**Jour 3** : Précharger ressources
- [ ] Ajouter preload critiques
- [ ] Tester performance

---

## 🔍 Commandes de Mesure

### Mesurer Web Vitals

```bash
# Lighthouse complet
npm run audit:lighthouse

# Mesurer Web Vitals uniquement
npm run measure:vitals

# Analyser bundle
npm run analyze:bundle

# Audit complet (responsive + lighthouse)
npm run audit:all
```

### Analyser Résultats

**Fichiers générés** :
- `docs/audits/web-vitals/lighthouse-web-vitals-YYYY-MM-DD.json`
- Rapports dans console

---

## 📊 Métriques de Succès

### Objectifs Semaine 1

- ✅ FCP < 2.0s (actuellement 2-5s)
- ✅ LCP < 3.0s (actuellement 2-5s)
- ✅ Bundle < 400KB (actuellement 450-550KB)

### Objectifs Semaine 2

- ✅ FCP < 1.8s
- ✅ LCP < 2.5s
- ✅ TTFB < 600ms
- ✅ Bundle < 350KB

---

## 🛠️ Outils Recommandés

### 1. Lighthouse CI

```bash
# Installer Lighthouse CI
npm install -g @lhci/cli

# Exécuter audit
lhci autorun --collect.url=http://localhost:8080
```

### 2. Web Vitals Extension

- Chrome Extension : Web Vitals
- Mesure en temps réel dans DevTools

### 3. Bundle Analyzer

```bash
# Analyser bundle avec visualisation
npm run build:analyze
# Ouvrir dist/stats.html
```

---

## ⚠️ Points d'Attention

### 1. Images LCP

**Identifier l'élément LCP** :
- Généralement : Hero image, logo, ou premier contenu visible
- Utiliser Chrome DevTools → Performance → LCP

**Optimiser** :
- Précharger avec `<link rel="preload">`
- Utiliser WebP/AVIF
- Dimensions appropriées (pas trop grandes)

### 2. Bundle Size

**Vérifier** :
- Dépendances inutilisées
- Code mort (tree shaking)
- Polyfills inutiles

**Réduire** :
- Code splitting agressif
- Lazy loading composants lourds
- Utiliser imports dynamiques

### 3. TTFB

**Causes** :
- Requêtes API lentes
- Serveur lent
- CDN non optimisé

**Optimiser** :
- Cache API avec React Query
- CDN pour assets statiques
- Edge Functions pour API

---

## 🔗 Ressources

- **Script Lighthouse** : `scripts/lighthouse-web-vitals.js`
- **Guide Fonts** : `docs/FONT_OPTIMIZATION_GUIDE.md`
- **Script Images** : `scripts/optimize-images.js`
- **Service Worker** : `public/sw.js`

---

**Prochaine étape** : Exécuter `npm run audit:lighthouse` pour mesurer les métriques actuelles, puis implémenter les optimisations par priorité.
