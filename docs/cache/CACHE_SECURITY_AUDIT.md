# CACHE_SECURITY_AUDIT — Emarzona

**Date:** 16 juin 2026  
**Classification:** Interne — Sécurité cache multi-tenant

---

## 1. Isolation multi-tenant

| Risque                                      | Statut    | Mesure                                               |
| ------------------------------------------- | --------- | ---------------------------------------------------- |
| Fuite données vendeur A → B via React Query | ✅ Mitigé | Query keys incluent `storeId`                        |
| Fuite via localStorage marketplace          | ✅ Mitigé | `clearSessionBrowserCaches` au logout                |
| Fuite via Redis                             | ✅ Mitigé | Clés préfixées `emz:v1:` + tags scopés `store:{id}:` |
| Fuite SEO meta cross-store                  | ✅ Mitigé | `buildMetaCacheKey` inclut `host`                    |

### Recommandation

Toujours inclure `storeId` dans les query keys privées vendeur :

```typescript
queryKey: ['products', storeId]; // ✅
queryKey: ['products']; // ❌ risque cross-tenant
```

---

## 2. Cache public vs privé

| Donnée                | Classification | Headers                          |
| --------------------- | -------------- | -------------------------------- |
| Catalogue marketplace | Public         | `public, stale-while-revalidate` |
| Commandes / panier    | Privé          | `private, no-store`              |
| Dashboard vendeur     | Privé          | `private, no-store`              |
| Meta SEO bots         | Public         | `public, s-maxage=600`           |

Stratégies définies dans `CACHE_STRATEGIES` avec flag `isPrivate`.

---

## 3. Protection cache poisoning

| Vecteur                      | Protection                                    |
| ---------------------------- | --------------------------------------------- |
| Injection clé Redis          | Préfixe versionné `emz:v1:` + validation JSON |
| Paramètres URL tracking      | `TRACKING_PARAMS` exclus des clés SEO         |
| User-Agent spoofing bots     | Rate limit 120 req/min/IP                     |
| API invalidate non autorisée | `CACHE_INVALIDATION_SECRET` Bearer            |

---

## 4. Protection cache deception

| Vecteur                            | Protection                                                 |
| ---------------------------------- | ---------------------------------------------------------- |
| CDN sert HTML obsolète post-deploy | `VITE_BUILD_ID` + SW `updateViaCache: 'none'`              |
| Stale données critiques (stock)    | `staleTime` court commandes, RPC temps réel stock checkout |
| XSS via cached HTML                | CSP nonces (middleware utilisateurs réels)                 |

---

## 5. Protection cache bypass

| Vecteur                                  | Protection                                  |
| ---------------------------------------- | ------------------------------------------- |
| Headers `Cache-Control: no-cache` client | Ignoré — stratégie serveur prime            |
| Requêtes directes Supabase               | RLS PostgreSQL (audit existant `audit:rls`) |
| API keys dans cache                      | Jamais cachées — `no-store`                 |

---

## 6. Secrets et variables

| Variable                    | Côté                         | Exposition                            |
| --------------------------- | ---------------------------- | ------------------------------------- |
| `UPSTASH_REDIS_REST_TOKEN`  | Serveur uniquement           | ❌ Jamais client                      |
| `CACHE_INVALIDATION_SECRET` | Serveur + `VITE_*` optionnel | ⚠️ VITE exposé — rotation recommandée |
| `VITE_SUPABASE_ANON_KEY`    | Client                       | ✅ OK avec RLS                        |

### Action requise

Préférer invalidation Redis via **webhook serveur** plutôt que secret côté client. Le `VITE_CACHE_INVALIDATION_SECRET` est optionnel et ne doit être activé que si nécessaire.

---

## 7. Checklist conformité

- [x] Purge session au logout
- [x] Tags scopés par store
- [x] Données privées en `no-store`
- [x] Rate limit bots edge
- [x] Auth API cache invalidate
- [ ] Webhook Supabase invalidation (recommandé)
- [ ] Audit périodique clés Redis orphelines

---

## 8. Score sécurité cache

**8.5/10** — Architecture solide. Amélioration principale : retirer secret invalidation du bundle client.
