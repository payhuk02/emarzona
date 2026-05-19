# fedex-cancel

Annule une expédition FedEx côté serveur (avant prise en charge par le transporteur).

## Secrets

`FEDEX_API_KEY`, `FEDEX_API_SECRET`, `FEDEX_ACCOUNT_NUMBER`, `FEDEX_TEST_MODE` (identiques aux autres fonctions FedEx).

Sans secrets → annulation **mock** (succès simulé).

## Requête

```json
POST /functions/v1/fedex-cancel
{ "tracking_number": "7489123456789" }
```

## Réponse

```json
{
  "success": true,
  "tracking_number": "7489123456789",
  "message": "Expédition annulée chez FedEx",
  "source": "fedex_api"
}
```

## Déploiement

```bash
supabase functions deploy fedex-cancel
```
