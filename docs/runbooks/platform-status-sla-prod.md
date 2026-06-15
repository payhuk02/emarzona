# Runbook — Page status & SLA (Epic 5.3)

## Migration

```bash
supabase db push
# 20260615200000__e48_platform_sla_status.sql
```

## Deploy edge

```bash
supabase functions deploy platform-health --project-ref hbdnzajbyjakdhuavrvb
```

## Cron sonde (toutes les 5 min)

```powershell
$env:CRON_SECRET = '<secret Edge Functions>'
.\scripts\setup-platform-health-cron.ps1
```

Secours GitHub Actions : `.github/workflows/platform-health-cron.yml`

## Cron manuel (curl)

## URLs

- Page publique : `https://www.emarzona.com/status`
- RPC : `get_platform_status_summary()` (anon + authenticated)
- Widget Enterprise : onglet SSO → Équipe boutique (`EnterpriseStatusPanel`)

## Incidents manuels (admin)

```sql
INSERT INTO platform_status_incidents (title, severity, status, services)
VALUES ('Latence Supabase élevée', 'major', 'investigating', ARRAY['supabase']);
```

## Redeploy front

Nécessaire pour la route `/status` et le widget dashboard.
