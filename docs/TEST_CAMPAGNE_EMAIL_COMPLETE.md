# 🧪 Test Complet - Campagne Email Automatique

**Date** : 30 Janvier 2025  
**Objectif** : Valider le cycle complet d'envoi automatique de campagnes email

---

## 📋 Vue d'Ensemble

Ce guide vous permet de créer une campagne email de test qui sera automatiquement envoyée par le cron job toutes les 5 minutes.

---

## 🚀 Étape 1 : Créer la Campagne de Test

### Option A : Via SQL (Recommandé)

1. **Ouvrir Supabase SQL Editor**
   - Allez dans Supabase Dashboard > SQL Editor

2. **Exécuter le script de test**
   - Ouvrez le fichier : `supabase/migrations/20250230_create_test_email_campaign.sql`
   - Copiez-collez le contenu dans SQL Editor
   - Cliquez sur **Run** (ou `CTRL + Enter`)

3. **Vérifier le résultat**
   - Vous devriez voir un message de succès avec :
     - Campagne ID
     - Template ID
     - Store ID
     - Date/heure programmée

### Option B : Via l'Interface (Alternative)

1. **Créer un template** (si nécessaire)
   - Allez dans l'interface des templates email
   - Créez un template simple avec :
     - Sujet : "Test de Campagne Email"
     - Contenu HTML basique

2. **Créer la campagne**
   - Allez dans l'interface des campagnes
   - Créez une nouvelle campagne :
     - **Nom** : "TEST - Campagne Email Automatique"
     - **Type** : Promotional
     - **Template** : Sélectionnez le template créé
     - **Statut** : Scheduled
     - **Date d'envoi** : Dans 5-10 minutes
     - **Audience** : Filtre simple (ou segment de test)

---

## ⏱️ Étape 2 : Attendre l'Exécution du Cron Job

Le cron job s'exécute **toutes les 5 minutes** aux heures suivantes :

- `:00`, `:05`, `:10`, `:15`, `:20`, `:25`, `:30`, `:35`, `:40`, `:45`, `:50`, `:55`

**Exemple** : Si vous créez la campagne à `14:23`, elle sera traitée à `14:25` ou `14:30`.

---

## ✅ Étape 3 : Vérifier le Résultat

### 3.1 Vérifier le Statut de la Campagne

Exécutez cette requête dans SQL Editor :

```sql
SELECT
  id,
  name,
  status,
  scheduled_at,
  metrics->>'sent' as emails_sent,
  metrics->>'delivered' as emails_delivered,
  metrics->>'opened' as emails_opened,
  updated_at
FROM public.email_campaigns
WHERE name LIKE 'TEST - %'
ORDER BY created_at DESC
LIMIT 1;
```

**Résultats attendus :**

- `status` : `sending` ou `completed`
- `emails_sent` : > 0
- `updated_at` : Mis à jour après l'exécution du cron

### 3.2 Vérifier les Logs du Cron Job

```sql
SELECT
  jobid,
  runid,
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
LIMIT 5;
```

**Résultats attendus :**

- `status` : `succeeded`
- `return_message` : Contient des informations sur les campagnes traitées

### 3.3 Vérifier les Logs de l'Edge Function

1. **Allez dans** : Supabase Dashboard > Edge Functions > `process-scheduled-campaigns`
2. **Cliquez sur** : Logs
3. **Vérifiez** :
   - Dernières exécutions autour de l'heure programmée
   - Messages de succès
   - Nombre de campagnes traitées
   - Erreurs éventuelles

### 3.4 Vérifier les Emails Logs

```sql
SELECT
  id,
  recipient_email,
  subject,
  sendgrid_status,
  sent_at,
  delivered_at,
  opened_at,
  clicked_at
FROM public.email_logs
WHERE campaign_id = (
  SELECT id FROM public.email_campaigns
  WHERE name LIKE 'TEST - %'
  ORDER BY created_at DESC
  LIMIT 1
)
ORDER BY sent_at DESC;
```

**Résultats attendus :**

- Des logs d'emails créés
- `sendgrid_status` : `queued`, `delivered`, etc.
- `sent_at` : Timestamp de l'envoi

### 3.5 Vérifier l'Email Reçu

Si vous avez configuré votre email dans les filtres d'audience :

- ✅ Vérifiez votre boîte de réception
- ✅ Vérifiez les spams
- ✅ Vérifiez que le contenu est correct

---

## 🔍 Dépannage

### Problème : La campagne reste en `scheduled`

**Solutions :**

1. Vérifier que le cron job est actif :

   ```sql
   SELECT * FROM cron.job WHERE jobname = 'process-scheduled-email-campaigns';
   ```

2. Vérifier que `scheduled_at` est dans le passé :

   ```sql
   SELECT
     name,
     scheduled_at,
     NOW() as current_time,
     scheduled_at < NOW() as should_be_sent
   FROM email_campaigns
   WHERE name LIKE 'TEST - %';
   ```

3. Vérifier les logs du cron job pour des erreurs

### Problème : Le statut passe à `sending` mais aucun email n'est envoyé

**Solutions :**

1. Vérifier que le template existe et est actif :

   ```sql
   SELECT id, name, is_active FROM email_templates WHERE id = 'template-id';
   ```

2. Vérifier que SendGrid est configuré :
   - Variables d'environnement de l'Edge Function
   - `SENDGRID_API_KEY` présent

3. Vérifier les logs de l'Edge Function `send-email-campaign`

### Problème : Erreurs dans les logs

**Solutions :**

1. Vérifier les permissions RLS sur `email_campaigns`
2. Vérifier que `SUPABASE_SERVICE_ROLE_KEY` est configuré
3. Vérifier la structure des données (template, audience, etc.)

---

## 📊 Checklist de Validation

- [ ] Campagne créée avec succès
- [ ] Statut initial : `scheduled`
- [ ] `scheduled_at` défini correctement
- [ ] Cron job s'exécute (vérifier les logs)
- [ ] Statut passe à `sending` ou `completed`
- [ ] Métriques `sent` > 0
- [ ] Logs d'emails créés dans `email_logs`
- [ ] Email reçu (si configuré)
- [ ] Pas d'erreurs dans les logs

---

## 🧹 Nettoyage (Optionnel)

Pour supprimer les campagnes de test après validation :

```sql
-- Supprimer les campagnes de test
DELETE FROM public.email_campaigns
WHERE name LIKE 'TEST - %';

-- Supprimer le template de test (optionnel)
DELETE FROM public.email_templates
WHERE slug = 'test-campaign-template';
```

---

## 📝 Notes Importantes

1. **Temps d'attente** : Le cron job s'exécute toutes les 5 minutes, attendez jusqu'à 5 minutes après l'heure programmée

2. **Environnement de test** : Utilisez un email de test pour éviter d'envoyer des emails à de vrais clients

3. **SendGrid** : Assurez-vous que SendGrid est configuré et actif pour que les emails soient réellement envoyés

4. **Audience** : Pour un test réel, configurez les filtres d'audience pour cibler votre email de test

---

## 🎯 Prochaines Étapes

Une fois le test validé :

1. ✅ **Cron job fonctionnel** - Confirmer
2. ⏳ **Configurer les webhooks SendGrid** - Pour le tracking (opens, clicks)
3. ⏳ **Créer des campagnes réelles** - Utiliser l'interface
4. ⏳ **Monitorer les performances** - Suivre les métriques

---

**Dernière mise à jour** : 30 Janvier 2025  
**Statut** : ✅ **PRÊT POUR TEST**
