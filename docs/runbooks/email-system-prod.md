# Runbook — Système email production (Phases 0–3)

Objectif : opérer le pipeline email Emarzona (Resend, campagnes, séquences, webhooks, conformité, archivage) avec **0 double-traitement**, **fail-closed compliance** et **rétention maîtrisée**.

## Architecture (vue d'ensemble)

```mermaid
flowchart LR
  subgraph send [Envoi]
    A[send-email] --> B[Resend API]
    C[send-email-campaign] --> B
    D[process-email-sequences] --> B
  end
  subgraph track [Tracking]
    B --> E[resend-webhook-handler]
    E --> F[email_logs]
    E --> G[email_webhook_events]
    E --> H[email_analytics_daily]
  end
  subgraph compliance [Conformité]
    I[/unsubscribe] --> J[email_unsubscribes]
    K[email-compliance-utils] --> A
  end
  subgraph ops [Ops]
    L[run_email_maintenance_batch] --> F
    L --> G
    M[platform-health] --> N[Resend probe]
  end
```

## Migrations requises (ordre)

```bash
npx supabase db query --linked -f supabase/migrations/20260704000000__phase0_emailing_hardening.sql
npx supabase db query --linked -f supabase/migrations/20260706190000__phase1_email_p0_hardening.sql
npx supabase db query --linked -f supabase/migrations/20260706200000__phase2_email_security.sql
npx supabase db query --linked -f supabase/migrations/20260706210000__phase3_email_webhook_idempotency.sql
npx supabase db query --linked -f supabase/migrations/20260706220000__phase3_email_archival_maintenance.sql
```

## Edge Functions à déployer

```bash
npx supabase functions deploy send-email --project-ref hbdnzajbyjakdhuavrvb
npx supabase functions deploy send-email-campaign --project-ref hbdnzajbyjakdhuavrvb
npx supabase functions deploy process-scheduled-campaigns --project-ref hbdnzajbyjakdhuavrvb
npx supabase functions deploy process-email-sequences --project-ref hbdnzajbyjakdhuavrvb
npx supabase functions deploy execute-email-workflow --project-ref hbdnzajbyjakdhuavrvb
npx supabase functions deploy resend-webhook-handler --project-ref hbdnzajbyjakdhuavrvb
npx supabase functions deploy process-nightly-maintenance --project-ref hbdnzajbyjakdhuavrvb
npx supabase functions deploy platform-health --project-ref hbdnzajbyjakdhuavrvb
```

## Secrets & variables d'environnement

| Variable                      | Usage                                     |
| ----------------------------- | ----------------------------------------- |
| `RESEND_API_KEY`              | Envoi + sonde health                      |
| `RESEND_WEBHOOK_SECRET`       | Vérification Svix (obligatoire prod)      |
| `ALLOW_LEGACY_RESEND_WEBHOOK` | `false` en prod (legacy header désactivé) |
| `CRON_SECRET`                 | Auth crons Edge Functions                 |
| `SLACK_WEBHOOK_URL`           | Alerte bounce rate > 5 %                  |

## Crons

| Job                         | Schedule              | Mécanisme                                                  |
| --------------------------- | --------------------- | ---------------------------------------------------------- |
| `email-maintenance-daily`   | `0 5 * * *` UTC       | SQL `run_email_maintenance_batch()`                        |
| `nightly-maintenance-batch` | `0 4 * * *` UTC       | Edge `process-nightly-maintenance` (+ `email-maintenance`) |
| Campagnes / séquences       | voir `20260524150000` | Edge + `x-cron-secret`                                     |
| `platform-health`           | toutes les 5 min      | `setup-platform-health-cron.ps1`                           |

### Réactiver le cron nightly (si besoin)

```powershell
$env:CRON_SECRET = '<secret>'
.\scripts\setup-nightly-maintenance-cron.ps1
```

### Maintenance email manuelle

```sql
SELECT public.run_email_maintenance_batch();
```

```bash
curl -X POST "https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/process-nightly-maintenance" \
  -H "Content-Type: application/json" \
  -H "x-cron-secret: $CRON_SECRET" \
  -d '{"jobs":["email-maintenance"]}'
```

## Politique de rétention `email_logs`

| Tier     | Âge       | Action                                                  |
| -------- | --------- | ------------------------------------------------------- |
| Chaud    | 90 jours  | Archive + purge logs **non engagés** (pas d'open/click) |
| Froid    | 730 jours | Archive + purge **tous** les logs restants              |
| Webhooks | 30 jours  | Purge `email_webhook_events`                            |
| Agrégats | permanent | `email_analytics_daily` (rollup avant purge)            |

Vérification post-maintenance :

```sql
SELECT COUNT(*) AS hot_logs FROM email_logs;
SELECT COUNT(*) AS archived FROM email_logs_archive;
SELECT MAX(archived_at) AS last_archive FROM email_logs_archive;
```

## Idempotence webhooks Resend

| Couche | Mécanisme                                                             |
| ------ | --------------------------------------------------------------------- |
| DB     | `email_webhook_events.dedup_key` PK                                   |
| RPC    | `claim_email_webhook_event` → `false` si replay                       |
| Edge   | `resend-webhook-handler` → `{ processed, skipped_duplicates, total }` |

### Test replay (staging / prod)

1. Resend Dashboard → Webhooks → **Replay** un événement
2. Réponse attendue : `skipped_duplicates: 1`, `processed: 0`
3. SQL :

```sql
SELECT dedup_key, event_type, processed_at
FROM email_webhook_events
ORDER BY processed_at DESC
LIMIT 20;
```

Voir aussi : `docs/runbooks/webhook-idempotency-replay-staging.md` (paiements).

## Enrollments invités (séquences post-checkout)

### Prérequis migration

```bash
npx supabase db query --linked -f supabase/migrations/20260706230000__guest_sequence_enrollment.sql
```

### Configuration vendeur

1. Créer une séquence **Active** avec déclencheur **Événement** → `order.paid` (ou `order.completed`)
2. Ajouter au moins une étape avec template + délai
3. Option filtre JSON : `{ "guest_only": true }` pour cibler uniquement les invités

### Flux automatique

```
Paiement confirmé → runPostOrderPaymentFulfillment
  → triggerSequenceEnrollmentsForEvent(order.paid)
  → enroll_store_email_in_sequence (user_id OU recipient_email)
  → process-email-sequences (cron) envoie les étapes
```

### Vérification SQL

```sql
SELECT e.id, e.recipient_email, e.user_id, e.status, e.context, s.name
FROM email_sequence_enrollments e
JOIN email_sequences s ON s.id = e.sequence_id
WHERE e.context->>'order_id' = '<order_uuid>';
```

### Tests CI

```bash
npx deno test --allow-env --config supabase/functions/deno.json \
  supabase/functions/_shared/__tests__/sequence-enrollment-utils.test.ts
```

---

## Conformité & désabonnement

- Page publique : `https://www.emarzona.com/unsubscribe?email=...&type=marketing`
- i18n : EN, FR, ES, DE, PT (`emails.unsubscribe.*`)
- Marketing fail-closed : `email-compliance-utils.ts` bloque si désabonné
- Plain-text obligatoire sur emails marketing (`resend-send-utils.ts`)

### Vérifier un désabonnement

```sql
SELECT * FROM email_unsubscribes
WHERE lower(email) = lower('client@example.com')
ORDER BY unsubscribed_at DESC;
```

## Monitoring & incidents

### Health check Resend

- Sonde : `platform-health` → service `resend`
- Page status : `https://www.emarzona.com/status`

```powershell
.\scripts\setup-platform-health-cron.ps1
```

### Alerte bounce rate

Déclenchée dans `resend-webhook-handler` si > 5 % sur 24 h (min. 50 emails).
Vérifier `email_logs` avec `status = 'alert'` et `metadata->>'alert_type' = 'bounce_rate'`.

### Diagnostics rapides

```sql
-- Échecs récents
SELECT status, COUNT(*) FROM email_logs
WHERE created_at > now() - interval '24 hours'
GROUP BY status;

-- Campagnes bloquées
SELECT id, name, status, scheduled_at FROM email_campaigns
WHERE status IN ('scheduled', 'sending')
ORDER BY scheduled_at DESC LIMIT 10;

-- Doublons webhook (normal = 0 re-traitement)
SELECT COUNT(*) FROM email_webhook_events
WHERE processed_at > now() - interval '1 hour';
```

## Tests CI

```bash
# Unit Deno (webhook utils)
npx deno test --allow-env --config supabase/functions/deno.json \
  supabase/functions/_shared/__tests__/resend-webhook-utils.test.ts

# E2E email
npm run test:e2e:email
```

## Critères go / no-go prod

| #   | Test                                  | Attendu                                      |
| --- | ------------------------------------- | -------------------------------------------- |
| 1   | Replay webhook Resend                 | `skipped_duplicates >= 1`                    |
| 2   | `run_email_maintenance_batch()`       | `success: true`, pas d'erreur SQL            |
| 3   | Envoi campagne test                   | `email_logs.status` progresse via webhook    |
| 4   | Désabonnement `/unsubscribe` ES/DE/PT | UI traduite + RPC `record_email_unsubscribe` |
| 5   | `platform-health` POST                | `resend` = `operational`                     |
| 6   | Marketing à un désabonné              | bloqué (fail-closed)                         |

## Rollback

| Composant          | Action                                                                    |
| ------------------ | ------------------------------------------------------------------------- |
| Webhook idempotent | Pas de rollback — les replays sont ignorés (souhaité)                     |
| Archivage          | Données dans `email_logs_archive` — restaurer via INSERT SELECT si besoin |
| Cron maintenance   | `SELECT cron.unschedule('email-maintenance-daily');`                      |
| Legacy webhook     | **Ne pas** activer `ALLOW_LEGACY_RESEND_WEBHOOK=true` en prod             |

## Contacts & références

- Resend status : https://resend.com/status
- Dashboard Supabase Functions : projet `hbdnzajbyjakdhuavrvb`
- Scripts cron : `scripts/setup-platform-health-cron.ps1`, `scripts/setup-nightly-maintenance-cron.ps1`
