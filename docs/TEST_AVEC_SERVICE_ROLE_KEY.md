# 🧪 Test avec Service Role Key Directe

**Date** : 30 Janvier 2025  
**Statut** : Migration créée avec la service role key

---

## ✅ Migration Créée

J'ai créé une migration SQL qui utilise la service role key directement dans le cron job.

**Fichier** : `supabase/migrations/20250230_fix_cron_job_with_service_role_key.sql`

---

## 🚀 Exécution de la Migration

### Étape 1 : Exécuter la Migration

Dans Supabase Dashboard > SQL Editor, exécutez le contenu de :

```
supabase/migrations/20250230_fix_cron_job_with_service_role_key.sql
```

Cette migration :

1. Supprime l'ancien cron job
2. Recrée le cron job avec la service role key directement dans le header `Authorization`

### Étape 2 : Vérifier le Cron Job

Vérifiez que le cron job contient bien la service role key :

```sql
SELECT
  jobid,
  jobname,
  schedule,
  active
FROM cron.job
WHERE jobname = 'process-scheduled-email-campaigns';
```

### Étape 3 : Test Manuel Immédiat

Testez manuellement avec la même clé :

```sql
SELECT net.http_post(
  url := 'https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/process-scheduled-campaigns',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZG56YWpieWpha2RodWF2cnZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzU5ODIzMSwiZXhwIjoyMDczMTc0MjMxfQ.MT2e4tcw_5eK0fRQFN5tF1Cwu210MKFUAUGqmYm_1XE',
    'x-cron-secret', 'process-scheduled-campaigns-secret-2025'
  ),
  body := jsonb_build_object('limit', 10)
) AS request_id;
```

**Résultat attendu** : Un `request_id` (ex: `190`, `191`, etc.)

---

## ✅ Vérifications

### 1. Vérifier les Invocations

Dans Supabase Dashboard > Edge Functions > `process-scheduled-campaigns` > **Invocations** :

1. **Vérifier la dernière invocation** (celle avec le `request_id` du test)
2. **Statut attendu** : ✅ **200 OK** (plus de `401`)
3. **Vérifier les logs** : Devrait contenir les logs de débogage `=== REQUEST DEBUG ===`

### 2. Vérifier le Statut de la Campagne

```sql
SELECT
  id,
  name,
  status,
  scheduled_at,
  metrics->>'sent' as emails_sent,
  updated_at,
  NOW() as current_time
FROM public.email_campaigns
WHERE id = '4f3d3b29-7643-4696-8139-3b49feed4d36';
```

**Résultats attendus** :

- `status` : `sending` ou `completed` (plus `scheduled`)
- `emails_sent` : > 0
- `updated_at` : mis à jour

### 3. Vérifier les Logs d'Emails

```sql
SELECT
  COUNT(*) as total_logs,
  status,
  campaign_id
FROM public.email_logs
WHERE campaign_id = '4f3d3b29-7643-4696-8139-3b49feed4d36'
GROUP BY status, campaign_id;
```

**Résultat attendu** : `total_logs` > 0

---

## ⚠️ Notes Importantes

1. **Sécurité** : La service role key est maintenant directement dans le cron job SQL. En production, considérez :
   - Utiliser un secret Supabase
   - Utiliser une variable d'environnement PostgreSQL
   - Utiliser un service externe pour gérer les secrets

2. **Rotation des Clés** : Si vous changez la service role key, vous devrez mettre à jour le cron job.

3. **Solution Temporaire** : Cette solution fonctionne pour tester, mais pour la production, il serait mieux d'utiliser une méthode plus sécurisée.

---

## 📝 Checklist

- [ ] Migration exécutée
- [ ] Cron job vérifié
- [ ] Test manuel exécuté
- [ ] Invocation retourne `200 OK` (plus de `401`)
- [ ] Campagne passe à `sending` ou `completed`
- [ ] Logs d'emails créés dans `email_logs`

---

**Dernière mise à jour** : 30 Janvier 2025
