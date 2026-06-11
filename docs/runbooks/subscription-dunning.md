# Runbook — Dunning abonnement produits physiques

## Vue d'ensemble

Le cycle de facturation vendeur physique (Epic 2.1) s'appuie sur :

| Composant                                       | Rôle                                                           |
| ----------------------------------------------- | -------------------------------------------------------------- |
| `run_physical_subscription_billing_sql_phase()` | Lifecycle `past_due` → `expired` + notifications in-app        |
| `process-subscription-dunning-emails`           | Emails J-7, J-1, J+1 (past_due), J+3, J+7, expired, auto-renew |
| `process-subscription-renewals`                 | Checkout Moneroo pré-rempli (mandate)                          |
| `moneroo-webhook`                               | Activation / renouvellement / changement de plan               |

## Séquence dunning email

| Étape      | Type         | Condition                                  | Template                           |
| ---------- | ------------ | ------------------------------------------ | ---------------------------------- |
| J-7        | `j-7`        | 7 j avant échéance, status active/trialing | `subscription_renewal_reminder`    |
| J-1        | `j-1`        | 1 j avant échéance                         | `subscription_renewal_j1`          |
| J+1        | `past_due`   | Grace jour 1                               | `subscription_past_due`            |
| J+3        | `j+3`        | Grace jour 3                               | `subscription_grace_j3`            |
| J+7        | `j+7`        | Dernier jour de grâce                      | `subscription_grace_j7`            |
| Expired    | `expired`    | J+8 (produits suspendus)                   | `subscription_expired`             |
| Auto-renew | `auto_renew` | Checkout Moneroo prêt                      | `subscription_auto_renew_checkout` |

Flags metadata : `dunning_*_email = 'sent'`. Réinitialisés à `'paid'` via `mark_subscription_invoice_paid`.

## Cron prod (setup initial)

Exécuter **une fois** en prod avec secrets réels :

```sql
SELECT public.setup_physical_subscription_billing_cron_jobs(
  '<project_ref>',
  '<CRON_SECRET>',
  '<SUPABASE_ANON_KEY>'
);
```

Jobs créés (UTC) :

- **06:00** — phase SQL lifecycle + dunning in-app
- **06:10** — emails dunning (`process-subscription-dunning-emails`)
- **06:15** — auto-renewal checkout (`process-subscription-renewals`)

## Variables d'environnement requises

| Variable               | Edge Function                              |
| ---------------------- | ------------------------------------------ |
| `CRON_SECRET`          | Toutes les crons                           |
| `EDGE_INTERNAL_SECRET` | `send-notification-email` (invoke interne) |
| `MONEROO_API_KEY`      | `process-subscription-renewals`, `moneroo` |
| `SITE_URL`             | Liens facturation dans emails              |

## Incident : emails dunning non envoyés

1. Vérifier logs Edge `process-subscription-dunning-emails`
2. Tester RPC :
   ```sql
   SELECT public.list_subscription_dunning_email_targets();
   ```
3. Vérifier cron actif :
   ```sql
   SELECT jobname, schedule, active FROM cron.job
   WHERE jobname LIKE 'physical-subscription%';
   ```
4. Vérifier templates actifs :
   ```sql
   SELECT slug, is_active FROM notification_templates
   WHERE slug LIKE 'subscription_%';
   ```

## Incident : renouvellement auto non déclenché

1. Vérifier mandate :
   ```sql
   SELECT auto_renew_enabled, customer_email, last_successful_at
   FROM subscription_billing_mandates WHERE store_id = '<store_id>';
   ```
2. Vérifier `list_subscriptions_for_auto_renewal()` retourne la subscription
3. Logs `process-subscription-renewals` — checkout URL généré ?
4. Webhook Moneroo reçu ? Vérifier `subscription_invoices.status`

## Incident : produits suspendus à tort

1. Statut subscription :
   ```sql
   SELECT status, current_period_end, metadata
   FROM store_platform_subscriptions WHERE store_id = '<store_id>';
   ```
2. Si paiement reçu mais statut incorrect → webhook manqué :
   - Relancer manuellement `mark_subscription_invoice_paid(invoice_id, ...)`
   - Réactiver produits :
     ```sql
     UPDATE products SET is_active = true
     WHERE store_id = '<store_id>' AND product_type = 'physical'
       AND metadata->>'suspended_reason' = 'physical_subscription_expired';
     ```

## Rollback feature

Désactiver crons sans migration :

```sql
SELECT cron.unschedule('physical-subscription-dunning-emails');
SELECT cron.unschedule('physical-subscription-auto-renewal');
SELECT cron.unschedule('physical-subscription-billing-sql');
```

Les vendeurs peuvent toujours renouveler manuellement via `/dashboard/billing/physical`.

## KPI Gate P1

- Rétention MRR post-trial ≥ 75 %
- 0 écart réconciliation non expliqué (voir `docs/FINANCIAL_RECONCILIATION.md` — à créer Epic 2.3.6)
- Dunning : aucun `past_due` > 7 j sans passage `expired` (lifecycle daily)
