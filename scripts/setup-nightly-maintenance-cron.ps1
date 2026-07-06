# Réactive le cron nightly-maintenance (inclut email-maintenance)

param(
  [string]$ProjectRef = 'hbdnzajbyjakdhuavrvb',
  [string]$CronSecret = $(. "$PSScriptRoot\Get-CronSecret.ps1")
)

if (-not $CronSecret) {
  Write-Error @'
CRON_SECRET introuvable. Options :
  1. .\scripts\rotate-cron-secret.ps1 -GenerateNew
  2. scripts/.cron-secret.local (gitignored)
  3. $env:CRON_SECRET = "..." puis relancer
'@
}

$EscSecret = $CronSecret.Replace("'", "''")
$sql = @"
SELECT public.setup_nightly_maintenance_cron_job('$ProjectRef', '$EscSecret');
"@

Write-Host "Activation cron nightly-maintenance (+ email-maintenance) project $ProjectRef..." -ForegroundColor Cyan
$sql | npx supabase db query --linked
