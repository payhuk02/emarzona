# Configuration Cron Job SSL via Dashboard Supabase - Guide Détaillé

## 🎯 Méthode la Plus Simple et Fiable

Le Dashboard Supabase gère automatiquement les permissions, donc c'est la méthode recommandée.

## 📋 Étapes Détaillées

### Étape 1 : Obtenir votre Service Role Key

1. Allez dans **Settings > API**
2. Dans la section **Project API keys**, trouvez **`service_role`** (secret)
3. Cliquez sur l'icône 👁️ pour révéler la clé
4. Copiez la clé complète (commence par `eyJ...`)

**Votre clé :**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZG56YWpieWpha2RodWF2cnZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzU5ODIzMSwiZXhwIjoyMDczMTc0MjMxfQ.MT2e4tcw_5eK0fRQFN5tF1Cwu210MKFUAUGqmYm_1XE
```

### Étape 2 : Accéder aux Cron Jobs

1. Dans le dashboard Supabase, cliquez sur **Database** dans le menu latéral
2. Cliquez sur **Cron Jobs** (ou cherchez "Cron" dans la recherche)
3. Cliquez sur **"New Cron Job"** ou **"Add Cron Job"**

### Étape 3 : Configurer le Cron Job

Remplissez les champs suivants :

#### Schedule (Programmation) :
```
0 9 * * *
```
- **Signification :** Tous les jours à 9h00 UTC
- **Format :** `minute hour day month weekday`
- Vous pouvez tester avec `*/5 * * * *` (toutes les 5 minutes) pour vérifier que ça fonctionne

#### Name (Nom) :
```
check-ssl-expiration-daily
```

#### Command (Commande SQL) :
```sql
SELECT net.http_post(
  url := 'https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/check-ssl-expiration',
  headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZG56YWpieWpha2RodWF2cnZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzU5ODIzMSwiZXhwIjoyMDczMTc0MjMxfQ.MT2e4tcw_5eK0fRQFN5tF1Cwu210MKFUAUGqmYm_1XE"}'::jsonb,
  body := '{}'::jsonb
) AS request_id;
```

**⚠️ IMPORTANT :** J'ai déjà inclus votre Service Role Key dans la commande ci-dessus.

#### Active (Actif) :
- ✅ **Cocher** pour activer immédiatement

### Étape 4 : Sauvegarder

Cliquez sur **"Save"** ou **"Create Cron Job"**

## ✅ Vérification

Après création, vous devriez voir le cron job dans la liste avec :
- ✅ Status: **Active**
- ✅ Schedule: `0 9 * * *`
- ✅ Name: `check-ssl-expiration-daily`
- ✅ Last run: (sera mis à jour après la première exécution)

## 🧪 Test Immédiat (Optionnel)

Pour tester avant la prochaine exécution automatique :

1. Allez dans **Edge Functions > check-ssl-expiration**
2. Cliquez sur **"Invoke"**
3. Cliquez sur **"Run Function"**
4. Vérifiez les logs pour voir le résultat

## 📊 Vérifier les Exécutions

Pour voir l'historique des exécutions :

1. Allez dans **Database > Cron Jobs**
2. Cliquez sur le cron job `check-ssl-expiration-daily`
3. Consultez l'onglet **"Run History"** ou **"Execution Logs"**

## ⚙️ Modifier le Schedule

Si vous voulez changer la fréquence :

1. Allez dans **Database > Cron Jobs**
2. Cliquez sur `check-ssl-expiration-daily`
3. Cliquez sur **"Edit"**
4. Modifiez le **Schedule** (ex: `*/6 * * * *` pour toutes les 6 heures)
5. Cliquez sur **"Save"**

## 🔍 Autres Options de Schedule

- **Toutes les 6 heures** : `0 */6 * * *`
- **Toutes les 12 heures** : `0 */12 * * *`
- **Deux fois par jour (9h et 21h)** : `0 9,21 * * *`
- **Toutes les heures** (pour tests) : `0 * * * *`
- **Toutes les 5 minutes** (pour tests) : `*/5 * * * *`

---

**Date :** 2025-02-02  
**Méthode :** Dashboard Supabase (recommandé)

