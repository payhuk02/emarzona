# Script PowerShell pour télécharger les images placeholder des templates
# Usage: .\download-template-images.ps1

Write-Host "`n📸 Téléchargement des images de templates..." -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

# Fonction pour télécharger une image
function Download-TemplateImage {
    param(
        [string]$Url,
        [string]$OutputPath,
        [string]$TemplateName
    )
    
    try {
        Write-Host "⬇️  Téléchargement: $TemplateName..." -ForegroundColor Yellow -NoNewline
        Invoke-WebRequest -Uri $Url -OutFile $OutputPath -UseBasicParsing
        Write-Host " ✅ OK" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host " ❌ ERREUR" -ForegroundColor Red
        Write-Host "   Erreur: $_" -ForegroundColor Red
        return $false
    }
}

# Créer le dossier si nécessaire
$outputDir = "public\templates\physical"
if (!(Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
    Write-Host "📁 Dossier créé: $outputDir`n" -ForegroundColor Green
}

# Définir les images à télécharger
$images = @(
    @{
        Name = "Fashion & Apparel"
        Url = "https://placehold.co/1280x720/0051BA/FFDB00/jpg?text=Fashion+%26+Apparel+Template&font=montserrat"
        File = "fashion-apparel-thumb.jpg"
    },
    @{
        Name = "Electronics & Gadgets"
        Url = "https://placehold.co/1280x720/000000/FFFFFF/jpg?text=Electronics+%26+Gadgets+Template&font=montserrat"
        File = "electronics-thumb.jpg"
    },
    @{
        Name = "Jewelry & Accessories"
        Url = "https://placehold.co/1280x720/1a1a1a/d4af37/jpg?text=Jewelry+%26+Accessories+Template&font=montserrat"
        File = "jewelry-thumb.jpg"
    },
    @{
        Name = "Home & Garden"
        Url = "https://placehold.co/1280x720/0051BA/FFDB00/jpg?text=Home+%26+Garden+Template&font=montserrat"
        File = "home-garden-thumb.jpg"
    },
    @{
        Name = "Health & Wellness"
        Url = "https://placehold.co/1280x720/0066cc/00a86b/jpg?text=Health+%26+Wellness+Template&font=montserrat"
        File = "health-wellness-thumb.jpg"
    }
)

# Télécharger chaque image
$successCount = 0
$totalCount = $images.Count

foreach ($image in $images) {
    $outputPath = Join-Path $outputDir $image.File
    $result = Download-TemplateImage -Url $image.Url -OutputPath $outputPath -TemplateName $image.Name
    if ($result) { $successCount++ }
    Start-Sleep -Milliseconds 500  # Petite pause entre les téléchargements
}

# Résumé
Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "📊 RÉSUMÉ" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "✅ Images téléchargées: $successCount / $totalCount" -ForegroundColor $(if ($successCount -eq $totalCount) { "Green" } else { "Yellow" })
Write-Host "📁 Emplacement: $outputDir" -ForegroundColor Gray

if ($successCount -eq $totalCount) {
    Write-Host "`n🎉 Toutes les images ont été téléchargées avec succès!" -ForegroundColor Green
    Write-Host "🚀 Actualisez votre navigateur pour voir les templates avec images!" -ForegroundColor Cyan
} else {
    Write-Host "`n⚠️  Certaines images n'ont pas pu être téléchargées." -ForegroundColor Yellow
    Write-Host "   Vérifiez votre connexion internet et réessayez." -ForegroundColor Yellow
}

Write-Host "`n📝 Note: Ce sont des images temporaires (placeholders)" -ForegroundColor Gray
Write-Host "   Pour des images professionnelles, voir TEMPLATES_IMAGES_GUIDE.md" -ForegroundColor Gray
Write-Host ""

