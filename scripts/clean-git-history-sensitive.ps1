# Script pour nettoyer l'historique Git des fichiers sensibles
# ATTENTION : Cette opération réécrit l'historique Git
# Utilisez avec précaution et faites un backup avant

param(
    [switch]$DryRun = $false,
    [string[]]$SensitiveFiles = @(".env", ".env.local", ".env.production", ".env.development")
)

Write-Host "🔍 Nettoyage de l'historique Git des fichiers sensibles" -ForegroundColor Yellow
Write-Host ""

# Vérifier si git-filter-repo est installé
$gitFilterRepoInstalled = $false
try {
    $null = git filter-repo --version 2>&1
    $gitFilterRepoInstalled = $true
} catch {
    Write-Host "⚠️  git-filter-repo n'est pas installé" -ForegroundColor Yellow
    Write-Host "Installation nécessaire..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Pour installer git-filter-repo:" -ForegroundColor Cyan
    Write-Host "  pip install git-filter-repo" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Ou utilisez BFG Repo Cleaner:" -ForegroundColor Cyan
    Write-Host "  choco install bfg" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

# Créer un backup
Write-Host "📦 Création d'un backup du dépôt..." -ForegroundColor Cyan
$backupDir = "payhula-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
git clone --mirror . "$backupDir"
Write-Host "✅ Backup créé dans: $backupDir" -ForegroundColor Green
Write-Host ""

if ($DryRun) {
    Write-Host "🔍 MODE DRY-RUN : Aucune modification ne sera effectuée" -ForegroundColor Yellow
    Write-Host ""
}

# Vérifier les fichiers sensibles dans l'historique
Write-Host "🔍 Recherche des fichiers sensibles dans l'historique..." -ForegroundColor Cyan
foreach ($file in $SensitiveFiles) {
    $commits = git log --all --full-history --oneline -- "$file" 2>&1
    if ($commits) {
        Write-Host "⚠️  Fichier trouvé dans l'historique: $file" -ForegroundColor Yellow
        $commits | Select-Object -First 5 | ForEach-Object {
            Write-Host "   $_" -ForegroundColor Gray
        }
        if ($commits.Count -gt 5) {
            Write-Host "   ... et $($commits.Count - 5) autres commits" -ForegroundColor Gray
        }
    } else {
        Write-Host "✅ Fichier non trouvé: $file" -ForegroundColor Green
    }
}
Write-Host ""

# Demander confirmation
if (-not $DryRun) {
    Write-Host "⚠️  ATTENTION : Cette opération va réécrire l'historique Git" -ForegroundColor Red
    Write-Host "   - Tous les collaborateurs devront re-cloner le dépôt" -ForegroundColor Red
    Write-Host "   - Les pull requests ouverts devront être recréés" -ForegroundColor Red
    Write-Host ""
    $confirmation = Read-Host "Voulez-vous continuer ? (oui/non)"
    if ($confirmation -ne "oui") {
        Write-Host "❌ Opération annulée" -ForegroundColor Red
        exit 0
    }
}

# Nettoyer l'historique pour chaque fichier sensible
Write-Host "🧹 Nettoyage de l'historique..." -ForegroundColor Cyan
foreach ($file in $SensitiveFiles) {
    Write-Host "   Suppression de: $file" -ForegroundColor Gray
    if (-not $DryRun) {
        try {
            # Utiliser git filter-repo pour supprimer le fichier de l'historique
            git filter-repo --path "$file" --invert-paths --force
            Write-Host "   ✅ $file supprimé de l'historique" -ForegroundColor Green
        } catch {
            Write-Host "   ❌ Erreur lors de la suppression de $file : $_" -ForegroundColor Red
        }
    }
}

# Nettoyer les références
Write-Host ""
Write-Host "🧹 Nettoyage des références..." -ForegroundColor Cyan
if (-not $DryRun) {
    git reflog expire --expire=now --all
    git gc --prune=now --aggressive
    Write-Host "✅ Références nettoyées" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ Nettoyage terminé !" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  PROCHAINES ÉTAPES :" -ForegroundColor Yellow
Write-Host "1. Vérifier que l'historique est propre :" -ForegroundColor Cyan
Write-Host "   git log --all --full-history -- .env" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Si tout est correct, forcer la mise à jour du dépôt distant :" -ForegroundColor Cyan
Write-Host "   git push --force --all" -ForegroundColor Gray
Write-Host "   git push --force --tags" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Notifier tous les collaborateurs de re-cloner le dépôt" -ForegroundColor Cyan
Write-Host ""

