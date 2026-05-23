# ADR-001 : Stripe Connect — Destination Charge et commission plateforme

**Date** : 2026-05-23  
**Statut** : Accepté  
**Décideurs** : Lead Platform  
**Contexte** : [PAYMENT_ORCHESTRATION_IMPLEMENTATION_PLAN.md](../PAYMENT_ORCHESTRATION_IMPLEMENTATION_PLAN.md)

## Contexte

Emarzona doit permettre aux vendeurs de connecter **leur** compte Stripe (Connect) tout en prélevant une **commission plateforme** sur chaque vente, sans détenir les fonds comme unique merchant of record.

Alternatives Stripe :

| Modèle                           | Description                                                                                                      |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Destination Charge**           | Charge sur le compte plateforme, transfert immédiat au connected account, `application_fee_amount` pour Emarzona |
| **Separate Charge and Transfer** | Charge + transfer différé — plus flexible, plus complexe                                                         |
| **Direct Charge**                | Charge sur le compte connecté — moins de contrôle plateforme sur le flux                                         |

## Décision

Nous adoptons **Stripe Connect Express** avec **Destination Charge** pour les checkouts one-time (phase 2) :

```text
Checkout Session (compte plateforme)
  payment_intent_data[transfer_data][destination] = acct_connected
  payment_intent_data[application_fee_amount]    = floor(amount * platform_fee_percent)
```

- **Onboarding** : Express (OAuth), pas de saisie de `sk_live` par le vendeur.
- **Merchant of record** : vendeur (connected account) pour la partie nette ; Emarzona perçoit la commission.
- **Webhooks** : événements écoutés sur le compte **plateforme** (`checkout.session.completed`, `account.updated`).

## Conséquences

### Positives

- Commission automatique sans reversement manuel.
- Expérience vendeur alignée Shopify / Gumroad.
- Compatible avec les 5 verticaux (même `PaymentOrchestrator`).

### Négatives / contraintes

- Obligation d'approbation **Stripe Connect** plateforme (conformité marketplace).
- Gestion des comptes `restricted` / `requirements.past_due` (UI vendeur requise).
- Remboursements : politique à documenter (rembourser depuis connected account, fee reversée selon règles Stripe).

## Hors scope ADR-001

- Stripe Billing / abonnements → ADR futur (phase 4).
- Direct Charge pour vendeurs Enterprise → réévaluation si besoin B2B.

## Références

- [Stripe Connect — Destination charges](https://docs.stripe.com/connect/destination-charges)
- [Collect application fees](https://docs.stripe.com/connect/direct-charges#collect-fees)
