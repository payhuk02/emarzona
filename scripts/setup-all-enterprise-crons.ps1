# Regénère CRON_SECRET + active tous les crons (dont Moon 5/6)
# Usage : .\scripts\setup-all-enterprise-crons.ps1
# Prérequis : supabase login, .env.local avec VITE_SUPABASE_ANON_KEY

param(
  [switch]$SyncGitHub
)

$ErrorActionPreference = 'Stop'
Write-Host 'Rotation CRON_SECRET + recréation pg_cron (tous jobs)...' -ForegroundColor Cyan
if ($SyncGitHub) {
  & "$PSScriptRoot\rotate-cron-secret.ps1" -GenerateNew -SyncGitHub
} else {
  & "$PSScriptRoot\rotate-cron-secret.ps1" -GenerateNew
}
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host ''
Write-Host 'OK — platform-health, order-fulfillment-monitor, google-indexing, gdpr-account-deletion, verify-domains, dashboard-views-refresh et jobs existants alignés.' -ForegroundColor Green
