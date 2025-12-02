# Process Scheduled Campaigns

Edge Function pour traiter automatiquement les campagnes email programmées.

## Description

Cette fonction vérifie les campagnes email avec le statut `scheduled` dont la date d'envoi (`scheduled_at`) est passée, et les envoie automatiquement.

## Configuration Cron Job

Pour activer cette fonction automatiquement, configurez un cron job dans Supabase :

### Option 1: Via Supabase Dashboard

1. Allez dans **Database** > **Cron Jobs**
2. Créez un nouveau cron job avec :
   - **Schedule**: `*/5 * * * *` (toutes les 5 minutes)
   - **Function**: `process-scheduled-campaigns`
   - **Payload**: `{}`

### Option 2: Via SQL Migration

```sql
-- Créer le cron job
SELECT cron.schedule(
  'process-scheduled-campaigns',
  '*/5 * * * *', -- Toutes les 5 minutes
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT.supabase.co/functions/v1/process-scheduled-campaigns',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
```

## Variables d'Environnement

- `SENDGRID_API_KEY` : Clé API SendGrid (optionnel, vérifie seulement)
- `SUPABASE_URL` : URL de votre projet Supabase
- `SUPABASE_SERVICE_ROLE_KEY` : Clé de service Supabase

## Paramètres

- `limit` (optionnel) : Nombre maximum de campagnes à traiter par exécution (défaut: 10)

## Réponse

```json
{
  "success": true,
  "message": "Processed 3 scheduled campaigns",
  "processed": 3,
  "successful": 2,
  "failed": 1,
  "results": [
    {
      "campaign_id": "uuid",
      "campaign_name": "Campaign Name",
      "success": true,
      "error": null
    }
  ]
}
```

