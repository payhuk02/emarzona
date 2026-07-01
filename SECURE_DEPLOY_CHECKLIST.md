# Secure Deploy Checklist (Emarzona)

## 1) Secrets and environment

- Set `EDGE_INTERNAL_SECRET` for all internal Edge Functions.
- Verify `SUPABASE_SERVICE_ROLE_KEY` is only present in server-side runtimes.
- Verify `RESEND_API_KEY`, `RESEND_FROM_EMAIL=noreply@mail.emarzona.com`, and `RESEND_FROM_NAME`.
- Confirm `ALLOWED_ORIGINS` includes only trusted domains.

## 2) Edge Functions security gates

- `webhook-delivery` must reject requests without valid `x-internal-secret`.
- `send-email` must allow:
  - internal calls with `x-internal-secret`,
  - authenticated user calls only in restricted mode.
- Ensure user-mode email calls cannot send custom HTML and cannot target other recipients.

## 3) CI checks before merge

- Run `npm run lint:ci`.
- Run `npm run test:coverage`.
- Run workflow job `edge-functions`:
  - `deno fmt --check supabase/functions`
  - `deno check` on Edge Function entrypoints.

## 4) Post-deploy smoke tests

Automated (Phase 0.5):

```powershell
npm run verify:secure-deploy
# ou validation complète Phase 0 :
npm run verify:phase0
```

Variables optionnelles pour tests positifs complets :

| Variable                                 | Usage                                               |
| ---------------------------------------- | --------------------------------------------------- |
| `EDGE_INTERNAL_SECRET`                   | Smoke `webhook-delivery` + `send-email` interne     |
| `scripts/.edge-internal-secret.local`    | Alternative gitignored (comme `.cron-secret.local`) |
| `E2E_BUYER_EMAIL` / `E2E_BUYER_PASSWORD` | Smoke restrictions utilisateur `send-email`         |

Checks manuels si secrets absents :

- Call `webhook-delivery` without secret → expect `401`.
- Call `webhook-delivery` with valid secret → expect `200`.
- Call `send-email` as user with `html` payload → expect `403`.
- Call `send-email` as user to another email → expect `403`.
- Call `send-email` with internal secret and valid payload → expect `200`.

## 5) Observability validation

- Confirm logs include `requestId` and `durationMs` for `send-email` and `webhook-delivery`.
- Confirm failed requests include structured error payloads.
- Track error rates after deploy (first 24h, then 7 days).

## 6) Sign-off (Phase 0)

Génération automatique du statut :

```powershell
npm run verify:phase0:signoff
```

| Check                         | Commande                             | Statut                                    |
| ----------------------------- | ------------------------------------ | ----------------------------------------- |
| Idempotence webhooks          | `npm run verify:webhook-idempotency` | ✅                                        |
| Fulfillment monitor           | `npm run verify:fulfillment-monitor` | ✅                                        |
| Payment V2                    | `npm run verify:payment-v2`          | ✅ (linked SQL ou service role)           |
| FedEx prod                    | `npm run verify:fedex-prod`          | ⚠️ — credentials `FEDEX_*` requis en prod |
| Secure deploy                 | `npm run verify:secure-deploy`       | ✅                                        |
| RLS + storage + client portal | `npm run audit:security-gates`       | ✅                                        |
| Client portal RLS (offline)   | `npm run test:client-portal-rls`     | ✅                                        |
| E2E prod guard (offline)      | `npm run test:e2e-guard`             | ✅                                        |
| Phase 0 complet               | `npm run verify:phase0`              | ✅ (FedEx optionnel dégradé hors prod)    |

**Signé par :** **\*\*\*\***\_\_**\*\*\*\*** **Date :** **\*\*\*\***\_\_**\*\*\*\***
