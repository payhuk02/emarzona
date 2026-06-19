# Deploiement prod : cron RGPD + edge function process-account-deletions
# Usage : .\scripts\deploy-gdpr-account-deletion-prod.ps1
# Prerequis : supabase login, projet lie (npx supabase link)

param(
  [string]$ProjectRef = 'hbdnzajbyjakdhuavrvb',
  [int]$GraceDays = 30,
  [switch]$SkipMigration,
  [switch]$SkipCronSetup
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path $PSScriptRoot -Parent
Push-Location $Root

try {
  if (-not $SkipMigration) {
    Write-Host '1/4 - Application migration RGPD (fichier SQL cible)...' -ForegroundColor Cyan
    $migration = Join-Path $Root 'supabase\migrations\20260619120000__gdpr_account_deletion_cron.sql'
    if (-not (Test-Path $migration)) { throw "Migration introuvable: $migration" }
    npx supabase db query --linked -f $migration --yes
    if ($LASTEXITCODE -ne 0) { throw 'supabase db query (migration RGPD) failed' }
  }

  Write-Host '2/4 - Deploiement edge function process-account-deletions...' -ForegroundColor Cyan
  npx supabase functions deploy process-account-deletions --project-ref $ProjectRef --no-verify-jwt
  if ($LASTEXITCODE -ne 0) { throw 'supabase functions deploy failed' }

  Write-Host "3/4 - Secret Edge GDPR_DELETION_GRACE_DAYS=$GraceDays..." -ForegroundColor Cyan
  npx supabase secrets set "GDPR_DELETION_GRACE_DAYS=$GraceDays" --project-ref $ProjectRef
  if ($LASTEXITCODE -ne 0) { throw 'supabase secrets set failed' }

  if (-not $SkipCronSetup) {
    Write-Host '4/4 - Activation pg_cron gdpr-account-deletion-daily...' -ForegroundColor Cyan
    & "$PSScriptRoot\setup-account-deletion-cron.ps1" -ProjectRef $ProjectRef
    if ($LASTEXITCODE -ne 0) { throw 'setup-account-deletion-cron failed' }
  }

  Write-Host ''
  Write-Host 'OK - RGPD account deletion cron deployed.' -ForegroundColor Green
  Write-Host 'Smoke: POST /functions/v1/process-account-deletions with x-cron-secret header' -ForegroundColor DarkGray
}
finally {
  Pop-Location
}
