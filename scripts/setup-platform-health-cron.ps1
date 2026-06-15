# Epic 5.3 — Active le cron platform-health (pg_cron, toutes les 5 min)

param(
  [string]$ProjectRef = 'hbdnzajbyjakdhuavrvb',
  [string]$CronSecret = $(. "$PSScriptRoot\Get-CronSecret.ps1")
)

if (-not $CronSecret) {
  Write-Error @'
CRON_SECRET introuvable. Options :
  1. .\scripts\rotate-cron-secret.ps1 -GenerateNew   (recommandé si oublié)
  2. Créer scripts/.cron-secret.local (une ligne, fichier gitignored)
  3. $env:CRON_SECRET = "..." puis relancer ce script
Ne collez jamais le secret dans le chat.
'@
}

$EscSecret = $CronSecret.Replace("'", "''")
$sql = @"
SELECT public.setup_platform_health_cron_job('$ProjectRef', '$EscSecret');
"@

Write-Host "Activation cron platform-health (project $ProjectRef)..." -ForegroundColor Cyan
$sql | npx supabase db query --linked
