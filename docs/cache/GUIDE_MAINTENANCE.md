# Guide de maintenance — Cache Emarzona

## Maintenance hebdomadaire

- [ ] Vérifier `/api/cache/health` (automatable via cron)
- [ ] Consulter hit rate dashboard admin
- [ ] Vérifier logs Vercel middleware (`x-seo-cache: miss` élevé)

## Maintenance mensuelle

- [ ] Audit clés Redis orphelines (`KEYS emz:v1:*` count)
- [ ] Revoir TTL dans `CACHE_STRATEGIES` selon métriques
- [ ] Lighthouse audit : `npm run audit:lighthouse`
- [ ] Rotation `CACHE_INVALIDATION_SECRET` si exposé côté client

## Maintenance post-release

1. Deploy Vercel
2. `POST /api/cache/warm`
3. Vérifier health Redis
4. Smoke test marketplace (produit visible < 5s après publish)

## Nettoyage localStorage client

Automatique via :

- `setupCacheCleanup` (1h inactivité)
- `optimizeLocalStorageCache` (seuil 5MB)
- `cleanExpiredCache` marketplace (5min interval)

## Mise à jour stratégies

1. Modifier `src/lib/cache/config.ts`
2. Synchroniser `docs/cache/CACHE_STRATEGY_MATRIX.md`
3. Ajuster `vercel.json` headers si CDN impacté
4. Tests : `npm run test:unit -- src/lib/cache`

## Migration Redis

Si changement provider Upstash → Redis Enterprise :

1. Mettre à jour `UPSTASH_REDIS_REST_URL/TOKEN`
2. `client.ts` compatible REST API Upstash protocol
3. Warm cache complet post-migration

## Rollback cache

En cas de régression cache :

```bash
# 1. Rollback deploy Vercel
# 2. Purge Redis complète (attention charge)
curl -X POST .../api/cache/invalidate -d '{"tags":["marketplace","product","seo-meta"]}'
# 3. Warm cache
curl -X POST .../api/cache/warm ...
```

## Dette technique connue

| Item                                   | Priorité | Effort |
| -------------------------------------- | -------- | ------ |
| Webhook Supabase → invalidate API      | Haute    | 2j     |
| Fusion RPC products+facets             | Moyenne  | 3j     |
| Retirer VITE_CACHE_INVALIDATION_SECRET | Haute    | 1j     |
| Predictive prefetch engine             | Basse    | 5j     |
| Redis rate-limiter edge functions      | Moyenne  | 3j     |
