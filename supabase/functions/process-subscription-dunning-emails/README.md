# process-subscription-dunning-emails

Envoie les emails de relance (dunning) pour les abonnements produits physiques.

## Types d'emails

| Dunning    | Template slug                      | Déclencheur                      |
| ---------- | ---------------------------------- | -------------------------------- |
| J-7        | `subscription_renewal_reminder`    | 7 jours avant échéance           |
| J-1        | `subscription_renewal_j1`          | 24h avant échéance               |
| past_due   | `subscription_past_due`            | >1 jour après échéance           |
| auto_renew | `subscription_auto_renew_checkout` | Checkout Moneroo auto créé (E23) |

## Prérequis

- Migration `20260611190000__e24_subscription_dunning_emails.sql`
- Edge `send-notification-email` + `send-email` opérationnels
- Secret `EDGE_INTERNAL_SECRET` (recommandé)

## Cron

Exécuter **1x/jour** après `process_subscription_dunning_notifications` :

```sql
SELECT net.http_post(
  url := 'https://<PROJECT_REF>.supabase.co/functions/v1/process-subscription-dunning-emails',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'x-cron-secret', '<CRON_SECRET>'
  ),
  body := '{}'::jsonb
);
```
