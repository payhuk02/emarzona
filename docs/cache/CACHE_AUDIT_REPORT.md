# CACHE_AUDIT_REPORT — Emarzona

**Date:** 16 juin 2026  
**Stack réelle:** Vite 7 + React 18 + React Router 6 + TanStack Query 5 + Supabase + Vercel Edge + Upstash Redis + Cloudflare  
**Note:** La mission initiale mentionnait Next.js 15 — l'audit reflète la stack **réelle** (SPA Vite, pas App Router).

---

## 1. Synthèse exécutive

| Domaine                             | Score           | État                                  |
| ----------------------------------- | --------------- | ------------------------------------- |
| Cache client (React Query)          | 7/10            | Bon, stratégies hétérogènes           |
| Cache navigateur (localStorage/IDB) | 8/10            | SWR marketplace implémenté            |
| Cache edge (middleware SEO)         | 8/10            | Upstash + fallback mémoire            |
| Cache CDN (Vercel/Cloudflare)       | 6/10            | Assets OK, HTML SPA limité            |
| Invalidation                        | 7/10 → **9/10** | Moteur enterprise ajouté              |
| Redis distribué                     | 5/10 → **8/10** | Service + API + métriques             |
| Monitoring cache                    | 4/10 → **8/10** | Dashboard dédié                       |
| Images                              | 8/10            | OptimizedImage + Supabase transform   |
| Tolérance aux pannes                | 6/10 → **8/10** | SWR + stale-if-error + fallback local |

---

## 2. Frontend — Architecture

### 2.1 Modèle de rendu

Emarzona est une **SPA client-side** (pas SSR/ISR Next.js) :

- **SSG partiel:** `index.html` + contenu SEO statique (`seo-fallback`) pour crawlers
- **SSR bots:** Vercel Edge Middleware injecte meta OG pour bots uniquement
- **CSR:** Toutes les pages utilisateur via React Router + lazy loading

### 2.2 Routes

| Module                | Routes | Lazy loading |
| --------------------- | ------ | ------------ |
| `publicRoutes.tsx`    | 65     | Oui          |
| `dashboardRoutes.tsx` | 104    | Oui          |
| `adminRoutes.tsx`     | ~40    | Oui          |
| `customerRoutes.tsx`  | ~20    | Oui          |

### 2.3 Double chargements identifiés

| Page/Hook                  | Problème                         | Sévérité     | Recommandation                        |
| -------------------------- | -------------------------------- | ------------ | ------------------------------------- |
| `Marketplace.tsx`          | `useAuth` + `useCurrentUserId`   | Moyen        | Réutiliser `user.id` de `useAuth`     |
| `Marketplace.tsx`          | `usePageCustomization` ×2        | Faible       | Factoriser en un seul appel           |
| `Marketplace.tsx`          | Products + Facets RPC parallèles | Intentionnel | OK — fusion RPC future                |
| `AIProductRecommendations` | 3e fetch produits indépendant    | Moyen        | Partager cache `marketplace-products` |
| 194 hooks `useQuery`       | `staleTime` incohérents          | Faible       | Centraliser via `cacheStrategies`     |

### 2.4 Données non cachées (avant implémentation)

- Recherches populaires → **Redis** (nouveau `RedisService`)
- Store-by-domain (subdomain) → candidat Redis edge
- Rate limiter Supabase functions → Postgres COUNT (latence)

### 2.5 Données sur-cachées

- `refetchOnMount: true` global — acceptable avec `staleTime` 5min
- Service Worker images: 150 entrées SWR — bien dimensionné

### 2.6 SEO

- ✅ Middleware bots + meta dynamiques
- ✅ Sitemaps via Supabase Edge Functions
- ✅ `react-helmet-async` + `AutoSEO`
- ⚠️ SPA: contenu principal dépend du JS (mitigé par prerender bots)

### 2.7 Risques stale data

| Risque                             | Mitigation implémentée                      |
| ---------------------------------- | ------------------------------------------- |
| Produit modifié, marketplace stale | `invalidateCatalogCaches` + purge Redis API |
| Multi-tenant fuite cache           | Tags scopés `store:{id}:`                   |
| Session cross-account              | `clearSessionBrowserCaches` à logout        |

---

## 3. Couches de cache existantes (cartographie)

```
Utilisateur
    ↓
Cloudflare CDN (DNS, Cache Reserve, Brotli, HTTP/3 — dashboard)
    ↓
Vercel Edge Middleware (SEO bots, CSP, rate limit)
    ↓
Upstash Redis (meta SEO, rate limit bots)
    ↓
SPA React
    ├── Service Worker (assets, images SWR)
    ├── React Query (mémoire, 5min stale)
    ├── localStorage / IndexedDB (marketplace 10min)
    └── Supabase (source de vérité)
```

---

## 4. Fichiers audités

| Fichier                               | Rôle                 |
| ------------------------------------- | -------------------- |
| `src/lib/cache-optimization.ts`       | QueryClient global   |
| `src/lib/marketplace-cache.ts`        | Cache navigateur SWR |
| `src/lib/cache-invalidation.ts`       | Invalidation entités |
| `middleware.ts`                       | Edge SEO + Redis     |
| `public/sw.js`                        | Service Worker       |
| `vercel.json`                         | Headers CDN          |
| `src/hooks/useMarketplaceProducts.ts` | Catalogue principal  |

---

## 5. Plan d'action réalisé

1. ✅ `src/lib/cache/` — tags, config, SWR, invalidation, warmer
2. ✅ `src/lib/redis/` — service distribué + fallback local
3. ✅ API `/api/cache/*` — invalidate, warm, health, metrics
4. ✅ `CacheMonitoringDashboard` — admin monitoring
5. ✅ Headers CDN enrichis (`vercel.json`)
6. ✅ Tests automatisés (16 tests)
7. ✅ Documentation complète `docs/cache/`

---

## 6. Métriques cibles post-implémentation

| Métrique                     | Avant        | Cible              |
| ---------------------------- | ------------ | ------------------ |
| TTFB marketplace (cache hit) | ~800ms       | <200ms             |
| Cache hit rate Redis SEO     | ~60%         | >90%               |
| LCP homepage                 | ~2.5s        | <1.8s              |
| Invalidation propagation     | ~10min (TTL) | <5s (event-driven) |
