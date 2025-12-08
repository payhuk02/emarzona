# 🔗 Configuration Webhooks SendGrid - Guide Complet

**Date** : 30 Janvier 2025  
**Edge Function** : `sendgrid-webhook-handler`

---

## 📋 Vue d'Ensemble

Les webhooks SendGrid permettent de recevoir des événements en temps réel (opens, clicks, bounces, etc.) et de mettre à jour automatiquement les métriques des campagnes et séquences email.

---

## 🚀 Configuration SendGrid

### Étape 1 : Accéder aux Paramètres SendGrid

1. Connectez-vous à votre compte SendGrid : https://app.sendgrid.com
2. Allez dans **Settings** > **Mail Settings** > **Event Webhook**

### Étape 2 : Configurer l'URL du Webhook

1. **Activer l'Event Webhook**
   - Cliquez sur **Event Webhook** dans la liste
   - Activez le toggle **Event Webhook**

2. **Configurer l'URL**
   ```
   https://your-project-id.supabase.co/functions/v1/sendgrid-webhook-handler
   ```
   
   **Remplacez** `your-project-id` par votre ID de projet Supabase.

3. **Méthode HTTP**
   - Sélectionnez **HTTP POST**

### Étape 3 : Sélectionner les Événements

Activez les événements suivants (recommandés) :

- ✅ **processed** - Email en file d'attente
- ✅ **delivered** - Email livré
- ✅ **open** - Email ouvert
- ✅ **click** - Lien cliqué
- ✅ **bounce** - Email rebondé
- ✅ **dropped** - Email rejeté
- ✅ **spamreport** - Signalé comme spam
- ✅ **unsubscribe** - Désabonnement
- ✅ **group_unsubscribe** - Désabonnement de groupe

**Note** : Tous ces événements sont traités par l'Edge Function.

### Étape 4 : Configurer le Secret (Optionnel mais Recommandé)

1. **Générer un Secret**
   - Utilisez un générateur de secret (ex: `openssl rand -hex 32`)
   - Ou utilisez un service comme https://randomkeygen.com

2. **Ajouter le Secret dans SendGrid**
   - Dans les paramètres du webhook, ajoutez le secret
   - Notez-le pour l'ajouter aux variables d'environnement Supabase

3. **Ajouter le Secret dans Supabase**
   - Supabase Dashboard > Project Settings > Edge Functions > Secrets
   - Ajoutez : `SENDGRID_WEBHOOK_SECRET` = `votre-secret`

---

## 🔧 Configuration Supabase

### Variables d'Environnement Requises

Dans Supabase Dashboard > Project Settings > Edge Functions > Secrets :

- ✅ `SUPABASE_URL` - Déjà configuré automatiquement
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Déjà configuré automatiquement
- ⚠️ `SENDGRID_WEBHOOK_SECRET` - À ajouter manuellement (optionnel mais recommandé)

### Déploiement de l'Edge Function

```bash
# Depuis le répertoire du projet
supabase functions deploy sendgrid-webhook-handler
```

---

## ✅ Vérification de la Configuration

### Test 1 : Vérifier l'URL du Webhook

1. **Test manuel**
   ```bash
   curl -X POST https://your-project-id.supabase.co/functions/v1/sendgrid-webhook-handler \
     -H "Content-Type: application/json" \
     -d '[{"email":"test@example.com","event":"delivered","timestamp":1234567890,"sg_event_id":"test","sg_message_id":"test"}]'
   ```

2. **Vérifier les logs**
   - Supabase Dashboard > Edge Functions > `sendgrid-webhook-handler` > Logs
   - Vérifiez qu'il n'y a pas d'erreurs

### Test 2 : Envoyer un Email de Test

1. **Créer une campagne de test**
   - Créez une campagne email simple
   - Envoyez-la à votre adresse email

2. **Vérifier les événements**
   - Ouvrez l'email
   - Cliquez sur un lien
   - Vérifiez dans Supabase que les métriques sont mises à jour :
     ```sql
     SELECT * FROM email_logs 
     WHERE recipient_email = 'votre-email@example.com' 
     ORDER BY created_at DESC 
     LIMIT 1;
     ```

3. **Vérifier les métriques de campagne**
   ```sql
     SELECT metrics FROM email_campaigns 
     WHERE id = 'campaign-id';
     ```

---

## 📊 Événements Traités

### Événements Supportés

| Événement | Description | Action |
|-----------|-------------|--------|
| **processed** | Email en file d'attente | Met à jour `sendgrid_status = 'queued'` |
| **delivered** | Email livré | Met à jour `sendgrid_status = 'delivered'` et `delivered_at` |
| **open** | Email ouvert | Met à jour `opened_at`, `opened_ip` |
| **click** | Lien cliqué | Met à jour `clicked_at`, `clicked_url`, `clicked_ip` |
| **bounce** | Email rebondé | Met à jour `sendgrid_status = 'bounced'`, `bounced_at`, `bounce_reason` |
| **dropped** | Email rejeté | Met à jour `sendgrid_status = 'failed'`, `bounced_at` |
| **spamreport** | Signalé comme spam | Met à jour `sendgrid_status = 'spam'` |
| **unsubscribe** | Désabonnement | Enregistre dans `email_unsubscribes` |
| **group_unsubscribe** | Désabonnement de groupe | Enregistre dans `email_unsubscribes` |

### Mise à Jour des Métriques

Les métriques sont automatiquement mises à jour pour :
- ✅ Campagnes (`email_campaigns.metrics`)
- ✅ Séquences (`email_sequences.metrics`)
- ✅ Logs individuels (`email_logs`)

---

## 🔍 Dépannage

### Problème : Webhooks non reçus

**Solutions :**
1. Vérifier que l'URL est correcte dans SendGrid
2. Vérifier que l'Edge Function est déployée
3. Vérifier les logs Supabase pour des erreurs
4. Tester l'URL manuellement avec curl

### Problème : Métriques non mises à jour

**Solutions :**
1. Vérifier que `custom_args` contient `email_log_id` ou `campaign_id`
2. Vérifier que `sg_message_id` correspond dans `email_logs`
3. Vérifier les logs de l'Edge Function pour des erreurs

### Problème : Erreur 401/403

**Solutions :**
1. Vérifier que `SUPABASE_SERVICE_ROLE_KEY` est configuré
2. Vérifier que le secret webhook correspond (si configuré)

---

## 📝 Exemple de Payload SendGrid

```json
[
  {
    "email": "user@example.com",
    "timestamp": 1640995200,
    "event": "open",
    "sg_event_id": "abc123",
    "sg_message_id": "def456",
    "ip": "192.168.1.1",
    "useragent": "Mozilla/5.0...",
    "custom_args": {
      "email_log_id": "uuid-here",
      "campaign_id": "campaign-uuid",
      "sequence_id": "sequence-uuid",
      "user_id": "user-uuid"
    }
  }
]
```

---

## 🔐 Sécurité

### Validation des Webhooks (Optionnel)

L'Edge Function peut valider les webhooks SendGrid en vérifiant le secret :

```typescript
// Dans sendgrid-webhook-handler/index.ts
const SENDGRID_WEBHOOK_SECRET = Deno.env.get('SENDGRID_WEBHOOK_SECRET');

if (SENDGRID_WEBHOOK_SECRET) {
  // Valider le webhook avec le secret
  // (implémentation dépend de SendGrid)
}
```

**Note** : SendGrid ne fournit pas de signature HMAC par défaut, mais vous pouvez configurer un secret personnalisé.

---

## 📚 Ressources

- [Documentation SendGrid Event Webhook](https://docs.sendgrid.com/for-developers/tracking-events/event)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Edge Function sendgrid-webhook-handler](../supabase/functions/sendgrid-webhook-handler/README.md)

---

**Dernière mise à jour** : 30 Janvier 2025

