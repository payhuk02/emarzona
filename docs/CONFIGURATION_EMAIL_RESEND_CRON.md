# Configuration email — Resend, webhooks et cron campagnes

## État actuel (projet `hbdnzajbyjakdhuavrvb`)

| Composant                                                                  | Statut                                                                     |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| RPC `setup_email_campaigns_cron_job`                                       | ✅ Appliquée                                                               |
| Cron `process-scheduled-email-campaigns`                                   | ✅ Toutes les 5 min → `process-scheduled-campaigns`                        |
| Cron `process-email-sequences`                                             | Via RPC `setup_email_sequences_cron_job` (\*/15)                           |
| Cron `abandoned-cart-recovery`                                             | Via RPC `setup_abandoned_cart_recovery_cron_job` (horaire)                 |
| Edge `resend-webhook-handler`                                              | ✅ Déployée (`--no-verify-jwt`, signature Svix Resend)                     |
| Edge `setup-email-infrastructure`                                          | ✅ Déployée                                                                |
| `RESEND_API_KEY` / `RESEND_WEBHOOK_SECRET` / `RESEND_FROM_EMAIL`           | ✅ Configurés (`noreply@mail.emarzona.com`)                                |
| `CRON_SECRET`                                                              | ✅ Configuré (pg_cron + en-tête `x-cron-secret`)                           |
| `process-email-sequences` / `abandoned-cart-recovery`                      | ✅ Protégés par `x-cron-secret` (`CRON_SECRET`)                            |
| Edge `send-notification-email`                                             | ✅ Notifications unifiées (canal email)                                    |
| Slugs templates `order-confirmation-digital` / `physical` / `welcome-user` | Migration `20260524170000`                                                 |
| Auth confirmation + SMTP Resend (`mail.emarzona.com`)                      | [CONFIGURATION_AUTH_EMAIL_RESEND.md](./CONFIGURATION_AUTH_EMAIL_RESEND.md) |
| Welcome post-confirmation (`send-welcome-email`)                           | Migration `20260524180000` + Edge `send-welcome-email`                     |

## 1. Secrets Supabase (obligatoire pour l’envoi)

```bash
npx supabase secrets set \
  RESEND_API_KEY=re_VOTRE_CLE \
  RESEND_WEBHOOK_SECRET=whsec_VOTRE_SECRET \
  RESEND_FROM_EMAIL=noreply@mail.emarzona.com \
  --project-ref hbdnzajbyjakdhuavrvb
```

Domaine d'envoi vérifié dans Resend : **`mail.emarzona.com`** (pas la racine `emarzona.com`). Le fallback code utilise `noreply@mail.emarzona.com` si `RESEND_FROM_EMAIL` est absent.

## 2. Webhook Resend

**Option A — automatique** (après `RESEND_API_KEY`) :

```bash
curl -X POST "https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/setup-email-infrastructure" \
  -H "Authorization: Bearer <JWT service_role eyJ...>" \
  -H "Content-Type: application/json" \
  -d "{}"
```

Si un webhook est créé, exécutez la commande `next_step` renvoyée pour enregistrer `RESEND_WEBHOOK_SECRET`.

**Option B — manuel** (dashboard Resend) :

- URL : `https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/resend-webhook-handler`
- Événements : `email.sent`, `email.delivered`, `email.opened`, `email.clicked`, `email.bounced`, `email.complained`
- Copier le **signing secret** (`whsec_...`) dans `RESEND_WEBHOOK_SECRET`

## 3. Crons email (campagnes, séquences, paniers abandonnés)

`setup-email-infrastructure` enregistre les trois jobs pg_cron (même `CRON_SECRET`) :

| Job                                 | Schedule       | Edge Function                 |
| ----------------------------------- | -------------- | ----------------------------- |
| `process-scheduled-email-campaigns` | `*/5 * * * *`  | `process-scheduled-campaigns` |
| `process-email-sequences`           | `*/15 * * * *` | `process-email-sequences`     |
| `abandoned-cart-recovery`           | `0 * * * *`    | `abandoned-cart-recovery`     |

Pour reconfigurer (Dashboard → SQL ou curl) :

```bash
curl -X POST "https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/setup-email-infrastructure" \
  -H "Authorization: Bearer <JWT service_role eyJ...>" \
  -H "Content-Type: application/json" \
  -d '{}'
```

`CRON_SECRET` est lu depuis les secrets Edge (ou passez `cron_secret` dans le body).

**Alternative SQL** (même secret que `CRON_SECRET` dans Supabase → Edge Secrets) :

```sql
-- 3e argument = clé anon (JWT eyJ..., Dashboard → API → anon public)
SELECT public.setup_email_campaigns_cron_job('hbdnzajbyjakdhuavrvb', '<CRON_SECRET>', '<ANON_JWT>');
SELECT public.setup_email_sequences_cron_job('hbdnzajbyjakdhuavrvb', '<CRON_SECRET>', '<ANON_JWT>');
SELECT public.setup_abandoned_cart_recovery_cron_job('hbdnzajbyjakdhuavrvb', '<CRON_SECRET>', '<ANON_JWT>');
```

> Utilisez le JWT **legacy** `eyJ...` (role `service_role`), pas la clé `sb_secret_...`, pour l’en-tête `Authorization` sur `setup-email-infrastructure`.

## 4. CRON_SECRET et jobs existants

`CRON_SECRET` a été régénéré (≥ 16 caractères). Les jobs pg_cron qui envoient un `x-cron-secret` **différent** (ex. payouts) doivent être alignés sur la même valeur ou mis à jour dans leur définition SQL.

## 5. Notifications email unifiées

Les emails du système `unified-notifications` passent par l’Edge Function **`send-notification-email`** (templates `notification_templates` + fallback HTML), puis **`send-email`** en interne.

## 6. Tests

1. Créer une campagne `scheduled` avec `scheduled_at` dans le passé.
2. Attendre 5 min ou appeler manuellement `process-scheduled-campaigns` avec `x-cron-secret: <CRON_SECRET>`.
3. Vérifier `email_logs` et les métriques campagne après ouverture/clic (webhook).
