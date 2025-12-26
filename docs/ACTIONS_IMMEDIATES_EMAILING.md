# 🚀 Actions Immédiates - Système Emailing

**Date** : 30 Janvier 2025  
**Priorité** : ⚠️ **CRITIQUE**

---

## ⚠️ Problèmes Critiques Identifiés

D'après les logs, **2 problèmes critiques** empêchent le système d'emailing de fonctionner :

1. ❌ **`SENDGRID_API_KEY is not set`** - Les emails ne peuvent pas être envoyés
2. ❌ **`401 Invalid JWT`** - L'appel à `send-email-campaign` échoue

---

## ✅ Action 1 : Configurer `SENDGRID_API_KEY` (5 minutes)

### Étape 1 : Obtenir la Clé SendGrid

1. Allez sur [SendGrid](https://sendgrid.com)
2. Connectez-vous ou créez un compte
3. Allez dans **Settings** > **API Keys**
4. Cliquez sur **"Create API Key"**
5. Donnez un nom : `Emarzona Production`
6. Sélectionnez **"Full Access"** ou **"Restricted Access"** avec **"Mail Send"** activé
7. Cliquez sur **"Create & View"**
8. **Copiez la clé** (commence par `SG.` et ne sera affichée qu'une seule fois)

### Étape 2 : Ajouter dans Supabase

1. Allez dans : **Supabase Dashboard** > **Edge Functions** > **Secrets**
   - URL directe : `https://supabase.com/dashboard/project/hbdnzajbyjakdhuavrvb/functions/secrets`
2. Cliquez sur **"Add new secret"**
3. Remplissez :
   - **Name** : `SENDGRID_API_KEY`
   - **Value** : Votre clé API SendGrid (commence par `SG.`)
4. Cliquez sur **"Save"**

**✅ Fait !** Le warning `SENDGRID_API_KEY is not set` devrait disparaître.

---

## ✅ Action 2 : Vérifier l'Erreur 401 (Si elle persiste)

Si l'erreur `401 Invalid JWT` persiste après avoir configuré `SENDGRID_API_KEY`, cela signifie que l'anon key n'est pas acceptée par `send-email-campaign`.

### Solution Alternative : Utiliser la Service Role Key

Si l'anon key ne fonctionne pas, on peut modifier `process-scheduled-campaigns` pour utiliser la service role key directement (comme dans le cron job).

**⚠️ Note** : Cette solution fonctionne mais est moins sécurisée. L'idéal serait de comprendre pourquoi l'anon key est rejetée.

---

## 🧪 Test Immédiat

Après avoir configuré `SENDGRID_API_KEY`, testez :

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

**Vérifiez les logs** :

- ✅ Plus de warning `SENDGRID_API_KEY is not set`
- ⚠️ Si toujours `401 Invalid JWT`, voir Action 2

---

## 📊 État Actuel

| Problème                      | Statut            | Solution                             |
| ----------------------------- | ----------------- | ------------------------------------ |
| `SENDGRID_API_KEY is not set` | ❌ **NON RÉSOLU** | Configurer dans Supabase Dashboard   |
| `401 Invalid JWT`             | ❌ **NON RÉSOLU** | Vérifier l'utilisation de l'anon key |

---

## 🎯 Priorité

1. **URGENT** : Configurer `SENDGRID_API_KEY` (5 minutes)
2. **IMPORTANT** : Résoudre l'erreur `401 Invalid JWT` si elle persiste

---

**Dernière mise à jour** : 30 Janvier 2025
