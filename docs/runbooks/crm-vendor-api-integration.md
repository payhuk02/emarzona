# Runbook — Intégration CRM via API vendeur (E43)

Emarzona n’intègre pas nativement HubSpot/Salesforce. Les vendeurs Enterprise connectent leur CRM via **API REST v1** + webhooks.

## Prérequis

- Plan Enterprise ou accès API activé
- Clé API boutique : **Dashboard → Paramètres → Équipe → Clés API** (`StoreApiKeysPanel`)
- Runbook déploiement : [vendor-public-api-prod.md](./vendor-public-api-prod.md)

## Endpoints utiles CRM

| Ressource           | Méthode | Usage CRM                |
| ------------------- | ------- | ------------------------ |
| `/api/v1/orders`    | GET     | Sync commandes entrantes |
| `/api/v1/customers` | GET     | Sync contacts acheteurs  |
| `/api/v1/products`  | GET     | Catalogue produits       |

Base URL : `https://<project>.supabase.co/functions/v1/api-v1`

Header : `Authorization: Bearer <store_api_key>`

## Webhooks (temps réel)

Configurer dans **Dashboard → Webhooks** :

- `order.created` → créer deal/opportunity CRM
- `order.paid` → marquer deal gagné
- `customer.created` → créer contact

Voir Epic 4.7 dans `AUDIT_ENTERPRISE_EMARZONA.md`.

## Recettes courantes

### HubSpot (Zapier / Make)

1. Trigger webhook Emarzona `order.paid`
2. Action HubSpot : Create/Update Contact + Deal

### Salesforce (middleware)

1. Poll `GET /api/v1/orders?since=<iso>` toutes les 5 min
2. Upsert via Salesforce REST API (External ID = `order.id`)

## Vérification

```bash
npm run verify:enterprise-readiness
```

## SOC2

Exports audit : onglet **Audit SOC2** (Équipe boutique) ou `/admin/audit` plateforme.  
Runbook : [audit-logs-soc2-prod.md](./audit-logs-soc2-prod.md)
