# Définit les variables VITE pour dev local (simulation rollout canary).
# Usage: .\scripts\set-payment-v2-rollout-local.ps1 -RolloutPercent 50

param(
  [ValidateRange(0, 100)]
  [int]$RolloutPercent = 50
)

$env:VITE_PAYMENT_ORCHESTRATION_V2 = 'true'
$env:VITE_PAYMENT_ORCHESTRATION_V2_ROLLOUT = "$RolloutPercent"
Write-Host "Local: VITE_PAYMENT_ORCHESTRATION_V2=true, VITE_PAYMENT_ORCHESTRATION_V2_ROLLOUT=$RolloutPercent"
Write-Host 'Lancez npm run dev dans ce terminal pour tester le canary.'
