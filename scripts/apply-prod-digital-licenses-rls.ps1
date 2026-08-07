# Apply digital_licenses buyer RLS migration on production (pooler).
# Requires: Dashboard > Settings > Database > password
#
#   $env:SUPABASE_DB_PASSWORD = '<your-db-password>'
#   .\scripts\apply-prod-digital-licenses-rls.ps1

$ErrorActionPreference = 'Stop'

if (-not $env:SUPABASE_DB_PASSWORD) {
  Write-Host 'Set SUPABASE_DB_PASSWORD first (Supabase Dashboard > Settings > Database).' -ForegroundColor Red
  exit 1
}

$env:SUPABASE_TARGET = 'prod'

node scripts/apply-target-migrations.mjs supabase/migrations/20260807120000__fix_digital_licenses_customer_rls_email_only.sql
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host 'Digital licenses RLS migration applied on prod.' -ForegroundColor Green
