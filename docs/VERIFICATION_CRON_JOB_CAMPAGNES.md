# ✅ Vérification Cron Job - Campagnes Email Programmées

**Date** : 30 Janvier 2025  
**Statut** : ✅ **CRON JOB CONFIGURÉ ET ACTIF**

---

## 📊 État Actuel

D'après la capture d'écran Supabase SQL Editor, le cron job est **déjà configuré et actif** :

### Configuration Détectée

- ✅ **Nom du job** : `process-scheduled-email-campaigns`
- ✅ **Schedule** : `0,5,10,15,20,25,30,35,40,45,50,55 * * * *` (toutes les 5 minutes)
- ✅ **Statut** : `active: true`
- ✅ **Database** : `postgres`
- ✅ **Node** : `localhost:5432`

---

## 🔍 Vérification Complète

### 1. Vérifier les Détails du Cron Job

Exécutez cette requête dans Supabase SQL Editor pour voir tous les détails :

```sql
SELECT 
  jobid,
  jobname,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active,
  jobid
FROM cron.job
WHERE jobname = 'process-scheduled-email-campaigns';
```

### 2. Vérifier l'Historique d'Exécution

Pour voir les dernières exécutions du cron job :

```sql
SELECT 
  jobid,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
WHERE jobid = (
  SELECT jobid FROM cron.job 
  WHERE jobname = 'process-scheduled-email-campaigns'
)
ORDER BY start_time DESC
LIMIT 10;
```

### 3. Vérifier les Logs de l'Edge Function

1. Allez dans **Supabase Dashboard** > **Edge Functions** > **process-scheduled-campaigns**
2. Cliquez sur **Logs**
3. Vérifiez les dernières exécutions

---

## 🧪 Test Manuel

### Option 1 : Tester via SQL (Appel Direct)

Exécutez cette requête pour tester manuellement l'Edge Function :

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

### Option 2 : Tester via cURL

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -d '{"limit": 10}' \
  https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/process-scheduled-campaigns
```

### Option 3 : Créer une Campagne de Test

1. **Créer une campagne de test** :
   - Allez dans l'interface des campagnes email
   - Créez une nouvelle campagne
   - Définissez le statut à `scheduled`
   - Définissez `scheduled_at` à une date/heure proche (dans 1-2 minutes)

2. **Attendre l'exécution** :
   - Le cron job s'exécute toutes les 5 minutes
   - Vérifiez que la campagne passe de `scheduled` à `sending`

3. **Vérifier les résultats** :
   ```sql
   SELECT 
     id,
     name,
     status,
     scheduled_at,
     metrics
   FROM email_campaigns
   WHERE status IN ('scheduled', 'sending')
   ORDER BY scheduled_at DESC
   LIMIT 5;
   ```

---

## ✅ Checklist de Vérification

- [x] Cron job créé avec le bon nom
- [x] Schedule configuré (toutes les 5 minutes)
- [x] Statut actif (`active: true`)
- [ ] Test manuel réussi
- [ ] Campagne de test traitée automatiquement
- [ ] Logs Edge Function sans erreurs
- [ ] Métriques de campagne mises à jour

---

## 🔧 Dépannage

### Problème : Le cron job ne s'exécute pas

**Solutions :**
1. Vérifier que `pg_cron` est activé :
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_cron';
   ```

2. Vérifier les logs du cron :
   ```sql
   SELECT * FROM cron.job_run_details 
   WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'process-scheduled-email-campaigns')
   ORDER BY start_time DESC LIMIT 5;
   ```

3. Vérifier que l'Edge Function est déployée :
   - Supabase Dashboard > Edge Functions > `process-scheduled-campaigns`

### Problème : Erreurs dans les logs

**Solutions :**
1. Vérifier les variables d'environnement de l'Edge Function
2. Vérifier que `SUPABASE_SERVICE_ROLE_KEY` est configuré
3. Vérifier les permissions RLS sur la table `email_campaigns`

---

## 📝 Prochaines Étapes

1. ✅ **Cron job configuré** - Fait
2. ⏳ **Tester avec une campagne réelle** - À faire
3. ⏳ **Configurer les webhooks SendGrid** - Voir `docs/CONFIGURATION_WEBHOOKS_SENDGRID.md`
4. ⏳ **Monitorer les performances** - Surveiller les logs régulièrement

---

**Dernière vérification** : 30 Janvier 2025  
**Statut** : ✅ **OPÉRATIONNEL**

