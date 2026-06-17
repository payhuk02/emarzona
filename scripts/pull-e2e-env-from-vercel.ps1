# Récupère les variables Vercel dans .env.e2e.local (gitignored).
# Prérequis : npx vercel login OU $env:VERCEL_TOKEN
#
# Usage:
#   .\scripts\pull-e2e-env-from-vercel.ps1
#   .\scripts\pull-e2e-env-from-vercel.ps1 -Environment preview

param(
  [ValidateSet('development', 'preview', 'production')]
  [string]$Environment = 'production'
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path $PSScriptRoot -Parent
$OutFile = Join-Path $Root '.env.e2e.local'

Push-Location $Root
try {
  Write-Host "Pull Vercel env ($Environment) -> .env.e2e.local" -ForegroundColor Cyan
  if ($Environment -eq 'production') {
    Write-Host '  Les E2E créent/suppriment des users de test sur le projet Supabase lié.' -ForegroundColor Yellow
  }

  $cliArgs = @('--yes', 'vercel@latest', 'env', 'pull', $OutFile, '--environment', $Environment, '--yes')
  if ($env:VERCEL_TOKEN) {
    $cliArgs += @('--token', $env:VERCEL_TOKEN)
  }

  & npx @cliArgs
  if ($LASTEXITCODE -ne 0) {
    Write-Error 'vercel env pull failed. Run: npx vercel login'
  }

  $content = Get-Content $OutFile -Raw
  if ($content -match 'SUPABASE_SERVICE_ROLE_KEY=""' -or $content -match "SUPABASE_SERVICE_ROLE_KEY=''") {
    Write-Host ''
    Write-Host 'ATTENTION: SUPABASE_SERVICE_ROLE_KEY est vide dans le pull Vercel.' -ForegroundColor Yellow
    Write-Host '  Vercel masque parfois les secrets sensibles en local.'
    Write-Host '  Ajoutez manuellement dans .env.e2e.local (une ligne) :'
    Write-Host '    SUPABASE_SERVICE_ROLE_KEY=sb_secret_...  (Supabase Dashboard → API Keys)'
    Write-Host '  Ou synchronisez GitHub CI : npm run setup:commerce-e2e-secret'
    Write-Host ''
  }

  Write-Host ''
  Write-Host 'OK. Lancez les E2E :' -ForegroundColor Green
  Write-Host '  npm run test:e2e:vertical-paid:local'
  Write-Host '  npm run test:e2e:commerce-gating:local'
  Write-Host ''
  Write-Host 'Attention : SUPABASE_SERVICE_ROLE_KEY ne doit jamais avoir le préfixe VITE_.'
}
finally {
  Pop-Location
}
