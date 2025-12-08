# ✅ Configuration Finale - Auto-Payout

**Date** : 30 Janvier 2025  
**Statut** : ✅ **CONFIGURÉ ET ACTIVÉ**

---

## 📋 Résumé de la Configuration

### ✅ Cron Jobs Configurés

| Cron Job | Schedule | Statut | Description |
|----------|----------|--------|-------------|
| `auto-payout-vendors-daily` | `0 3 * * *` | ✅ Actif | Reversement automatique des fonds vendeurs (3h du matin) |
| `auto-pay-referral-commissions-daily` | `0 4 * * *` | ✅ Actif | Paiement automatique des commissions parrainage (4h du matin) |

### ✅ Configuration Activée

| Fonctionnalité | Enabled | Paramètres |
|----------------|---------|------------|
| Auto-Payout Vendors | ✅ `true` | `delay_days: 7`, `min_amount: 50000` |
| Auto-Pay Referral Commissions | ✅ `true` | `min_amount: 50000` |

---

## 🔍 Vérifications Effectuées

### 1. Cron Jobs Configurés ✅

```sql
SELECT 
  jobid,
  jobname,
  schedule,
  active
FROM cron.job
WHERE jobname IN ('auto-payout-vendors-daily', 'auto-pay-referral-commissions-daily');
```

**Résultat** :
- ✅ `auto-payout-vendors-daily` : schedule `0 3 * * *`, active `true`
- ✅ `auto-pay-referral-commissions-daily` : schedule `0 4 * * *`, active `true`

### 2. Configuration Activée ✅

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

**Résultat** :
- ✅ `auto_payout_enabled`: `true`
- ✅ `delay_days`: `7`
- ✅ `min_amount`: `50000`
- ✅ `auto_pay_referral_enabled`: `true`
- ✅ `referral_min_amount`: `50000`

### 3. Historique d'Exécution

```sql
SELECT 
  jrd.runid,
  j.jobname,
  jrd.status,
  jrd.return_message,
  jrd.start_time,
  jrd.end_time
FROM cron.job_run_details jrd
JOIN cron.job j ON j.jobid = jrd.jobid
WHERE j.jobname IN ('auto-payout-vendors-daily', 'auto-pay-referral-commissions-daily')
ORDER BY jrd.start_time DESC
LIMIT 20;
```

**Note** : "No rows returned" est normal si les cron jobs n'ont pas encore été exécutés. Les données apparaîtront après la première exécution (3h et 4h du matin).

---

## ⏰ Quand les Cron Jobs S'Exécutent

### Auto-Payout Vendors
- **Heure** : Tous les jours à **3h du matin** (UTC)
- **Action** : Vérifie les stores éligibles et crée des retraits automatiques
- **Conditions** :
  - `available_balance >= 50000 XOF`
  - Dernier calcul antérieur à 7 jours
  - Méthode de paiement par défaut configurée

### Auto-Pay Referral Commissions
- **Heure** : Tous les jours à **4h du matin** (UTC)
- **Action** : Marque les commissions parrainage comme payées
- **Conditions** :
  - Commissions avec status `pending`
  - Total par `referrer_id >= 50000 XOF`

---

## 🧪 Test Manuel (Optionnel)

Si vous voulez tester avant la première exécution automatique :

### Tester Auto-Payout Vendors

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

### Tester Auto-Pay Referral Commissions

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

**Après le test**, vérifiez les logs dans :
- **Supabase Dashboard** > **Edge Functions** > **Logs** > Sélectionnez la fonction
- Ou vérifiez les résultats dans les tables :
  - `store_withdrawals` (pour auto-payout-vendors)
  - `referral_commissions` (pour auto-pay-referral-commissions)

---

## 📊 Monitoring

### Vérifier les Exécutions Récentes

```sql
SELECT 
  jrd.runid,
  j.jobname,
  jrd.status,
  jrd.return_message,
  jrd.start_time,
  jrd.end_time,
  CASE 
    WHEN jrd.end_time IS NOT NULL 
    THEN EXTRACT(EPOCH FROM (jrd.end_time - jrd.start_time))
    ELSE NULL
  END as duration_seconds
FROM cron.job_run_details jrd
JOIN cron.job j ON j.jobid = jrd.jobid
WHERE j.jobname IN ('auto-payout-vendors-daily', 'auto-pay-referral-commissions-daily')
ORDER BY jrd.start_time DESC
LIMIT 20;
```

### Statistiques d'Exécution

```sql
SELECT 
  j.jobname,
  COUNT(*) as total_runs,
  COUNT(*) FILTER (WHERE jrd.status = 'succeeded') as succeeded,
  COUNT(*) FILTER (WHERE jrd.status = 'failed') as failed,
  MAX(jrd.start_time) as last_run,
  AVG(EXTRACT(EPOCH FROM (jrd.end_time - jrd.start_time))) as avg_duration_seconds
FROM cron.job j
LEFT JOIN cron.job_run_details jrd ON j.jobid = jrd.jobid
WHERE j.jobname IN ('auto-payout-vendors-daily', 'auto-pay-referral-commissions-daily')
GROUP BY j.jobname
ORDER BY j.jobname;
```

---

## 🔧 Désactiver Temporairement

Si vous devez désactiver temporairement une fonctionnalité :

### Désactiver Auto-Payout Vendors

```sql
UPDATE platform_settings
SET settings = jsonb_set(
  settings,
  '{auto_payout_vendors,enabled}',
  'false'::jsonb
)
WHERE key = 'admin';
```

### Désactiver Auto-Pay Referral Commissions

```sql
UPDATE platform_settings
SET settings = jsonb_set(
  settings,
  '{auto_pay_referral_commissions,enabled}',
  'false'::jsonb
)
WHERE key = 'admin';
```

### Désactiver un Cron Job

```sql
-- Désactiver auto-payout-vendors-daily
SELECT cron.alter_job(
  job_id := (SELECT jobid FROM cron.job WHERE jobname = 'auto-payout-vendors-daily'),
  active := false
);

-- Réactiver
SELECT cron.alter_job(
  job_id := (SELECT jobid FROM cron.job WHERE jobname = 'auto-payout-vendors-daily'),
  active := true
);
```

---

## ✅ Checklist Finale

- [x] Cron jobs créés et actifs
- [x] Configuration activée dans `platform_settings`
- [x] Edge Functions déployées
- [x] Vérifications effectuées
- [ ] Première exécution automatique (attendre 3h/4h du matin)
- [ ] Vérifier les logs après première exécution
- [ ] Vérifier les retraits créés (pour auto-payout-vendors)
- [ ] Vérifier les commissions payées (pour auto-pay-referral-commissions)

---

## 📝 Notes Importantes

1. **Première Exécution** : Les cron jobs s'exécuteront automatiquement aux heures configurées (3h et 4h du matin UTC). L'historique apparaîtra après la première exécution.

2. **Retraits Automatiques** : Les retraits créés automatiquement ont le status `pending` et nécessitent l'approbation d'un admin avant d'être complétés.

3. **Commissions Parrainage** : Les commissions sont marquées comme `paid` mais ne créent pas de retrait automatique. Pour créer des retraits automatiques, il faudrait une fonction supplémentaire.

4. **Monitoring** : Surveillez les logs des Edge Functions dans Supabase Dashboard pour détecter d'éventuels problèmes.

---

**Configuration terminée le** : 30 Janvier 2025  
**Prochaine exécution** : 3h et 4h du matin (UTC)  
**Statut** : ✅ **OPÉRATIONNEL**

