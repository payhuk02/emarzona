# Payment V2 canary — rollout direct Vercel (sans GitHub Actions).
# Utilise les memes secrets que Supabase Edge (VERCEL_API_TOKEN ou VERCEL_TOKEN + VERCEL_PROJECT_ID).
#
# Usage (copier les valeurs depuis Supabase Dashboard → Edge Functions → Secrets) :
#   $env:VERCEL_TOKEN = "<valeur depuis Supabase>"      # ou VERCEL_API_TOKEN
#   $env:VERCEL_PROJECT_ID = "<valeur depuis Supabase>"
#   .\scripts\rollout-payment-v2-local.ps1 -RolloutPercent 10

param(
  [ValidateRange(0, 100)]
  [int]$RolloutPercent = 10,
  [switch]$SkipRedeploy
)

$ErrorActionPreference = 'Stop'

# Supabase Edge utilise souvent VERCEL_API_TOKEN ; le CLI Vercel attend VERCEL_TOKEN
if (-not $env:VERCEL_TOKEN -and $env:VERCEL_API_TOKEN) {
  $env:VERCEL_TOKEN = $env:VERCEL_API_TOKEN
  Write-Host 'VERCEL_TOKEN <- VERCEL_API_TOKEN (alias Supabase Edge)' -ForegroundColor DarkGray
}

if (-not $env:VERCEL_TOKEN) {
  Write-Error @'
VERCEL_TOKEN (ou VERCEL_API_TOKEN) manquant.
Copiez la valeur depuis Supabase Dashboard → Project Settings → Edge Functions → Secrets
  $env:VERCEL_TOKEN = "<token>"
  $env:VERCEL_PROJECT_ID = "<project_id>"
'@
}

if (-not $env:VERCEL_PROJECT_ID) {
  Write-Error 'VERCEL_PROJECT_ID manquant (meme secret que sur Supabase Edge Functions).'
}

Write-Host "=== Rollout Payment V2 local — $RolloutPercent % ===" -ForegroundColor Cyan

$main = Join-Path $PSScriptRoot 'enable-payment-v2-rollout-vercel.ps1'
if ($SkipRedeploy) {
  & $main -RolloutPercent $RolloutPercent -SkipRedeploy
} else {
  & $main -RolloutPercent $RolloutPercent -Redeploy
}

Write-Host ''
Write-Host 'Post-deploiement : npm run verify:payment-v2' -ForegroundColor Green
Write-Host 'GitHub Actions (optionnel) : npm run setup:payment-v2-github-secrets pour dupliquer vers les secrets repo' -ForegroundColor DarkGray
