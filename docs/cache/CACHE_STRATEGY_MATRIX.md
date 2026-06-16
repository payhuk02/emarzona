# CACHE_STRATEGY_MATRIX — Emarzona

Matrice source de vérité — synchronisée avec `src/lib/cache/config.ts`.

---

## Légende

| Colonne          | Description                       |
| ---------------- | --------------------------------- |
| **TTL**          | Durée de vie cache (secondes)     |
| **SWR**          | stale-while-revalidate (secondes) |
| **SIE**          | stale-if-error (secondes)         |
| **Méthode**      | Stratégie de récupération         |
| **Invalidation** | Événements déclencheurs           |

---

## Données statiques

| Type                         | TTL   | SWR    | SIE   | Méthode   | Couches          | Invalidation           |
| ---------------------------- | ----- | ------ | ----- | --------- | ---------------- | ---------------------- |
| CGU / CGV / Mentions légales | 86400 | 604800 | 86400 | immutable | Browser, CDN, SW | `admin:legal-update`   |
| FAQ                          | 3600  | 86400  | 3600  | SWR       | Browser, CDN, RQ | `admin:faq-update`     |
| Pages institutionnelles      | 86400 | 604800 | 86400 | immutable | Browser, CDN     | `admin:content-update` |

---

## Données semi-dynamiques

| Type                         | TTL | SWR  | SIE  | Méthode | Couches                       | Invalidation                          |
| ---------------------------- | --- | ---- | ---- | ------- | ----------------------------- | ------------------------------------- |
| Boutiques / profils vendeurs | 300 | 600  | 3600 | SWR     | Browser, CDN, Edge, Redis, RQ | `store:update`, `store:publish`       |
| Catégories                   | 600 | 1800 | 3600 | SWR     | Browser, Redis, RQ            | `category:update`, `product:mutation` |
| Collections artistes         | 600 | 1800 | 3600 | SWR     | Browser, Redis, RQ            | `artist:mutation`                     |

---

## Données dynamiques — Catalogue

| Type                  | TTL | SWR | SIE  | Méthode | Couches                 | Invalidation                           |
| --------------------- | --- | --- | ---- | ------- | ----------------------- | -------------------------------------- |
| Produits (tous types) | 120 | 600 | 3600 | SWR     | Toutes                  | `product:*`                            |
| Liste marketplace     | 90  | 600 | 1800 | SWR     | Browser, Redis, RQ      | `product:mutation`, `import:catalog`   |
| Facettes / filtres    | 120 | 600 | 1800 | SWR     | Browser, RQ             | `product:mutation`                     |
| Recherche             | 60  | 300 | 600  | SWR     | Browser, Redis, RQ      | `product:mutation`                     |
| Recommandations       | 300 | 900 | 1800 | SWR     | Browser, Redis, RQ      | `product:mutation`, `analytics:rollup` |
| Homepage              | 120 | 600 | 3600 | SWR     | Browser, CDN, Redis, RQ | `deploy`, `admin:homepage-update`      |

---

## Données dynamiques — Transactionnel (PRIVÉ)

| Type          | TTL | SWR | SIE | Méthode       | Couches     | Invalidation                 |
| ------------- | --- | --- | --- | ------------- | ----------- | ---------------------------- |
| Commandes     | 0   | 0   | 120 | network-first | RQ          | `order:*`, `payment:webhook` |
| Panier        | 0   | 0   | 60  | network-first | RQ, Browser | `cart:mutation`              |
| Notifications | 0   | 0   | 30  | network-only  | RQ          | `notification:create`        |
| Messages      | 0   | 0   | 30  | network-only  | RQ          | temps réel                   |

---

## SEO & Edge

| Type          | TTL  | SWR   | SIE  | Méthode | Couches     | Invalidation                         |
| ------------- | ---- | ----- | ---- | ------- | ----------- | ------------------------------------ |
| Meta SEO bots | 600  | 1800  | 3600 | SWR     | Edge, Redis | `product:mutation`, `store:mutation` |
| Sitemaps XML  | 3600 | 86400 | 3600 | SWR     | CDN, Edge   | cron régénération                    |

---

## Assets

| Type                       | TTL             | Méthode    | Headers                                              |
| -------------------------- | --------------- | ---------- | ---------------------------------------------------- |
| JS/CSS hashés (`/assets/`) | 31536000        | immutable  | `Cache-Control: public, max-age=31536000, immutable` |
| Fonts                      | 31536000        | immutable  | idem                                                 |
| Images SW                  | 150 entrées LRU | SWR        | Service Worker                                       |
| Images Supabase            | transform API   | responsive | AVIF/WebP via `OptimizedImage`                       |

---

## Mapping tags → implémentation

| Tag (`CacheTag`) | React Query prefixes                         | Redis pattern          |
| ---------------- | -------------------------------------------- | ---------------------- |
| `marketplace`    | `marketplace-products`, `marketplace-facets` | `emz:v1:*marketplace*` |
| `product`        | `product`, `products`                        | `emz:v1:*product*`     |
| `search`         | `product-search`, `search-suggestions`       | `emz:v1:search:*`      |
| `seo-meta`       | —                                            | `seo:meta:v1:*`        |

Voir `src/lib/cache/query-tags.ts` et `src/lib/cache/tags.ts`.
