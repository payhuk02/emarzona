# FedEx — credentials production (Epic 3.2.1)

## Objectif

Tarifs et suivi **FedEx API réels** en production. Les réponses mock sont **interdites** sauf opt-in explicite.

## Secrets Supabase (Edge Functions)

Configurer dans **Supabase Dashboard → Project Settings → Edge Functions → Secrets** :

| Secret                 | Production                | Staging               |
| ---------------------- | ------------------------- | --------------------- |
| `FEDEX_API_KEY`        | Client ID FedEx prod      | Client ID sandbox     |
| `FEDEX_API_SECRET`     | Client secret prod        | Client secret sandbox |
| `FEDEX_ACCOUNT_NUMBER` | Compte marchand           | Compte test           |
| `FEDEX_TEST_MODE`      | `false`                   | `true`                |
| `FEDEX_ALLOW_MOCK`     | **non défini** ou `false` | `true` (optionnel)    |

## Garde-fous

| Couche                         | Comportement                                                                  |
| ------------------------------ | ----------------------------------------------------------------------------- |
| Edge `_shared/fedex-policy.ts` | Mock autorisé si `ENVIRONMENT` ≠ production **ou** `FEDEX_ALLOW_MOCK=true`    |
| Client `fedex-policy.ts`       | Mock si `!import.meta.env.PROD` **ou** `VITE_FEDEX_ALLOW_MOCK=true`           |
| `fedex-rates-client`           | `assertFedexResponseNotMock(source)` — rejette `source: mock` en prod         |
| Plan vendeur                   | `shipping.fedex_live` requis (Professional+) via `store_has_physical_feature` |

## Déploiement

```bash
npx supabase functions deploy fedex-rates fedex-track --project-ref hbdnzajbyjakdhuavrvb
```

## Vérification prod

```sql
-- Pas de test API depuis SQL ; vérifier secrets présents côté dashboard
SELECT proname FROM pg_proc WHERE proname = 'store_has_physical_feature';
```

Appel manuel (utilisateur authentifié Professional+) :

```bash
curl -X POST "$SUPABASE_URL/functions/v1/fedex-rates" \
  -H "Authorization: Bearer $USER_JWT" \
  -H "Content-Type: application/json" \
  -d '{"ship_from":{"country":"BF","postal_code":"01"},"ship_to":{"country":"BF","postal_code":"02"},"weight_kg":1}'
```

Réponse attendue : `"source": "fedex_api"`. Si credentials absents en prod → **503** `FEDEX_NOT_CONFIGURED`.

## Admin plateforme

Référence optionnelle (non exposée au client) : `/admin/platform-integrations` → carte FedEx.

Les clés effectives restent **uniquement** dans les secrets Edge Supabase.

## Rollback

1. Définir `FEDEX_ALLOW_MOCK=true` temporairement (staging uniquement recommandé).
2. Ne jamais activer `VITE_FEDEX_ALLOW_MOCK=true` sur Vercel production sans validation PO.
