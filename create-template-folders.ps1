# Script PowerShell pour créer la structure de dossiers des templates
# Usage: .\create-template-folders.ps1

Write-Host "📁 Création de la structure de dossiers pour les images de templates..." -ForegroundColor Cyan

# Créer les dossiers principaux
$folders = @(
    "public\templates\physical",
    "public\templates\digital", 
    "public\templates\services",
    "public\templates\courses",
    "public\templates\v2\digital",
    "public\templates\v2\physical",
    "public\templates\v2\services",
    "public\templates\v2\courses"
)

foreach ($folder in $folders) {
    if (!(Test-Path $folder)) {
        New-Item -ItemType Directory -Path $folder -Force | Out-Null
        Write-Host "✅ Créé: $folder" -ForegroundColor Green
    } else {
        Write-Host "ℹ️  Existe déjà: $folder" -ForegroundColor Yellow
    }
}

Write-Host "`n✨ Structure de dossiers créée avec succès!" -ForegroundColor Green
Write-Host "`n📝 Prochaine étape: Ajouter les images dans ces dossiers" -ForegroundColor Cyan
Write-Host "   Voir TEMPLATES_IMAGES_GUIDE.md pour les instructions détaillées" -ForegroundColor Gray

