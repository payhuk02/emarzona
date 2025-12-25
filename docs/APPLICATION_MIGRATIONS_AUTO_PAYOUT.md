# 🚀 Application des Migrations - Auto-Payout

**Date** : 30 Janvier 2025

---

## 📋 Instructions

Pour configurer les cron jobs et activer les fonctionnalités, appliquez la migration SQL suivante :

### Option 1 : Via Supabase Dashboard (Recommandé)

1. Allez dans **Supabase Dashboard** > **SQL Editor**
2. Ouvrez le fichier : `supabase/migrations/20250230_setup_and_activate_auto_payout.sql`
3. Copiez-collez tout le contenu dans l'éditeur SQL
4. Cliquez sur **Run** ou appuyez sur `Ctrl+Enter`

### Option 2 : Via Supabase CLI

```bash
# Appliquer uniquement cette migration
supabase db push --file supabase/migrations/20250230_setup_and_activate_auto_payout.sql
```

---

## ✅ Vérification

Après avoir appliqué la migration, vérifiez que tout est configuré :

### 1. Vérifier les Cron Jobs

```sql
SELECT 
  jobid,
  jobname,
  schedule,
  active
FROM cron.job
WHERE jobname IN ('auto-payout-vendors-daily', 'auto-pay-referral-commissions-daily');
```

**Résultat attendu** :
- `auto-payout-vendors-daily` : schedule `0 3 * * *`, active `true`
- `auto-pay-referral-commissions-daily` : schedule `0 4 * * *`, active `true`

### 2. Vérifier la Configuration

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

## 🧪 Test Manuel

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

---

## 📝 Notes

- Les cron jobs sont configurés pour s'exécuter **tous les jours**
- Les fonctionnalités sont **activées par défaut** après application de la migration
- Les retraits créés automatiquement nécessitent toujours l'**approbation d'un admin**
- Les commissions parrainage sont marquées comme payées mais ne créent pas de retrait automatique

---

**Dernière mise à jour** : 30 Janvier 2025


