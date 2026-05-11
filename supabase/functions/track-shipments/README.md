# Edge Function: Track Shipments

Cette fonction Supabase Edge Function permet de tracker automatiquement tous les shipments en attente.

## Configuration

### 1. Déployer la fonction

```bash
supabase functions deploy track-shipments
```

### 2. Configurer le Cron Job

Dans Supabase Dashboard, allez dans **Database > Cron Jobs** et créez un nouveau job :

```sql
-- Exécuter toutes les 5 minutes
SELECT cron.schedule(
  'track-pending-shipments',
  '*/5 * * * *', -- Toutes les 5 minutes
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/track-shipments',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
```

### 3. Variables d'environnement

La fonction utilise automatiquement les variables d'environnement Supabase :

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Utilisation

### Appel manuel

```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/track-shipments \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

### Réponse

```json
{
  "success": true,
  "message": "Tracked 5 shipments successfully, 0 failed",
  "tracked": 5,
  "failed": 0,
  "total": 5
}
```

## Notes

- La fonction track uniquement les shipments avec un `tracking_number`
- Les shipments trackés sont ceux avec le statut : `pending`, `label_created`, `picked_up`, `in_transit`
- Une pause de 500ms est ajoutée entre chaque tracking pour éviter de surcharger les APIs
