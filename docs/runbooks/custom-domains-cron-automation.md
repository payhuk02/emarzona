# Runbook — Domaines personnalisés automatisés (Epic 4.2)

## Objectif

Vérification DNS + enregistrement Vercel **sans intervention manuelle** via cron `verify-domains` (toutes les 15 min).

## Prérequis

| Secret Supabase Edge          | Statut                          |
| ----------------------------- | ------------------------------- |
| `CRON_SECRET`                 | Déjà configuré                  |
| `VERCEL_API_TOKEN`            | Déjà configuré                  |
| `VERCEL_PROJECT_ID`           | Déjà configuré                  |
| `CUSTOM_DOMAIN_A_TARGETS`     | Recommandé (cibles A attendues) |
| `CUSTOM_DOMAIN_CNAME_TARGETS` | Recommandé                      |

## Migration E39

Appliquer `20260614000000__e39_custom_domains_cron_rpc.sql` puis activer le cron :

```sql
SELECT public.setup_verify_domains_cron_job(
  'hbdnzajbyjakdhuavrvb',
  '<CRON_SECRET>'  -- même valeur que Edge Functions → Secrets
);
```

Vérification :

```sql
SELECT jobname, schedule, active FROM cron.job WHERE jobname = 'verify-domains-periodically';
```

## Flux vendeur

1. Dashboard → Domaine personnalisé → TXT `_emarzona.<domain>`
2. Clic **Vérifier** (edge `verify-custom-domain`) ou attente cron 15 min
3. DNS OK → statut `active` + domaine ajouté projet Vercel
4. SSL Vercel provisionné automatiquement

## SEO bots (middleware Epic 4.1)

Les domaines custom actifs reçoivent meta OG via `get_store_by_custom_domain` dans `middleware.ts` (plus seulement `*.myemarzona.shop`).

## Tests

```bash
# SQL
psql ... -f tests/financial/e39-custom-domains-cron.test.sql

# Manuel cron
curl -X POST "https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/verify-domains" \
  -H "x-cron-secret: $CRON_SECRET" \
  -H "Content-Type: application/json"
```

## Rollback cron

```sql
SELECT cron.unschedule('verify-domains-periodically');
```

Les domaines restent actifs ; seule la reverification automatique s'arrête.
