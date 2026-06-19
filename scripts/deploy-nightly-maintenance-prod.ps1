# Deploiement prod : cron maintenance nocturne groupee
param(
  [string]$ProjectRef = 'hbdnzajbyjakdhuavrvb',
  [switch]$SkipMigration,
  [switch]$SkipCronSetup
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path $PSScriptRoot -Parent
Push-Location $Root

try {
  if (-not $SkipMigration) {
    Write-Host '1/3 - Migration nightly maintenance...' -ForegroundColor Cyan
    $migration = Join-Path $Root 'supabase\migrations\20260619130000__nightly_maintenance_cron.sql'
    npx supabase db query --linked -f $migration --yes
    if ($LASTEXITCODE -ne 0) { throw 'migration failed' }
  }

  Write-Host '2/3 - Deploy process-nightly-maintenance...' -ForegroundColor Cyan
  npx supabase functions deploy process-nightly-maintenance --project-ref $ProjectRef --no-verify-jwt
  if ($LASTEXITCODE -ne 0) { throw 'deploy failed' }

  if (-not $SkipCronSetup) {
    Write-Host '3/3 - Setup pg_cron...' -ForegroundColor Cyan
    $CronSecret = & "$PSScriptRoot\Get-CronSecret.ps1"
    if (-not $CronSecret) { throw 'CRON_SECRET missing' }
    $EscSecret = $CronSecret.Replace("'", "''")
    "SELECT public.setup_nightly_maintenance_cron_job('$ProjectRef', '$EscSecret');" | npx supabase db query --linked
    if ($LASTEXITCODE -ne 0) { throw 'cron setup failed' }
  }

  Write-Host 'OK - nightly maintenance deployed.' -ForegroundColor Green
}
finally {
  Pop-Location
}
