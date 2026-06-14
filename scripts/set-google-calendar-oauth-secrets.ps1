# Epic E37 — Configure Google Calendar OAuth secrets on Supabase production.
# Voir docs/runbooks/google-calendar-oauth-prod.md

param(
  [switch]$Interactive,
  [string]$ProjectRef = 'hbdnzajbyjakdhuavrvb',
  [string]$RedirectUri = 'https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/google-calendar-oauth'
)

$ErrorActionPreference = 'Stop'

function Get-SecretValue {
  param([string]$Name, [string]$Prompt)
  $fromEnv = [Environment]::GetEnvironmentVariable($Name)
  if ($fromEnv) { return $fromEnv.Trim() }
  if ($Interactive) {
    return (Read-Host $Prompt)
  }
  return $null
}

$clientId = Get-SecretValue 'GOOGLE_CALENDAR_CLIENT_ID' 'Google OAuth Client ID'
$clientSecret = Get-SecretValue 'GOOGLE_CALENDAR_CLIENT_SECRET' 'Google OAuth Client Secret'
$redirect = Get-SecretValue 'GOOGLE_CALENDAR_REDIRECT_URI' "Redirect URI [$RedirectUri]"
if (-not $redirect) { $redirect = $RedirectUri }

if (-not $clientId -or -not $clientSecret) {
  Write-Error @"
Secrets manquants. Definissez les variables d'environnement ou utilisez -Interactive :
  `$env:GOOGLE_CALENDAR_CLIENT_ID = "<id>"
  `$env:GOOGLE_CALENDAR_CLIENT_SECRET = "<secret>"
  .\scripts\set-google-calendar-oauth-secrets.ps1
"@
}

Write-Host "Configuration secrets Supabase (project $ProjectRef)..." -ForegroundColor Cyan

$setArgs = @(
  'secrets', 'set',
  "GOOGLE_CALENDAR_CLIENT_ID=$clientId",
  "GOOGLE_CALENDAR_CLIENT_SECRET=$clientSecret",
  "GOOGLE_CALENDAR_REDIRECT_URI=$redirect",
  '--project-ref', $ProjectRef
)

& npx supabase @setArgs
if ($LASTEXITCODE -ne 0) {
  throw "supabase secrets set failed (exit $LASTEXITCODE)"
}

Write-Host ''
Write-Host 'Secrets enregistres. Verification :' -ForegroundColor Green
& npx supabase secrets list --project-ref $ProjectRef | Select-String 'GOOGLE_CALENDAR'

Write-Host ''
Write-Host 'Redeploy edge functions si necessaire :'
Write-Host '  npx supabase functions deploy google-calendar-oauth --no-verify-jwt --project-ref' $ProjectRef
