# Script d'organisation de la documentation
# Déplace les fichiers .md dans la structure docs/

Write-Host "[INFO] Organisation de la documentation..." -ForegroundColor Cyan

# Créer la structure si elle n'existe pas
$dirs = @(
    "docs\architecture",
    "docs\guides",
    "docs\api",
    "docs\deployment",
    "docs\audits",
    "docs\audits\archive",
    "docs\corrections",
    "docs\ameliorations",
    "docs\analyses"
)

foreach ($dir in $dirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
        Write-Host "[OK] Cree: $dir" -ForegroundColor Green
    }
}

# Déplacer les audits
Write-Host "`n[INFO] Deplacement des audits..." -ForegroundColor Yellow
Get-ChildItem -Path "." -Filter "AUDIT_*.md" -File | ForEach-Object {
    Move-Item -Path $_.FullName -Destination "docs\audits\" -Force
    Write-Host "  ✅ $($_.Name)" -ForegroundColor Gray
}

# Déplacer les analyses
Write-Host "`n[INFO] Deplacement des analyses..." -ForegroundColor Yellow
Get-ChildItem -Path "." -Filter "ANALYSE_*.md" -File | ForEach-Object {
    Move-Item -Path $_.FullName -Destination "docs\analyses\" -Force
    Write-Host "  ✅ $($_.Name)" -ForegroundColor Gray
}

# Déplacer les corrections
Write-Host "`n[INFO] Deplacement des corrections..." -ForegroundColor Yellow
Get-ChildItem -Path "." -Filter "CORRECTION_*.md" -File | ForEach-Object {
    Move-Item -Path $_.FullName -Destination "docs\corrections\" -Force
    Write-Host "  ✅ $($_.Name)" -ForegroundColor Gray
}
Get-ChildItem -Path "." -Filter "CORRECTIONS_*.md" -File | ForEach-Object {
    Move-Item -Path $_.FullName -Destination "docs\corrections\" -Force
    Write-Host "  ✅ $($_.Name)" -ForegroundColor Gray
}

# Déplacer les améliorations
Write-Host "`n[INFO] Deplacement des ameliorations..." -ForegroundColor Yellow
Get-ChildItem -Path "." -Filter "AMELIORATION_*.md" -File | ForEach-Object {
    Move-Item -Path $_.FullName -Destination "docs\ameliorations\" -Force
    Write-Host "  ✅ $($_.Name)" -ForegroundColor Gray
}
Get-ChildItem -Path "." -Filter "AMELIORATIONS_*.md" -File | ForEach-Object {
    Move-Item -Path $_.FullName -Destination "docs\ameliorations\" -Force
    Write-Host "  ✅ $($_.Name)" -ForegroundColor Gray
}

# Déplacer les guides
Write-Host "`n[INFO] Deplacement des guides..." -ForegroundColor Yellow
$guideFiles = @(
    "*_GUIDE.md",
    "*GUIDE.md",
    "DEMARRAGE_RAPIDE.md",
    "DEPLOYMENT_*.md",
    "DEPLOIEMENT_*.md",
    "DEPLOY_*.md",
    "SETUP_*.md",
    "CONFIGURATION_*.md"
)
foreach ($pattern in $guideFiles) {
    Get-ChildItem -Path "." -Filter $pattern -File | ForEach-Object {
        Move-Item -Path $_.FullName -Destination "docs\guides\" -Force
        Write-Host "  [OK] $($_.Name)" -ForegroundColor Gray
    }
}

# Déplacer les guides de déploiement
Write-Host "`n[INFO] Deplacement des guides de deploiement..." -ForegroundColor Yellow
Get-ChildItem -Path "." -Filter "*DEPLOYMENT*.md" -File | ForEach-Object {
    Move-Item -Path $_.FullName -Destination "docs\deployment\" -Force
    Write-Host "  ✅ $($_.Name)" -ForegroundColor Gray
}
Get-ChildItem -Path "." -Filter "*DEPLOIEMENT*.md" -File | ForEach-Object {
    Move-Item -Path $_.FullName -Destination "docs\deployment\" -Force
    Write-Host "  ✅ $($_.Name)" -ForegroundColor Gray
}

# Déplacer les guides API
Write-Host "`n[INFO] Deplacement des guides API..." -ForegroundColor Yellow
Get-ChildItem -Path "." -Filter "*MONEROO*.md" -File | ForEach-Object {
    Move-Item -Path $_.FullName -Destination "docs\api\" -Force
    Write-Host "  ✅ $($_.Name)" -ForegroundColor Gray
}
Get-ChildItem -Path "." -Filter "*CRISP*.md" -File | ForEach-Object {
    Move-Item -Path $_.FullName -Destination "docs\api\" -Force
    Write-Host "  ✅ $($_.Name)" -ForegroundColor Gray
}
Get-ChildItem -Path "." -Filter "*INTEGRATION*.md" -File | ForEach-Object {
    Move-Item -Path $_.FullName -Destination "docs\api\" -Force
    Write-Host "  ✅ $($_.Name)" -ForegroundColor Gray
}

# Déplacer les autres fichiers de documentation
Write-Host "`n[INFO] Deplacement des autres fichiers..." -ForegroundColor Yellow
$otherFiles = @(
    "ARCHITECTURE_*.md",
    "COMPARATIF_*.md",
    "DASHBOARD_*.md",
    "DESIGN_*.md",
    "DIAGNOSTIC_*.md",
    "DNS_*.md",
    "DOMAIN_*.md"
)
foreach ($pattern in $otherFiles) {
    Get-ChildItem -Path "." -Filter $pattern -File | ForEach-Object {
        Move-Item -Path $_.FullName -Destination "docs\analyses\" -Force
        Write-Host "  [OK] $($_.Name)" -ForegroundColor Gray
    }
}

Write-Host "`n[OK] Organisation terminee !" -ForegroundColor Green
Write-Host "[OK] Structure creee dans docs/" -ForegroundColor Cyan

