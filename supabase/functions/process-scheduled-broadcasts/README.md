# process-scheduled-broadcasts

Traite les envois admin programmés (`admin_broadcasts.status = 'scheduled'`).

## Déploiement

```bash
npx supabase functions deploy process-scheduled-broadcasts --project-ref hbdnzajbyjakdhuavrvb
```

## Cron (toutes les 5 min)

Configurer un job pg_cron similaire à `process-scheduled-email-campaigns`, avec header `x-cron-secret` = `CRON_SECRET`.

Exemple manuel (SQL Editor, après migration `20260531120000`) :

```sql
SELECT cron.schedule(
  'process-scheduled-admin-broadcasts',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/process-scheduled-broadcasts',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', '<CRON_SECRET>'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

## Test manuel

```bash
curl -X POST "https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/process-scheduled-broadcasts" \
  -H "Content-Type: application/json" \
  -H "x-cron-secret: <CRON_SECRET>"
```
