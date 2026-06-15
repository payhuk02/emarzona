# Smoke test google-indexing-submit (cron auth, sans afficher le secret)
$ErrorActionPreference = 'Stop'
$ProjectRef = 'hbdnzajbyjakdhuavrvb'
$CronSecret = & "$PSScriptRoot\Get-CronSecret.ps1"
if (-not $CronSecret) { Write-Error 'CRON_SECRET introuvable (scripts/.cron-secret.local)' }

$uri = "https://$ProjectRef.supabase.co/functions/v1/google-indexing-submit?limit=1"
$headers = @{
  'Content-Type'  = 'application/json'
  'x-cron-secret' = $CronSecret
}

Write-Host "POST $uri ..." -ForegroundColor Cyan
try {
  $resp = Invoke-RestMethod -Uri $uri -Method Post -Headers $headers -Body '{}' -TimeoutSec 180
  Write-Host 'OK - google-indexing-submit' -ForegroundColor Green
  if ($resp.error) {
    Write-Host "  error: $($resp.error)" -ForegroundColor Yellow
  }
  if ($null -ne $resp.processed) { Write-Host "  processed: $($resp.processed)" }
  if ($null -ne $resp.enqueued) { Write-Host "  enqueued: $($resp.enqueued)" }
} catch {
  Write-Host "FAIL - $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}
