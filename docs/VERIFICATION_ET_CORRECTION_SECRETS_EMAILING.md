# ✅ Vérification et Correction des Secrets - Système Emailing

**Date** : 30 Janvier 2025  
**Objectif** : Vérifier et corriger la configuration des secrets pour le système d'emailing

---

## 📋 Secrets Requis pour le Système Emailing

### 1. `SENDGRID_API_KEY` ⚠️ **CRITIQUE**

**Où configurer** : Supabase Dashboard > Edge Functions > Secrets

**Edge Functions qui l'utilisent** :
- ✅ `send-email-campaign` - **OBLIGATOIRE**
- ✅ `process-email-sequences` - **OBLIGATOIRE**
- ⚠️ `process-scheduled-campaigns` - Optionnel (mais recommandé pour les warnings)

**Comment vérifier** :
1. Allez dans Supabase Dashboard > Edge Functions > Secrets
2. Recherchez `SENDGRID_API_KEY` dans la liste
3. Si absent, ajoutez-le (voir instructions ci-dessous)

**Comment obtenir** :
1. Créez un compte sur [SendGrid](https://sendgrid.com)
2. Allez dans Settings > API Keys
3. Cliquez sur "Create API Key"
4. Donnez un nom (ex: "Emarzona Production")
5. Sélectionnez "Full Access" ou "Restricted Access" avec "Mail Send" activé
6. Cliquez sur "Create & View"
7. **Copiez la clé** (commence par `SG.` et ne sera affichée qu'une seule fois)

**Format** : `SG.xxxxxxxxxxxxx` (longue chaîne commençant par `SG.`)

---

## 🔧 Instructions de Configuration

### Étape 1 : Accéder aux Secrets

1. Allez dans : **Supabase Dashboard** > **Edge Functions** > **Secrets**
   - URL directe : `https://supabase.com/dashboard/project/hbdnzajbyjakdhuavrvb/functions/secrets`

### Étape 2 : Vérifier les Secrets Existants

Vérifiez si `SENDGRID_API_KEY` est déjà présent dans la liste.

**Si présent** :
- ✅ Vérifiez que la valeur est correcte (commence par `SG.`)
- ✅ Vérifiez qu'elle n'est pas expirée

**Si absent** :
- ⚠️ **AJOUTEZ-LE** (voir Étape 3)

### Étape 3 : Ajouter `SENDGRID_API_KEY`

1. Cliquez sur **"Add new secret"** ou **"+ Add secret"**
2. Remplissez :
   - **Name** : `SENDGRID_API_KEY`
   - **Value** : Votre clé API SendGrid (commence par `SG.`)
3. Cliquez sur **"Save"**

**⚠️ IMPORTANT** :
- Ne mettez PAS d'espaces avant ou après la valeur
- La clé doit commencer par `SG.`
- La clé est sensible, ne la partagez jamais

---

## ✅ Vérification Post-Configuration

### 1. Vérifier dans les Logs

Après avoir configuré `SENDGRID_API_KEY`, testez une Edge Function et vérifiez les logs :

**Dans Supabase Dashboard > Edge Functions > `send-email-campaign` > Logs** :

- ✅ **Pas de warning** : `SENDGRID_API_KEY is not set`
- ✅ **Pas d'erreur** : `SendGrid API Key not configured`

### 2. Test Rapide

Exécutez cette requête pour tester :

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

**Dans les logs**, vous ne devriez plus voir :
- ❌ `SENDGRID_API_KEY is not set. Campaigns will not be sent.`

---

## 📝 Checklist de Vérification

- [ ] Accès à Supabase Dashboard > Edge Functions > Secrets
- [ ] `SENDGRID_API_KEY` présent dans la liste des secrets
- [ ] Valeur de `SENDGRID_API_KEY` commence par `SG.`
- [ ] Test effectué
- [ ] Logs vérifiés (plus de warning `SENDGRID_API_KEY is not set`)
- [ ] Campagnes peuvent être envoyées

---

## 🐛 Problèmes Courants

### Problème 1 : "SENDGRID_API_KEY is not set"

**Cause** : Le secret n'est pas configuré dans Supabase Dashboard

**Solution** : Ajouter `SENDGRID_API_KEY` dans Supabase Dashboard > Edge Functions > Secrets

### Problème 2 : "Invalid API Key" dans SendGrid

**Cause** : La clé API est incorrecte ou expirée

**Solution** :
1. Vérifier que la clé commence par `SG.`
2. Vérifier qu'il n'y a pas d'espaces avant/après
3. Générer une nouvelle clé API dans SendGrid si nécessaire

### Problème 3 : "Name must not start with the SUPABASE_ prefix"

**Cause** : Tentative d'ajouter `SUPABASE_URL` ou `SUPABASE_SERVICE_ROLE_KEY` comme secret

**Solution** : Ces variables sont automatiquement injectées, pas besoin de les ajouter manuellement

---

## 📊 État Actuel des Secrets

| Secret | Requis | Configuré | Edge Functions |
|--------|--------|-----------|----------------|
| `SENDGRID_API_KEY` | ✅ Oui | ⚠️ **À VÉRIFIER** | `send-email-campaign`, `process-email-sequences`, `process-scheduled-campaigns` |
| `SUPABASE_URL` | ✅ Oui | ✅ Auto | Toutes (injecté automatiquement) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Oui | ✅ Auto | Toutes (injecté automatiquement) |
| `SUPABASE_ANON_KEY` | ✅ Oui | ✅ Auto | Toutes (injecté automatiquement) |
| `SENDGRID_WEBHOOK_SECRET` | ⚠️ Optionnel | ⚠️ **À VÉRIFIER** | `sendgrid-webhook-handler` |
| `CRON_SECRET` | ⚠️ Optionnel | ⚠️ **À VÉRIFIER** | `process-scheduled-campaigns` |

---

**Dernière mise à jour** : 30 Janvier 2025


