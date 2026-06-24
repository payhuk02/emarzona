# process-order-fulfillment-monitor

Cron P0 — détecte les commandes payées dont le fulfillment dépasse le SLA (défaut **5 min**).

## Flux

1. `detect_stale_order_fulfillment` — scan SQL (7 verticaux)
2. `record_order_fulfillment_alert` — alertes admin (déduplication 1 h)
3. Retry `runPostOrderPaymentFulfillment` si `edge_fulfillment_pending`
4. `auto_resolve_fulfilled_order_alerts` — clôture alertes réparées
5. `record_platform_sla_check` — service `fulfillment` sur `/status`

## Secrets

| Variable                    | Description                                         |
| --------------------------- | --------------------------------------------------- |
| `CRON_SECRET`               | Header `x-cron-secret`                              |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin client                                        |
| `EDGE_INTERNAL_SECRET`      | Retry certificats artiste (via fulfillment partagé) |
| `FULFILLMENT_SLA_MINUTES`   | Optionnel (défaut `5`)                              |

## Planification

```powershell
.\scripts\setup-fulfillment-monitor-cron.ps1
# ou tous les crons :
.\scripts\rotate-cron-secret.ps1 -GenerateNew -SyncGitHub
```

Secours : `.github/workflows/fulfillment-monitor-cron.yml`

## Vérification

```bash
npm run verify:fulfillment-monitor
```

```powershell
.\scripts\smoke-fulfillment-monitor.ps1
```

Runbook complet : [`docs/runbooks/order-fulfillment-monitor-prod.md`](../../../docs/runbooks/order-fulfillment-monitor-prod.md)

## Admin UI

- `/admin/fulfillment-alerts` — scan live + sweep SQL (`admin_run_fulfillment_monitor_sweep`)
- `/status` — SLA service `fulfillment`
