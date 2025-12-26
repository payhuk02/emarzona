# Configuration du Cron Job SSL via Dashboard Supabase

## 🎯 Méthode Recommandée : Via Dashboard

Si vous rencontrez des erreurs de permission avec les scripts SQL directs, utilisez le Dashboard Supabase (méthode la plus simple et la plus fiable).

## 📋 Étapes Détaillées

### Étape 1 : Obtenir votre Service Role Key

1. Allez dans votre dashboard Supabase : **Settings > API**
2. Dans la section **Project API keys**, trouvez **`service_role`** (secret)
3. **⚠️ IMPORTANT** : C'est une clé secrète, ne la partagez jamais publiquement
4. Cliquez sur l'icône "👁️" pour révéler et copier la clé (elle commence généralement par `eyJ...`)

### Étape 2 : Accéder aux Cron Jobs

1. Dans le dashboard Supabase, allez dans **Database**
2. Dans le menu latéral, cliquez sur **Cron Jobs**
3. Cliquez sur **"New Cron Job"** ou **"Add Cron Job"**

### Étape 3 : Configurer le Cron Job

Remplissez les champs suivants :

**Schedule (Programmation) :**

```
0 9 * * *
```

- Tous les jours à 9h00 UTC
- Format : `minute hour day month weekday`

**Name (Nom) :**

```
check-ssl-expiration-daily
```

**Command (Commande SQL) :**

```sql
SELECT net.http_post(
  url := 'https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/check-ssl-expiration',
  headers := '{"Content-Type": "application/json", "Authorization": "Bearer VOTRE_SERVICE_ROLE_KEY_ICI"}'::jsonb,
  body := '{}'::jsonb
) AS request_id;
```

**⚠️ IMPORTANT :** Remplacez `VOTRE_SERVICE_ROLE_KEY_ICI` par votre vraie service role key !

**Active (Actif) :**

- ✅ Cocher pour activer immédiatement

### Étape 4 : Sauvegarder

Cliquez sur **"Save"** ou **"Create Cron Job"**

## ✅ Vérification

Après création, vous devriez voir le cron job dans la liste avec :

- ✅ Status: Active
- ✅ Schedule: `0 9 * * *`
- ✅ Name: `check-ssl-expiration-daily`

## 🧪 Test Manuel

Avant d'attendre la prochaine exécution automatique, testez la fonction :

1. Allez dans **Edge Functions > check-ssl-expiration**
2. Cliquez sur **"Invoke"**
3. Cliquez sur **"Run Function"**
4. Vérifiez les logs pour voir le résultat

## 📊 Vérifier les Exécutions

Pour voir l'historique des exécutions du cron job :

1. Allez dans **Database > Cron Jobs**
2. Cliquez sur le cron job `check-ssl-expiration-daily`
3. Consultez l'onglet **"Run History"** ou **"Execution Logs"**

## ⚙️ Modifier le Cron Job

Si vous devez modifier le schedule ou d'autres paramètres :

1. Allez dans **Database > Cron Jobs**
2. Cliquez sur `check-ssl-expiration-daily`
3. Cliquez sur **"Edit"**
4. Modifiez les paramètres souhaités
5. Cliquez sur **"Save"**

## 🚫 Désactiver Temporairement

Pour désactiver sans supprimer :

1. Allez dans **Database > Cron Jobs**
2. Cliquez sur `check-ssl-expiration-daily`
3. Décochez **"Active"**
4. Cliquez sur **"Save"**

## 🗑️ Supprimer le Cron Job

Si vous devez supprimer complètement :

1. Allez dans **Database > Cron Jobs**
2. Cliquez sur `check-ssl-expiration-daily`
3. Cliquez sur **"Delete"**
4. Confirmez la suppression

## 📚 Autres Options de Schedule

Si vous voulez vérifier plus souvent :

- **Toutes les 6 heures** : `0 */6 * * *`
- **Toutes les 12 heures** : `0 */12 * * *`
- **Deux fois par jour (9h et 21h)** : `0 9,21 * * *`
- **Toutes les heures** (pour tests) : `0 * * * *`

## 🔍 Dépannage

### Le cron job ne s'exécute pas

1. Vérifiez qu'il est **Active** dans la liste
2. Vérifiez que la **Service Role Key** est correcte dans la commande
3. Vérifiez les **Logs** dans Edge Functions pour voir les erreurs

### Erreur "permission denied"

Si vous avez toujours des erreurs de permission :

- Utilisez la méthode Dashboard décrite ci-dessus (plus fiable)
- Ou utilisez la fonction helper `setup_ssl_expiration_check_cron()` (voir script SQL alternatif)

### Pas d'alertes reçues

1. Vérifiez qu'il y a des certificats SSL dans `ssl_certificate_status`
2. Vérifiez que les notifications sont activées dans les paramètres de boutique
3. Vérifiez que la fonction `send-email` est configurée

---

**Date de création :** 2025-02-02  
**Dernière mise à jour :** 2025-02-02
