# Script de mise à jour des liens dans la documentation
# Met à jour les références aux fichiers qui ont été déplacés

Write-Host "[INFO] Mise a jour des liens dans la documentation..." -ForegroundColor Cyan

# Mappings des anciens chemins vers les nouveaux chemins
$linkMappings = @{
    "AUDIT_COMPLET_PROJET_2025_DETAILLE.md" = "docs/audits/AUDIT_COMPLET_PROJET_2025_DETAILLE.md"
    "ACTIONS_IMMEDIATES_AUDIT_2025.md" = "docs/ACTIONS_IMMEDIATES_AUDIT_2025.md"
    "AUDIT_*.md" = "docs/audits/"
    "ANALYSE_*.md" = "docs/analyses/"
    "CORRECTION_*.md" = "docs/corrections/"
    "CORRECTIONS_*.md" = "docs/corrections/"
    "AMELIORATION_*.md" = "docs/ameliorations/"
    "AMELIORATIONS_*.md" = "docs/ameliorations/"
}

# Fonction pour mettre à jour les liens dans un fichier
function Update-LinksInFile {
    param (
        [string]$FilePath
    )
    
    if (-not (Test-Path $FilePath)) {
        return
    }
    
    $content = Get-Content $FilePath -Raw -Encoding UTF8
    $originalContent = $content
    $updated = $false
    
    # Mettre à jour les liens vers les audits
    $content = $content -replace '\]\(AUDIT_([^)]+)\)', '](docs/audits/AUDIT_$1)'
    
    # Mettre à jour les liens vers les analyses
    $content = $content -replace '\]\(ANALYSE_([^)]+)\)', '](docs/analyses/ANALYSE_$1)'
    
    # Mettre à jour les liens vers les corrections
    $content = $content -replace '\]\(CORRECTION_([^)]+)\)', '](docs/corrections/CORRECTION_$1)'
    $content = $content -replace '\]\(CORRECTIONS_([^)]+)\)', '](docs/corrections/CORRECTIONS_$1)'
    
    # Mettre à jour les liens vers les améliorations
    $content = $content -replace '\]\(AMELIORATION_([^)]+)\)', '](docs/ameliorations/AMELIORATION_$1)'
    $content = $content -replace '\]\(AMELIORATIONS_([^)]+)\)', '](docs/ameliorations/AMELIORATIONS_$1)'
    
    # Mettre à jour les liens spécifiques
    $content = $content -replace '\]\(AUDIT_COMPLET_PROJET_2025_DETAILLE\.md\)', '](docs/audits/AUDIT_COMPLET_PROJET_2025_DETAILLE.md)'
    $content = $content -replace '\]\(ACTIONS_IMMEDIATES_AUDIT_2025\.md\)', '](docs/ACTIONS_IMMEDIATES_AUDIT_2025.md)'
    
    if ($content -ne $originalContent) {
        Set-Content -Path $FilePath -Value $content -Encoding UTF8 -NoNewline
        $updated = $true
    }
    
    return $updated
}

# Mettre à jour le README principal
Write-Host "[INFO] Mise a jour du README principal..." -ForegroundColor Yellow
$readmeUpdated = Update-LinksInFile "README.md"
if ($readmeUpdated) {
    Write-Host "  [OK] README.md" -ForegroundColor Gray
}

# Mettre à jour les fichiers dans docs/
Write-Host "[INFO] Mise a jour des fichiers dans docs/..." -ForegroundColor Yellow
$docsFiles = Get-ChildItem -Path "docs" -Recurse -Filter "*.md" -File
$updatedCount = 0

foreach ($file in $docsFiles) {
    if (Update-LinksInFile $file.FullName) {
        $updatedCount++
        Write-Host "  [OK] $($file.Name)" -ForegroundColor Gray
    }
}

Write-Host "`n[OK] $updatedCount fichiers mis a jour" -ForegroundColor Green

