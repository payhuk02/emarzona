# fedex-ship

Crée une expédition FedEx et génère une étiquette côté serveur (clés API jamais exposées au client).

## Secrets Supabase

| Variable               | Description                        |
| ---------------------- | ---------------------------------- |
| `FEDEX_API_KEY`        | Client ID FedEx                    |
| `FEDEX_API_SECRET`     | Client secret                      |
| `FEDEX_ACCOUNT_NUMBER` | Numéro de compte                   |
| `FEDEX_TEST_MODE`      | `true` (sandbox) ou `false` (prod) |

Sans secrets → réponse **mock** (numéro de suivi et coût estimés en XOF).

## Requête

```json
POST /functions/v1/fedex-ship
{
  "ship_from": {
    "name": "Boutique",
    "address": "Rue 12",
    "city": "Ouagadougou",
    "postal_code": "01",
    "country": "BF",
    "phone": "+22670000000"
  },
  "ship_to": {
    "name": "Client",
    "address": "Avenue 5",
    "city": "Bobo-Dioulasso",
    "postal_code": "02",
    "country": "BF"
  },
  "package": { "weight_kg": 1.2, "length": 20, "width": 15, "height": 10 },
  "service_type": "FEDEX_GROUND",
  "reference": "order-uuid"
}
```

## Réponse

```json
{
  "success": true,
  "tracking_number": "7489123456789",
  "tracking_url": "https://www.fedex.com/fedextrack/?trknbr=...",
  "label_url": "https://...",
  "estimated_delivery": "2026-05-24T00:00:00.000Z",
  "shipping_cost": 5000,
  "currency": "XOF",
  "service_type": "FEDEX_GROUND",
  "source": "fedex_api"
}
```

## Déploiement

```bash
supabase functions deploy fedex-ship
```
