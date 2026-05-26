# process-auction-statuses

Cron (toutes les 5 min) :

1. `update_auction_statuses()` — active / clôture les enchères expirées
2. `create_auction_winner_order` si commande manquante
3. Email gagnant via `send-notification-email` + template `notification_templates.slug = auction_won`

## Auth

Header `x-cron-secret` = `CRON_SECRET`, ou `x-internal-secret` = `EDGE_INTERNAL_SECRET`.

## Variables template `auction_won`

- `{{user_name}}`, `{{auction_title}}`, `{{current_bid}}`
- `{{action_url}}`, `{{action_label}}`, `{{message}}`
- `{{winner_payment_deadline}}`, `{{platform_name}}`

## pg_cron (prod)

```sql
SELECT public.setup_auction_statuses_cron_job('PROJECT_REF', 'CRON_SECRET');
```

## GitHub Actions (secours)

Workflow `.github/workflows/auction-status-cron.yml` — secrets `SUPABASE_URL`, `CRON_SECRET`.
