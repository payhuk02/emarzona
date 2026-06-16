# PREDICTIVE_PREFETCH_ENGINE — Emarzona

## État actuel

Emarzona dispose déjà d'un prefetch multi-niveaux :

| Couche            | Fichier                                      | Mécanisme                                             |
| ----------------- | -------------------------------------------- | ----------------------------------------------------- |
| Routes idle/hover | `usePrefetch.ts`, `route-prefetch-config.ts` | `requestIdleCallback` + hover `<link rel="prefetch">` |
| Queries critiques | `usePrefetch` options.queries                | `queryClient.prefetchQuery`                           |
| Pages marketplace | `useMarketplaceProducts`                     | `prefetchNextPage` délai 1s                           |
| Post-deploy       | `CACHE_WARMER.ts`                            | Prefetch routes critiques                             |
| Resource hints    | `resource-hints.ts`                          | preconnect CDN Supabase                               |

---

## Architecture cible (Phase 9)

```
Navigation utilisateur
    ↓
useBehavioralAnalytics (existant)
    ↓
PredictivePrefetchEngine
    ├── Historique routes (sessionStorage)
    ├── Produits populaires (Redis cache)
    ├── Pays/langue (i18next)
    └── Tendances (analytics rollup)
    ↓
Prefetch prioritisé
    ├── Route chunks (React.lazy)
    ├── React Query data
    └── Images LCP (useLCPPreload)
```

---

## Signaux d'entrée

| Signal                      | Source                   | Poids |
| --------------------------- | ------------------------ | ----- |
| Route précédente → suivante | `useNavigationAnalytics` | 40%   |
| Type produit marketplace    | URL `?type=`             | 25%   |
| Pays (`navigator.language`) | i18next                  | 15%   |
| Produits populaires         | Redis `popular-products` | 20%   |

---

## Règles de prefetch

### Marketplace

```typescript
// Si utilisateur sur /marketplace?type=physical
// Prefetch: /marketplace?type=physical&page=2, fiche produit top-3
idleRoutes: ['/cart', '/checkout'];
hoverRoutes: productDetailPaths;
```

### Storefront subdomain

```typescript
// Si *.myemarzona.shop
// Prefetch: produits vedette boutique, panier
```

---

## Implémentation recommandée (prochaine itération)

```typescript
// src/lib/cache/predictive-prefetch.ts
export function computePrefetchTargets(context: PrefetchContext): PrefetchTarget[] {
  const transitions = getRouteTransitionProbabilities(context.currentPath);
  return transitions
    .filter(t => t.probability > 0.3)
    .map(t => ({ path: t.nextPath, priority: t.probability }));
}
```

---

## Garde-fous

- Ne pas prefetch si `navigator.connection.saveData === true`
- Ne pas prefetch si `effectiveType === '2g'`
- Limite: 5 prefetches concurrents max
- Respect `Cache-Control: private` pour données auth

---

## Métriques de succès

| KPI                | Cible              |
| ------------------ | ------------------ |
| Prefetch hit rate  | >60%               |
| Navigation perçue  | <100ms (cache hit) |
| Bandwidth overhead | <5% du total       |

---

## Fichiers concernés

- `src/hooks/usePrefetch.ts` — extension point
- `src/lib/route-prefetch-config.ts` — règles par rôle
- `src/hooks/useBehavioralAnalytics.ts` — signaux navigation
- `src/lib/cache/CACHE_WARMER.ts` — warm post-deploy
