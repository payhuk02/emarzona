# 🚀 Guide de Déploiement - Edge Functions et Cron Jobs

**Date**: 1 Février 2025  
**Statut**: ✅ Déployé

---

## ✅ Edge Functions Déployées

Les 3 Edge Functions suivantes ont été déployées avec succès :

1. ✅ **retry-failed-transactions** - Retry automatique des transactions
2. ✅ **auto-pay-commissions** - Paiement automatique des commissions
3. ✅ **transaction-alerts** - Monitoring et alertes transactions

**URLs des fonctions:**
- `https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/retry-failed-transactions`
- `https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/auto-pay-commissions`
- `https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/transaction-alerts`

---

## 📋 Configuration des Cron Jobs

### Option 1: Via SQL (Recommandé)

Exécutez la migration SQL dans Supabase Dashboard → SQL Editor :

```sql
-- Fichier: supabase/migrations/20250201_setup_cron_jobs.sql
```

Cette migration :
- ✅ Active les extensions `pg_net` et `pg_cron`
- ✅ Crée les 3 cron jobs avec les schedules appropriés
- ✅ Configure les URLs et authentification

### Option 2: Via Supabase Dashboard (Si pg_cron n'est pas disponible)

Si l'extension `pg_cron` n'est pas disponible, utilisez l'interface Supabase Dashboard :

1. **Allez dans** : Supabase Dashboard → Database → Cron Jobs
2. **Créez 3 cron jobs** avec les paramètres suivants :

#### Cron Job 1: retry-failed-transactions

- **Name**: `retry-failed-transactions`
- **Schedule**: `0 * * * *` (toutes les heures)
- **SQL Command**:
```sql
SELECT net.http_post(
  url := 'https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/retry-failed-transactions',
  headers := jsonb_build_object(
    'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true),
    'Content-Type', 'application/json'
  ),
  body := '{}'::jsonb
);
```

#### Cron Job 2: auto-pay-commissions

- **Name**: `auto-pay-commissions`
- **Schedule**: `0 2 * * *` (tous les jours à 2h du matin)
- **SQL Command**:
```sql
SELECT net.http_post(
  url := 'https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/auto-pay-commissions',
  headers := jsonb_build_object(
    'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true),
    'Content-Type', 'application/json'
  ),
  body := '{}'::jsonb
);
```

#### Cron Job 3: transaction-alerts

- **Name**: `transaction-alerts`
- **Schedule**: `0 */6 * * *` (toutes les 6 heures)
- **SQL Command**:
```sql
SELECT net.http_post(
  url := 'https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/transaction-alerts',
  headers := jsonb_build_object(
    'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true),
    'Content-Type', 'application/json'
  ),
  body := '{}'::jsonb
);
```

---

## 🔍 Vérification

### Vérifier les Cron Jobs

Exécutez cette requête SQL pour vérifier que les cron jobs sont bien configurés :

```sql
SELECT 
  jobid,
  jobname,
  schedule,
  active,
  nodename,
  nodeport
FROM cron.job
WHERE jobname IN ('retry-failed-transactions', 'auto-pay-commissions', 'transaction-alerts')
ORDER BY jobname;
```

### Vérifier les Extensions

```sql
SELECT 
  extname,
  extversion
FROM pg_extension
WHERE extname IN ('pg_net', 'pg_cron');
```

### Tester les Edge Functions manuellement

Vous pouvez tester chaque fonction manuellement via Supabase Dashboard → Edge Functions → Logs, ou via une requête SQL :

```sql
-- Tester retry-failed-transactions
SELECT net.http_post(
  url := 'https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/retry-failed-transactions',
  headers := jsonb_build_object(
    'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true),
    'Content-Type', 'application/json'
  ),
  body := '{}'::jsonb
);

-- Tester auto-pay-commissions
SELECT net.http_post(
  url := 'https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/auto-pay-commissions',
  headers := jsonb_build_object(
    'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true),
    'Content-Type', 'application/json'
  ),
  body := '{}'::jsonb
);

-- Tester transaction-alerts
SELECT net.http_post(
  url := 'https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/transaction-alerts',
  headers := jsonb_build_object(
    'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true),
    'Content-Type', 'application/json'
  ),
  body := '{}'::jsonb
);
```

---

## 📊 Monitoring

### Consulter les logs des Edge Functions

1. Allez dans **Supabase Dashboard** → **Edge Functions** → **Logs**
2. Sélectionnez la fonction à surveiller
3. Consultez les logs en temps réel

### Consulter les logs des Cron Jobs

```sql
-- Historique des exécutions des cron jobs
SELECT 
  runid,
  jobid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
WHERE jobid IN (
  SELECT jobid FROM cron.job 
  WHERE jobname IN ('retry-failed-transactions', 'auto-pay-commissions', 'transaction-alerts')
)
ORDER BY start_time DESC
LIMIT 50;
```

### Consulter les alertes

```sql
-- Toutes les alertes des dernières 24h
SELECT 
  *,
  request_data->>'message' as alert_message
FROM transaction_logs
WHERE event_type LIKE 'alert_%'
  AND created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

---

## ⚙️ Configuration

### Activer/Désactiver le paiement automatique des commissions

```sql
-- Désactiver
UPDATE platform_settings
SET settings = jsonb_set(
  settings,
  '{auto_pay_commissions,enabled}',
  'false'::jsonb
)
WHERE key = 'admin';

-- Activer
UPDATE platform_settings
SET settings = jsonb_set(
  settings,
  '{auto_pay_commissions,enabled}',
  'true'::jsonb
)
WHERE key = 'admin';
```

### Modifier le seuil minimum pour paiement automatique

```sql
-- Modifier le seuil à 100000 XOF
UPDATE platform_settings
SET settings = jsonb_set(
  settings,
  '{auto_pay_commissions,minCommissionAmount}',
  '100000'::jsonb
)
WHERE key = 'admin';
```

### Modifier les seuils d'alertes

```sql
-- Modifier le seuil d'alerte pour transactions en attente (48h au lieu de 24h)
UPDATE platform_settings
SET settings = jsonb_set(
  settings,
  '{transaction_alerts,pendingThresholdHours}',
  '48'::jsonb
)
WHERE key = 'admin';

-- Modifier le seuil de taux d'échec (15% au lieu de 10%)
UPDATE platform_settings
SET settings = jsonb_set(
  settings,
  '{transaction_alerts,failureRateThreshold}',
  '15'::jsonb
)
WHERE key = 'admin';
```

---

## 🛠️ Dépannage

### Les cron jobs ne s'exécutent pas

1. **Vérifier que pg_cron est activé** :
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_cron';
   ```
   Si pas de résultat, activez l'extension dans Supabase Dashboard → Database → Extensions

2. **Vérifier que pg_net est activé** :
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_net';
   ```
   Si pas de résultat, activez l'extension dans Supabase Dashboard → Database → Extensions

3. **Vérifier les logs des cron jobs** :
   ```sql
   SELECT * FROM cron.job_run_details 
   WHERE jobid IN (SELECT jobid FROM cron.job WHERE jobname = 'retry-failed-transactions')
   ORDER BY start_time DESC LIMIT 10;
   ```

### Les Edge Functions retournent des erreurs

1. **Consulter les logs** dans Supabase Dashboard → Edge Functions → Logs
2. **Vérifier les variables d'environnement** (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
3. **Tester manuellement** avec les requêtes SQL ci-dessus

### Désactiver temporairement un cron job

```sql
-- Désactiver retry-failed-transactions
UPDATE cron.job
SET active = false
WHERE jobname = 'retry-failed-transactions';

-- Réactiver
UPDATE cron.job
SET active = true
WHERE jobname = 'retry-failed-transactions';
```

---

## ✅ Checklist de Déploiement

- [x] Edge Functions déployées
- [ ] Migrations SQL appliquées
- [ ] Extensions pg_net et pg_cron activées
- [ ] Cron Jobs configurés
- [ ] Tests manuels effectués
- [ ] Monitoring configuré
- [ ] Documentation partagée avec l'équipe

---

**Date de déploiement**: 1 Février 2025  
**Projet**: hbdnzajbyjakdhuavrvb  
**Statut**: ✅ Déployé et prêt pour configuration

