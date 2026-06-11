# ADR-004 — Matrice de routage paiements V2

**Date :** 2026-06-11  
**Statut :** Accepté  
**Epic :** 2.2.2, 2.2.5, 2.2.6

## Décisions

| PSP                | Devises                                     | Priorité | Statut                         |
| ------------------ | ------------------------------------------- | -------- | ------------------------------ |
| Stripe Connect     | USD, EUR, GBP, CAD, AUD, CHF, JPY, MAD, NGN | 1        | Actif                          |
| PayPal Commerce    | USD, EUR, GBP, CAD, AUD, CHF, JPY           | 2        | Actif                          |
| Moneroo plateforme | XOF, XAF (+ fallback)                       | 3        | Actif                          |
| Flutterwave        | —                                           | —        | **Retiré** (phase 4+)          |
| Paystack           | —                                           | —        | **Retiré** (jamais implémenté) |

## Règles

1. **XOF / XAF** → Moneroo uniquement (pas Stripe ni PayPal checkout).
2. **Flutterwave** retiré du resolver, RPC `get_store_payment_options` et UI checkout.
3. **Fallback Moneroo** : notification acheteur obligatoire (toast Epic 2.2.7).
4. **Rollout canary** : `VITE_PAYMENT_ORCHESTRATION_V2_ROLLOUT=10|50|100` (hash déterministe par `storeId`).

## Rollback

`VITE_PAYMENT_ORCHESTRATION_V2=false` → legacy Moneroo seul.
