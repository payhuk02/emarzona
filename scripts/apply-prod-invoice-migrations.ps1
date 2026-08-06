# Apply customer invoice migrations on production (pooler).
# Requires: Dashboard > Settings > Database > password
#
#   $env:SUPABASE_DB_PASSWORD = '<your-db-password>'
#   .\scripts\apply-prod-invoice-migrations.ps1

$ErrorActionPreference = 'Stop'

if (-not $env:SUPABASE_DB_PASSWORD) {
  Write-Host 'Set SUPABASE_DB_PASSWORD first (Supabase Dashboard > Settings > Database).' -ForegroundColor Red
  exit 1
}

$env:SUPABASE_TARGET = 'prod'

$migrations = @(
  'supabase/migrations/20260806140000__fix_invoices_customer_rls_email_only.sql',
  'supabase/migrations/20260806130000__invoice_no_default_vat.sql'
)

node scripts/apply-target-migrations.mjs @migrations
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host 'Running verification queries...' -ForegroundColor Cyan
node scripts/apply-target-migrations.mjs supabase/scripts/verify-customer-invoices-prod.sql
