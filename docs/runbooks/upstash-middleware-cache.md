# Runbook — Cache Redis Upstash middleware SEO (Epic 4.1)

## Objectif

Réduire la charge Supabase des crawlers (Google, Facebook, IA) en mutualisant le cache meta SEO sur **Upstash Redis** (compatible Vercel Edge). Fallback in-memory si Redis absent (dev/preview).

## Architecture

```
Bot request → middleware.ts
  → rate-limit Redis (120 req/min/IP)
  → cache key normalisée (host + path, sans utm_*)
  → hit Redis ? inject meta : fetch Supabase → SET EX 600s
  → header x-seo-cache: hit-redis | hit-memory | miss
```

## Provisioning Upstash

1. [console.upstash.com](https://console.upstash.com) → Create Redis database (region proche EU).
2. Copier **REST URL** et **REST Token**.

## Variables Vercel (Production + Preview)

| Variable                   | Valeur                   |
| -------------------------- | ------------------------ |
| `UPSTASH_REDIS_REST_URL`   | `https://xxx.upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | token REST               |

Alternative Vercel KV (mêmes noms internes) :

- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

### Script

```powershell
$env:UPSTASH_REDIS_REST_URL = "https://..."
$env:UPSTASH_REDIS_REST_TOKEN = "..."
.\scripts\set-upstash-vercel-env.ps1
```

Puis **Redeploy Production**.

## Vérification

```bash
npx vitest run src/lib/middleware/__tests__/meta-cache.test.ts
```

Test manuel (simuler bot) :

```bash
curl -sI -A "Googlebot" "https://www.emarzona.com/marketplace" | findstr x-seo-cache
# 1ère requête : x-seo-cache: miss
# 2ème requête : x-seo-cache: hit-redis
```

Rate-limit (optionnel staging) :

```bash
# >120 requêtes/min depuis même IP → 429
```

## Rollback

1. Supprimer `UPSTASH_REDIS_*` sur Vercel → fallback memory-only (par instance edge).
2. Redeploy.

## Monitoring

- Ratio `hit-redis` / `miss` via logs Vercel ou observabilité custom.
- Latence P95 middleware < 1.5 s (timeout meta inchangé).
- Alertes si taux 429 bots > baseline (spoofing UA).

## Coût estimé

Upstash free tier : 10k commandes/jour — suffisant phase canary. Passer Pro si > 50k bots/jour.
