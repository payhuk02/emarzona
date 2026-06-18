# process-order-fulfillment-monitor

Cron P0 — détecte les commandes payées dont le fulfillment dépasse le SLA (défaut **5 min**).

## Secrets

| Variable                    | Description                                         |
| --------------------------- | --------------------------------------------------- |
| `CRON_SECRET`               | Header `x-cron-secret`                              |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin client                                        |
| `EDGE_INTERNAL_SECRET`      | Retry certificats artiste (via fulfillment partagé) |
| `FULFILLMENT_SLA_MINUTES`   | Optionnel (défaut `5`)                              |

## Planification (pg_cron ou Supabase Dashboard)

```sql
SELECT cron.schedule(
  'order-fulfillment-monitor',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://<project>.supabase.co/functions/v1/process-order-fulfillment-monitor',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', '<CRON_SECRET>'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

## Manuel

```bash
curl -X POST "https://<project>.supabase.co/functions/v1/process-order-fulfillment-monitor" \
  -H "x-cron-secret: <CRON_SECRET>" \
  -H "Content-Type: application/json"
```

## SLA plateforme

Enregistre un check `fulfillment` dans `platform_sla_checks` (visible sur `/status`).
