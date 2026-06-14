# Epic 4.1 — Configure Upstash Redis on Vercel for middleware SEO cache

param(
  [switch]$Interactive,
  [string]$RestUrl = $env:UPSTASH_REDIS_REST_URL,
  [string]$RestToken = $env:UPSTASH_REDIS_REST_TOKEN
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path $PSScriptRoot -Parent

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

if ($Interactive) {
  if (-not $RestUrl) { $RestUrl = Read-Host 'UPSTASH_REDIS_REST_URL' }
  if (-not $RestToken) { $RestToken = Read-Host 'UPSTASH_REDIS_REST_TOKEN' }
}

if (-not $RestUrl -or -not $RestToken) {
  Write-Error 'Definissez UPSTASH_REDIS_REST_URL et UPSTASH_REDIS_REST_TOKEN (ou -Interactive)'
}

Push-Location $Root
try {
  foreach ($target in @('production', 'preview')) {
    Write-Host "Vercel $target - UPSTASH_REDIS_REST_URL" -ForegroundColor Cyan
    Set-VercelEnv -Name 'UPSTASH_REDIS_REST_URL' -Value $RestUrl -Target $target
    Write-Host "Vercel $target - UPSTASH_REDIS_REST_TOKEN" -ForegroundColor Cyan
    Set-VercelEnv -Name 'UPSTASH_REDIS_REST_TOKEN' -Value $RestToken -Target $target
  }
  Write-Host ''
  Write-Host 'OK. Redeploy production pour activer le cache Redis edge.' -ForegroundColor Green
}
finally {
  Pop-Location
}
