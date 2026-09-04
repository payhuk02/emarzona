# Post-lancement — Perf & scale (Phase 3+)

Checklist ops après stabilisation Payment V2 canary. Baseline locale : **2026-07-02**.
Audit plateforme (perf / stabilité / navigation) : **2026-09-04**.

## Bundle (budgets CI)

```bash
npm run monitor:bundle:quick    # sans build (dist existant)
npm run build:check             # build + budgets
npm run check:zod-schema-chains # anti-crash Zod (refine→trim)
npm run verify:routes           # lazy imports + nav URLs
```

| Chunk (baseline 2026-07-02) | Taille | Budget |
| --------------------------- | ------ | ------ |
| `index-*.js` (main)         | 299 KB | 300 KB |
| `vendor-react`              | 160 KB | 180 KB |
| `vendor-supabase`           | 200 KB | 220 KB |
| `charts`                    | 491 KB | 520 KB |

Budget CI actuel `app-core` : **340 KB** (`scripts/check-bundle-budget.mjs`).

**Actions si dépassement :** lazy-load routes admin, split charts/three/pdf, `npm run analyze:bundle`.

## Audit 2026-09-04 — findings traités (P0/P1)

| Sévérité | Finding                                                                       | Correctif                                                                         |
| -------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| P0       | Checkout multi-boutique : Connect sélectionnable + message GeniusPay obsolète | `PaymentProviderSelector` + `multi-store-checkout.ts` → MoneyFusion only + alerte |
| P0       | E2E wizard attend 90s sur `FormErrorBoundary`                                 | `data-testid` + fail-fast dans `waitForWizardMarker`                              |
| P0       | `verify:routes` cassé (script TS manquant)                                    | `scripts/verify-routes.mjs`                                                       |
| P1       | Guard seller : spinner + `null` pendant redirect + toasts spam                | skeleton + toast once                                                             |
| P1       | Flash chrome admin→seller pendant `useAdmin` loading                          | hold persona admin dans `useSidebarPersona`                                       |
| P1       | Logos boutique marketplace en `<img>` brut                                    | `OptimizedImage` sur ProductCard\*                                                |
| P1       | Anti-pattern Zod `.refine().trim()` (déjà fixé cours)                         | gate CI `check:zod-schema-chains`                                                 |

### P2 traités (2026-09-04 suite)

| Finding                              | Correctif                                                                         |
| ------------------------------------ | --------------------------------------------------------------------------------- |
| ErrorBoundary marketplace / checkout | `CommercePageErrorBoundary` sur routes public + subdomain                         |
| Waterfall Auth→Store first paint     | `StoreContext` loading optimiste (guest ready si pas de `selectedStoreId`)        |
| Preconnect LCP                       | `crossorigin` dans `index.html` + `ResourceHints` dynamique (`VITE_SUPABASE_URL`) |

### P2 restants (ops / hors code)

- Activer Vercel Speed Insights en production
- Mesurer LCP storefront mobile 4G &lt; 2,5 s (après deploy)
- Preconnect CDN custom si assets hors Supabase/GCS

## LCP / Core Web Vitals

- [ ] Vercel Speed Insights activé (production)
- [ ] LCP cible storefront &lt; 2,5 s (mobile 4G)
- [x] Images produit / logos carte : lazy + `OptimizedImage` (WebP/AVIF via composant)
- [x] Preconnect Supabase + GCS (+ `ResourceHints` runtime)

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
