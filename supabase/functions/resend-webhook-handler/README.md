# resend-webhook-handler

Reçoit les webhooks Resend pour mettre à jour `email_logs` et les métriques de campagne.

## Configuration

1. Déployer la fonction (**sans JWT Supabase** — Resend n'envoie pas de Bearer) :
   `supabase functions deploy resend-webhook-handler --no-verify-jwt`
   (ou `[functions.resend-webhook-handler] verify_jwt = false` dans `supabase/config.toml`)
2. Secret Edge : `RESEND_WEBHOOK_SECRET` (valeur aléatoire forte)
3. Dans [Resend Webhooks](https://resend.com/webhooks), créer un endpoint :
   - URL : `https://<project>.supabase.co/functions/v1/resend-webhook-handler`
   - Événements : `email.sent`, `email.delivered`, `email.opened`, `email.clicked`, `email.bounced`, `email.complained`
4. Ajouter un header personnalisé (si l'UI le permet) ou utiliser un proxy :
   - `x-resend-webhook-secret: <RESEND_WEBHOOK_SECRET>`

Les emails envoyés via Resend sont reliés aux logs par `sendgrid_message_id` (= `email_id` Resend).
