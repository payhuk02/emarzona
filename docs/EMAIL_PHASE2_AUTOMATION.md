# Email Phase 2 — Automation & segmentation

## Déploiement requis

1. Appliquer la migration `20260526120000__email_phase2_workflow_enrollment.sql`
2. Déployer les Edge Functions :
   - `execute-email-workflow`
   - `trigger-email-workflows`
   - Toute fonction utilisant `post-order-payment-fulfillment` (webhooks paiement)

## Workflows automatiques

### Événements déclenchés automatiquement

| Événement         | Source                                          |
| ----------------- | ----------------------------------------------- |
| `order.paid`      | `runPostOrderPaymentFulfillment` après paiement |
| `order.completed` | Idem (alias pour workflows existants)           |

### Configuration UI

- Déclencheur **Événement** : liste (`order.paid`, `customer.created`, etc.)
- Action **Envoyer un email** : sélection du template marketing + sujet optionnel
- Action **Attendre** : durée en **minutes** (convertie en secondes côté Edge, max 10 s en serverless)

### API manuelle

```json
POST /functions/v1/trigger-email-workflows
{
  "store_id": "uuid",
  "event": "customer.created",
  "context": { "email": "...", "customer_id": "...", "user_id": "..." }
}
```

Auth : service role, `x-internal-secret`, ou `x-cron-secret`.

## Séquences — inscriptions

Onglet **Inscriptions** sur une séquence : inscrire un contact par email via `resolve_user_id_for_store_email`.

## Segments dynamiques

Critères UI : tags, clients ayant commandé, min commandes, min montant dépensé.  
Calcul SQL basé sur les **clients de la boutique** (`customers`), pas uniquement `auth.users`.
