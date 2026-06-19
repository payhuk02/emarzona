# Active read replica Supabase + VITE_SUPABASE_READ_URL sur Vercel
# Usage :
#   .\scripts\set-vercel-read-replica-env.ps1
#   .\scripts\set-vercel-read-replica-env.ps1 -ReadUrl "https://<ref>-all.supabase.co"
#   .\scripts\set-vercel-read-replica-env.ps1 -WhatIf

param(
  [string]$ProjectRef = 'hbdnzajbyjakdhuavrvb',
  [string]$ReadUrl = "https://$ProjectRef-all.supabase.co",
  [switch]$WhatIf
)

$ErrorActionPreference = 'Stop'
$varName = 'VITE_SUPABASE_READ_URL'
$environments = @('production', 'preview', 'development')

Write-Host "Read URL cible : $ReadUrl" -ForegroundColor Cyan
Write-Host "Load balancer Supabase (-all) : geo-route les GET vers la replica la plus proche." -ForegroundColor DarkGray
Write-Host ""

if ($WhatIf) {
  Write-Host '[WhatIf] Aucune modification.' -ForegroundColor Yellow
  exit 0
}

foreach ($envName in $environments) {
  Write-Host "Mise a jour $varName ($envName)..." -ForegroundColor Cyan
  npx vercel env add $varName $envName --value $ReadUrl --yes --force --no-sensitive
  if ($LASTEXITCODE -ne 0) {
    throw "vercel env add failed for $envName"
  }
}

Write-Host ''
Write-Host 'OK - Redeploy Vercel (prod + previews) pour injecter VITE_SUPABASE_READ_URL au build.' -ForegroundColor Green
Write-Host 'Dashboard Supabase : Settings > Infrastructure > Add Read Replica (si pas encore fait).' -ForegroundColor DarkGray
