# Runbook — Cache invalidation webhook

## 1. Secrets Supabase Edge Functions

Dans **Supabase Dashboard → Edge Functions → Secrets** :

```
CACHE_INVALIDATION_SECRET=<même valeur que Vercel>
UPSTASH_REDIS_REST_URL=<upstash url>
UPSTASH_REDIS_REST_TOKEN=<upstash token>
SITE_URL=https://www.emarzona.com
CRON_SECRET=<optionnel, pour cron>
```

## 2. Déployer les Edge Functions

```bash
npx supabase functions deploy cache-invalidate
npx supabase functions deploy cache-warm
```

## 3. Migration triggers DB

Appliquer `20260616140000__cache_invalidation_triggers.sql` puis **remplacer** dans la fonction SQL :

`REPLACE_WITH_CACHE_INVALIDATION_SECRET` → valeur réelle du secret.

Ou via Supabase Vault + `current_setting`.

## 4. Vercel secrets

```
CACHE_INVALIDATION_SECRET
CRON_SECRET          # utilisé par Vercel Cron (Authorization: Bearer)
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
```

## 5. Test manuel

```bash
# Edge function directe
curl -X POST https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/cache-invalidate \
  -H "x-cache-invalidate-secret: $CACHE_INVALIDATION_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"table":"products","operation":"UPDATE","record_id":"test"}'

# Vercel warm (cron)
curl https://www.emarzona.com/api/cache/warm \
  -H "Authorization: Bearer $CRON_SECRET"
```

## 6. Flux automatique

```
UPDATE products → trigger notify_cache_invalidate_catalog()
  → pg_net.http_post → cache-invalidate edge function
  → purgeRedisByTags → Redis SEO + app cache purgés
```

Le client React Query est invalidé séparément via `invalidateCatalogCaches()` dans l'UI vendeur.

## 7. Déploiement automatisé

```powershell
# Windows (interactif)
npm run deploy:cache

# Ou directement
.\scripts\deploy-cache-enterprise.ps1 -Interactive
```

```bash
# Linux/macOS
chmod +x scripts/deploy-cache-enterprise.sh
./scripts/deploy-cache-enterprise.sh --interactive
```

Le script configure : Vercel env, Supabase secrets, edge functions, trigger SQL avec secret.
