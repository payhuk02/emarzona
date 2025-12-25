# 🔧 Variables d'Environnement - Système Emailing

**Date** : 30 Janvier 2025  
**Contexte** : Configuration des variables d'environnement pour le système d'emailing

---

## 📋 Variables Requises

### Pour les Edge Functions Supabase

Les Edge Functions Supabase ont accès automatiquement à ces variables (injectées par Supabase) :
- ✅ `SUPABASE_URL` : Injecté automatiquement
- ✅ `SUPABASE_SERVICE_ROLE_KEY` : Injecté automatiquement
- ✅ `SUPABASE_ANON_KEY` : Injecté automatiquement

**⚠️ IMPORTANT** : Vous ne pouvez PAS ajouter ces secrets manuellement dans Supabase Dashboard > Edge Functions > Secrets car Supabase affiche l'erreur :
> "Name must not start with the SUPABASE_ prefix"

### Variables à Configurer Manuellement

#### 1. `SENDGRID_API_KEY` (Recommandé)

**Où configurer** : Supabase Dashboard > Edge Functions > Secrets

**Comment obtenir** :
1. Créez un compte sur [SendGrid](https://sendgrid.com)
2. Allez dans Settings > API Keys
3. Créez une nouvelle clé API avec les permissions "Mail Send"
4. Copiez la clé API

**Valeur** : `SG.xxxxxxxxxxxxx` (commence par `SG.`)

**Edge Functions qui l'utilisent** :
- `send-email-campaign`
- `process-email-sequences`
- `process-scheduled-campaigns` (optionnel, mais recommandé)

**⚠️ Note** : Si `SENDGRID_API_KEY` n'est pas configuré, les campagnes ne seront pas envoyées (vous verrez le warning dans les logs).

#### 2. `SENDGRID_WEBHOOK_SECRET` (Optionnel)

**Où configurer** : Supabase Dashboard > Edge Functions > Secrets

**Comment obtenir** :
1. Dans SendGrid Dashboard > Settings > Mail Settings > Event Webhook
2. Configurez l'URL : `https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/sendgrid-webhook-handler`
3. Générez un secret (optionnel mais recommandé pour la sécurité)

**Valeur** : Une chaîne aléatoire (ex: `sendgrid-webhook-secret-2025`)

**Edge Function qui l'utilise** :
- `sendgrid-webhook-handler`

#### 3. `CRON_SECRET` (Optionnel)

**Où configurer** : Supabase Dashboard > Edge Functions > Secrets

**Valeur** : `process-scheduled-campaigns-secret-2025` (ou une autre valeur sécurisée)

**Edge Function qui l'utilise** :
- `process-scheduled-campaigns` (pour l'authentification personnalisée)

---

## 🔧 Configuration dans Supabase Dashboard

### Étapes pour Ajouter les Secrets

1. **Allez dans** : Supabase Dashboard > Edge Functions > Secrets
2. **Cliquez sur** : "Add new secret"
3. **Ajoutez** :
   - **Name** : `SENDGRID_API_KEY`
   - **Value** : Votre clé API SendGrid (commence par `SG.`)
4. **Cliquez sur** : "Save"
5. **Répétez** pour `SENDGRID_WEBHOOK_SECRET` et `CRON_SECRET` si nécessaire

---

## ✅ Vérification

### Vérifier que les Secrets sont Configurés

Dans Supabase Dashboard > Edge Functions > Secrets, vous devriez voir :
- ✅ `SENDGRID_API_KEY` (si configuré)
- ✅ `SENDGRID_WEBHOOK_SECRET` (si configuré)
- ✅ `CRON_SECRET` (si configuré)

**Note** : `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, et `SUPABASE_ANON_KEY` n'apparaîtront PAS dans cette liste car ils sont injectés automatiquement.

### Vérifier dans les Logs

Dans les logs des Edge Functions, vous devriez voir :
- ✅ Pas de warning `SENDGRID_API_KEY is not set` si la clé est configurée
- ✅ Les appels à SendGrid réussissent

---

## 📝 Checklist

- [ ] `SENDGRID_API_KEY` configuré dans Supabase Dashboard > Edge Functions > Secrets
- [ ] `SENDGRID_WEBHOOK_SECRET` configuré (optionnel)
- [ ] `CRON_SECRET` configuré (optionnel)
- [ ] Secrets vérifiés dans Supabase Dashboard
- [ ] Logs vérifiés pour confirmer que les secrets sont bien utilisés

---

## 🐛 Problèmes Courants

### Problème 1 : "SENDGRID_API_KEY is not set"

**Cause** : Le secret n'est pas configuré dans Supabase Dashboard

**Solution** : Ajouter `SENDGRID_API_KEY` dans Supabase Dashboard > Edge Functions > Secrets

### Problème 2 : "Name must not start with the SUPABASE_ prefix"

**Cause** : Tentative d'ajouter `SUPABASE_URL` ou `SUPABASE_SERVICE_ROLE_KEY` comme secret

**Solution** : Ces variables sont automatiquement injectées, pas besoin de les ajouter manuellement

### Problème 3 : Les Secrets ne sont pas Accessibles

**Cause** : Les secrets doivent être ajoutés dans Supabase Dashboard, pas dans un fichier `.env` local

**Solution** : Utiliser Supabase Dashboard > Edge Functions > Secrets

---

**Dernière mise à jour** : 30 Janvier 2025


