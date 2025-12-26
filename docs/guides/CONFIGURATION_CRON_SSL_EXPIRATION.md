# Configuration du Cron Job - Vérification SSL Expiration

## 🎯 Objectif

Configurer un cron job qui vérifie automatiquement l'expiration des certificats SSL tous les jours et envoie des alertes email aux propriétaires de boutiques.

## 📋 Prérequis

1. ✅ Edge Function `check-ssl-expiration` déployée
2. ✅ Table `ssl_certificate_status` créée
3. ✅ Table `store_notification_settings` créée
4. ✅ Fonction `send-email` configurée (pour l'envoi d'alertes)

## 🔑 Étape 1 : Obtenir votre Service Role Key

1. Allez dans votre dashboard Supabase : **Settings > API**
2. Dans la section **Project API keys**, trouvez **`service_role`** (secret)
3. **⚠️ IMPORTANT** : C'est une clé secrète, ne la partagez jamais publiquement
4. Copiez cette clé (elle commence généralement par `eyJ...`)

## 📝 Étape 2 : Exécuter le Script SQL

### Option A : Via SQL Editor (Recommandé)

1. Ouvrez le fichier : `supabase/migrations/20250202_setup_ssl_expiration_check_cron.sql`
2. **Remplacez** `YOUR_SERVICE_ROLE_KEY` par votre vraie service role key (ligne 29)
3. Copiez tout le contenu du fichier
4. Collez dans le SQL Editor de Supabase
5. Cliquez sur **"Run"** (CTRL+Enter)

### Option B : Script Prêt à Exécuter

Voici le script complet avec un placeholder à remplacer :

```sql
-- Supprimer le cron job existant s'il existe
DELETE FROM cron.job WHERE jobname = 'check-ssl-expiration-daily';

-- Créer le cron job
INSERT INTO cron.job (
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active,
  jobname,
  description
)
VALUES (
  '0 9 * * *', -- Tous les jours à 9h00 UTC
  $$SELECT net.http_post(
    url := 'https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/check-ssl-expiration',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer VOTRE_SERVICE_ROLE_KEY_ICI"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id$$,
  'localhost',
  5432,
  current_database(),
  'postgres',
  true,
  'check-ssl-expiration-daily',
  'Vérifie quotidiennement l''expiration des certificats SSL et envoie des alertes'
);
```

**⚠️ N'oubliez pas** de remplacer `VOTRE_SERVICE_ROLE_KEY_ICI` par votre vraie clé !

## ✅ Étape 3 : Vérifier la Configuration

Exécutez cette requête pour vérifier que le cron job est bien créé :

```sql
SELECT
  jobid,
  schedule,
  command,
  nodename,
  active,
  jobname,
  description
FROM cron.job
WHERE jobname = 'check-ssl-expiration-daily';
```

Vous devriez voir :

- `active: true`
- `schedule: 0 9 * * *`
- `jobname: check-ssl-expiration-daily`

## 🧪 Étape 4 : Tester Manuellement

Avant d'attendre le prochain exécution automatique, testez manuellement :

### Via Supabase Dashboard

1. Allez dans **Edge Functions > check-ssl-expiration**
2. Cliquez sur **"Invoke"**
3. Cliquez sur **"Run Function"**
4. Vérifiez les logs pour voir le résultat

### Via cURL

```bash
curl -X POST https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/check-ssl-expiration \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Réponse Attendre

```json
{
  "message": "SSL expiration check completed",
  "checked": 0,
  "expiring_soon": 0,
  "expired": 0,
  "alerts_sent": 0,
  "domains": []
}
```

## ⚙️ Personnalisation

### Changer la Fréquence

Pour vérifier plus souvent, modifiez le `schedule` :

```sql
-- Toutes les 6 heures
UPDATE cron.job
SET schedule = '0 */6 * * *'
WHERE jobname = 'check-ssl-expiration-daily';

-- Toutes les 12 heures
UPDATE cron.job
SET schedule = '0 */12 * * *'
WHERE jobname = 'check-ssl-expiration-daily';

-- Deux fois par jour (9h00 et 21h00)
UPDATE cron.job
SET schedule = '0 9,21 * * *'
WHERE jobname = 'check-ssl-expiration-daily';

-- Toutes les heures (pour tests)
UPDATE cron.job
SET schedule = '0 * * * *'
WHERE jobname = 'check-ssl-expiration-daily';
```

### Désactiver Temporairement

```sql
UPDATE cron.job
SET active = false
WHERE jobname = 'check-ssl-expiration-daily';
```

### Réactiver

```sql
UPDATE cron.job
SET active = true
WHERE jobname = 'check-ssl-expiration-daily';
```

### Supprimer le Cron Job

```sql
DELETE FROM cron.job
WHERE jobname = 'check-ssl-expiration-daily';
```

## 📊 Vérifier l'Exécution

### Voir l'Historique des Exécutions

```sql
SELECT
  j.jobname,
  j.schedule,
  j.active,
  r.runid,
  r.start_time,
  r.end_time,
  r.status,
  r.return_message,
  r.job_pid
FROM cron.job j
LEFT JOIN cron.job_run_details r ON j.jobid = r.jobid
WHERE j.jobname = 'check-ssl-expiration-daily'
ORDER BY r.start_time DESC
LIMIT 10;
```

### Voir les Erreurs Récentes

```sql
SELECT
  runid,
  start_time,
  end_time,
  status,
  return_message,
  job_pid
FROM cron.job_run_details
WHERE jobid = (
  SELECT jobid FROM cron.job WHERE jobname = 'check-ssl-expiration-daily'
)
AND status = 'failed'
ORDER BY start_time DESC
LIMIT 10;
```

## 🔔 Configuration des Notifications

Les alertes sont envoyées selon les paramètres configurés dans l'onglet **Notifications** de chaque boutique :

1. Allez dans **Votre Boutique > Paramètres > Notifications**
2. Activez **"Email SSL expire bientôt"** pour les alertes avant expiration
3. Activez **"Email SSL expiré"** pour les alertes d'expiration
4. Configurez l'**"Email de notification"** si différent du contact_email

## 🐛 Dépannage

### Le cron job ne s'exécute pas

1. Vérifiez qu'il est actif :

   ```sql
   SELECT active FROM cron.job WHERE jobname = 'check-ssl-expiration-daily';
   ```

2. Vérifiez l'extension pg_cron :

   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_cron';
   ```

3. Vérifiez les logs dans **Database > Logs**

### Erreur "Invalid authorization header"

- Vérifiez que votre Service Role Key est correcte
- Assurez-vous qu'elle n'a pas expiré ou été régénérée

### Pas d'alertes reçues

1. Vérifiez qu'il y a des certificats SSL à vérifier :

   ```sql
   SELECT * FROM ssl_certificate_status WHERE certificate_valid = true;
   ```

2. Vérifiez que les notifications sont activées :

   ```sql
   SELECT
     s.name,
     s.custom_domain,
     ns.email_enabled,
     ns.email_ssl_expiring,
     ns.email_ssl_expired,
     ns.notification_email,
     s.contact_email
   FROM stores s
   LEFT JOIN store_notification_settings ns ON s.id = ns.store_id
   WHERE s.custom_domain IS NOT NULL;
   ```

3. Vérifiez que la fonction `send-email` fonctionne

## 📚 Ressources

- [Documentation pg_cron](https://github.com/citusdata/pg_cron)
- [Documentation Supabase Cron Jobs](https://supabase.com/docs/guides/database/extensions/pg_cron)
- [Format Cron Expression](https://crontab.guru/)

---

**Date de création :** 2025-02-02  
**Dernière mise à jour :** 2025-02-02
