# Synchronise EDGE_INTERNAL_SECRET : Supabase Edge + fichier local gitignored
# Usage :
#   1. Créer scripts/.edge-internal-secret.local (une ligne = secret) OU définir EDGE_INTERNAL_SECRET
#   2. .\scripts\setup-edge-internal-secret.ps1
#   3. npm run verify:secure-deploy

param(
  [string]$ProjectRef = 'hbdnzajbyjakdhuavrvb',
  [string]$SecretsFile = (Join-Path $PSScriptRoot '.edge-internal-secret.local'),
  [switch]$GenerateNew
)

$ErrorActionPreference = 'Stop'

function New-EdgeInternalSecret {
  $bytes = New-Object byte[] 32
  [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  return [Convert]::ToBase64String($bytes).Replace('+', 'x').Replace('/', 'y').Substring(0, 32)
}

if ($GenerateNew) {
  $Secret = New-EdgeInternalSecret
  Set-Content -Path $SecretsFile -Value $Secret -NoNewline -Encoding utf8
  Write-Host "OK — secret généré dans $SecretsFile" -ForegroundColor Green
}
else {
  if ($env:EDGE_INTERNAL_SECRET) {
    $Secret = $env:EDGE_INTERNAL_SECRET.Trim()
  }
  elseif (Test-Path $SecretsFile) {
    $Secret = (Get-Content $SecretsFile -Raw).Trim()
  }
  else {
    Write-Error @"
EDGE_INTERNAL_SECRET manquant.
  - Créez scripts/.edge-internal-secret.local (une ligne)
  - ou `$env:EDGE_INTERNAL_SECRET
  - ou .\scripts\setup-edge-internal-secret.ps1 -GenerateNew
"@
  }
}

if ($Secret.Length -lt 16) {
  Write-Error 'EDGE_INTERNAL_SECRET doit faire au moins 16 caractères.'
}

Write-Host "Configuration EDGE_INTERNAL_SECRET (project $ProjectRef)..." -ForegroundColor Cyan
Push-Location (Split-Path $PSScriptRoot -Parent)
try {
  npx supabase secrets set "EDGE_INTERNAL_SECRET=$Secret" --project-ref $ProjectRef
  if ($LASTEXITCODE -ne 0) { throw 'supabase secrets set a échoué' }

  Write-Host ''
  Write-Host 'OK — secret posé sur Supabase Edge.' -ForegroundColor Green
  Write-Host 'Redéployer les fonctions sensibles :' -ForegroundColor Cyan
  Write-Host '  npx supabase functions deploy send-email webhook-delivery send-welcome-email --project-ref' $ProjectRef
  Write-Host ''
  Write-Host 'Vérification : npm run verify:secure-deploy' -ForegroundColor Cyan
}
finally {
  Pop-Location
}
