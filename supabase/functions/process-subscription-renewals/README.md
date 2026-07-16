# process-subscription-renewals

Initie automatiquement les renouvellements d'abonnement produits physiques via GeniusPay.

GeniusPay ne propose pas de mandate récurrent natif : cette fonction crée un checkout pré-rempli avec le profil client enregistré (`subscription_billing_mandates`) et envoie une notification in-app avec le lien de paiement.

## Prérequis

- Migration `20260611180000__e23_geniuspay_automatic_subscription_renewal.sql` appliquée
- Secrets Edge : `CRON_SECRET`, `GENIUSPAY_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Mandate enregistré après le premier paiement réussi (webhook)

## Cron (pg_cron)

Exécuter **une fois par jour** (ex. 06:00 UTC), après `process_store_platform_subscription_lifecycle` :

```sql
SELECT net.http_post(
  url := 'https://<PROJECT_REF>.supabase.co/functions/v1/process-subscription-renewals',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'x-cron-secret', '<CRON_SECRET>'
  ),
  body := '{}'::jsonb
);
```

## Test manuel

```bash
curl -X POST "https://<PROJECT_REF>.supabase.co/functions/v1/process-subscription-renewals" \
  -H "Content-Type: application/json" \
  -H "x-cron-secret: <CRON_SECRET>"
```

## Comportement

1. `list_subscriptions_for_auto_renewal()` — abonnements actifs J-3 ou `past_due`, mandate actif
2. Crée ou réutilise une facture pending (`get_or_create_renewal_invoice`)
3. Initialise GeniusPay server-side avec email/téléphone du mandate
4. Enregistre la tentative + notification avec `checkout_url`
5. Cooldown 24h entre deux tentatives avec checkout actif
