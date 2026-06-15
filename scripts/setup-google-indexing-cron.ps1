# Epic 5.2 — Active les crons Google Indexing (enqueue hebdo + process horaire)

param(
  [string]$ProjectRef = 'hbdnzajbyjakdhuavrvb',
  [string]$CronSecret = $(. "$PSScriptRoot\Get-CronSecret.ps1")
)

if (-not $CronSecret) {
  Write-Error @'
CRON_SECRET introuvable. Utilisez .\scripts\rotate-cron-secret.ps1 -GenerateNew
'@
}

$EscSecret = $CronSecret.Replace("'", "''")
$sql = @"
SELECT public.setup_google_indexing_cron_jobs('$ProjectRef', '$EscSecret');
"@

Write-Host "Activation crons google-indexing (project $ProjectRef)..." -ForegroundColor Cyan
$sql | npx supabase db query --linked
