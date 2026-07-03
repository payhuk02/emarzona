# Rotation CRON_SECRET : Supabase Edge secret + recréation des jobs pg_cron
# Usage sécurisé (ne pas coller le secret dans le chat) :
#   1. Créer scripts/.cron-secret.local avec UNE ligne = le secret (fichier gitignored)
#   2. S'assurer que .env.local contient VITE_SUPABASE_ANON_KEY ou VITE_SUPABASE_PUBLISHABLE_KEY
#   3. .\scripts\rotate-cron-secret.ps1
#
# Options :
#   -GenerateNew     Génère un secret aléatoire (ignore .cron-secret.local)
#   -SyncGitHub      Met à jour secrets GitHub Actions (CRON_SECRET + SUPABASE_URL)

param(
  [switch]$GenerateNew,
  [switch]$SyncGitHub
)

$ErrorActionPreference = 'Stop'
$ProjectRef = 'hbdnzajbyjakdhuavrvb'
$GithubRepo = 'payhuk02/emarzona'
$SupabaseUrl = "https://$ProjectRef.supabase.co"
$Root = Split-Path $PSScriptRoot -Parent

function New-CronSecret {
  $bytes = New-Object byte[] 32
  [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  return [Convert]::ToBase64String($bytes).Replace('+', 'x').Replace('/', 'y').Substring(0, 32)
}

if ($GenerateNew) {
  $CronSecret = New-CronSecret
}
else {
  $SecretFile = Join-Path $PSScriptRoot '.cron-secret.local'
  if (-not (Test-Path $SecretFile)) {
    Write-Error "Fichier manquant: $SecretFile`nCréez-le avec une seule ligne contenant le CRON_SECRET, ou utilisez -GenerateNew."
  }
  $raw = Get-Content $SecretFile -Raw
  if (-not $raw -or $raw.Trim().Length -eq 0) {
    Write-Error "Fichier vide: $SecretFile`nAjoutez une ligne avec le CRON_SECRET (Dashboard Supabase → Edge Functions → Secrets), ou exécutez -GenerateNew."
  }
  $CronSecret = $raw.Trim()
}

if ($CronSecret.Length -lt 16) {
  Write-Error 'CRON_SECRET doit faire au moins 16 caractères.'
}

function Get-AnonKeyFromEnvFile {
  param([string]$EnvPath)
  if (-not (Test-Path $EnvPath)) { return $null }
  foreach ($line in Get-Content $EnvPath) {
    if ($line -match '^\s*#') { continue }
    if ($line -match '^\s*VITE_SUPABASE_(ANON_KEY|PUBLISHABLE_KEY)\s*=\s*(.+)\s*$') {
      return $Matches[2].Trim().Trim('"').Trim("'")
    }
  }
  return $null
}

$AnonKey = $env:VITE_SUPABASE_ANON_KEY
if (-not $AnonKey) { $AnonKey = $env:VITE_SUPABASE_PUBLISHABLE_KEY }
if (-not $AnonKey) {
  $AnonKey = Get-AnonKeyFromEnvFile (Join-Path $Root '.env.local')
}
if (-not $AnonKey) {
  $AnonKey = Get-AnonKeyFromEnvFile (Join-Path $Root '.env')
}
if (-not $AnonKey) {
  Write-Error 'Clé anon introuvable. Définissez VITE_SUPABASE_ANON_KEY dans .env.local ou en variable d''environnement.'
}

function Escape-SqlString([string]$s) {
  return $s.Replace("'", "''")
}

$EscSecret = Escape-SqlString $CronSecret
$EscAnon = Escape-SqlString $AnonKey

Write-Host '1/3 — Définition du secret Edge CRON_SECRET sur Supabase...'
Push-Location $Root
try {
  npx supabase secrets set "CRON_SECRET=$CronSecret" --project-ref $ProjectRef
  if ($LASTEXITCODE -ne 0) { throw 'supabase secrets set a échoué' }

  Write-Host '2/3 — Recréation des jobs pg_cron...'
  $Sql = @"
BEGIN;
SELECT public.setup_physical_subscription_billing_cron_jobs(
  '$ProjectRef',
  '$EscSecret',
  '$EscAnon'
);
SELECT public.setup_moneroo_reconciliation_cron_job(
  '$ProjectRef',
  '$EscSecret',
  '$EscAnon'
);
SELECT public.setup_email_campaigns_cron_job(
  '$ProjectRef',
  '$EscSecret',
  '$EscAnon'
);
SELECT public.setup_email_sequences_cron_job(
  '$ProjectRef',
  '$EscSecret',
  '$EscAnon'
);
SELECT public.setup_abandoned_cart_recovery_cron_job(
  '$ProjectRef',
  '$EscSecret',
  '$EscAnon'
);
SELECT public.setup_auction_statuses_cron_job(
  '$ProjectRef',
  '$EscSecret'
);
SELECT public.setup_verify_domains_cron_job(
  '$ProjectRef',
  '$EscSecret'
);
SELECT public.setup_platform_health_cron_job(
  '$ProjectRef',
  '$EscSecret'
);
SELECT public.setup_google_indexing_cron_jobs(
  '$ProjectRef',
  '$EscSecret'
);
SELECT public.setup_account_deletion_cron_job(
  '$ProjectRef',
  '$EscSecret'
);
SELECT public.setup_nightly_maintenance_cron_job(
  '$ProjectRef',
  '$EscSecret'
);
SELECT public.setup_order_fulfillment_monitor_cron_job(
  '$ProjectRef',
  '$EscSecret'
);
SELECT public.setup_dashboard_materialized_views_cron_job('15 * * * *');
COMMIT;
"@

  $Utf8NoBom = New-Object System.Text.UTF8Encoding $false
  $TempSql = [System.IO.Path]::GetTempFileName() + '.sql'
  try {
    [System.IO.File]::WriteAllText($TempSql, $Sql, $Utf8NoBom)
    npx supabase db query --linked -f $TempSql --yes
    if ($LASTEXITCODE -ne 0) { throw 'supabase db query a échoué' }
  }
  finally {
    if (Test-Path $TempSql) { Remove-Item $TempSql -Force }
  }

  Write-Host '3/3 — Vérification des jobs actifs...'
  $CheckSql = "SELECT jobname, schedule, active FROM cron.job WHERE active = true ORDER BY jobname;"
  $CheckFile = [System.IO.Path]::GetTempFileName() + '.sql'
  try {
    [System.IO.File]::WriteAllText($CheckFile, $CheckSql, $Utf8NoBom)
    npx supabase db query --linked -f $CheckFile --yes
  }
  finally {
    if (Test-Path $CheckFile) { Remove-Item $CheckFile -Force }
  }

  if ($SyncGitHub) {
    Write-Host '4/4 — Synchronisation GitHub Actions...'
    gh secret set CRON_SECRET --repo $GithubRepo --body $CronSecret
    if ($LASTEXITCODE -ne 0) { throw 'gh secret set CRON_SECRET a échoué' }
    gh secret set SUPABASE_URL --repo $GithubRepo --body $SupabaseUrl
    if ($LASTEXITCODE -ne 0) { throw 'gh secret set SUPABASE_URL a échoué' }
    Write-Host '   Secrets GitHub mis à jour : CRON_SECRET, SUPABASE_URL'
  }

  Write-Host ''
  Write-Host 'OK — CRON_SECRET mis à jour.'
  if ($GenerateNew) {
    $SecretFile = Join-Path $PSScriptRoot '.cron-secret.local'
    $Utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($SecretFile, $CronSecret, $Utf8NoBom)
    Write-Host "Copie locale enregistrée dans scripts/.cron-secret.local (gitignored)."
  }
  if (-not $SyncGitHub) {
    Write-Host 'Pensez aussi à GitHub Actions : .\scripts\rotate-cron-secret.ps1 -SyncGitHub'
  }
  if (-not $GenerateNew) {
    Write-Host 'Vous pouvez supprimer scripts/.cron-secret.local après exécution si vous préférez.'
  }
}
finally {
  Pop-Location
}
