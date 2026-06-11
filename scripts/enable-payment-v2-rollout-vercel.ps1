# Active le rollout canary Payment V2 sur Vercel (production).
# Prérequis : VERCEL_TOKEN (Dashboard → Settings → Tokens) et projet lié ou VERCEL_ORG_ID + VERCEL_PROJECT_ID.
#
# Usage :
#   $env:VERCEL_TOKEN = "<token>"
#   .\scripts\enable-payment-v2-rollout-vercel.ps1
#   .\scripts\enable-payment-v2-rollout-vercel.ps1 -RolloutPercent 50

param(
  [ValidateRange(0, 100)]
  [int]$RolloutPercent = 10,
  [switch]$Redeploy
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path $PSScriptRoot -Parent

if (-not $env:VERCEL_TOKEN) {
  Write-Error 'VERCEL_TOKEN manquant. Créez un token sur https://vercel.com/account/tokens'
}

Push-Location $Root
try {
  $vercel = 'npx --yes vercel@latest'

  Write-Host "Production — VITE_PAYMENT_ORCHESTRATION_V2=true"
  Invoke-Expression "echo true | $vercel env add VITE_PAYMENT_ORCHESTRATION_V2 production --force --token $env:VERCEL_TOKEN"
  if ($LASTEXITCODE -ne 0) { throw 'vercel env add VITE_PAYMENT_ORCHESTRATION_V2 a échoué' }

  Write-Host "Production — VITE_PAYMENT_ORCHESTRATION_V2_ROLLOUT=$RolloutPercent"
  Invoke-Expression "echo $RolloutPercent | $vercel env add VITE_PAYMENT_ORCHESTRATION_V2_ROLLOUT production --force --token $env:VERCEL_TOKEN"
  if ($LASTEXITCODE -ne 0) { throw 'vercel env add VITE_PAYMENT_ORCHESTRATION_V2_ROLLOUT a échoué' }

  Write-Host ''
  Write-Host 'Variables production :'
  Invoke-Expression "$vercel env ls production --token $env:VERCEL_TOKEN" | Select-String 'VITE_PAYMENT_ORCHESTRATION'

  if ($Redeploy) {
    Write-Host ''
    Write-Host 'Redéploiement production...'
    Invoke-Expression "$vercel deploy --prod --token $env:VERCEL_TOKEN"
    if ($LASTEXITCODE -ne 0) { throw 'vercel deploy --prod a échoué' }
  }
  else {
    Write-Host ''
    Write-Host 'Redéployez production (Vercel Dashboard ou vercel deploy --prod) pour appliquer les VITE_* au build.'
  }
}
finally {
  Pop-Location
}
