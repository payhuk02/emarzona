# Smoke test platform-health avec CRON_SECRET local (sans afficher le secret)
$ErrorActionPreference = 'Stop'
$ProjectRef = 'hbdnzajbyjakdhuavrvb'
$CronSecret = & "$PSScriptRoot\Get-CronSecret.ps1"
if (-not $CronSecret) { Write-Error 'CRON_SECRET introuvable' }

$uri = "https://$ProjectRef.supabase.co/functions/v1/platform-health"
$headers = @{
  'Content-Type'  = 'application/json'
  'x-cron-secret' = $CronSecret
}

Write-Host "POST $uri ..." -ForegroundColor Cyan
try {
  $resp = Invoke-RestMethod -Uri $uri -Method Post -Headers $headers -Body '{}' -TimeoutSec 120
  Write-Host 'OK - platform-health' -ForegroundColor Green
  if ($resp.overall) { Write-Host "  overall: $($resp.overall)" }
  if ($resp.services) { Write-Host "  services: $($resp.services.Count)" }
} catch {
  Write-Host "FAIL - $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}
