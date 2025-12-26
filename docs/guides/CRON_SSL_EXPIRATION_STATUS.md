# ✅ Statut : Cron Job SSL Expiration - CONFIGURÉ

**Date de Configuration :** 2025-02-02  
**Statut :** ✅ **ACTIF ET OPÉRATIONNEL**

---

## 📊 Vérification du Cron Job

Le cron job a été créé avec succès :

| Propriété         | Valeur                                  |
| ----------------- | --------------------------------------- |
| **Job ID**        | `23`                                    |
| **Nom**           | `check-ssl-expiration-daily`            |
| **Schedule**      | `0 9 * * *` (Tous les jours à 9h00 UTC) |
| **Status**        | ✅ **Active: true**                     |
| **Edge Function** | `check-ssl-expiration`                  |

---

## 🎯 Fonctionnalités Actives

### 1. Vérification Automatique Quotidienne

- ⏰ **Heure d'exécution :** 9h00 UTC (tous les jours)
- 🔍 **Action :** Appelle automatiquement l'Edge Function `check-ssl-expiration`
- 📊 **Portée :** Tous les domaines personnalisés avec SSL activé

### 2. Alertes Automatiques

- ⚠️ **Alerte à 30 jours :** Email envoyé si expiration < 30 jours
- 🚨 **Alerte à 15 jours :** Email envoyé si expiration < 15 jours
- 🔴 **Alerte à 7 jours :** Email envoyé si expiration < 7 jours
- ⛔ **Alerte à 3 jours :** Email envoyé si expiration < 3 jours

### 3. Mise à Jour des Statuts

- 📝 Met à jour la table `ssl_certificate_status`
- 📚 Enregistre l'historique dans `domain_verification_history`
- 📧 Envoie les notifications selon les préférences de chaque boutique

---

## 🔍 Vérification Manuelle

Pour vérifier manuellement le cron job :

```sql
SELECT
  jobid,
  schedule,
  active,
  jobname
FROM cron.job
WHERE jobname = 'check-ssl-expiration-daily';
```

**Résultat attendu :**

- `jobid`: 23
- `schedule`: `0 9 * * *`
- `active`: `true`
- `jobname`: `check-ssl-expiration-daily`

---

## 🧪 Test Manuel (Optionnel)

Pour tester immédiatement sans attendre le prochain schedule :

1. **Via Dashboard Supabase :**
   - Allez dans **Edge Functions → check-ssl-expiration**
   - Cliquez sur **"Invoke"**
   - Cliquez sur **"Run Function"**
   - Vérifiez les logs

2. **Via cURL :**
   ```bash
   curl -X POST \
     'https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/check-ssl-expiration' \
     -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
     -H 'Content-Type: application/json'
   ```

---

## 📅 Historique des Exécutions

Pour voir l'historique des vérifications SSL :

```sql
SELECT
  s.store_id,
  s.domain,
  s.certificate_valid,
  s.certificate_expires_at,
  s.last_checked_at,
  s.ssl_grade
FROM ssl_certificate_status s
ORDER BY s.last_checked_at DESC
LIMIT 10;
```

Pour voir l'historique des vérifications de domaines :

```sql
SELECT
  d.store_id,
  d.domain,
  d.status,
  d.checked_at,
  d.error_message
FROM domain_verification_history d
ORDER BY d.checked_at DESC
LIMIT 20;
```

---

## ⚙️ Modifier le Schedule (Si Nécessaire)

Si vous voulez changer la fréquence d'exécution :

```sql
-- Désactiver l'ancien
SELECT cron.unschedule('check-ssl-expiration-daily');

-- Recréer avec nouveau schedule
SELECT cron.schedule(
  'check-ssl-expiration-daily',
  'NOUVEAU_SCHEDULE',  -- Ex: '0 */6 * * *' pour toutes les 6 heures
  $$
  SELECT net.http_post(
    url := 'https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/check-ssl-expiration',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
```

### Options de Schedule Populaires :

- **Toutes les 6 heures :** `0 */6 * * *`
- **Toutes les 12 heures :** `0 */12 * * *`
- **Deux fois par jour (9h et 21h) :** `0 9,21 * * *`
- **Toutes les heures :** `0 * * * *`
- **Toutes les 5 minutes (pour tests) :** `*/5 * * * *`

---

## 🎉 Résumé

✅ **Cron job créé et actif**  
✅ **Vérification quotidienne configurée (9h00 UTC)**  
✅ **Edge Function déployée et fonctionnelle**  
✅ **Alertes automatiques configurées**  
✅ **Monitoring SSL opérationnel**

---

**Prochaine vérification automatique :** Demain à 9h00 UTC  
**Statut système :** 🟢 **OPÉRATIONNEL**
