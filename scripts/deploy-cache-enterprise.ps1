# Emarzona — Déploiement architecture cache enterprise
# Usage PowerShell:
#   .\scripts\deploy-cache-enterprise.ps1 -Interactive
#   .\scripts\deploy-cache-enterprise.ps1 -CacheSecret "xxx" -UpstashUrl "..." -UpstashToken "..."

param(
  [switch]$Interactive,
  [switch]$SkipMigration,
  [switch]$SkipEdgeFunctions,
  [switch]$SkipVercel,
  [switch]$SkipSupabaseSecrets,
  [string]$CacheSecret = $env:CACHE_INVALIDATION_SECRET,
  [string]$CronSecret = $env:CRON_SECRET,
  [string]$UpstashUrl = $env:UPSTASH_REDIS_REST_URL,
  [string]$UpstashToken = $env:UPSTASH_REDIS_REST_TOKEN,
  [string]$SiteUrl = $env:SITE_URL,
  [string]$SupabaseProjectRef = 'hbdnzajbyjakdhuavrvb'
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path $PSScriptRoot -Parent

function New-RandomHex {
  param([int]$Bytes = 32)
  $bytes = New-Object byte[] $Bytes
  [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  return ([BitConverter]::ToString($bytes) -replace '-', '').ToLower()
}

function Get-VercelCliArgs {
  $cliArgs = @('--yes', 'vercel@latest')
  if ($env:VERCEL_TOKEN) { $cliArgs += @('--token', $env:VERCEL_TOKEN) }
  return $cliArgs
}

function Set-VercelEnv {
  param([string]$Name, [string]$Value, [string]$Target)
  $all = @(Get-VercelCliArgs) + @('env', 'add', $Name, $Target, '--value', $Value, '--yes', '--force')
  & npx @all
  if ($LASTEXITCODE -ne 0) { throw "vercel env add $Name failed" }
}

function Set-SupabaseSecret {
  param([string]$Name, [string]$Value)
  & npx --yes supabase secrets set "${Name}=${Value}" --project-ref $SupabaseProjectRef
  if ($LASTEXITCODE -ne 0) { throw "supabase secrets set $Name failed" }
}

Write-Host '=== Emarzona — Deploy Cache Enterprise ===' -ForegroundColor Cyan

if ($Interactive) {
  if (-not $CacheSecret) { $CacheSecret = Read-Host 'CACHE_INVALIDATION_SECRET (vide = auto-generate)' }
  if (-not $UpstashUrl) { $UpstashUrl = Read-Host 'UPSTASH_REDIS_REST_URL' }
  if (-not $UpstashToken) { $UpstashToken = Read-Host 'UPSTASH_REDIS_REST_TOKEN' }
  if (-not $SiteUrl) { $SiteUrl = Read-Host 'SITE_URL (defaut: https://www.emarzona.com)' }
}

if (-not $CacheSecret) {
  $CacheSecret = New-RandomHex
  Write-Host "CACHE_INVALIDATION_SECRET genere: $CacheSecret" -ForegroundColor Yellow
}

if (-not $CronSecret) {
  $CronSecret = New-RandomHex
  Write-Host "CRON_SECRET genere: $CronSecret" -ForegroundColor Yellow
}

if (-not $SiteUrl) { $SiteUrl = 'https://www.emarzona.com' }

if (-not $UpstashUrl -or -not $UpstashToken) {
  Write-Warning 'UPSTASH_REDIS_* manquant — Redis edge sera en mode degrade (fallback memoire).'
}

Push-Location $Root
try {
  # --- 1. Vercel env ---
  if (-not $SkipVercel) {
    Write-Host "`n[1/4] Configuration Vercel..." -ForegroundColor Cyan
    foreach ($target in @('production', 'preview')) {
      Set-VercelEnv -Name 'CACHE_INVALIDATION_SECRET' -Value $CacheSecret -Target $target
      Set-VercelEnv -Name 'CRON_SECRET' -Value $CronSecret -Target $target
      if ($UpstashUrl) { Set-VercelEnv -Name 'UPSTASH_REDIS_REST_URL' -Value $UpstashUrl -Target $target }
      if ($UpstashToken) { Set-VercelEnv -Name 'UPSTASH_REDIS_REST_TOKEN' -Value $UpstashToken -Target $target }
    }
    Write-Host 'Vercel OK' -ForegroundColor Green
  }

  # --- 2. Supabase secrets ---
  if (-not $SkipSupabaseSecrets) {
    Write-Host "`n[2/4] Secrets Supabase Edge Functions..." -ForegroundColor Cyan
    Set-SupabaseSecret -Name 'CACHE_INVALIDATION_SECRET' -Value $CacheSecret
    Set-SupabaseSecret -Name 'CRON_SECRET' -Value $CronSecret
    Set-SupabaseSecret -Name 'SITE_URL' -Value $SiteUrl
    if ($UpstashUrl) { Set-SupabaseSecret -Name 'UPSTASH_REDIS_REST_URL' -Value $UpstashUrl }
    if ($UpstashToken) { Set-SupabaseSecret -Name 'UPSTASH_REDIS_REST_TOKEN' -Value $UpstashToken }
    Write-Host 'Supabase secrets OK' -ForegroundColor Green
  }

  # --- 3. Edge Functions ---
  if (-not $SkipEdgeFunctions) {
    Write-Host "`n[3/4] Deploiement Edge Functions..." -ForegroundColor Cyan
    & npx --yes supabase functions deploy cache-invalidate --project-ref $SupabaseProjectRef
    if ($LASTEXITCODE -ne 0) { throw 'deploy cache-invalidate failed' }
    & npx --yes supabase functions deploy cache-warm --project-ref $SupabaseProjectRef
    if ($LASTEXITCODE -ne 0) { throw 'deploy cache-warm failed' }
    Write-Host 'Edge Functions OK' -ForegroundColor Green
  }

  # --- 4. Migration trigger avec secret ---
  if (-not $SkipMigration) {
    Write-Host "`n[4/4] Application trigger cache invalidation..." -ForegroundColor Cyan
    $template = Get-Content (Join-Path $Root 'scripts\sql\cache-invalidate-trigger.template.sql') -Raw
    $triggerSql = $template `
      -replace '\{\{CACHE_INVALIDATION_SECRET\}\}', $CacheSecret `
      -replace '\{\{SUPABASE_PROJECT_REF\}\}', $SupabaseProjectRef
    $tempSql = Join-Path $env:TEMP "emarzona-cache-trigger.sql"
    Set-Content -Path $tempSql -Value $triggerSql -Encoding UTF8
    & npx --yes supabase db execute --file $tempSql --project-ref $SupabaseProjectRef
    if ($LASTEXITCODE -ne 0) {
      Write-Warning 'supabase db execute a echoue — appliquez scripts/sql/cache-invalidate-trigger.template.sql manuellement'
    } else {
      Write-Host 'Trigger SQL OK' -ForegroundColor Green
    }
    Remove-Item $tempSql -ErrorAction SilentlyContinue
  }

  Write-Host "`n=== DEPLOIEMENT TERMINE ===" -ForegroundColor Green
  Write-Host "Conservez ces secrets en lieu sur:" -ForegroundColor Yellow
  Write-Host "  CACHE_INVALIDATION_SECRET=$CacheSecret"
  Write-Host "  CRON_SECRET=$CronSecret"
  Write-Host ""
  Write-Host "Etapes manuelles restantes:" -ForegroundColor Cyan
  Write-Host "  1. supabase db push (migrations 20260616140000 + 20260616150000)"
  Write-Host "  2. Redeploy Vercel production"
  Write-Host "  3. Cloudflare: docs/cache/CLOUDFLARE_SETUP.md"
  Write-Host "  4. VAPID push: node scripts/generate-vapid-keys.mjs"
  Write-Host ""
  Write-Host "Verification:" -ForegroundColor Cyan
  Write-Host "  curl $SiteUrl/api/cache/health"
}
finally {
  Pop-Location
}
