# Déploiement — audit œuvre d'artiste (20260526)

## 1. Migrations SQL

```bash
supabase db push
```

Vérification :

```bash
# SQL Editor : supabase/scripts/verify_artist_audit_migrations.sql
```

Versions attendues : `20260526120500`, `20260526120100`, `20260526140000`, `20260526150000`, `20260526160000` (phase 1 suite).

> `20260526120500` remplace l'ancien timestamp `20260526120000` (conflit avec email_phase2).

**Phase 1 suite (`20260526160000`)** : RPC `get_edition_tracking`, `list_my_artist_orders`, `verify_artist_certificate_by_code`, retrait policy INSERT certificats. Page publique `/verify/:code`. Redéployer `generate-artist-certificate` pour `is_public: true` sur les nouveaux certificats.

**Observabilité + backfill (`20260526170000`)** :

- Backfill `is_public = true` sur certificats valides avec `verification_code`
- Table `artist_fulfillment_events` + `log_artist_fulfillment_event` (service_role)
- KPI admin : `SELECT get_artist_audit_health(7);` (script `supabase/scripts/verify_artist_audit_health.sql`)
- Redéployer : `generate-artist-certificate`, `process-auction-statuses` (logs événements)

**E2E éditions limitées** : `tests/e2e/artist-limited-edition.spec.ts` — env `E2E_ARTIST_LIMITED_PRODUCT_ID`, `E2E_RUN_AUTH_TESTS=1`.

## 2. Edge Functions

```bash
supabase functions deploy generate-artist-certificate
supabase functions deploy process-auction-statuses
```

Secrets : `EDGE_INTERNAL_SECRET`, `CRON_SECRET`, `RESEND_API_KEY`, `SITE_URL`.

## 3. Cron enchères (pg_cron)

```sql
SELECT public.setup_auction_statuses_cron_job(
  'votre-project-ref',
  'votre-cron-secret-min-16-chars'
);
```

Secours GitHub Actions : `.github/workflows/auction-status-cron.yml`  
Secrets repo : `SUPABASE_URL`, `CRON_SECRET`.

## 4. Storage

Bucket `product-files` — chemin `artist-certificates/` pour les PDF certificats.
