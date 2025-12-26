# Edge Function: Transaction Alerts

## Description

Cette Edge Function surveille les transactions et génère des alertes pour :

- Transactions en attente depuis plus de X heures
- Taux d'échec élevé (> seuil configurable)
- Différences de montants détectées dans les webhooks

## Configuration

### Variables d'environnement

Aucune variable d'environnement spécifique requise. La fonction utilise :

- `SUPABASE_URL` (automatique)
- `SUPABASE_SERVICE_ROLE_KEY` (automatique)

### Configuration via platform_settings

Vous pouvez configurer le comportement via `platform_settings` :

```json
{
  "transaction_alerts": {
    "enabled": true,
    "pendingThresholdHours": 24, // Alerte si transaction en attente > 24h
    "failureRateThreshold": 10 // Alerte si taux d'échec > 10%
  }
}
```

**Paramètres par défaut :**

- `enabled`: true
- `pendingThresholdHours`: 24h
- `failureRateThreshold`: 10%

## Déploiement

```bash
supabase functions deploy transaction-alerts
```

## Configuration du Cron Job

Dans Supabase Dashboard :

1. Allez dans **Database** → **Cron Jobs**
2. Créez un nouveau cron job :
   - **Name**: `transaction-alerts`
   - **Schedule**: `0 */6 * * *` (toutes les 6 heures)
   - **SQL Command**:
   ```sql
   SELECT net.http_post(
     url := 'https://YOUR_PROJECT.supabase.co/functions/v1/transaction-alerts',
     headers := jsonb_build_object(
       'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
     ),
     body := '{}'::jsonb
   );
   ```

## Types d'Alertes

### 1. Transactions en attente

- **Déclencheur**: Transactions avec status `processing` depuis > `pendingThresholdHours`
- **Sévérité**:
  - `critical`: > 50 transactions
  - `high`: > 20 transactions
  - `medium`: > 0 transactions

### 2. Taux d'échec élevé

- **Déclencheur**: Taux d'échec > `failureRateThreshold` sur les dernières 24h
- **Sévérité**:
  - `critical`: > 30%
  - `high`: > 20%
  - `medium`: > 10%

### 3. Différences de montants

- **Déclencheur**: > 5 événements `webhook_amount_mismatch` dans les dernières 24h
- **Sévérité**:
  - `critical`: > 20 événements
  - `high`: > 5 événements

## Logs

Toutes les alertes sont loggées dans `transaction_logs` avec :

- `event_type`: `alert_<type>`
- `status`: Sévérité de l'alerte
- `request_data`: Détails de l'alerte

## Monitoring

Pour consulter les alertes :

```sql
-- Toutes les alertes des dernières 24h
SELECT
  *,
  request_data->>'message' as alert_message
FROM transaction_logs
WHERE event_type LIKE 'alert_%'
  AND created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Alertes critiques uniquement
SELECT
  *,
  request_data->>'message' as alert_message
FROM transaction_logs
WHERE event_type LIKE 'alert_%'
  AND status = 'critical'
  AND created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

## Intégration Future

Pour l'instant, les alertes sont uniquement loggées. Pour une intégration complète :

1. **Email**: Intégrer avec SendGrid pour envoyer des emails aux admins
2. **SMS**: Intégrer avec un service SMS pour alertes critiques
3. **Slack/Discord**: Webhooks pour notifications en temps réel
4. **Dashboard**: Afficher les alertes dans le dashboard admin
