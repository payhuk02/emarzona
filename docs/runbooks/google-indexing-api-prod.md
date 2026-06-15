# Runbook — Google Indexing API (Epic 5.2)

## Prérequis Google Cloud

1. Activer **Web Search Indexing API** sur le projet GCP.
2. Créer un compte de service avec rôle **Owner** ou accès Indexing API.
3. Vérifier la propriété du site dans Google Search Console (domaine ou URL prefix).

## Secrets Supabase

```powershell
# 1. Compte de service Google — copier le JSON téléchargé depuis GCP :
#    scripts/.google-indexing-service-account.json.local  (gitignored)
.\scripts\set-google-indexing-secrets.ps1

# CRON_SECRET : scripts/.cron-secret.local (voir rotate-cron-secret.ps1)
```

## Migration

```bash
supabase db push
# ou repair si prod : 20260615100000__e47_google_indexing_queue.sql
# Cron RPC : 20260615300000__e49_enterprise_cron_jobs.sql
```

## Deploy edge

```bash
supabase functions deploy google-indexing-submit --project-ref hbdnzajbyjakdhuavrvb
```

## Cron pg_cron (prod)

```powershell
$env:CRON_SECRET = '<secret Edge Functions>'
.\scripts\setup-google-indexing-cron.ps1
```

Planification :

- **Enqueue sitemaps** : dimanche 03:00 UTC
- **Traitement file** : :15 chaque heure

Secours GitHub Actions : `.github/workflows/google-indexing-cron.yml` (secrets `SUPABASE_URL`, `CRON_SECRET`, `VITE_SUPABASE_PUBLISHABLE_KEY`).

## Cron manuel (curl)

```bash
# Enqueue sitemaps actifs
curl -X POST "https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/google-indexing-submit?action=enqueue-sitemaps&limit=200" \
  -H "x-cron-secret: $CRON_SECRET"

# Traiter la file
curl -X POST "https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/google-indexing-submit" \
  -H "x-cron-secret: $CRON_SECRET"
```

## RPC manuelle

```sql
SELECT enqueue_google_indexing('https://boutique.myemarzona.shop/sitemap.xml');
SELECT * FROM google_indexing_queue ORDER BY created_at DESC LIMIT 10;
```

## Quotas

Google Indexing API : ~200 URL/jour par propriété — la file retente les échecs manuellement.
