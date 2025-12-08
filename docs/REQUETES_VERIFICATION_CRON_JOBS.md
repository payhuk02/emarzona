# 📋 Requêtes de Vérification - Cron Jobs Auto-Payout

**Date** : 30 Janvier 2025

---

## ✅ Vérification des Cron Jobs Configurés

### 1. Voir tous les cron jobs actifs

```sql
SELECT 
  jobid,
  jobname,
  schedule,
  active,
  LEFT(command, 100) as command_preview
FROM cron.job
WHERE jobname IN ('auto-payout-vendors-daily', 'auto-pay-referral-commissions-daily')
ORDER BY jobname;
```

**Résultat attendu** :
- `auto-payout-vendors-daily` : schedule `0 3 * * *`, active `true`
- `auto-pay-referral-commissions-daily` : schedule `0 4 * * *`, active `true`

---

## 📊 Vérification de l'Historique d'Exécution

### 2. Voir l'historique d'exécution (CORRIGÉ)

La table `cron.job_run_details` utilise `jobid` au lieu de `jobname`. Voici la requête corrigée :

```sql
SELECT 
  jrd.runid,
  j.jobname,
  jrd.status,
  jrd.return_message,
  jrd.start_time,
  jrd.end_time,
  jrd.job_pid
FROM cron.job_run_details jrd
JOIN cron.job j ON j.jobid = jrd.jobid
WHERE j.jobname IN ('auto-payout-vendors-daily', 'auto-pay-referral-commissions-daily')
ORDER BY jrd.start_time DESC
LIMIT 20;
```

**Colonnes disponibles dans `cron.job_run_details`** :
- `runid` : ID de l'exécution
- `jobid` : ID du job (FK vers `cron.job`)
- `status` : Statut de l'exécution (`succeeded`, `failed`, `running`)
- `return_message` : Message de retour
- `start_time` : Heure de début
- `end_time` : Heure de fin
- `job_pid` : Process ID

---

## 🔍 Vérification de la Configuration

### 3. Vérifier que les fonctionnalités sont activées

```sql
SELECT 
  settings->'auto_payout_vendors'->>'enabled' as auto_payout_enabled,
  settings->'auto_payout_vendors'->>'delay_days' as delay_days,
  settings->'auto_payout_vendors'->>'min_amount' as min_amount,
  settings->'auto_pay_referral_commissions'->>'enabled' as auto_pay_referral_enabled,
  settings->'auto_pay_referral_commissions'->>'min_amount' as referral_min_amount
FROM platform_settings
WHERE key = 'admin';
```

**Résultat attendu** :
- `auto_payout_enabled`: `true`
- `delay_days`: `7`
- `min_amount`: `50000`
- `auto_pay_referral_enabled`: `true`
- `referral_min_amount`: `50000`

---

## 📈 Statistiques d'Exécution

### 4. Statistiques des exécutions (succès/échecs)

```sql
SELECT 
  j.jobname,
  COUNT(*) as total_runs,
  COUNT(*) FILTER (WHERE jrd.status = 'succeeded') as succeeded,
  COUNT(*) FILTER (WHERE jrd.status = 'failed') as failed,
  MAX(jrd.start_time) as last_run
FROM cron.job j
LEFT JOIN cron.job_run_details jrd ON j.jobid = jrd.jobid
WHERE j.jobname IN ('auto-payout-vendors-daily', 'auto-pay-referral-commissions-daily')
GROUP BY j.jobname
ORDER BY j.jobname;
```

---

## 🧪 Test Manuel des Edge Functions

### 5. Tester Auto-Payout Vendors

```sql
SELECT net.http_post(
  url := 'https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/auto-payout-vendors',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZG56YWpieWpha2RodWF2cnZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzU5ODIzMSwiZXhwIjoyMDczMTc0MjMxfQ.MT2e4tcw_5eK0fRQFN5tF1Cwu210MKFUAUGqmYm_1XE',
    'x-cron-secret', 'auto-payout-vendors-secret-2025'
  ),
  body := jsonb_build_object()
) AS request_id;
```

### 6. Tester Auto-Pay Referral Commissions

```sql
SELECT net.http_post(
  url := 'https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/auto-pay-referral-commissions',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZG56YWpieWpha2RodWF2cnZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzU5ODIzMSwiZXhwIjoyMDczMTc0MjMxfQ.MT2e4tcw_5eK0fRQFN5tF1Cwu210MKFUAUGqmYm_1XE',
    'x-cron-secret', 'auto-pay-referral-commissions-secret-2025'
  ),
  body := jsonb_build_object()
) AS request_id;
```

---

## 🔧 Dépannage

### Problème : Cron job ne s'exécute pas

```sql
-- Vérifier que le job est actif
SELECT jobid, jobname, active, schedule
FROM cron.job
WHERE jobname IN ('auto-payout-vendors-daily', 'auto-pay-referral-commissions-daily');

-- Vérifier les erreurs récentes
SELECT 
  j.jobname,
  jrd.status,
  jrd.return_message,
  jrd.start_time
FROM cron.job_run_details jrd
JOIN cron.job j ON j.jobid = jrd.jobid
WHERE j.jobname IN ('auto-payout-vendors-daily', 'auto-pay-referral-commissions-daily')
  AND jrd.status = 'failed'
ORDER BY jrd.start_time DESC
LIMIT 10;
```

---

**Dernière mise à jour** : 30 Janvier 2025

