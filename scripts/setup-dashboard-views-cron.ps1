# Planifie pg_cron refresh-dashboard-materialized-views (toutes les heures à :15 UTC)
# Usage: .\scripts\setup-dashboard-views-cron.ps1
# Prérequis: supabase login + projet linked

$ErrorActionPreference = 'Stop'
$Root = Split-Path $PSScriptRoot -Parent
Push-Location $Root

try {
  Write-Host 'Activation pg_cron refresh-dashboard-materialized-views...' -ForegroundColor Cyan

  $Sql = @"
SELECT public.setup_dashboard_materialized_views_cron_job('15 * * * *');
"@

  $Utf8NoBom = New-Object System.Text.UTF8Encoding $false
  $TempSql = [System.IO.Path]::GetTempFileName() + '.sql'
  [System.IO.File]::WriteAllText($TempSql, $Sql, $Utf8NoBom)

  npx supabase db query --linked --file $TempSql
  if ($LASTEXITCODE -ne 0) { throw 'supabase db query failed' }

  Remove-Item $TempSql -ErrorAction SilentlyContinue
  Write-Host 'OK — job refresh-dashboard-materialized-views actif (15 * * * * UTC).' -ForegroundColor Green
}
finally {
  Pop-Location
}
