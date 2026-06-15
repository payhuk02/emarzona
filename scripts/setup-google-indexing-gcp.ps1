# Epic 5.2 — Guide interactif creation compte de service Google Indexing API
# Ne stocke aucun secret ; ouvre les liens GCP / Search Console utiles.

$ErrorActionPreference = 'Stop'
$LocalJson = Join-Path $PSScriptRoot '.google-indexing-service-account.json.local'

Write-Host ''
Write-Host '=== Google Indexing API — creation compte de service ===' -ForegroundColor Cyan
Write-Host ''
Write-Host 'Etape 1 — Google Cloud Console' -ForegroundColor Yellow
Write-Host '  a) Selectionnez ou creez un projet GCP (ex. meme projet que Google Calendar OAuth).'
Write-Host '  b) Activez l API : Web Search Indexing API'
Write-Host '     https://console.cloud.google.com/apis/library/indexing.googleapis.com'
Write-Host ''
Write-Host 'Etape 2 — Compte de service' -ForegroundColor Yellow
Write-Host '  a) IAM → Comptes de service → Creer'
Write-Host '     https://console.cloud.google.com/iam-admin/serviceaccounts'
Write-Host '  b) Nom suggere : emarzona-indexing'
Write-Host '  c) Roles : aucun role GCP obligatoire (auth via Search Console)'
Write-Host '  d) Cles → Ajouter une cle → JSON → telecharger le fichier'
Write-Host ''
Write-Host 'Etape 3 — Google Search Console' -ForegroundColor Yellow
Write-Host '  a) Ouvrez la propriete du site (domaine ou prefixe URL) :'
Write-Host '     https://search.google.com/search-console'
Write-Host '  b) Parametres → Utilisateurs et autorisations'
Write-Host '  c) Ajouter un utilisateur : client_email du JSON (ex. emarzona-indexing@....iam.gserviceaccount.com)'
Write-Host '  d) Role : Proprietaire (requis par l Indexing API)'
Write-Host ''
Write-Host 'Etape 4 — Copier le JSON localement' -ForegroundColor Yellow
Write-Host "  Copiez le fichier telecharge vers :"
Write-Host "  $LocalJson"
Write-Host '  (gitignored via *.local — ne jamais committer)'
Write-Host ''
Write-Host 'Etape 5 — Configurer Supabase' -ForegroundColor Yellow
Write-Host '  .\scripts\set-google-indexing-secrets.ps1'
Write-Host '  .\scripts\smoke-google-indexing.ps1'
Write-Host ''

$open = Read-Host 'Ouvrir les liens GCP dans le navigateur ? (o/N)'
if ($open -match '^[oOyY]') {
  Start-Process 'https://console.cloud.google.com/apis/library/indexing.googleapis.com'
  Start-Sleep -Milliseconds 500
  Start-Process 'https://console.cloud.google.com/iam-admin/serviceaccounts'
  Start-Sleep -Milliseconds 500
  Start-Process 'https://search.google.com/search-console'
}

if (Test-Path -LiteralPath $LocalJson) {
  Write-Host ''
  Write-Host 'Fichier local detecte — lancement set-google-indexing-secrets.ps1 ...' -ForegroundColor Green
  & "$PSScriptRoot\set-google-indexing-secrets.ps1"
}
