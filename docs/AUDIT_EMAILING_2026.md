# Audit emailing Emarzona — Rapport consolidé (Phases 0–3)

**Date de consolidation :** 2026-07-07  
**Statut global :** ✅ Production-ready (P0/P1/P2/P3 livrés + enrollments invités)  
**Runbook ops :** [email-system-prod.md](./runbooks/email-system-prod.md)

---

## 1. Synthèse exécutive

| Domaine                    | Avant audit                    | Après remédiation                              |
| -------------------------- | ------------------------------ | ---------------------------------------------- |
| Sécurité campagnes / crons | Auth absente, RLS permissif    | Fail-closed, `x-cron-secret`, RLS durci        |
| Webhooks Resend            | Double-traitement possible     | Idempotence Svix + `email_webhook_events`      |
| Conformité marketing       | Fail-open partiel              | Fail-closed + plain-text + i18n EN/FR/ES/DE/PT |
| Rétention logs             | Croissance illimitée           | Archivage tiered 90j/730j + cron maintenance   |
| Séquences invités          | Bloquées (user_id obligatoire) | `recipient_email` + post-checkout auto         |
| Observabilité              | Partielle                      | Health Resend, runbook, smoke SQL, tests CI    |

---

## 2. Phases livrées

### Phase 0 — Hardening base

- Migration `20260704000000__phase0_emailing_hardening.sql`
- Colonnes `provider_message_id`, `status`, sync triggers
- Tests E2E `email-phase0-hardening.spec.ts`

### Phase 1 — P0 production

- Commit `7bfac70` — orchestration batches campagne, auth crons, RLS INSERT retiré
- `send-unified-notification` → proxy sécurisé
- Désabonnement panier abandonné

### Phase 2 — Sécurité & conformité

- Commits `a2636cd`, `873f43d`
- Compliance fail-closed, séquences désabonnés, legacy webhook gated
- i18n désabonnement EN/FR

### Phase 3 — Idempotence & ops

- Commit `bde282b` — webhooks idempotents, tests Deno, CI
- Commit `4f2c0fa` — archivage `email_logs`, runbook, i18n ES/DE/PT
- Commit `298e425` — enrollments invités séquences

---

## 3. Architecture cible (état actuel)

```
Envoi: send-email | send-email-campaign | process-email-sequences
         ↓ Resend API
Tracking: resend-webhook-handler → email_logs + email_analytics_daily
Idempotence: email_webhook_events (claim_email_webhook_event)
Conformité: email-compliance-utils + email_unsubscribes + /unsubscribe
Post-checkout: post-order-payment-fulfillment → triggerSequenceEnrollmentsForEvent
Maintenance: run_email_maintenance_batch (cron 05:00 UTC)
Health: platform-health → sonde Resend
```

---

## 4. Matrice risques résiduels

| Risque                                            | Sévérité | Mitigation                               | Backlog                   |
| ------------------------------------------------- | -------- | ---------------------------------------- | ------------------------- |
| Replay webhook sans svix-id                       | Faible   | `ALLOW_LEGACY_RESEND_WEBHOOK=false` prod | —                         |
| Séquences sans `event_name`                       | Moyen    | UI WorkflowTriggerEditor sur séquences   | Doc vendeur               |
| `auth.users` shadow pour invités                  | N/A      | Évité — modèle `recipient_email`         | —                         |
| Volume `email_logs`                               | Faible   | Archivage + agrégats daily               | Partitioning si >10M rows |
| Enrollments doublons order.paid + order.completed | Faible   | Idempotence RPC enrollment               | Filtrer un seul event     |

---

## 5. Checklist vérification 100%

### Automatisé (CI)

```bash
# Deno — webhooks + séquences invités
npx deno test --allow-env --config supabase/functions/deno.json \
  supabase/functions/_shared/__tests__/resend-webhook-utils.test.ts \
  supabase/functions/_shared/__tests__/sequence-enrollment-utils.test.ts \
  supabase/functions/_shared/__tests__/sequence-enrollment-integration.test.ts

# E2E email
npm run test:e2e:email
```

### Production (SQL)

```bash
npx supabase db query --linked -f supabase/scripts/email-audit-smoke-verify.sql
```

### Manuel go-live

| #   | Test                                    | Attendu                                               |
| --- | --------------------------------------- | ----------------------------------------------------- |
| 1   | Replay webhook Resend                   | `skipped_duplicates: 1`                               |
| 2   | Commande invité + séquence `order.paid` | enrollment `recipient_email` + `guest_checkout: true` |
| 3   | `/unsubscribe?lang=es`                  | UI traduite                                           |
| 4   | `SELECT run_email_maintenance_batch()`  | `success: true`                                       |
| 5   | `/status`                               | service `resend` operational                          |
| 6   | Marketing à désabonné                   | bloqué                                                |

---

## 6. Migrations (ordre déploiement)

1. `20260704000000__phase0_emailing_hardening.sql`
2. `20260706190000__phase1_email_p0_hardening.sql`
3. `20260706200000__phase2_email_security.sql`
4. `20260706210000__phase3_email_webhook_idempotency.sql`
5. `20260706220000__phase3_email_archival_maintenance.sql`
6. `20260706230000__guest_sequence_enrollment.sql`

---

## 7. Edge Functions critiques

| Function                                                        | Rôle                                |
| --------------------------------------------------------------- | ----------------------------------- |
| `send-email`                                                    | Transactionnel + marketing unitaire |
| `send-email-campaign`                                           | Campagnes batch                     |
| `process-scheduled-campaigns`                                   | Cron campagnes                      |
| `process-email-sequences`                                       | Cron drip sequences                 |
| `resend-webhook-handler`                                        | Analytics + idempotence             |
| `process-nightly-maintenance`                                   | Cleanup + email-maintenance         |
| `platform-health`                                               | SLA + Resend                        |
| `stripe-connect-webhook` / `moneroo-webhook` / `paypal-webhook` | Post-checkout enrollment            |

---

## 8. Commits de référence

| Commit    | Description                        |
| --------- | ---------------------------------- |
| `7bfac70` | Phase 1 P0                         |
| `a2636cd` | Phase 2 sécurité                   |
| `bde282b` | Phase 3 idempotence webhooks       |
| `4f2c0fa` | Phase 3 archivage + runbook + i18n |
| `298e425` | Enrollments invités séquences      |

---

## 9. Prochaines améliorations (P4 — optionnel)

- E2E checkout réel sandbox Stripe → enrollment (sans mocks)
- Action workflow `enroll_sequence`
- Partitioning `email_logs` si volume > seuil
- Dashboard métriques bounce/spam temps réel
- A/B test séquences post-achat

---

_Document maintenu avec le runbook [email-system-prod.md](./runbooks/email-system-prod.md)._
