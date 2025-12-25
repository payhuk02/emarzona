# ⏰ CONFIGURATION DES JOBS CRON - NOTIFICATIONS

**Date :** 2 Février 2025  
**Statut :** ✅ **PRÊT À DÉPLOYER**

---

## 📋 RÉSUMÉ

Configuration complète des jobs cron pour automatiser le traitement des notifications :

- ✅ Traitement des notifications schedulées
- ✅ Traitement des retries
- ✅ Envoi des digests (quotidien/hebdomadaire)
- ✅ Nettoyage automatique
- ✅ Rappels de réservations
- ✅ Vérifications diverses

---

## 🚀 INSTALLATION

### 1. Appliquer la Migration

Exécuter dans Supabase SQL Editor :

```sql
-- Fichier: supabase/migrations/20250202_notification_cron_jobs.sql
```

### 2. Déployer les Edge Functions

Les Edge Functions suivantes doivent être déployées :

- `supabase/functions/process-scheduled-notifications/index.ts`
- `supabase/functions/process-notification-retries/index.ts`
- `supabase/functions/send-digests/index.ts`

**Commande de déploiement :**

```bash
supabase functions deploy process-scheduled-notifications
supabase functions deploy process-notification-retries
supabase functions deploy send-digests
```

### 3. Modifier les Jobs Cron pour Appeler les Edge Functions

Une fois les Edge Functions déployées, modifier les jobs cron pour les appeler via HTTP :

```sql
-- Exemple pour process-scheduled-notifications
SELECT cron.unschedule('process-scheduled-notifications');

SELECT cron.schedule(
  'process-scheduled-notifications',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT.supabase.co/functions/v1/process-scheduled-notifications',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  ) AS request_id;
  $$
);
```

---

## 📊 JOBS CRON CONFIGURÉS

### 1. **Process Scheduled Notifications** ⏰

- **Fréquence :** Toutes les 5 minutes
- **Fonction :** Traite les notifications programmées en attente
- **Edge Function :** `process-scheduled-notifications`

### 2. **Process Notification Retries** 🔄

- **Fréquence :** Toutes les 10 minutes
- **Fonction :** Traite les retries en attente
- **Edge Function :** `process-notification-retries`

### 3. **Send Daily Digests** 📬

- **Fréquence :** Tous les jours à 8h00 UTC
- **Fonction :** Envoie les digests quotidiens
- **Edge Function :** `send-digests` (avec period='daily')

### 4. **Send Weekly Digests** 📬

- **Fréquence :** Tous les lundis à 8h00 UTC
- **Fonction :** Envoie les digests hebdomadaires
- **Edge Function :** `send-digests` (avec period='weekly')

### 5. **Cleanup Notifications** 🧹

- **Fréquence :** Tous les jours à 2h00 UTC
- **Fonction :** Nettoie les anciennes notifications
- **SQL Function :** `cleanup_notifications_enhanced()`

### 6. **Cleanup Rate Limits** 🧹

- **Fréquence :** Toutes les heures
- **Fonction :** Nettoie les anciens rate limits (>7 jours)

### 7. **Check Service Booking Reminders** ⏰

- **Fréquence :** Toutes les heures
- **Fonction :** Vérifie les rappels de réservations (24h et 1h avant)

### 8. **Check Expiring Licenses** ⚠️

- **Fréquence :** Tous les jours à 9h00 UTC
- **Fonction :** Vérifie les licences expirant dans 7 jours

### 9. **Check Pending Payments** 💳

- **Fréquence :** Toutes les 6 heures
- **Fonction :** Vérifie les paiements en attente depuis >3 jours

### 10. **Send Weekly Commission Reports** 📊

- **Fréquence :** Tous les lundis à 9h00 UTC
- **Fonction :** Envoie les rapports hebdomadaires de commissions

---

## 🔍 VÉRIFICATION

### Lister les Jobs Cron

```sql
SELECT * FROM list_notification_cron_jobs();
```

### Vérifier l'État d'un Job

```sql
SELECT * FROM cron.job WHERE jobname = 'process-scheduled-notifications';
```

### Voir l'Historique d'Exécution

```sql
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'process-scheduled-notifications')
ORDER BY start_time DESC
LIMIT 10;
```

---

## ⚙️ CONFIGURATION AVANCÉE

### Modifier la Fréquence d'un Job

```sql
-- Exemple: Changer process-scheduled-notifications à toutes les 2 minutes
SELECT cron.unschedule('process-scheduled-notifications');

SELECT cron.schedule(
  'process-scheduled-notifications',
  '*/2 * * * *', -- Toutes les 2 minutes
  $$...$$
);
```

### Désactiver un Job Temporairement

```sql
-- Désactiver un job
UPDATE cron.job
SET active = false
WHERE jobname = 'process-scheduled-notifications';
```

### Réactiver un Job

```sql
UPDATE cron.job
SET active = true
WHERE jobname = 'process-scheduled-notifications';
```

---

## 📝 NOTES IMPORTANTES

1. **Fuseaux Horaires :** Tous les horaires sont en UTC. Ajuster selon les besoins.

2. **Edge Functions :** Les jobs cron actuels font des vérifications basiques. Pour le traitement réel, utiliser les Edge Functions déployées.

3. **Permissions :** Les Edge Functions doivent avoir accès à la clé de service pour traiter les notifications.

4. **Monitoring :** Surveiller les logs des Edge Functions et les exécutions des jobs cron.

5. **Performance :** Les jobs traitent par lots de 100 pour éviter les timeouts.

---

## 🐛 DÉPANNAGE

### Job ne s'exécute pas

```sql
-- Vérifier que le job est actif
SELECT jobname, active, schedule FROM cron.job
WHERE jobname = 'process-scheduled-notifications';

-- Vérifier les erreurs récentes
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'process-scheduled-notifications')
  AND status = 'failed'
ORDER BY start_time DESC
LIMIT 5;
```

### Edge Function ne répond pas

- Vérifier que la fonction est déployée
- Vérifier les logs dans Supabase Dashboard > Edge Functions
- Vérifier les permissions et les clés API

---

**Document généré le :** 2 Février 2025  
**Version :** 1.0
