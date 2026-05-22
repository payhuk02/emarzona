# Tests de charge k6 — Emarzona

## Prérequis

- [k6](https://k6.io/docs/get-started/installation/) installé localement (`choco install k6` sur Windows, ou binaire officiel).

## Variables d'environnement

Copiez `.env.k6.example` vers `.env.k6` (non versionné) ou exportez les variables :

```bash
export SUPABASE_URL=https://votre-projet.supabase.co
export SUPABASE_ANON_KEY=eyJ...
```

Sous PowerShell :

```powershell
$env:SUPABASE_URL = "https://..."
$env:SUPABASE_ANON_KEY = "eyJ..."
```

## Marketplace RPC

Simule des appels `POST /rest/v1/rpc/get_marketplace_products_filtered` (même contrat que `useMarketplaceProducts`).

```bash
npm run load:test:marketplace
```

Options k6 :

| Variable      | Défaut | Description                    |
| ------------- | ------ | ------------------------------ |
| `K6_VUS`      | `50`   | Pic de VUs                     |
| `K6_DURATION` | `1m`   | Durée de la rampe à charge max |

Exemple léger (CI local) :

```bash
K6_VUS=5 K6_DURATION=30s k6 run scripts/k6/marketplace-rpc.js
```

## CI GitHub

Le workflow `.github/workflows/load-test-marketplace.yml` est **manuel** (`workflow_dispatch`). Configurez les secrets :

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

Ne lancez pas de charge importante contre la production sans accord préalable.
