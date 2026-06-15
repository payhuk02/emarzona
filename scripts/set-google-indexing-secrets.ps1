# Epic 5.2 — Configure GOOGLE_INDEXING_SERVICE_ACCOUNT_JSON on Supabase production.
# Voir docs/runbooks/google-indexing-api-prod.md

param(
  [string]$ProjectRef = 'hbdnzajbyjakdhuavrvb',
  [string]$JsonFilePath = $env:GOOGLE_INDEXING_SERVICE_ACCOUNT_JSON_FILE
)

$ErrorActionPreference = 'Stop'

$DefaultLocalFile = Join-Path $PSScriptRoot '.google-indexing-service-account.json.local'
if (-not $JsonFilePath) {
  $JsonFilePath = $DefaultLocalFile
}

if (-not (Test-Path -LiteralPath $JsonFilePath)) {
  Write-Error @"
Fichier JSON introuvable: $JsonFilePath

1. GCP Console → IAM → Comptes de service → Créer → Télécharger la clé JSON
2. Activer Web Search Indexing API sur le projet
3. Search Console → Paramètres → Utilisateurs → ajouter le client_email du JSON (propriétaire)
4. Copier le fichier vers :
   $DefaultLocalFile
   (gitignored via *.local)

Puis relancer :
  .\scripts\set-google-indexing-secrets.ps1

Ou avec un chemin explicite :
  `$env:GOOGLE_INDEXING_SERVICE_ACCOUNT_JSON_FILE = 'C:\chemin\service-account.json'
  .\scripts\set-google-indexing-secrets.ps1
"@
}

$raw = Get-Content -LiteralPath $JsonFilePath -Raw -Encoding UTF8
try {
  $parsed = $raw | ConvertFrom-Json
} catch {
  Write-Error "JSON invalide dans $JsonFilePath : $_"
}

if (-not $parsed.client_email -or -not $parsed.private_key) {
  Write-Error 'Le JSON doit contenir client_email et private_key'
}

# Secret compact (une ligne) pour Supabase Edge
$compact = ($raw -replace "`r`n", '' -replace '\s+', ' ').Trim()

Write-Host "Configuration GOOGLE_INDEXING_SERVICE_ACCOUNT_JSON ($ProjectRef)..." -ForegroundColor Cyan
Write-Host "Service account: $($parsed.client_email)" -ForegroundColor DarkGray

& npx supabase secrets set "GOOGLE_INDEXING_SERVICE_ACCOUNT_JSON=$compact" --project-ref $ProjectRef
if ($LASTEXITCODE -ne 0) {
  throw "supabase secrets set failed (exit $LASTEXITCODE)"
}

Write-Host ''
Write-Host 'Secret enregistre.' -ForegroundColor Green
Write-Host 'Redeploy google-indexing-submit...' -ForegroundColor Cyan
& npx supabase functions deploy google-indexing-submit --project-ref $ProjectRef --no-verify-jwt
if ($LASTEXITCODE -ne 0) { throw "deploy failed (exit $LASTEXITCODE)" }
Write-Host ''
Write-Host 'Crons deja actifs via pg_cron (E49). Smoke test :'
Write-Host '  .\scripts\smoke-google-indexing.ps1'
