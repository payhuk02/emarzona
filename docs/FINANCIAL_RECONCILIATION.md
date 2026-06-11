# Réconciliation financière Moneroo (Epic 2.3.6)

## Objectif

Détecter quotidiennement les écarts entre la base PostgreSQL (source of truth) et l'API Moneroo pour les paiements `moneroo` / `moneroo_platform`.

**KPI Gate P1 :** 0 écart > 1 XOF non expliqué.

## Architecture

| Composant                                        | Rôle                              |
| ------------------------------------------------ | --------------------------------- |
| `moneroo-reconciliation-cron`                    | Edge Function — compare API vs DB |
| `moneroo_reconciliation_runs`                    | Historique des exécutions         |
| `moneroo_reconciliation_mismatches`              | Écarts non résolus                |
| `list_moneroo_transactions_for_reconciliation()` | Cibles des 48 dernières heures    |
| `setup_moneroo_reconciliation_cron_job()`        | Planification pg_cron (07:00 UTC) |

## Setup prod (une fois)

```sql
SELECT public.setup_moneroo_reconciliation_cron_job(
  'hbdnzajbyjakdhuavrvb',
  '<CRON_SECRET>',
  '<SUPABASE_ANON_KEY>'
);
```

Secrets Edge requis : `MONEROO_API_KEY`, `CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`.

## Remboursements partiels (Epic 2.3.1–2.3.2)

- Colonne `refunded_amount` sur `transactions` et `orders`
- Statuts : `partially_refunded` / `refunded`
- RPC canonique : `apply_transaction_refund(transaction_id, amount, ...)`
- Révocation digitale : `revoke_digital_access_for_order(order_id, refund_ratio)`
  - ratio < 100 % → metadata licence (accès conservé)
  - ratio ≥ 100 % → révocation complète

## Gel wallet litiges (Epic 2.3.7)

- `store_earnings.withdrawals_blocked = true` si litige ouvert sur la boutique
- `auto-payout-vendors` exclut les stores bloqués

## Investigation écart

```sql
-- Derniers écarts non résolus
SELECT m.*, t.amount, t.status
FROM moneroo_reconciliation_mismatches m
LEFT JOIN transactions t ON t.id = m.transaction_id
WHERE m.resolved = false
ORDER BY m.created_at DESC
LIMIT 20;

-- Dernière exécution
SELECT * FROM moneroo_reconciliation_runs
ORDER BY started_at DESC LIMIT 5;
```

## Résolution manuelle

1. Confirmer le statut réel chez Moneroo (dashboard ou API)
2. Si DB incorrecte → corriger via admin ou `apply_transaction_refund` / webhook replay
3. Marquer résolu :

```sql
UPDATE moneroo_reconciliation_mismatches
SET resolved = true
WHERE id = '<mismatch_id>';
```

## Tests SQL

- `tests/financial/partial-refund-wallet.test.sql`
- `tests/financial/subscription-proration.test.sql`
