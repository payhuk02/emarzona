# Active le cron verify-domains (Epic 4.2) — nécessite CRON_SECRET connu.

param(
  [string]$ProjectRef = 'hbdnzajbyjakdhuavrvb',
  [string]$CronSecret = $env:CRON_SECRET
)

if (-not $CronSecret) {
  Write-Error 'Definissez $env:CRON_SECRET (meme valeur que Edge Functions Secrets)'
}

$sql = @"
SELECT public.setup_verify_domains_cron_job('$ProjectRef', '$CronSecret');
"@

$sql | npx supabase db query --linked
