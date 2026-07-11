# Deploiement prod : garde-fou changement commerce_type (Phase 1)
# Usage : .\scripts\deploy-store-commerce-type-guard.ps1
# Prerequis : supabase login + projet lie, OU variable SUPABASE_DB_PASSWORD
#
# Si l'API Supabase timeout (TLS handshake), definir le mot de passe DB :
#   $env:SUPABASE_DB_PASSWORD = '<depuis Dashboard > Settings > Database>'
#   .\scripts\deploy-store-commerce-type-guard.ps1

param(
  [string]$ProjectRef = 'hbdnzajbyjakdhuavrvb',
  [switch]$SkipMigration,
  [switch]$SkipVerify
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path $PSScriptRoot -Parent
Push-Location $Root

try {
  if (-not $SkipMigration) {
    Write-Host '1/2 - Application migration store_commerce_type_change_guard...' -ForegroundColor Cyan
    $migration = Join-Path $Root 'supabase\migrations\20260711140000__store_commerce_type_change_guard.sql'
    if (-not (Test-Path $migration)) { throw "Migration introuvable: $migration" }

    if (-not $env:SUPABASE_DB_PASSWORD) {
      Write-Host '  Astuce: si timeout API, definir $env:SUPABASE_DB_PASSWORD avant de relancer.' -ForegroundColor Yellow
    }

    npx supabase db query --linked -f $migration --yes
    if ($LASTEXITCODE -ne 0) {
      throw @'
supabase db query a echoue.
- Verifier supabase login (npx supabase login)
- Ou definir SUPABASE_DB_PASSWORD puis relancer
- Sinon appliquer le SQL manuellement dans le SQL Editor Supabase
'@
    }
  }

  if (-not $SkipVerify) {
    Write-Host '2/2 - Verification fonctions + trigger...' -ForegroundColor Cyan
    $verify = Join-Path $Root 'supabase\scripts\verify-store-commerce-type-guard.sql'
    if (-not (Test-Path $verify)) { throw "Script verify introuvable: $verify" }

    $out = npx supabase db query --linked -f $verify --yes -o csv 2>&1
    if ($LASTEXITCODE -ne 0) { throw "Verification echouee: $out" }
    Write-Host $out
    if ($out -notmatch 'true') {
      throw 'Verification incomplete: attendu true pour les 4 colonnes'
    }
  }

  Write-Host ''
  Write-Host 'OK - Garde-fou commerce_type deploye.' -ForegroundColor Green
}
finally {
  Pop-Location
}
