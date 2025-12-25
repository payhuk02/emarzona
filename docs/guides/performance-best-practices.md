# ⚡ Bonnes Pratiques de Performance - Payhula

**Dernière mise à jour** : Janvier 2025

---

## 📋 Table des Matières

1. [Optimisation des Imports](#optimisation-des-imports)
2. [Lazy Loading](#lazy-loading)
3. [Code Splitting](#code-splitting)
4. [Optimisation des Images](#optimisation-des-images)
5. [Mémoization](#mémoization)
6. [Prefetching](#prefetching)

---

## 📥 Optimisation des Imports

### Imports d'Icônes

✅ **Utiliser l'index centralisé** :

```typescript
import { ShoppingCart, Package } from '@/components/icons';
```

❌ **Éviter les imports directs** :

```typescript
import { ShoppingCart, Package } from 'lucide-react';
```

### Imports de Dépendances Lourdes

✅ **Lazy loading** :

```typescript
const { jsPDF } = await loadPDFModules();
```

❌ **Import statique** :

```typescript
import jsPDF from 'jspdf'; // Charge au démarrage
```

---

## 🚀 Lazy Loading

### Composants Lourds

```typescript
const HeavyChart = lazy(() => import('./HeavyChart'));

function Dashboard() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <HeavyChart />
    </Suspense>
  );
}
```

### Routes

✅ **Déjà implémenté** dans `App.tsx` :

```typescript
const Dashboard = lazy(() => import("./pages/Dashboard"));
```

---

## 📦 Code Splitting

### Configuration Vite

Le `vite.config.ts` est configuré pour :
- Séparer les dépendances lourdes (PDF, Canvas, QR Code)
- Garder React dans le chunk principal
- Optimiser les chunks par fonctionnalité

### Vérifier le Bundle

```bash
npm run build:analyze
```

Ouvre `dist/stats.html` pour visualiser le bundle.

---

## 🖼️ Optimisation des Images

### Composant OptimizedImg

```typescript
import { OptimizedImg } from '@/components/shared/OptimizedImg';

<OptimizedImg 
  src="/image.jpg" 
  alt="Description"
  priority={false} // lazy par défaut
/>
```

### Attributs Importants

- `loading="lazy"` : Chargement différé
- `decoding="async"` : Décodage asynchrone
- `priority={true}` : Pour les images above-the-fold

---

## 🧠 Mémoization

### React.memo

Pour les composants qui re-render souvent :

```typescript
export const ProductCard = React.memo(({ product }) => {
  return <div>{product.name}</div>;
});
```

### useMemo

Pour les calculs coûteux :

```typescript
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);
```

### useCallback

Pour les fonctions passées en props :

```typescript
const handleClick = useCallback(() => {
  doSomething();
}, [dependencies]);
```

---

## 🔮 Prefetching

### Routes

Le hook `usePrefetch` est déjà implémenté dans `App.tsx` :

```typescript
usePrefetch({
  routes: ['/dashboard', '/marketplace'],
  delay: 100,
});
```

### Données

```typescript
const queryClient = useQueryClient();

queryClient.prefetchQuery({
  queryKey: ['products'],
  queryFn: fetchProducts,
});
```

---

## 📊 Métriques à Surveiller

### Web Vitals

- **FCP** (First Contentful Paint) : < 1.5s
- **LCP** (Largest Contentful Paint) : < 2.5s
- **TTI** (Time to Interactive) : < 3.5s
- **INP** (Interaction to Next Paint) : < 200ms
- **CLS** (Cumulative Layout Shift) : < 0.1

### Bundle Size

- **Chunk principal** : < 500 KB (gzipped)
- **Chunks secondaires** : < 200 KB chacun

---

## ✅ Checklist de Performance

### Avant de Créer un Composant

- [ ] Imports depuis l'index centralisé
- [ ] Images avec lazy loading
- [ ] Dépendances lourdes en lazy loading
- [ ] React.memo si nécessaire
- [ ] useMemo pour calculs coûteux

### Avant de Déployer

- [ ] Bundle size vérifié
- [ ] Web Vitals testés
- [ ] Lazy loading activé
- [ ] Images optimisées
- [ ] Code splitting vérifié

---

## 🔗 Ressources

- [Guide Optimisation Bundle](./bundle-optimization-guide.md)
- [Guide Migration](./migration-guide.md)
- [Web Vitals](https://web.dev/vitals/)

---

**Dernière mise à jour** : Janvier 2025

