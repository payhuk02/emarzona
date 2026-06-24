# Smoke FedEx prod — sonde OAuth via platform-health
$ErrorActionPreference = 'Stop'
$ProjectRef = 'hbdnzajbyjakdhuavrvb'
$CronSecret = & "$PSScriptRoot\Get-CronSecret.ps1"
if (-not $CronSecret) { Write-Error 'CRON_SECRET introuvable' }

$uri = "https://$ProjectRef.supabase.co/functions/v1/platform-health"
$headers = @{
  'Content-Type'  = 'application/json'
  'x-cron-secret' = $CronSecret
}

Write-Host "POST $uri (FedEx probe) ..." -ForegroundColor Cyan
try {
  $resp = Invoke-RestMethod -Uri $uri -Method Post -Headers $headers -Body '{}' -TimeoutSec 120
  $fedex = $resp.services | Where-Object { $_.service_key -eq 'fedex' } | Select-Object -First 1
  if (-not $fedex) {
    Write-Host 'FAIL - service fedex absent' -ForegroundColor Red
    exit 1
  }
  Write-Host "FedEx status: $($fedex.status)" -ForegroundColor $(if ($fedex.status -eq 'operational') { 'Green' } else { 'Yellow' })
  if ($fedex.message) { Write-Host "  message: $($fedex.message)" }
  if ($fedex.latency_ms) { Write-Host "  latency_ms: $($fedex.latency_ms)" }
  if ($fedex.status -eq 'outage') { exit 1 }
  Write-Host 'OK - FedEx probe' -ForegroundColor Green
} catch {
  Write-Host "FAIL - $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}
