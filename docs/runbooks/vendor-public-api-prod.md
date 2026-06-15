# Runbook — API REST vendeurs (Epic 4.6)

## Objectif

API REST Bearer (`/functions/v1/api-v1`) pour intégrer ERP/CRM : produits, commandes, clients, analytics, export.

## Prérequis

| Item          | Détail                                      |
| ------------- | ------------------------------------------- |
| Plan boutique | `physical_standard` minimum (`api.public`)  |
| Migration     | `20260614300000__e43_vendor_public_api.sql` |
| Edge function | `api/v1` déployée                           |

## Déploiement

```bash
npx supabase db query --linked -f supabase/migrations/20260614300000__e43_vendor_public_api.sql
npx supabase migration repair --status applied 20260614300000
npx supabase functions deploy api-v1 --project-ref hbdnzajbyjakdhuavrvb
```

## Création clé API (vendeur)

1. **Dashboard → Intégrations → onglet API REST**
2. Créer une clé (affichée une seule fois)
3. Copier le secret `pk_live_…`

## Authentification

```http
GET https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/api-v1/me
Authorization: Bearer pk_live_xxxxxxxx
```

## Endpoints

| Méthode             | Chemin                  | Permission                   |
| ------------------- | ----------------------- | ---------------------------- |
| GET                 | `/me`                   | —                            |
| GET/POST/PUT/DELETE | `/products`             | `products:read/write/delete` |
| GET/POST            | `/orders`               | `orders:read/write`          |
| GET/POST            | `/customers`            | `customers:read/write`       |
| GET                 | `/analytics?days=30`    | `analytics:read`             |
| GET                 | `/export?type=products` | `export:read`                |
| GET/POST/DELETE     | `/webhooks`             | `webhooks:read/write`        |

Permissions JSON exemple :

```json
{
  "products:read": true,
  "orders:read": true,
  "customers:read": true,
  "analytics:read": true,
  "webhooks:read": true,
  "webhooks:write": true
}
```

## Supervision

- Admin plateforme : `/admin/api-keys`
- Logs requêtes : table `api_request_logs`
- Révocation : toggle dans le panneau vendeur ou admin

## Vérification

```bash
npx supabase db query --linked -f tests/financial/e43-vendor-public-api.test.sql
curl -H "Authorization: Bearer <KEY>" \
  https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/api/v1/me
```
