# Smoke test process-order-fulfillment-monitor avec CRON_SECRET local
$ErrorActionPreference = 'Stop'
$ProjectRef = 'hbdnzajbyjakdhuavrvb'
$CronSecret = & "$PSScriptRoot\Get-CronSecret.ps1"
if (-not $CronSecret) { Write-Error 'CRON_SECRET introuvable' }

$uri = "https://$ProjectRef.supabase.co/functions/v1/process-order-fulfillment-monitor"
$headers = @{
  'Content-Type'  = 'application/json'
  'x-cron-secret' = $CronSecret
}

Write-Host "POST $uri ..." -ForegroundColor Cyan
try {
  $resp = Invoke-RestMethod -Uri $uri -Method Post -Headers $headers -Body '{}' -TimeoutSec 120
  Write-Host 'OK - process-order-fulfillment-monitor' -ForegroundColor Green
  if ($null -ne $resp.stale_count) { Write-Host "  stale_count: $($resp.stale_count)" }
  if ($null -ne $resp.sla_status) { Write-Host "  sla_status: $($resp.sla_status)" }
  if ($null -ne $resp.retries_attempted) { Write-Host "  retries_attempted: $($resp.retries_attempted)" }
  if ($resp.auto_resolved) { Write-Host "  auto_resolved: $($resp.auto_resolved | ConvertTo-Json -Compress)" }
} catch {
  Write-Host "FAIL - $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}
