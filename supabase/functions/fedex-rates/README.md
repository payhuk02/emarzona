# fedex-rates

Calcule les tarifs d'expédition FedEx côté serveur (clés API jamais exposées au client).

## Secrets Supabase

| Variable               | Description                        |
| ---------------------- | ---------------------------------- |
| `FEDEX_API_KEY`        | Client ID FedEx                    |
| `FEDEX_API_SECRET`     | Client secret                      |
| `FEDEX_ACCOUNT_NUMBER` | Numéro de compte                   |
| `FEDEX_TEST_MODE`      | `true` (sandbox) ou `false` (prod) |

Sans secrets → réponse **mock** (estimation XOF).

## Requête

```json
POST /functions/v1/fedex-rates
{
  "ship_from": { "country": "BF", "postal_code": "01", "city": "Ouagadougou" },
  "ship_to": { "country": "BF", "postal_code": "02", "city": "Bobo-Dioulasso" },
  "weight_kg": 1.2
}
```

## Réponse

```json
{
  "rates": [
    {
      "service_type": "FEDEX_GROUND",
      "service_name": "FedEx Ground",
      "total_cost": 5000,
      "currency": "XOF",
      "estimated_days": 5
    }
  ],
  "source": "fedex_api"
}
```

## Déploiement

```bash
supabase functions deploy fedex-rates
```
