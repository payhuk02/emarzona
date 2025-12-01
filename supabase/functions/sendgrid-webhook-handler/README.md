# SendGrid Webhook Handler

Edge Function pour recevoir et traiter les webhooks SendGrid.

## Configuration

### Variables d'environnement requises

- `SUPABASE_URL` : URL de votre instance Supabase
- `SUPABASE_SERVICE_ROLE_KEY` : Clé de service Supabase
- `SENDGRID_WEBHOOK_SECRET` (optionnel) : Secret pour valider les webhooks

### Configuration SendGrid

1. Allez dans SendGrid > Settings > Mail Settings > Event Webhook
2. Configurez l'URL de votre Edge Function :
   ```
   https://your-project.supabase.co/functions/v1/sendgrid-webhook-handler
   ```
3. Sélectionnez les événements à recevoir :
   - processed
   - delivered
   - open
   - click
   - bounce
   - dropped
   - spamreport
   - unsubscribe
   - group_unsubscribe

## Événements traités

- **processed** : Email en file d'attente
- **delivered** : Email livré
- **open** : Email ouvert
- **click** : Lien cliqué
- **bounce** : Email rebondé
- **dropped** : Email rejeté
- **spamreport** : Signalé comme spam
- **unsubscribe** : Désabonnement
- **group_unsubscribe** : Désabonnement de groupe

## Fonctionnalités

- Mise à jour automatique des `email_logs`
- Mise à jour des métriques de campagnes
- Mise à jour des métriques de séquences
- Enregistrement automatique des désabonnements

## Déploiement

```bash
supabase functions deploy sendgrid-webhook-handler
```

