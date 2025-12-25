# Script PowerShell pour pousser les modifications
Write-Host "Configuration du pager Git..." -ForegroundColor Yellow
git config --local core.pager ""
$env:GIT_PAGER = ""
$env:PAGER = ""

Write-Host "Ajout du fichier modifie..." -ForegroundColor Yellow
git add src/components/physical/customer/OrderTracking.tsx

Write-Host "Creation du commit..." -ForegroundColor Yellow
git commit -m "fix(physical-portal): Corriger erreur chargement commande dans onglet Suivi"

Write-Host "Push vers le depot distant..." -ForegroundColor Yellow
git push

Write-Host "Termine!" -ForegroundColor Green



