# fedex-track

Suivi de colis FedEx côté serveur (clés API jamais exposées au client).

## Secrets

Mêmes variables que `fedex-rates` / `fedex-ship` : `FEDEX_API_KEY`, `FEDEX_API_SECRET`, `FEDEX_TEST_MODE`.

Sans secrets → événements **mock** déterministes.

## Requête

```json
POST /functions/v1/fedex-track
{ "tracking_number": "7489123456789" }
```

## Déploiement

```bash
supabase functions deploy fedex-track
```
