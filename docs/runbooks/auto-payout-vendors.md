# Runbook — Suggestions de retrait vendeur (auto-payout-vendors)

**Epic 2.4** · Dernière mise à jour : 2026-06-11

## Ce que fait (et ne fait pas) le système

| Fait                                           | Ne fait pas                                 |
| ---------------------------------------------- | ------------------------------------------- |
| Crée une ligne `store_withdrawals` **pending** | Virement Moneroo / Mobile Money automatique |
| `withdrawal_source = auto_payout_suggested`    | Débit du solde sans validation admin        |
| Respecte seuil + délai configurés              | Paiement instantané au vendeur              |

**Transparence vendeur** : bannière sur `/dashboard/withdrawals` + badge « Suggéré par le système ».

## Configuration admin

**Page** : `/admin/commission-settings` → onglet Retraits → « Suggestions de retrait vendeur »

| Paramètre    | Défaut  | Description                       |
| ------------ | ------- | --------------------------------- |
| `enabled`    | `false` | Active le cron                    |
| `delay_days` | `7`     | Jours depuis dernier calcul solde |
| `min_amount` | `50000` | Seuil XOF `available_balance`     |

RPC : `update_auto_payout_vendor_config(enabled, delay_days, min_amount)`

## Cron

- Job : `auto-payout-vendors-daily` (03:00 UTC)
- Edge : `auto-payout-vendors` — header `x-cron-secret`

```bash
curl -X POST "$SUPABASE_URL/functions/v1/auto-payout-vendors" \
  -H "x-cron-secret: $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Workflow admin

1. Vendeur voit une demande **En attente** (badge suggestion système)
2. Admin : `/admin/store-withdrawals` → approuver → compléter avec référence de virement
3. Stores avec `store_earnings.withdrawals_blocked = true` (litige) sont exclus

## Rollback

```sql
SELECT public.update_auto_payout_vendor_config(false, 7, 50000);
```

## Monitoring

- Logs Edge : `auto-payout-vendors`
- Compteur quotidien : `successful` / `failed` dans la réponse JSON du cron
