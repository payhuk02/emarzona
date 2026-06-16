# Guide de monitoring — Cache Emarzona

## Dashboard admin

**URL:** `/admin/monitoring`  
**Composant:** `CacheMonitoringDashboard`

### Métriques affichées

| Métrique       | Source                    | Seuil alerte |
| -------------- | ------------------------- | ------------ |
| Hit Rate       | `redis/metrics.ts` client | < 70%        |
| Redis latency  | `/api/cache/health`       | > 100ms      |
| Fallback count | Métriques client          | > 50/min     |
| Edge status    | Health API                | != `ok`      |

---

## API monitoring

### Health check (public)

```
GET /api/cache/health
```

```json
{
  "status": "ok",
  "layers": {
    "redis": { "status": "healthy", "latencyMs": 12 },
    "cdn": { "status": "edge", "provider": "cloudflare+vercel" }
  }
}
```

### Métriques détaillées (auth)

```
GET /api/cache/metrics
Authorization: Bearer {CACHE_INVALIDATION_SECRET}
```

---

## Intégration Sentry

Les Web Vitals existants (`src/lib/web-vitals.ts`) couvrent LCP/FID/CLS.

Ajouter breadcrumb cache sur invalidation :

```typescript
import * as Sentry from '@sentry/react';
Sentry.addBreadcrumb({ category: 'cache', message: 'product:mutation invalidated' });
```

---

## Alertes recommandées

| Alerte            | Condition                      | Canal          |
| ----------------- | ------------------------------ | -------------- |
| Redis down        | health.redis.status != healthy | Sentry + email |
| Hit rate bas      | < 60% sur 15min                | Dashboard      |
| Warm cache failed | warm API failed > 3            | Vercel logs    |

---

## Headers de debug

| Header          | Valeur                        | Contexte        |
| --------------- | ----------------------------- | --------------- |
| `x-seo-cache`   | hit-redis / hit-memory / miss | Réponses bots   |
| `x-prerendered` | bot                           | Middleware SEO  |
| `Cache-Control` | voir stratégie                | Toutes réponses |

---

## KPIs mensuels

- Cache hit rate global
- P95 latence Redis
- Nombre invalidations / jour
- Taux fallback local Redis
- LCP homepage (Lighthouse CI)

Script existant : `npm run audit:lighthouse`
