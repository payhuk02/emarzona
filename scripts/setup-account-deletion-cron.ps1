# RGPD - Active le cron purge comptes (pg_cron quotidien 03:00 UTC)
# Prerequis : migration 20260619120000 + edge function process-account-deletions deployee

param(
  [string]$ProjectRef = 'hbdnzajbyjakdhuavrvb',
  [string]$CronSecret = $(. "$PSScriptRoot\Get-CronSecret.ps1")
)

if (-not $CronSecret) {
  Write-Error 'CRON_SECRET introuvable. Voir scripts/rotate-cron-secret.ps1 -GenerateNew'
}

$EscSecret = $CronSecret.Replace("'", "''")
$sql = @"
SELECT public.setup_account_deletion_cron_job('$ProjectRef', '$EscSecret');
"@

Write-Host "Activation cron RGPD account-deletion (project $ProjectRef)..." -ForegroundColor Cyan
$sql | npx supabase db query --linked
