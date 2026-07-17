# Configure les secrets FedEx sur Supabase Edge (production ou sandbox)
# Usage sécurisé :
#   1. Créer scripts/.fedex-secrets.local (gitignored) avec :
#      FEDEX_API_KEY=...
#      FEDEX_API_SECRET=...
#      FEDEX_ACCOUNT_NUMBER=...
#      FEDEX_TEST_MODE=false   # prod API
#   2. .\scripts\setup-fedex-prod-secrets.ps1
#
# Ou variables d'environnement avant exécution.

param(
  [string]$ProjectRef = 'hbdnzajbyjakdhuavrvb',
  [string]$SecretsFile = (Join-Path $PSScriptRoot '.fedex-secrets.local'),
  [switch]$ProductionApi
)

$ErrorActionPreference = 'Stop'

function Read-SecretsFile([string]$path) {
  $map = @{}
  if (-not (Test-Path $path)) { return $map }
  foreach ($line in Get-Content $path) {
    if ($line -match '^\s*#' -or $line -notmatch '=') { continue }
    $parts = $line -split '=', 2
    $key = $parts[0].Trim()
    $val = $parts[1].Trim().Trim('"').Trim("'")
    if ($key) { $map[$key] = $val }
  }
  return $map
}

$fileSecrets = Read-SecretsFile $SecretsFile
$apiKey = $env:FEDEX_API_KEY ?? $fileSecrets['FEDEX_API_KEY']
$apiSecret = $env:FEDEX_API_SECRET ?? $fileSecrets['FEDEX_API_SECRET']
$account = $env:FEDEX_ACCOUNT_NUMBER ?? $fileSecrets['FEDEX_ACCOUNT_NUMBER']
$testMode = if ($ProductionApi) { 'false' } else { $env:FEDEX_TEST_MODE ?? $fileSecrets['FEDEX_TEST_MODE'] ?? 'true' }

if (-not $apiKey -or -not $apiSecret -or -not $account) {
  Write-Error @"
Secrets FedEx incomplets. Définir FEDEX_API_KEY, FEDEX_API_SECRET, FEDEX_ACCOUNT_NUMBER
dans scripts/.fedex-secrets.local ou en variables d'environnement.
Voir docs/runbooks/fedex-prod-credentials.md
"@
}

Write-Host "Configuration secrets FedEx (project $ProjectRef)..." -ForegroundColor Cyan
Write-Host "  FEDEX_TEST_MODE=$testMode"

Push-Location (Split-Path $PSScriptRoot -Parent)
try {
  npx supabase secrets set `
    "FEDEX_API_KEY=$apiKey" `
    "FEDEX_API_SECRET=$apiSecret" `
    "FEDEX_ACCOUNT_NUMBER=$account" `
    "FEDEX_TEST_MODE=$testMode" `
    "FEDEX_ALLOW_MOCK=false" `
    --project-ref $ProjectRef

  if ($LASTEXITCODE -ne 0) { throw 'supabase secrets set a échoué' }

  Write-Host ''
  Write-Host 'Déploiement Edge Functions FedEx...' -ForegroundColor Cyan
  npx supabase functions deploy fedex-rates fedex-ship fedex-track fedex-cancel --project-ref $ProjectRef
  if ($LASTEXITCODE -ne 0) { throw 'supabase functions deploy FedEx a échoué' }

  Write-Host ''
  Write-Host 'OK — secrets FedEx posés + fonctions déployées.' -ForegroundColor Green
  Write-Host 'Vérification : npm run verify:fedex-prod:strict' -ForegroundColor Cyan
}
finally {
  Pop-Location
}
