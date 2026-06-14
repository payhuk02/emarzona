# Payment V2 — passage canary 50 % → 100 % (production).
# Voir docs/runbooks/payment-v2-rollout-100.md pour la checklist go/no-go.

param(
  [switch]$SkipRedeploy,
  [switch]$Force
)

$ErrorActionPreference = 'Stop'
$mainScript = Join-Path $PSScriptRoot 'enable-payment-v2-rollout-vercel.ps1'

if (-not (Test-Path $mainScript)) {
  Write-Error "Script introuvable: $mainScript"
}

if (-not $Force) {
  Write-Host '=== Checklist go/no-go (payment-v2-rollout-100.md) ===' -ForegroundColor Cyan
  Write-Host '  [ ] Canary 50 % stable >= 48 h'
  Write-Host '  [ ] get_payment_webhook_health(24) OK'
  Write-Host '  [ ] npm run test:e2e:financial vert'
  Write-Host '  [ ] Smoke Stripe + PayPal + Moneroo'
  Write-Host ''
  $confirm = Read-Host 'Confirmer passage a 100 % ? (oui/non)'
  if ($confirm -notmatch '^(oui|o|yes|y)$') {
    Write-Host 'Annule.'
    exit 0
  }
}

if ($SkipRedeploy) {
  & $mainScript -RolloutPercent 100 -SkipRedeploy
} else {
  & $mainScript -RolloutPercent 100 -Redeploy
}
