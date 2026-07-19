# Apply Emarzona SQL migrations to the dedicated E2E Supabase project.
#
# Prerequis:
#   npx supabase login   # same account as the E2E project (payhuk15@gmail.com)
#   $env:SUPABASE_DB_PASSWORD = '<Dashboard > Settings > Database > password>'
#
# Usage:
#   .\scripts\push-e2e-supabase-migrations.ps1
#   .\scripts\push-e2e-supabase-migrations.ps1 -ProjectRef ufbztturuwwazfcvhvuu

param(
  [string]$ProjectRef = ''
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path $PSScriptRoot -Parent
Push-Location $Root

try {
  if (-not $ProjectRef) {
    $refFile = Join-Path $Root '.e2e-commerce-project-ref'
    if (Test-Path $refFile) {
      $ProjectRef = (Get-Content $refFile -Raw).Trim().Split("`n")[0].Trim()
    }
  }
  if (-not $ProjectRef) {
    throw 'Missing project ref. Pass -ProjectRef or create .e2e-commerce-project-ref'
  }

  Write-Host "Linking Supabase CLI to E2E project $ProjectRef ..." -ForegroundColor Cyan
  npx supabase link --project-ref $ProjectRef --yes
  if ($LASTEXITCODE -ne 0) {
    throw @"
supabase link failed.
- Run: npx supabase login (account that owns the E2E project)
- Or set `$env:SUPABASE_DB_PASSWORD` from Dashboard > Settings > Database
"@
  }

  Write-Host 'Pushing migrations (may take several minutes)...' -ForegroundColor Cyan
  if (-not $env:SUPABASE_DB_PASSWORD) {
    Write-Host 'Tip: set $env:SUPABASE_DB_PASSWORD if the API times out.' -ForegroundColor Yellow
  }
  npx supabase db push --yes
  if ($LASTEXITCODE -ne 0) {
    throw 'supabase db push failed. Check login, DB password, and migration logs.'
  }

  Write-Host ''
  Write-Host "OK - migrations applied on $ProjectRef." -ForegroundColor Green
  Write-Host 'Next: re-run Playwright CI or npm run test:e2e:product-wizards:local' -ForegroundColor Green
}
finally {
  Pop-Location
}
