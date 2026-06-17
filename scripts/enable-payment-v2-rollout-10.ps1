# Payment V2 — démarrage canary 10 % (production).
# Voir docs/PAYMENT_ORCHESTRATION_V2_PROD_RUNBOOK.md

param(
  [switch]$SkipRedeploy,
  [switch]$VerifyOnly
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path $PSScriptRoot -Parent

if ($VerifyOnly) {
  node (Join-Path $PSScriptRoot 'payment-v2-canary.mjs') --verify-only
  exit $LASTEXITCODE
}

Write-Host '=== Preflight Payment V2 canary 10 % ===' -ForegroundColor Cyan
node (Join-Path $PSScriptRoot 'payment-v2-canary.mjs') --verify-only
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$mainScript = Join-Path $PSScriptRoot 'enable-payment-v2-rollout-vercel.ps1'
if (-not (Test-Path $mainScript)) {
  Write-Error "Script introuvable: $mainScript"
}

if ($SkipRedeploy) {
  & $mainScript -RolloutPercent 10 -SkipRedeploy
} else {
  & $mainScript -RolloutPercent 10 -Redeploy
}
