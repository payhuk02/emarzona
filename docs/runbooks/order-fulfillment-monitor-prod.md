# Runbook — Monitoring fulfillment post-paiement (E49 P0)

Objectif : détecter les commandes **payées** dont le fulfillment (licences, stock, inscriptions, edge) dépasse **5 minutes**, enregistrer des alertes admin et alimenter le SLA `/status`.

## Prérequis

| Secret / variable           | Où                                                 |
| --------------------------- | -------------------------------------------------- |
| `CRON_SECRET`               | Supabase Edge Functions + GitHub Actions           |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge `process-order-fulfillment-monitor`           |
| `EDGE_INTERNAL_SECRET`      | Retry fulfillment edge (certificats artiste, etc.) |
| `FULFILLMENT_SLA_MINUTES`   | Optionnel (défaut `5`)                             |

## 1. Migrations

```bash
supabase db push
# 20260618130000__e49_order_fulfillment_monitoring.sql
# 20260618140000__e49_fulfillment_alerts_admin_access.sql
# 20260623180000__e49_fulfillment_monitor_ops.sql
```

## 2. Deploy edge function

```bash
supabase functions deploy process-order-fulfillment-monitor --project-ref hbdnzajbyjakdhuavrvb
```

## 3. Activer le cron (pg_cron, \*/5 min)

```powershell
# Tous les crons (recommandé après rotation secret)
.\scripts\rotate-cron-secret.ps1 -GenerateNew -SyncGitHub

# Ou job seul
.\scripts\setup-fulfillment-monitor-cron.ps1
```

Secours GitHub Actions : `.github/workflows/fulfillment-monitor-cron.yml`

## 4. Vérification staging / prod

```bash
npm run verify:fulfillment-monitor
```

```powershell
.\scripts\smoke-fulfillment-monitor.ps1
```

Critères go :

| #   | Critère                              | Cible                               |
| --- | ------------------------------------ | ----------------------------------- |
| 1   | RPC `detect_stale_order_fulfillment` | Retourne `stale_count` + `orders[]` |
| 2   | Edge smoke                           | HTTP 200, `success: true`           |
| 3   | SLA `/status`                        | Service `fulfillment` présent       |
| 4   | Panneau admin                        | `/admin/fulfillment-alerts` charge  |

## 5. Panneau admin

- URL : `/admin/fulfillment-alerts`
- **Actualiser** : scan SLA live (`admin_detect_stale_order_fulfillment`)
- **Lancer le monitor** : sweep SQL (alertes + auto-résolution + SLA) — le cron edge gère en plus les **retries** fulfillment

## 6. Types d’alertes

| Code                             | Signification                  |
| -------------------------------- | ------------------------------ |
| `edge_fulfillment_pending`       | Post-paiement edge non exécuté |
| `confirmation_email_pending`     | Email confirmation absent      |
| `digital_license_missing`        | Licence inactive / absente     |
| `physical_inventory_uncommitted` | Stock réservé non déduit       |
| `course_enrollment_missing`      | Pas d’inscription cours        |
| `service_booking_pending`        | Réservation encore `pending`   |
| `artist_certificate_missing`     | Certificat requis absent       |

## 7. SLA sur `/status`

| `stale_count` | Statut SLA  |
| ------------- | ----------- |
| 0             | operational |
| 1–3           | degraded    |
| > 3           | outage      |

## 8. Rollback cron

```sql
SELECT cron.unschedule('order-fulfillment-monitor');
```

## 9. KPI Phase 0

- Fulfillment post-paid **< 5 min** sur ≥ 99 % des commandes (fenêtre 7 jours)
- 0 alertes **critiques** ouvertes > 1 h en prod
- Cron actif : `SELECT jobname, active FROM cron.job WHERE jobname = 'order-fulfillment-monitor';`
