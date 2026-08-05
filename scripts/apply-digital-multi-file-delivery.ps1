# Apply digital multi-file delivery migration on a Supabase project (prod or E2E).
#
# Usage:
#   .\scripts\apply-digital-multi-file-delivery.ps1
#   .\scripts\apply-digital-multi-file-delivery.ps1 -ProjectRef ufbztturuwwazfcvhvuu
#
# Prerequis:
#   npx supabase login  (compte ayant accès au projet)
#   $env:SUPABASE_DB_PASSWORD = '<Dashboard > Settings > Database>'

param(
  [string]$ProjectRef = 'hbdnzajbyjakdhuavrvb'
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path $PSScriptRoot -Parent
Push-Location $Root

$migration = Join-Path $Root 'supabase\migrations\20260805120000__digital_multi_file_unlock_and_email.sql'
$verify = Join-Path $Root 'supabase\scripts\verify-digital-multi-file-delivery.sql'

try {
  if (-not (Test-Path $migration)) {
    throw "Migration introuvable: $migration"
  }

  Write-Host "Linking project $ProjectRef ..." -ForegroundColor Cyan
  npx supabase link --project-ref $ProjectRef --yes
  if ($LASTEXITCODE -ne 0) {
    throw 'supabase link failed - verifiez npx supabase login et les droits sur le projet.'
  }

  Write-Host 'Applying migration...' -ForegroundColor Cyan
  npx supabase db query --linked -f $migration --yes
  if ($LASTEXITCODE -ne 0) {
    throw 'Application SQL échouée.'
  }

  Write-Host 'Verifying...' -ForegroundColor Cyan
  npx supabase db query --linked -f $verify --yes
  if ($LASTEXITCODE -ne 0) {
    throw 'Vérification échouée.'
  }

  Write-Host 'Recording migration history...' -ForegroundColor Cyan
  npx supabase migration repair --status applied 20260805120000
  if ($LASTEXITCODE -ne 0) {
    throw 'migration repair failed.'
  }

  Write-Host ''
  Write-Host "OK - migration digital multi-file appliquee sur $ProjectRef." -ForegroundColor Green
}
finally {
  Pop-Location
}
