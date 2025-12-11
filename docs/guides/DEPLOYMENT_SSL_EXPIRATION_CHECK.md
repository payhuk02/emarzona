# Guide de Déploiement - Vérification SSL Expiration

## ✅ Edge Function Déployée

L'Edge Function `check-ssl-expiration` a été déployée avec succès sur votre projet Supabase.

**URL de la fonction :**
```
https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/check-ssl-expiration
```

## 📅 Configuration du Cron Job

### Option 1 : Via Supabase Dashboard (Recommandé)

1. Allez dans **Database > Cron Jobs** dans votre dashboard Supabase
2. Cliquez sur **"New Cron Job"**
3. Configurez :
   - **Schedule:** `0 9 * * *` (Tous les jours à 9h00 UTC)
   - **Name:** `check-ssl-expiration-daily`
   - **Command:** 
   ```sql
   SELECT net.http_post(
     url := 'https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/check-ssl-expiration',
     headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
     body := '{}'::jsonb
   ) AS request_id;
   ```
   - Remplacez `YOUR_SERVICE_ROLE_KEY` par votre clé service role (disponible dans Settings > API)
   - **Active:** ✅ Activé

### Option 2 : Via SQL Editor

Exécutez le script `supabase/migrations/20250202_setup_ssl_expiration_check_cron.sql` dans le SQL Editor.

⚠️ **Important :** N'oubliez pas de remplacer `YOUR_SERVICE_ROLE_KEY` par votre vraie clé service role.

## 🧪 Test Manuel

Vous pouvez tester la fonction manuellement :

```bash
curl -X POST https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/check-ssl-expiration \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

Ou directement dans le dashboard Supabase :
1. Allez dans **Edge Functions > check-ssl-expiration**
2. Cliquez sur **"Invoke"**
3. Cliquez sur **"Run Function"**

## 📊 Réponse Attendue

```json
{
  "message": "SSL expiration check completed",
  "checked": 5,
  "expiring_soon": 2,
  "expired": 0,
  "alerts_sent": 2,
  "domains": ["example.com", "test.com"]
}
```

## 🔔 Configuration des Notifications

Les alertes SSL respectent les paramètres configurés dans l'onglet **Notifications** de chaque boutique :

- **Email SSL expirant** : Active/désactive les alertes pour certificats expirant dans < 30 jours
- **Email SSL expiré** : Active/désactive les alertes pour certificats expirés

Les emails sont envoyés à :
1. L'email de notification configuré dans les paramètres de la boutique (`notification_email`)
2. Ou l'email de contact de la boutique (`contact_email`) si aucun email de notification n'est configuré

## ⚙️ Personnalisation

### Changer la fréquence de vérification

Pour vérifier plus souvent (par exemple, toutes les 6 heures) :

```sql
UPDATE cron.job 
SET schedule = '0 */6 * * *' 
WHERE jobname = 'check-ssl-expiration-daily';
```

### Désactiver temporairement

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

## 📝 Logs

Les logs de la fonction sont disponibles dans :
- **Edge Functions > check-ssl-expiration > Logs**

Vous pouvez voir :
- Les certificats vérifiés
- Les alertes envoyées
- Les erreurs éventuelles

## 🔍 Vérification du Statut SSL

Pour voir le statut SSL de vos boutiques :

```sql
SELECT 
  s.id,
  s.name as store_name,
  s.custom_domain,
  ssl.domain,
  ssl.certificate_valid,
  ssl.certificate_expires_at,
  ssl.last_checked_at,
  CASE 
    WHEN ssl.certificate_expires_at < NOW() THEN 'Expired'
    WHEN ssl.certificate_expires_at < NOW() + INTERVAL '30 days' THEN 'Expiring Soon'
    ELSE 'Valid'
  END as status
FROM stores s
LEFT JOIN ssl_certificate_status ssl ON s.id = ssl.store_id
WHERE s.custom_domain IS NOT NULL
ORDER BY ssl.certificate_expires_at ASC;
```

## ⚠️ Notes Importantes

1. **Service Role Key** : Ne partagez jamais votre service role key publiquement
2. **Fréquence** : Vérifier quotidiennement est suffisant pour la plupart des cas
3. **Emails** : Assurez-vous que le système d'envoi d'emails (`send-email` function) est configuré
4. **Template Email** : Le template `ssl-alert` doit exister dans votre système d'emails

## 🐛 Dépannage

### La fonction ne s'exécute pas

1. Vérifiez que le cron job est actif :
   ```sql
   SELECT * FROM cron.job WHERE jobname = 'check-ssl-expiration-daily';
   ```

2. Vérifiez les logs du cron :
   ```sql
   SELECT * FROM cron.job_run_details 
   WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'check-ssl-expiration-daily')
   ORDER BY start_time DESC
   LIMIT 10;
   ```

### Pas d'alertes reçues

1. Vérifiez que les boutiques ont des certificats SSL enregistrés dans `ssl_certificate_status`
2. Vérifiez que `email_enabled = true` dans `store_notification_settings`
3. Vérifiez que `email_ssl_expiring` ou `email_ssl_expired` sont activés selon le cas
4. Vérifiez les logs de la fonction Edge Function

---

**Date de création :** 2025-02-02  
**Dernière mise à jour :** 2025-02-02

