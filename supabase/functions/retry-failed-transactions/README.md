# Edge Function: Retry Failed Transactions

## Description

Cette Edge Function effectue un retry automatique des transactions en statut "processing" qui sont restées en attente trop longtemps. Elle utilise un système de backoff exponentiel pour éviter de surcharger les APIs des providers.

## Configuration

### Variables d'environnement

Aucune variable d'environnement spécifique requise. La fonction utilise :

- `SUPABASE_URL` (automatique)
- `SUPABASE_SERVICE_ROLE_KEY` (automatique)

### Configuration via platform_settings

Vous pouvez configurer le comportement via `platform_settings` :

```json
{
  "retry_config": {
    "maxAttempts": 3,
    "backoffIntervals": [1, 6, 24], // En heures
    "minAgeForRetry": 1 // En heures
  }
}
```

**Paramètres par défaut :**

- `maxAttempts`: 3 tentatives maximum
- `backoffIntervals`: [1h, 6h, 24h] - Intervalles entre chaque tentative
- `minAgeForRetry`: 1h - Âge minimum avant premier retry

## Déploiement

```bash
supabase functions deploy retry-failed-transactions
```

## Configuration du Cron Job

Dans Supabase Dashboard :

1. Allez dans **Database** → **Cron Jobs**
2. Créez un nouveau cron job :
   - **Name**: `retry-failed-transactions`
   - **Schedule**: `0 * * * *` (toutes les heures)
   - **SQL Command**:

   ```sql
   SELECT net.http_post(
     url := 'https://YOUR_PROJECT.supabase.co/functions/v1/retry-failed-transactions',
     headers := jsonb_build_object(
       'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
     ),
     body := '{}'::jsonb
   );
   ```

   **OU** utilisez pg_cron directement :

   ```sql
   SELECT cron.schedule(
     'retry-failed-transactions',
     '0 * * * *',  -- Toutes les heures
     $$
     SELECT net.http_post(
       url := 'https://YOUR_PROJECT.supabase.co/functions/v1/retry-failed-transactions',
       headers := jsonb_build_object(
         'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
       ),
       body := '{}'::jsonb
     );
     $$
   );
   ```

## Fonctionnement

1. **Sélection des transactions** :
   - Statut = "processing"
   - Créées il y a plus de `minAgeForRetry` heures
   - Limite de 100 transactions par exécution

2. **Vérification d'éligibilité** :
   - Vérifie le nombre de tentatives précédentes
   - Vérifie si le backoff est respecté
   - Vérifie si le maximum de tentatives n'est pas atteint

3. **Vérification auprès du provider** :
   - Appelle l'API du provider (Moneroo/PayDunya)
   - Récupère le statut actuel

4. **Mise à jour** :
   - Met à jour la transaction si le statut a changé
   - Met à jour l'order associé si transaction complétée
   - Crée un enregistrement dans `transaction_retries`
   - Log dans `transaction_logs`

## Logs

Tous les retries sont loggés dans :

- `transaction_retries` : Détails de chaque tentative
- `transaction_logs` : Événements de retry

## Monitoring

Pour surveiller les retries :

```sql
-- Transactions en attente de retry
SELECT
  t.id,
  t.moneroo_transaction_id,
  t.amount,
  t.created_at,
  t.retry_count,
  AGE(NOW(), t.created_at) as age
FROM transactions t
WHERE t.status = 'processing'
  AND t.created_at < NOW() - INTERVAL '1 hour'
ORDER BY t.created_at ASC;

-- Historique des retries
SELECT
  tr.*,
  t.amount,
  t.status as transaction_status
FROM transaction_retries tr
JOIN transactions t ON t.id = tr.transaction_id
ORDER BY tr.created_at DESC
LIMIT 50;
```
