# 🔍 Debug : Campagne Non Traitée

**Date** : 30 Janvier 2025  
**Problème** : La campagne de test n'a pas été traitée après l'heure programmée

---

## 📊 État Actuel

- **Campagne ID** : `4f3d3b29-7643-4696-8139-3b49feed4d36`
- **Statut** : `scheduled` (devrait être `sending` ou `completed`)
- **Programmée pour** : `2025-12-08 09:50:36 UTC`
- **Heure actuelle** : `2025-12-08 09:51:21 UTC` ✅ (passée)
- **Emails envoyés** : `0` ❌

---

## 🔍 Diagnostic Étape par Étape

### 1. Vérifier les Exécutions du Cron Job

Exécutez cette requête pour voir si le cron job s'est exécuté :

```sql
SELECT
  jobid,
  runid,
  status,
  return_message,
  start_time,
  end_time,
  end_time - start_time as duration
FROM cron.job_run_details
WHERE jobid = 4
  AND start_time >= '2025-12-08 09:50:00'
ORDER BY start_time DESC
LIMIT 10;
```

**Résultats attendus :**

- Si le cron job s'est exécuté après `09:50:00`, vous devriez voir des entrées
- `status` devrait être `succeeded`
- `return_message` devrait contenir des informations sur les campagnes traitées

### 2. Vérifier la Requête du Cron Job

Le cron job cherche les campagnes avec :

- `status = 'scheduled'`
- `scheduled_at <= NOW()`
- `template_id IS NOT NULL`

Vérifiez que votre campagne répond à ces critères :

```sql
SELECT
  id,
  name,
  status,
  scheduled_at,
  template_id,
  scheduled_at <= NOW() as should_be_processed,
  template_id IS NOT NULL as has_template
FROM public.email_campaigns
WHERE id = '4f3d3b29-7643-4696-8139-3b49feed4d36';
```

**Résultats attendus :**

- `should_be_processed` : `true`
- `has_template` : `true`
- `status` : `scheduled`

### 3. Vérifier les Logs de l'Edge Function

1. **Allez dans** : Supabase Dashboard > Edge Functions > `process-scheduled-campaigns`
2. **Cliquez sur** : Logs
3. **Vérifiez** :
   - Dernières exécutions autour de `09:50:00` ou `09:55:00`
   - Messages d'erreur éventuels
   - Nombre de campagnes trouvées et traitées

### 4. Tester Manuellement l'Edge Function

Si le cron job ne s'est pas exécuté, testez manuellement :

```sql
SELECT net.http_post(
  url := 'https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/process-scheduled-campaigns',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
  ),
  body := jsonb_build_object('limit', 10)
) AS request_id;
```

**Résultats attendus :**

- Un `request_id` est retourné
- Vérifiez ensuite le statut de la campagne (devrait passer à `sending`)

### 5. Vérifier le Template

Assurez-vous que le template existe et est actif :

```sql
SELECT
  id,
  slug,
  name,
  is_active,
  category
FROM public.email_templates
WHERE id = '34abbdcb-fff1-4be9-93af-84aab0b3bd87';
```

**Résultats attendus :**

- Le template existe
- `is_active` : `true`

---

## ⚠️ Problèmes Possibles et Solutions

### Problème 1 : Le Cron Job Ne S'Exécute Pas

**Symptômes :**

- Aucune entrée dans `cron.job_run_details` après `09:50:00`
- Le cron job est actif mais ne s'exécute pas

**Solutions :**

1. Vérifier que le cron job est actif :

   ```sql
   SELECT * FROM cron.job WHERE jobname = 'process-scheduled-email-campaigns';
   ```

   - `active` devrait être `true`

2. Vérifier que `pg_cron` est activé :

   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_cron';
   ```

3. Attendre la prochaine exécution (toutes les 5 minutes)

### Problème 2 : Le Cron Job S'Exécute Mais Ne Trouve Pas la Campagne

**Symptômes :**

- Le cron job s'exécute (`succeeded`)
- Mais la campagne reste en `scheduled`

**Solutions :**

1. Vérifier la timezone :

   ```sql
   SELECT
     scheduled_at,
     send_at_timezone,
     scheduled_at AT TIME ZONE send_at_timezone as scheduled_local
   FROM email_campaigns
   WHERE id = '4f3d3b29-7643-4696-8139-3b49feed4d36';
   ```

2. Vérifier que `scheduled_at` est bien dans le passé en UTC :
   ```sql
   SELECT
     scheduled_at,
     NOW() as current_time,
     scheduled_at <= NOW() as is_past
   FROM email_campaigns
   WHERE id = '4f3d3b29-7643-4696-8139-3b49feed4d36';
   ```

### Problème 3 : Erreur dans l'Edge Function

**Symptômes :**

- Le cron job s'exécute mais échoue
- Erreurs dans les logs de l'Edge Function

**Solutions :**

1. Vérifier les variables d'environnement :
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SENDGRID_API_KEY` (optionnel)

2. Vérifier les permissions RLS sur `email_campaigns`

3. Vérifier les logs détaillés de l'Edge Function

---

## 🧪 Test Immédiat

Pour tester immédiatement, exécutez cette requête qui simule ce que fait le cron job :

```sql
-- Récupérer les campagnes qui devraient être traitées
SELECT
  id,
  name,
  status,
  scheduled_at,
  template_id,
  NOW() as current_time,
  scheduled_at <= NOW() as should_process
FROM public.email_campaigns
WHERE status = 'scheduled'
  AND scheduled_at <= NOW()
  AND template_id IS NOT NULL
ORDER BY scheduled_at ASC
LIMIT 10;
```

Si votre campagne apparaît dans les résultats, elle devrait être traitée par le cron job.

---

## 📝 Prochaines Actions

1. ✅ Vérifier les exécutions du cron job
2. ✅ Vérifier les logs de l'Edge Function
3. ✅ Tester manuellement si nécessaire
4. ✅ Vérifier le template et les permissions

---

**Dernière mise à jour** : 30 Janvier 2025
