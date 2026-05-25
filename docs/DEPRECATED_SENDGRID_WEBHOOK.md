# Dépréciation — SendGrid webhook & libellés legacy

## Contexte

Le **provider d'envoi production** est **Resend** (`mail.emarzona.com`) via les Edge Functions :

- `send-email`
- `send-email-campaign`
- `send-notification-email`
- `send-order-confirmation-email`
- `send-welcome-email`

Les événements de délivrabilité sont traités par **`resend-webhook-handler`** (signature Svix).

## `sendgrid-webhook-handler` — déprécié

| Élément      | Détail                                                                         |
| ------------ | ------------------------------------------------------------------------------ |
| Chemin       | `supabase/functions/sendgrid-webhook-handler`                                  |
| Statut       | **Déprécié** — ne pas configurer de nouveaux webhooks SendGrid                 |
| Remplacement | `resend-webhook-handler`                                                       |
| URL prod     | `https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/resend-webhook-handler` |
| Secret       | `RESEND_WEBHOOK_SECRET` (Supabase Edge Secrets)                                |

### Actions recommandées

1. **Dashboard Resend** : webhook actif uniquement vers `resend-webhook-handler`.
2. **SendGrid** : supprimer toute URL pointant vers `sendgrid-webhook-handler` si elle existe encore.
3. **Ne pas redéployer** `sendgrid-webhook-handler` sauf maintenance de sécurité ; planifier sa suppression après période de grâce (aucun trafic sur 30 jours).
4. **Admin plateforme** : section « Resend » (anciennement libellée SendGrid) — référence optionnelle ; l'envoi réel utilise `RESEND_API_KEY` côté Edge.

### Colonnes / types legacy (inchangés en DB)

Pour compatibilité schéma et analytics existants, les noms suivants restent en base / TypeScript :

- `email_logs.sendgrid_message_id` → ID message provider (Resend)
- `SendGridStatus` dans `src/types/email.ts` → alias sémantique des statuts email

Une migration de renommage peut être planifiée ultérieurement ; ce n'est pas bloquant pour l'exploitation.

## Références

- [CONFIGURATION_EMAIL_RESEND_CRON.md](./CONFIGURATION_EMAIL_RESEND_CRON.md)
- [EMAIL_SMOKE_TEST.md](./EMAIL_SMOKE_TEST.md)
- [DEPLOIEMENT_FRONT_SUPABASE_KEYS.md](./DEPLOIEMENT_FRONT_SUPABASE_KEYS.md)
