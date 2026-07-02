# Post-lancement — Perf & scale (Phase 3+)

Checklist ops après stabilisation Payment V2 canary. Baseline locale : **2026-07-02**.

## Bundle (budgets CI)

```bash
npm run monitor:bundle:quick    # sans build (dist existant)
npm run build:check             # build + budgets
```

| Chunk (baseline 2026-07-02) | Taille | Budget |
| --------------------------- | ------ | ------ |
| `index-*.js` (main)         | 299 KB | 300 KB |
| `vendor-react`              | 160 KB | 180 KB |
| `vendor-supabase`           | 200 KB | 220 KB |
| `charts`                    | 491 KB | 520 KB |

**Actions si dépassement :** lazy-load routes admin, split charts/three/pdf, `npm run analyze:bundle`.

## LCP / Core Web Vitals

- [ ] Vercel Speed Insights activé (production)
- [ ] LCP cible storefront < 2,5 s (mobile 4G)
- [ ] Images produit : `loading="lazy"` + formats WebP/AVIF
- [ ] Preconnect Supabase + CDN assets

## Upstash Redis (middleware SEO cache)

Déjà configuré sur Vercel (production + preview) et Supabase Edge.

```bash
npm run verify:upstash-prod
# Si absent : .\scripts\set-upstash-vercel-env.ps1 (credentials dans .env)
```

Secrets Supabase Edge (invalidation cache) :

```bash
npx supabase secrets set UPSTASH_REDIS_REST_URL=... UPSTASH_REDIS_REST_TOKEN=... --project-ref hbdnzajbyjakdhuavrvb
```

## Transporteur #2 (post-FedEx)

- [ ] FedEx prod : `.\scripts\setup-fedex-prod-secrets.ps1` + `npm run verify:fedex-prod`
- [ ] Évaluer DHL / Colissimo / partenaire régional selon marchés cibles
- [ ] Abstraction `shipping-providers` — second adapter + tests `fedex-policy.test.ts` pattern

## VAPID push PWA

```bash
npm run setup:vapid-secrets -- --dry-run
npm run setup:vapid-secrets -- --redeploy
```

## Payment V2 escalade

Voir [PAYMENT_V2_CANARY_10_CHECKLIST.md](./PAYMENT_V2_CANARY_10_CHECKLIST.md) et `npm run monitor:payment-v2-canary`.
