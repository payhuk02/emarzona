# 📦 Guide d'Optimisation de la Taille du Bundle - Payhula

**Dernière mise à jour** : Janvier 2025

---

## 📊 État Actuel

### Chunk Principal

- **Taille** : 598.61 KB (non gzipped)
- **Objectif** : < 500 KB
- **Statut** : ⚠️ À optimiser

### Chunks Séparés

- ✅ PDF: 415 KB (jspdf)
- ✅ Canvas: 201 KB (html2canvas)
- ✅ QR Code: 359 KB
- ✅ Charts: 350 KB (recharts)
- ✅ Monitoring: 254 KB (Sentry)

---

## 🎯 Stratégies d'Optimisation

### 1. Lazy Loading des Composants Lourds

#### Recharts (Graphiques)

**Problème** : Recharts est dans le chunk principal (350 KB)

**Solution** : Lazy loading pour les composants de graphiques

```typescript
// Créer un loader
// src/lib/charts-loader.ts
export const loadRecharts = async () => {
  const recharts = await import('recharts');
  return recharts;
};

// Utilisation
const { LineChart, Line } = await loadRecharts();
```

#### react-big-calendar

**Problème** : Calendar est dans le chunk principal

**Solution** : Lazy loading pour les pages qui utilisent le calendrier

```typescript
const Calendar = lazy(() => import('react-big-calendar'));
```

### 2. Séparer les Dépendances Non-React

Déjà séparées :

- ✅ dompurify → `sanitization`
- ✅ seo-tagger → `tagging`
- ✅ zod → `validation`

### 3. Optimiser les Imports

#### Éviter les Imports Circulaires

```typescript
// ❌ Mauvais
import * as utils from '@/utils';

// ✅ Bon
import { formatCurrency } from '@/utils/currency';
```

#### Imports Conditionnels

```typescript
// Charger seulement en production
if (import.meta.env.PROD) {
  await import('@/lib/performance-monitor');
}
```

---

## 📈 Métriques Cibles

### Bundle Size

- **Chunk principal** : < 500 KB (non gzipped)
- **Chunks secondaires** : < 200 KB chacun
- **Total initial** : < 300 KB (gzipped)

### Performance

- **FCP** : < 1.5s
- **LCP** : < 2.5s
- **TTI** : < 3.5s

---

## 🔧 Commandes Utiles

```bash
# Analyser le bundle
npm run build:analyze

# Vérifier la taille
npm run build
du -sh dist/js/

# Vérifier la couverture
npm run test:coverage
```

---

## ✅ Checklist d'Optimisation

- [ ] Analyser le bundle avec visualizer
- [ ] Identifier les dépendances lourdes
- [ ] Implémenter le lazy loading pour les composants lourds
- [ ] Optimiser les imports
- [ ] Séparer les chunks par fonctionnalité
- [ ] Vérifier les métriques de performance
- [ ] Tester sur différents appareils

---

## 🔗 Ressources

- [Guide Optimisation Bundle](./bundle-optimization-guide.md)
- [Guide Performance](./performance-best-practices.md)
- [Vite Documentation](https://vitejs.dev/guide/build.html)

---

**Dernière mise à jour** : Janvier 2025
