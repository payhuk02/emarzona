# Configuration email — Resend, webhooks et cron campagnes

## État actuel (projet `hbdnzajbyjakdhuavrvb`)

| Composant                                  | Statut                                              |
| ------------------------------------------ | --------------------------------------------------- |
| RPC `setup_email_campaigns_cron_job`       | ✅ Appliquée                                        |
| Cron `process-scheduled-email-campaigns`   | ✅ Toutes les 5 min → `process-scheduled-campaigns` |
| Edge `resend-webhook-handler`              | ✅ Déployée (vérif. Svix + fallback test)           |
| Edge `setup-email-infrastructure`          | ✅ Déployée                                         |
| `RESEND_API_KEY` / `RESEND_WEBHOOK_SECRET` | ❌ À configurer                                     |

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

## 3. Cron campagnes programmées

Déjà configuré via `setup-email-infrastructure`. Pour reconfigurer :

```bash
curl -X POST ".../setup-email-infrastructure" \
  -H "Authorization: Bearer <JWT service_role>" \
  -H "Content-Type: application/json" \
  -d '{"cron_secret":"<valeur de CRON_SECRET>"}'
```

> Utilisez le JWT **legacy** `eyJ...` (role `service_role`), pas la clé `sb_secret_...`, pour l’en-tête `Authorization`.

## 4. CRON_SECRET et jobs existants

`CRON_SECRET` a été régénéré (≥ 16 caractères). Les jobs pg_cron qui envoient un `x-cron-secret` **différent** (ex. payouts) doivent être alignés sur la même valeur ou mis à jour dans leur définition SQL.

## 5. Tests

1. Créer une campagne `scheduled` avec `scheduled_at` dans le passé.
2. Attendre 5 min ou appeler manuellement `process-scheduled-campaigns` avec `x-cron-secret: <CRON_SECRET>`.
3. Vérifier `email_logs` et les métriques campagne après ouverture/clic (webhook).
